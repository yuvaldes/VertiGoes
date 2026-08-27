import { Microphone, MicrophoneSlash, X } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../../i18n';
import { color, font, frame, shadow } from '../../theme/tokens';

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const BAR_COUNT = 5;
const BAR_CYCLE_MS = 420;

/**
 * Replaces the whole composer while hands-free voice mode is on — this is a call-style
 * control surface, not a text field, so there is nothing here to type into.
 *
 * SIMULATED: the bars animate on a timer, not real audio input. See `VoiceListening.tsx`
 * and `cannedPhrases.ts` for what actually feeds the conversation while this is showing.
 */
export function VoiceModeBar({
  active,
  muted,
  onToggleMute,
  onClose,
  statusText,
}: {
  /** Bars animate only while this is true — listening, not muted, not waiting on Liv. */
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onClose: () => void;
  statusText: string;
}) {
  const t = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.pill}>
          <View style={styles.micDot}>
            <Microphone size={16} weight="fill" color={color.white} />
          </View>
          <View style={styles.bars}>
            {Array.from({ length: BAR_COUNT }, (_, index) => (
              <Bar key={index} active={active} delay={index * 90} />
            ))}
          </View>
        </View>

        <Pressable
          style={styles.mute}
          onPress={onToggleMute}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(muted ? 'ui.voiceMode.a11yUnmute' : 'ui.voiceMode.a11yMute')}
        >
          {muted ? (
            <MicrophoneSlash size={20} weight="bold" color={color.white} />
          ) : (
            <Microphone size={20} weight="bold" color={color.white} />
          )}
        </Pressable>

        <Pressable
          style={styles.close}
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('ui.voiceMode.a11yEnd')}
        >
          <X size={20} weight="bold" color={color.white} />
        </Pressable>
      </View>

      <Text style={styles.status}>{statusText}</Text>
    </View>
  );
}

/** One bar of the waveform. Its own tiny loop, since five of these costs nothing to animate. */
function Bar({ active, delay }: { active: boolean; delay: number }) {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      grow.stopAnimation();
      Animated.timing(grow, {
        toValue: 0,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(grow, {
          toValue: 1,
          duration: BAR_CYCLE_MS,
          delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(grow, {
          toValue: 0,
          duration: BAR_CYCLE_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      grow.stopAnimation();
    };
  }, [active, delay, grow]);

  const height = grow.interpolate({ inputRange: [0, 1], outputRange: [4, 16] });

  return <Animated.View style={[styles.bar, { height }]} />;
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: frame.gutter,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    ...shadow.xs,
  },
  micDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: color.brand500,
  },
  mute: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 15,
    color: color.gray400,
    textAlign: 'center',
  },
});
