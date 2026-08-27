import { forwardRef, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import Svg, { Path, type PathProps } from 'react-native-svg';

/**
 * The decorative stroke bleeding off the right edge of each Home task card.
 *
 * Paths inlined from `tasks/*.svg` (kept alongside as the source of truth) rather than
 * imported through react-native-svg-transformer — no Metro config, and it renders
 * identically on native and web. Same reasoning as `Logo.tsx`.
 *
 * Figma exports a separate greyed copy of each shape for the completed state, but the path
 * data is byte-identical — only the stroke changes — so `color` is a prop instead.
 *
 * Each shape's intrinsic size is the *stroke-expanded* box: Figma sizes the layer to the
 * path's geometry and then bleeds the 10.4px stroke outside it (the `inset-[-x%_-y%]` on the
 * export). The `OFFSET` numbers below are that half-stroke, so the placements in `TaskCard`
 * can be read straight off the design's `right`/`top` values.
 */

/**
 * react-native-web's `useAnimatedProps` unconditionally adds `collapsable: false` to every
 * animated component's props — its comment: "Force `collapsable` to be false so that the native
 * view is not flattened." On native that is a real View prop. On web, react-native-svg forwards
 * props it does not recognise straight to the DOM, and React rejects `collapsable` on an
 * `<svg><path>` as a non-boolean attribute. So drop it, on web only.
 *
 * `forwardRef` rather than a plain wrapper: Animated needs the ref to reach the real `Path`
 * instance, or it loses direct manipulation and re-renders every frame instead.
 */
const WebPath = forwardRef<Path, PathProps & { collapsable?: boolean }>(
  function WebPath({ collapsable: _ignored, ...rest }, ref) {
    return <Path ref={ref} {...rest} />;
  },
);

/**
 * Created once, at module scope — `createAnimatedComponent` must never run during render, or it
 * mints a new component type every frame and remounts the path. The platform branch is resolved
 * here too, so on a device this wraps `Path` directly and the web workaround above is not in the
 * way.
 *
 * Animating an SVG prop works at all because react-native-svg's shape base class opts into
 * Animated's direct-manipulation path on purpose: `Shape.tsx` implements `getNativeScrollRef()`
 * (its own comment calls it a "hack to make Animated work with Shape components") and forwards
 * `setNativeProps` to the host view, so a prop write skips the React render entirely.
 */
const AnimatedPath = Animated.createAnimatedComponent(
  Platform.OS === 'web' ? WebPath : Path,
);

export type SwooshKind = 'feeling' | 'sleep' | 'exercises';

/** Half the stroke width, i.e. how far the art bleeds past its Figma layer box. */
export const SWOOSH_BLEED = 5.2;

/**
 * How often a card's sweep comes round. Each shape sets its own sweep length below and rests for
 * the remainder, so all three stay on one shared 10s cadence however long their gesture is.
 *
 * A short gesture on a long cycle rather than continuous motion — this is the "is this
 * obnoxious?" knob, the same role the pulse size plays in `Celebration`.
 */
const CYCLE_MS = 10000;

/**
 * `length` is the exact arc length of `d`, needed for the dash pattern. Measured with
 * svg-path-properties and cross-checked against an independent Simpson integration of the
 * cubics (agreeing to four decimals), then rounded up.
 *
 * `sweepMs` is how long that card's gesture takes; the rest of the 10s cycle is stillness. They
 * are not proportional to `length` — the sleep spiral covers its 980 units in 8s while the
 * feeling swoosh takes 5s over 193 — so each card moves at its own pace by design.
 *
 * `delayMs` spreads the three starts across the cycle. At 19s of sweep against a 10s cycle the
 * cards now overlap for most of it, so these offsets stagger the starts rather than separating
 * the gestures.
 */
const SHAPES = {
  feeling: {
    width: 105.162,
    height: 124.379,
    strokeWidth: 10.4004,
    round: false,
    length: 193,
    sweepMs: 5000,
    delayMs: 0,
    d: 'M79.6505 4.95666C79.6505 4.95666 108.029 13.9312 97.6973 39.2236C85.6663 66.9287 17.7957 59.8634 7.46443 85.1558C-2.86688 110.448 25.5114 119.423 25.5114 119.423',
  },
  sleep: {
    width: 181.747,
    height: 168.039,
    strokeWidth: 10.4,
    round: true,
    length: 980,
    sweepMs: 8000,
    delayMs: 6000,
    d: 'M87.4466 87.4466C89.2643 87.4466 91.0077 88.1687 92.293 89.454C93.5784 90.7394 94.3005 92.4827 94.3005 94.3004C94.3005 97.936 92.8562 101.423 90.2855 103.993C87.7148 106.564 84.2282 108.008 80.5927 108.008C75.1394 108.008 69.9095 105.842 66.0534 101.986C62.1974 98.1298 60.0311 92.8999 60.0311 87.4466C60.0311 80.1755 62.9195 73.2023 68.0609 68.0609C73.2023 62.9195 80.1755 60.031 87.4466 60.031C96.5354 60.031 105.252 63.6416 111.679 70.0683C118.105 76.4951 121.716 85.2116 121.716 94.3004C121.716 105.207 117.383 115.667 109.671 123.379C101.959 131.091 91.4993 135.424 80.5927 135.424C67.8684 135.424 55.6652 130.369 46.6677 121.372C37.6703 112.374 32.6155 100.171 32.6155 87.4466C32.6155 72.9045 38.3923 58.958 48.6752 48.6752C58.958 38.3923 72.9045 32.6155 87.4466 32.6155C103.806 32.6155 119.496 39.1144 131.064 50.6826C142.633 62.2508 149.132 77.9406 149.132 94.3004C149.132 103.301 147.359 112.214 143.914 120.529C140.47 128.845 135.421 136.4 129.057 142.765C122.693 149.129 115.137 154.178 106.821 157.622C98.5058 161.066 89.5933 162.839 80.5927 162.839C60.5973 162.839 41.4209 154.896 27.282 140.757C13.1431 126.618 5.2 107.442 5.2 87.4466C5.2 65.6334 13.8652 44.7137 29.2895 29.2895C44.7137 13.8652 65.6334 5.2 87.4466 5.2C99.1474 5.2 110.734 7.50465 121.544 11.9824C132.354 16.4601 142.176 23.0232 150.45 31.2969C158.724 39.5707 165.287 49.393 169.765 60.2032C174.242 71.0133 176.547 82.5996 176.547 94.3004',
  },
  exercises: {
    width: 91.9066,
    height: 154.604,
    strokeWidth: 10.4,
    round: false,
    length: 318,
    sweepMs: 6000,
    delayMs: 3000,
    d: 'M5.20003 154.604L5.20002 123.683L5.2 92.762V61.8413C5.2 44.7643 14.3229 30.9207 25.5767 30.9207C36.8304 30.9207 45.9533 44.7643 45.9533 61.8413C45.9533 78.9183 55.0762 92.762 66.33 92.762C77.5837 92.762 86.7066 78.9183 86.7066 61.8413V30.9207L86.7066 1.28305e-06',
  },
} as const;

export function swooshSize(kind: SwooshKind) {
  return { width: SHAPES[kind].width, height: SHAPES[kind].height };
}

/**
 * Sweeps itself away along its path and redraws itself along the same path, once per cycle.
 *
 * The dash pattern is `[L, L]` — one dash and one gap, each the full path length — so the
 * offset alone decides how much is showing. Because the pattern repeats every `2L`, an offset
 * of `2L` renders *identically* to `0`: both put the dash exactly over the path. That is what
 * makes every seam invisible — the static first paint, the sweep's first frame, and each loop
 * restart are all the same picture.
 *
 * Running `2L -> 0` erases from the start of the path (`2L -> L`) and then redraws from the
 * start (`L -> 0`), so the motion always travels one way rather than reversing.
 *
 * Erase-then-draw, not draw-then-erase, because the cycle has to *rest* somewhere: ending on 0
 * leaves the stroke complete for the still part of the cycle. Drawing first would mean resting on
 * an empty card, with the decoration missing most of the time.
 *
 * Offsets stay positive throughout: a negative `strokeDashoffset` is not reliable here.
 */
export function TaskSwoosh({
  kind,
  color,
  animate = true,
}: {
  kind: SwooshKind;
  color: string;
  /** Set false to pin the stroke; the reduce-motion check can also stop it on its own. */
  animate?: boolean;
}) {
  const shape = SHAPES[kind];
  const { length } = shape;

  const offset = useRef(new Animated.Value(2 * length)).current;
  /**
   * Static until proven otherwise. Unlike `Celebration`, which falls back to the *full* burst if
   * the accessibility query fails, a recurring animation falls back to *none*: a one-off reward is
   * worth showing on a failed read, something that comes back every ten seconds is not.
   */
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!animate) {
      setRunning(false);
      return;
    }

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!cancelled) setRunning(!reduced);
      })
      .catch(() => {
        // Leave it static.
      });

    return () => {
      cancelled = true;
    };
  }, [animate]);

  useEffect(() => {
    if (!running) return;

    offset.setValue(2 * length);

    // The stagger sits outside the loop, so it offsets this card's whole schedule rather than
    // adding a pause to every cycle.
    const animation = Animated.sequence([
      Animated.delay(shape.delayMs),
      Animated.loop(
        Animated.sequence([
          Animated.timing(offset, {
            toValue: 0,
            duration: shape.sweepMs,
            // Ease-out: the stroke leaves quickly and settles back gently, so the sweep ends
            // rather than just stopping.
            easing: Easing.out(Easing.cubic),
            // `strokeDashoffset` is absent from RN's NativeAnimatedAllowlist, so the native
            // driver cannot own it. On Fabric it would also only mutate the view, not the shadow
            // tree — any unrelated commit mid-animation snaps the stroke back. JS driver it is;
            // that is one prop write per frame per card, against Celebration's ~170.
            useNativeDriver: false,
          }),
          // Rests here with the stroke fully drawn, which is the whole point of ending on 0.
          Animated.delay(CYCLE_MS - shape.sweepMs),
        ]),
      ),
    ]);

    animation.start();

    return () => {
      animation.stop();
      offset.stopAnimation();
    };
  }, [running, offset, length, shape.sweepMs, shape.delayMs]);

  const linejoin = shape.round ? 'round' : undefined;

  return (
    <Svg
      width={shape.width}
      height={shape.height}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
    >
      {running ? (
        <AnimatedPath
          d={shape.d}
          stroke={color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin={linejoin}
          fill="none"
          strokeDasharray={[length, length]}
          strokeDashoffset={offset}
        />
      ) : (
        <Path
          d={shape.d}
          stroke={color}
          strokeWidth={shape.strokeWidth}
          strokeLinejoin={linejoin}
          fill="none"
        />
      )}
    </Svg>
  );
}
