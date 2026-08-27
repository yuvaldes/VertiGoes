import { useEffect, useRef } from 'react';
import { Animated, PanResponder, Platform } from 'react-native';

import { useDirection } from '../i18n';
import { frame } from '../theme/tokens';

/** How far in from the leading edge a drag must start to count as a back swipe. */
const EDGE_WIDTH = 28;
/** How far the finger must travel before this claims the gesture from a scroll. */
const SLOP = 8;
/** Past this fraction of the screen, releasing completes the pop instead of snapping back. */
const POP_THRESHOLD = 0.33;
/** …or a flick faster than this (px/ms), however short. */
const POP_VELOCITY = 0.4;

type Target = {
  /** The pushed screen's slide value: 1 fully open, 0 fully off the trailing edge. */
  anim: Animated.Value;
};

type Options = {
  /** The screen a swipe would dismiss, or null when there is nothing to go back to. */
  getTarget: () => Target | null;
  /** Completes the back navigation — the same `pop` the back button calls. */
  onPop: () => void;
  /** Returns the screen to rest when a swipe is abandoned. */
  onCancel: (anim: Animated.Value) => void;
};

/**
 * Swipe in from the leading edge to go back, alongside the back button.
 *
 * "Leading" is the left in English and the right in Hebrew, and the finger travels toward the
 * screen's centre either way. Both paths below normalise their input into a single positive
 * `travel` — how far the drag has carried the pop along — so everything downstream of that,
 * `finish` and `track` included, stays direction-agnostic.
 *
 * Two implementations, because one does not cover both:
 *
 * - **Native** uses `PanResponder`, the ordinary way to do this without pulling in Gesture
 *   Handler for a single gesture.
 * - **Web** listens to DOM pointer events on the frame directly. React Native Web's responder
 *   system does not drive `onMoveShouldSetResponder` for pointer input the way native does —
 *   the handler is consulted but never granted — and `gestureState.x0` comes back as 0, so the
 *   edge test has nothing to read. Pointer events give both reliably.
 *
 * Either way the gesture drives the very same `Animated.Value` the push animation uses, so a
 * committed swipe just hands the screen to the normal pop, which carries it the rest of the
 * way from wherever the finger let go.
 */
export function useEdgeSwipeBack({ getTarget, onPop, onCancel }: Options) {
  // Read through refs: the responder and the DOM listeners are installed once, and closing
  // over the first render's callbacks would leave them pointing at a stale stack.
  const opts = useRef({ getTarget, onPop, onCancel });
  opts.current = { getTarget, onPop, onCancel };

  // Same reason, and it genuinely changes under the user: on web the layout re-renders into
  // the other direction the moment the language does, without either listener being rebuilt.
  const rtl = useRef(false);
  rtl.current = useDirection().isRTL;

  /** The element the web listeners attach to — the device frame. */
  const rootRef = useRef<any>(null);

  /** Shared by both paths: decide what a finished drag of `travel` should do. */
  const finish = useRef((travel: number, velocity: number) => {
    const target = opts.current.getTarget();
    if (!target) return;
    if (travel > frame.width * POP_THRESHOLD || velocity > POP_VELOCITY) {
      opts.current.onPop();
    } else {
      opts.current.onCancel(target.anim);
    }
  }).current;

  const track = useRef((travel: number) => {
    const target = opts.current.getTarget();
    if (!target) return;
    const progress = 1 - Math.max(0, travel) / frame.width;
    target.anim.setValue(Math.min(1, Math.max(0, progress)));
  }).current;

  // ---- native ----------------------------------------------------------------

  const dragged = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        opts.current.getTarget() !== null &&
        (rtl.current ? gesture.x0 >= frame.width - EDGE_WIDTH : gesture.x0 <= EDGE_WIDTH) &&
        (rtl.current ? -gesture.dx : gesture.dx) > SLOP &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_event, gesture) => {
        dragged.current = Math.max(0, rtl.current ? -gesture.dx : gesture.dx);
        track(dragged.current);
      },
      // Velocity is signed the same way `dx` is, so it needs the same flip: a leftward flick
      // that completes an RTL pop reports a negative `vx`.
      onPanResponderRelease: (_event, gesture) =>
        finish(dragged.current, rtl.current ? -gesture.vx : gesture.vx),
      // Cancellation is treated exactly like a release: a swipe already carried past the
      // threshold should still complete rather than being stranded.
      onPanResponderTerminate: (_event, gesture) => {
        const vx = gesture?.vx ?? 0;
        finish(dragged.current, rtl.current ? -vx : vx);
      },
    }),
  ).current;

  // ---- web -------------------------------------------------------------------

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node: HTMLElement | null = rootRef.current;
    if (!node || typeof node.addEventListener !== 'function') return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    /** Touch began at the edge, but has not yet moved far enough to claim the gesture. */
    let armed = false;
    let active = false;
    /** Signed toward completing the pop, so it is positive in both directions. */
    let travel = 0;

    const onDown = (event: PointerEvent) => {
      if (!opts.current.getTarget()) return;
      const rect = node.getBoundingClientRect();
      startX = event.clientX - rect.left;
      startY = event.clientY - rect.top;
      startTime = event.timeStamp;
      // `rect.width`, not `frame.width`: this is the measured element, and the preview frame
      // is not always the 393pt design box the token describes.
      armed = rtl.current ? startX >= rect.width - EDGE_WIDTH : startX <= EDGE_WIDTH;
      active = false;
      travel = 0;
    };

    const onMove = (event: PointerEvent) => {
      if (!armed) return;
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - rect.left - startX;
      const dy = event.clientY - rect.top - startY;
      travel = rtl.current ? -dx : dx;

      if (!active) {
        // A vertical drag that merely started at the edge belongs to the scroll view.
        if (Math.abs(dy) > Math.abs(dx)) {
          armed = false;
          return;
        }
        if (travel <= SLOP) return;
        active = true;
      }

      // Stops the browser turning the drag into a text selection, which would cancel it.
      event.preventDefault();
      track(travel);
    };

    const onUp = (event: PointerEvent) => {
      if (!active) {
        armed = false;
        return;
      }
      const elapsed = Math.max(1, event.timeStamp - startTime);
      active = false;
      armed = false;
      finish(travel, travel / elapsed);
      travel = 0;
    };

    // Down on the frame — that is what scopes the gesture to this app. Move and up on the
    // window, because a finger that carries the screen across leaves the frame long before it
    // lifts, and those events would never reach the frame's own listener.
    node.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      node.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [finish, track]);

  return {
    /** Attach to the device frame — the web listeners bind to this element. */
    rootRef,
    /** Spread onto the topmost pushed screen. Empty on web, where the listeners do the work. */
    panHandlers: Platform.OS === 'web' ? {} : panResponder.panHandlers,
  };
}
