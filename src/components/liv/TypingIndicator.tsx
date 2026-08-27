import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { color } from '../../theme/tokens';
import { Ring } from '../Ring';

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const DOT_COUNT = 3;
const CYCLE_MS = 1200;
/** Each dot's slice of the cycle, so they rise in sequence rather than together. */
const STAGGER = 0.18;

/**
 * "Liv is typing" — three dots rising in sequence inside her bubble shape.
 *
 * One looping Animated.Value drives all three via staggered interpolation slices, matching
 * the single-clock approach used in Celebration: on web every frame is JS-driven, so extra
 * animated values would mean extra rAF loops for no benefit.
 */
export function TypingIndicator() {
  const clock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(clock, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      clock.stopAnimation();
    };
  }, [clock]);

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        {Array.from({ length: DOT_COUNT }, (_, index) => {
          const start = index * STAGGER;
          // Rise and fall within this dot's slice, flat for the rest of the cycle.
          const translateY = clock.interpolate({
            inputRange: [0, start, start + 0.12, start + 0.24, 1],
            outputRange: [0, 0, -4, 0, 0],
          });
          const opacity = clock.interpolate({
            inputRange: [0, start, start + 0.12, start + 0.24, 1],
            outputRange: [0.4, 0.4, 1, 0.4, 0.4],
          });
          return (
            <Animated.View
              key={index}
              style={[styles.dot, { opacity, transform: [{ translateY }] }]}
            />
          );
        })}
        <Ring radius={16} color={color.brand100} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
  },
  /**
   * Same shape as Liv's bubble, so the reply appears to land where the dots were — tail on
   * the leading edge, hence the logical corner rather than a bottom-left one.
   */
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: color.brand50,
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.brand500,
  },
});
