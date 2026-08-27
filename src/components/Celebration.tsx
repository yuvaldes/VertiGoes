import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { useDirection } from '../i18n';
import { color } from '../theme/tokens';

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// ---------------------------------------------------------------------------
// TUNING
//
// This is a port of the `canvas-confetti` "side cannons" recipe: two emitters at
// the left and right edges, firing inwards and upwards for three seconds.
//
// canvas-confetti itself cannot be used — it draws to a DOM canvas, so it exists
// on web only, and this screen has to run on a device. What is ported is its
// actual integration loop (see `simulateCannon`), not an approximation of it, so
// the motion matches rather than merely resembling it.
//
// Every number here is safe to change. DURATION_MS is the whole timeline and each
// keyframe time is a fraction of it (0 = mount, 1 = onDone).
// ---------------------------------------------------------------------------

/** How long the cannons keep firing. The recipe's `Date.now() + 3 * 1000`. */
const EMIT_MS = 3000;
/** Frames a single piece lives. canvas-confetti's `ticks`, trimmed from 200 to shorten the tail. */
const LIFE_TICKS = 100;
/** canvas-confetti steps its physics once per animation frame, so ticks are frames. */
const FPS = 60;
const LIFE_MS = (LIFE_TICKS / FPS) * 1000;

/** Emission plus the last piece's fall. */
const DURATION_MS = Math.round(EMIT_MS + LIFE_MS);

/** Reduce-motion path: a single soft pulse, no cannons. See `mode` in the component. */
const REDUCED_DURATION_MS = 420;

/**
 * Pieces per cannon.
 *
 * The recipe emits 2 per frame per side — about 360 each over three seconds. That is a canvas
 * drawing loop; here every piece is a View with its own interpolations, so the count has to be
 * a fraction of it. 32 a side reads as a stream while keeping the per-frame interpolation count
 * near the ~170 this file previously budgeted (on a device the shared clock is native-driven, so
 * the cost lands on the UI thread; on web it is JS).
 */
const PER_CANNON = 32;

/** Keyframes sampled from each piece's simulated arc. */
const ARC_SAMPLES = 10;

// --- canvas-confetti's physics constants, verbatim from the recipe -----------

/** `startVelocity: 60`, in px per frame — a piece's opening speed. */
const START_VELOCITY = 60;
/** `spread: 55` degrees, the fan either side of the cannon's angle. */
const SPREAD_DEG = 55;
/** canvas-confetti multiplies its `gravity` option by 3, and adds it to *position* each frame. */
const GRAVITY = 3;
/** Velocity retained per frame. canvas-confetti's `decay` default. */
const DECAY = 0.9;

type CannonSide = 'start' | 'end';

/** The two muzzles, in reading order. Their angles come from `cannonsFor`. */
const SIDES: readonly CannonSide[] = ['start', 'end'];

/**
 * `angle: 60` from the start edge, `angle: 120` from the end.
 *
 * The muzzles are anchored logically so they follow the layout, but a piece's flight is a
 * `translateX`, and neither platform mirrors a transform. Under RTL the start muzzle is on the
 * right, so it has to take the end muzzle's inward angle or every piece leaves the frame on the
 * first tick — silently, since there is nothing left on screen to look wrong.
 */
function cannonsFor(isRTL: boolean): { side: CannonSide; angle: number }[] {
  return [
    { side: 'start', angle: isRTL ? 120 : 60 },
    { side: 'end', angle: isRTL ? 60 : 120 },
  ];
}

// --- Per-piece timeline. All values are fractions of DURATION_MS. -----------

const EMIT_SPAN = EMIT_MS / DURATION_MS;
const LIFE_SPAN = LIFE_MS / DURATION_MS;
/** One frame, so a piece eases in over its first step rather than popping at full opacity. */
const FADE_IN = 1 / FPS / (DURATION_MS / 1000);

/** Edge-on passes over a piece's life. Keep at 1-2 — more starts to read as flicker. */
const TUMBLE_FLIPS_MIN = 1;
const TUMBLE_FLIPS_MAX = 2;
/** How thin the paper gets edge-on. 0.2 is a sliver without vanishing. */
const TUMBLE_FLOOR = 0.2;
/** Keyframes per flip. The tumble is a sampled |cos| and needs a few per period. */
const TUMBLE_SAMPLES_PER_FLIP = 4;

/** In-plane spin, degrees over a whole life. */
const SPIN_MIN = 180;
const SPIN_MAX = 540;

// --- Reduce-motion pulse ----------------------------------------------------
// Deliberately small and low-contrast. No full-screen anything: a dizzy user
// must never get a flash.

const PULSE_RING_SIZE = 64;
const PULSE_RING_OPACITY = 0.32;
const PULSE_CORE_OPACITY = 0.45;
const PULSE_SPAN = 0.85;

/** The recipe's palette, kept verbatim rather than mapped onto the product tokens. */
const PALETTE = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];

// ---------------------------------------------------------------------------
// PIECE GENERATION — runs exactly once per mount.
// ---------------------------------------------------------------------------

type Piece = {
  side: CannonSide;
  tint: string;
  width: number;
  height: number;
  radius: number;
  /** Arc keyframes: absolute clock times, plus px offsets from the cannon's muzzle. */
  arcTimes: number[];
  arcX: number[];
  arcY: number[];
  /** Opacity envelope, absolute clock times. */
  fadeTimes: number[];
  spinTimes: number[];
  spinMid: string;
  spinEnd: string;
  tumbleTimes: number[];
  tumbleValues: number[];
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * interpolate() requires a strictly increasing inputRange or it throws. Retuning the
 * constants above must never be able to crash the app, so nudge any collisions.
 */
function ascending(times: number[]): number[] {
  const out = times.slice();
  for (let i = 1; i < out.length; i++) {
    if (out[i] <= out[i - 1]) out[i] = out[i - 1] + 1e-4;
  }
  return out;
}

/** `segments + 1` evenly spaced, strictly increasing clock times across [start, end]. */
function spread(start: number, end: number, segments: number): number[] {
  const times: number[] = [];
  for (let i = 0; i <= segments; i++) times.push(lerp(start, end, i / segments));
  return ascending(times);
}

/**
 * canvas-confetti's own update loop, run once at mount and down-sampled to keyframes.
 *
 * From its `randomPhysics` / `updateFizz`:
 *   angle2D = -angle + (spread/2 - random * spread)   // negated: screen y grows downward
 *   velocity = startVelocity * 0.5 + random * startVelocity
 *   each frame:  x += cos(angle2D) * v
 *                y += sin(angle2D) * v + gravity      // gravity moves position, not velocity
 *                v *= decay
 *
 * Note gravity is a constant *positional* drift rather than an acceleration — that is what
 * makes confetti settle at a steady rate instead of accelerating away, and it is why the tail
 * of the arc is a straight fall.
 */
function simulateCannon(angleDeg: number, samples: number) {
  const radAngle = (angleDeg * Math.PI) / 180;
  const radSpread = (SPREAD_DEG * Math.PI) / 180;
  const angle2D = -radAngle + (0.5 * radSpread - Math.random() * radSpread);

  let velocity = START_VELOCITY * 0.5 + Math.random() * START_VELOCITY;
  let x = 0;
  let y = 0;
  const xs: number[] = [0];
  const ys: number[] = [0];

  for (let tick = 1; tick <= LIFE_TICKS; tick++) {
    x += Math.cos(angle2D) * velocity;
    y += Math.sin(angle2D) * velocity + GRAVITY;
    velocity *= DECAY;
    xs.push(x);
    ys.push(y);
  }

  const arcX: number[] = [];
  const arcY: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const index = Math.round((i / samples) * LIFE_TICKS);
    arcX.push(round(xs[index]));
    arcY.push(round(ys[index]));
  }
  return { arcX, arcY };
}

/** Sampled |cos| — a smooth edge-on flip rather than a triangle wave. */
function tumbleCurve(flips: number, phase: number, samples: number): number[] {
  const values: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const faceOn = Math.abs(Math.cos(Math.PI * (phase + (i / samples) * flips)));
    values.push(round(TUMBLE_FLOOR + (1 - TUMBLE_FLOOR) * faceOn));
  }
  return values;
}

/** Fisher-Yates. A shuffled deck beats picking at random: no two neighbours clash. */
function shuffled<T>(items: readonly T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = out[i];
    out[i] = out[j];
    out[j] = swap;
  }
  return out;
}

/** canvas-confetti's default shape is a square; the oblong ones read as ribbon. */
function shapeFor(index: number) {
  if (index % 3 === 0) {
    return { width: round(rand(9, 13)), height: round(rand(4, 6)), radius: 1 };
  }
  const side = round(rand(6, 9));
  return { width: side, height: side, radius: 1.5 };
}

function buildPiece(
  side: CannonSide,
  angle: number,
  index: number,
  count: number,
  tint: string,
): Piece {
  // Spawn times march evenly across the emission window, jittered inside their own slot so the
  // stream does not pulse. The recipe fires on every frame; this is the same thing, thinned.
  const slot = EMIT_SPAN / count;
  const start = Math.min(EMIT_SPAN, index * slot + Math.random() * slot);
  const end = Math.min(1, start + LIFE_SPAN);

  const { arcX, arcY } = simulateCannon(angle, ARC_SAMPLES);

  const flips = Math.round(rand(TUMBLE_FLIPS_MIN, TUMBLE_FLIPS_MAX));
  const tumbleSamples = flips * TUMBLE_SAMPLES_PER_FLIP;
  const spin = (Math.random() < 0.5 ? -1 : 1) * rand(SPIN_MIN, SPIN_MAX);

  return {
    side,
    tint,
    ...shapeFor(index),

    arcTimes: spread(start, end, ARC_SAMPLES),
    arcX,
    arcY,

    // canvas-confetti fades linearly across the whole life (`1 - tick / totalTicks`); the extra
    // first stop is a single frame of fade-in so nothing appears at full opacity mid-air.
    fadeTimes: ascending([start, start + FADE_IN, end]),

    // Three stops, not two, so the spin decelerates instead of ticking along at a constant
    // rate as drag bleeds off the angular velocity.
    spinTimes: ascending([start, lerp(start, end, 0.45), end]),
    spinMid: `${round(spin * 0.62)}deg`,
    spinEnd: `${round(spin)}deg`,

    tumbleTimes: spread(start, end, tumbleSamples),
    tumbleValues: tumbleCurve(flips, Math.random(), tumbleSamples),
  };
}

function buildPieces(isRTL: boolean): Piece[] {
  const pieces: Piece[] = [];
  cannonsFor(isRTL).forEach(({ side, angle }) => {
    const deck = shuffled(PALETTE);
    for (let i = 0; i < PER_CANNON; i++) {
      pieces.push(buildPiece(side, angle, i, PER_CANNON, deck[i % deck.length]));
    }
  });
  return pieces;
}

/** 'pending' lasts one frame, while we ask whether the user prefers reduced motion. */
type Mode = 'pending' | 'full' | 'reduced';

/**
 * The celebration shown when a task is completed: two confetti cannons at the left and right
 * edges, firing inwards for three seconds.
 *
 * Mount with a changing `key` to replay; `onDone` fires when the timeline ends, and never after
 * unmount. Notes worth reading before editing:
 *
 * - ONE `Animated.Value`. On react-native-web each extra animated value is another rAF loop and
 *   another style flush per frame, and independent values drift out of phase. The usual price of
 *   a shared clock — one easing curve for everything — is paid off by baking each piece's easing
 *   into its own sampled arc instead.
 * - Interpolations read the master clock directly, using absolute times. No interpolation of an
 *   interpolation, which would roughly double the per-frame node count.
 * - Only `opacity` and `transform` are animated, so on a device the whole thing is native-driven.
 *   Size, radius and colour are static.
 * - The tumble is `scaleY`, so no perspective transform is needed and web matches native.
 * - This is a vertigo app: no full-screen flash, no shake, no strobe, and reduce-motion gets a
 *   single soft pulse instead of the cannons.
 */
export function Celebration({ onDone }: { onDone?: () => void }) {
  /** Linear master clock. All the easing lives in the sampled curves, not here. */
  const clock = useRef(new Animated.Value(0)).current;
  const [mode, setMode] = useState<Mode>('pending');
  const { isRTL } = useDirection();

  // Lazy ref init: randomised exactly once per mount. `useRef(buildPieces())` would re-roll
  // every random on every render and throw the result away, and useMemo is only a cache — this
  // is the pattern that actually guarantees once. The direction is baked in with the rest: a
  // burst is over in a few seconds, so a language change mid-flight can wait for the next one.
  const piecesRef = useRef<Piece[] | null>(null);
  if (piecesRef.current === null) piecesRef.current = buildPieces(isRTL);
  const pieces = piecesRef.current;

  // Callers pass an inline arrow, so `onDone` is a new function on every parent render. Holding
  // it in a ref keeps it out of the start effect's dependencies, which would otherwise restart
  // the animation mid-flight.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // 1. Ask whether the user prefers reduced motion. Nothing is on screen until this resolves
  //    (one frame at most; on web it is a matchMedia read), so a user who asked for reduced
  //    motion never sees a single frame of confetti. Falling back to the full burst on rejection
  //    is deliberate: a failed query should not silently kill the reward.
  useEffect(() => {
    let cancelled = false;
    const decide = (reduced: boolean) => {
      if (!cancelled) setMode(reduced ? 'reduced' : 'full');
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(decide)
      .catch(() => decide(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Start the clock only once the pieces have actually committed, so frame 0 of the animation
  //    is also frame 0 of their existence and nothing can pop in mid-flight. `mode` only ever
  //    changes pending -> full|reduced, so this runs once for real.
  useEffect(() => {
    if (mode === 'pending') return;

    let cancelled = false;
    const animation = Animated.timing(clock, {
      toValue: 1,
      duration: mode === 'reduced' ? REDUCED_DURATION_MS : DURATION_MS,
      // Intentionally linear: the clock is a time axis. Easing here would double-ease every
      // piece on top of its own sampled curve.
      easing: Easing.linear,
      useNativeDriver: USE_NATIVE_DRIVER,
    });

    // `animation.stop()` invokes this with finished: false, and `cancelled` guards the rest —
    // onDone can never fire after unmount.
    animation.start(({ finished }) => {
      if (finished && !cancelled) onDoneRef.current?.();
    });

    return () => {
      cancelled = true;
      animation.stop();
      clock.stopAnimation();
    };
  }, [mode, clock]);

  const ringScale = clock.interpolate({
    inputRange: spread(0, PULSE_SPAN, 2),
    outputRange: [0.35, 1, 1.7],
    extrapolate: 'clamp',
  });
  const ringOpacity = clock.interpolate({
    inputRange: spread(0, PULSE_SPAN, 3),
    outputRange: [0, PULSE_RING_OPACITY, PULSE_RING_OPACITY * 0.5, 0],
    extrapolate: 'clamp',
  });
  // The core runs a little faster than the ring, so the pulse reads as one thing expanding out
  // of a bright centre rather than as two concentric rings.
  const coreScale = clock.interpolate({
    inputRange: spread(0, PULSE_SPAN * 0.7, 2),
    outputRange: [0.2, 1.1, 1.5],
    extrapolate: 'clamp',
  });
  const coreOpacity = clock.interpolate({
    inputRange: spread(0, PULSE_SPAN * 0.7, 2),
    outputRange: [0, PULSE_CORE_OPACITY, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.overlay}>
      {/* The cannons replace the old centre burst, so the pulse is now the reduced path alone. */}
      {mode === 'reduced' && (
        <>
          <Animated.View
            style={[styles.pulseRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
          />
          <Animated.View
            style={[styles.pulseCore, { opacity: coreOpacity, transform: [{ scale: coreScale }] }]}
          />
        </>
      )}

      {mode === 'full' &&
        SIDES.map((side) => (
          <View
            key={side}
            style={[styles.cannon, side === 'start' ? styles.cannonStart : styles.cannonEnd]}
          >
            {pieces
              .filter((piece) => piece.side === side)
              .map((piece, index) => {
                const translateX = clock.interpolate({
                  inputRange: piece.arcTimes,
                  outputRange: piece.arcX,
                  extrapolate: 'clamp',
                });
                const translateY = clock.interpolate({
                  inputRange: piece.arcTimes,
                  outputRange: piece.arcY,
                  extrapolate: 'clamp',
                });
                const opacity = clock.interpolate({
                  inputRange: piece.fadeTimes,
                  outputRange: [0, 1, 0],
                  extrapolate: 'clamp',
                });
                const rotate = clock.interpolate({
                  inputRange: piece.spinTimes,
                  outputRange: ['0deg', piece.spinMid, piece.spinEnd],
                  extrapolate: 'clamp',
                });
                const scaleY = clock.interpolate({
                  inputRange: piece.tumbleTimes,
                  outputRange: piece.tumbleValues,
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.piece,
                      {
                        width: piece.width,
                        height: piece.height,
                        borderRadius: piece.radius,
                        backgroundColor: piece.tint,
                        opacity,
                        // Order matters. translate places the piece, then rotate and scaleY act
                        // about its own centre; `scaleY` sits after `rotate` so the flip axis
                        // tilts with the paper instead of staying screen-vertical.
                        transform: [{ translateX }, { translateY }, { rotate }, { scaleY }],
                      },
                    ]}
                  />
                );
              })}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Centres the reduce-motion pulse; the cannons anchor themselves.
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * A zero-size muzzle at the middle of its edge — the recipe's `origin: { x: 0, y: 0.5 }` and
   * `{ x: 1, y: 0.5 }`. Anchoring to the edges rather than offsetting from the centre keeps this
   * correct on any screen width instead of assuming the 393pt frame.
   */
  cannon: {
    position: 'absolute',
    top: '50%',
    width: 0,
    height: 0,
  },
  cannonStart: {
    start: 0,
  },
  cannonEnd: {
    end: 0,
  },
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_RING_SIZE,
    height: PULSE_RING_SIZE,
    borderRadius: PULSE_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#0fd2bb',
  },
  pulseCore: {
    position: 'absolute',
    width: PULSE_RING_SIZE * 0.32,
    height: PULSE_RING_SIZE * 0.32,
    borderRadius: (PULSE_RING_SIZE * 0.32) / 2,
    backgroundColor: color.brand400,
  },
});
