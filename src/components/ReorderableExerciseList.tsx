import { DotsSixVertical, Trash } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import type { Exercise } from '../data/home';
import { useT } from '../i18n';
import { color } from '../theme/tokens';
import { EDIT_ROW_PITCH, ExerciseListRow } from './ExerciseListRow';

type Props = {
  exercises: Exercise[];
  onReorder: (from: number, to: number) => void;
  onRemove: (key: string) => void;
  /** Lets the screen freeze its ScrollView while a row is in hand. */
  onDragStateChange?: (dragging: boolean) => void;
};

/** Neighbours sliding aside, and the lifted card settling into its slot. */
const SHIFT_DURATION = 160;
/** Long enough that the drop and the shadow fading out both read as deliberate. */
const SETTLE_DURATION = 220;
const LIFT_DURATION = 120;

/**
 * Today's exercises, reorderable by dragging the DotsSixVertical handle.
 *
 * Hand-rolled on PanResponder rather than react-native-draggable-flatlist: that needs
 * Reanimated and Gesture Handler, and this screen has to keep working in the web preview.
 * Rows are a fixed 56px on a 64px pitch, so the target index is just the drag distance
 * divided by the pitch — no measuring required.
 *
 * Motion: the lifted card tracks the finger directly, each displaced neighbour animates
 * to its new slot, and on release the card animates into place *before* the array is
 * reordered — so committing the new order is visually a no-op rather than a jump.
 *
 * The gesture reads `gesture.dy` only and every offset is a translateY, so nothing here has
 * a leading or trailing side to mirror under RTL.
 */
export function ReorderableExerciseList({
  exercises,
  onReorder,
  onRemove,
  onDragStateChange,
}: Props) {
  const t = useT();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);

  /** Follows the finger for the card in hand. */
  const translate = useRef(new Animated.Value(0)).current;
  /** 0 -> 1 as a card is picked up; drives the lift scale. */
  const lift = useRef(new Animated.Value(0)).current;
  /** Per-row slide offsets, keyed so a reorder can't hand a row someone else's value. */
  const offsets = useRef(new Map<string, Animated.Value>()).current;

  const offsetFor = (key: string) => {
    let value = offsets.get(key);
    if (!value) {
      value = new Animated.Value(0);
      offsets.set(key, value);
    }
    return value;
  };

  // The responders are memoised, so everything mutable they touch goes through a ref.
  const dragIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const settlingRef = useRef(false);
  const exercisesRef = useRef(exercises);
  const onReorderRef = useRef(onReorder);
  const onDragStateChangeRef = useRef(onDragStateChange);
  exercisesRef.current = exercises;
  onReorderRef.current = onReorder;
  onDragStateChangeRef.current = onDragStateChange;

  /** How far a non-dragged row slides to make room for the one in hand. */
  const shiftFor = (index: number, from: number, to: number) => {
    if (index === from) return 0;
    if (from < to && index > from && index <= to) return -EDIT_ROW_PITCH;
    if (from > to && index < from && index >= to) return EDIT_ROW_PITCH;
    return 0;
  };

  // Slide displaced neighbours whenever the drop target moves.
  useEffect(() => {
    if (dragIndex === null || targetIndex === null) return;
    exercisesRef.current.forEach((exercise, index) => {
      if (index === dragIndex) return;
      Animated.timing(offsetFor(exercise.key), {
        toValue: shiftFor(index, dragIndex, targetIndex),
        duration: SHIFT_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });
    // offsetFor / shiftFor are stable helpers over refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragIndex, targetIndex]);

  const responders = useMemo(
    () =>
      exercises.map((_, index) =>
        PanResponder.create({
          // Ignore a new grab while the previous drop is still settling.
          onStartShouldSetPanResponder: () => !settlingRef.current,
          onMoveShouldSetPanResponder: () => !settlingRef.current,
          onPanResponderGrant: () => {
            dragIndexRef.current = index;
            targetIndexRef.current = index;
            setDragIndex(index);
            setTargetIndex(index);
            translate.setValue(0);
            Animated.timing(lift, {
              toValue: 1,
              duration: LIFT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: false,
            }).start();
            onDragStateChangeRef.current?.(true);
          },
          onPanResponderMove: (_event, gesture) => {
            translate.setValue(gesture.dy);
            const from = dragIndexRef.current;
            if (from === null) return;
            const max = exercisesRef.current.length - 1;
            const next = Math.max(
              0,
              Math.min(max, from + Math.round(gesture.dy / EDIT_ROW_PITCH)),
            );
            if (next !== targetIndexRef.current) {
              targetIndexRef.current = next;
              setTargetIndex(next);
            }
          },
          onPanResponderRelease: () => settle(),
          onPanResponderTerminate: () => settle(),
        }),
      ),
    // Identity only needs to change when the row count does; indices are positional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercises.length, translate, lift],
  );

  const settle = () => {
    const from = dragIndexRef.current;
    const to = targetIndexRef.current;
    if (from === null || to === null) return;

    settlingRef.current = true;
    Animated.parallel([
      Animated.timing(translate, {
        toValue: (to - from) * EDIT_ROW_PITCH,
        duration: SETTLE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(lift, {
        toValue: 0,
        duration: SETTLE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      // Every row is already sitting where the new order puts it, so flattening the
      // offsets and committing in the same tick reads as no movement at all.
      offsets.forEach((value) => value.setValue(0));
      translate.setValue(0);
      if (from !== to) onReorderRef.current(from, to);
      dragIndexRef.current = null;
      targetIndexRef.current = null;
      settlingRef.current = false;
      setDragIndex(null);
      setTargetIndex(null);
      onDragStateChangeRef.current?.(false);
    });
  };

  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  return (
    <View style={styles.list}>
      {exercises.map((exercise, index) => {
        const isDragging = index === dragIndex;
        return (
          <Animated.View
            key={exercise.key}
            style={
              isDragging
                ? { zIndex: 2, transform: [{ translateY: translate }, { scale: liftScale }] }
                : { zIndex: 1, transform: [{ translateY: offsetFor(exercise.key) }] }
            }
          >
            {/*
              The drag shadow is its own layer so its opacity can be animated — a
              `boxShadow` string can't be interpolated, and toggling it on a boolean made
              it snap off the moment the drop finished. Driving it from `lift` fades it out
              over the same curve the card settles on.
            */}
            {isDragging && <Animated.View style={[styles.dragShadow, { opacity: lift }]} />}

            <View style={styles.rowLayer}>
              <ExerciseListRow
                title={t(exercise.titleKey)}
                duration={t('data.duration.minutes', { minutes: exercise.durationMinutes })}
                thumbnail={exercise.thumbnail}
                handle={
                  <View
                    {...responders[index].panHandlers}
                    style={styles.handle}
                    accessibilityLabel={t('ui.reorderList.a11yReorder', {
                      title: t(exercise.titleKey),
                    })}
                  >
                    <DotsSixVertical size={20} color={color.gray400} />
                  </View>
                }
                trailing={
                  <Pressable
                    onPress={() => onRemove(exercise.key)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t('ui.reorderList.a11yRemove', {
                      title: t(exercise.titleKey),
                    })}
                  >
                    <Trash size={24} color={color.error500} />
                  </Pressable>
                }
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  /** Keeps the card above its own shadow layer, which is absolutely positioned. */
  rowLayer: {
    zIndex: 1,
  },
  /**
   * Not a Figma token — the design has no drag state for these rows. Derived from
   * shadow-2xl (0 24 48 -12 at 18%) scaled down: a wide, low-opacity spread so the card
   * reads as lifted without a hard edge.
   */
  dragShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: color.white,
    pointerEvents: 'none',
    ...Platform.select({
      web: { boxShadow: '0px 10px 30px -8px rgba(10, 13, 18, 0.13)' },
      ios: {
        shadowColor: '#0a0d12',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.13,
        shadowRadius: 15,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  handle: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Web only: stops the browser turning the drag into a text selection.
    ...(Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none' } as object) : null),
  },
});
