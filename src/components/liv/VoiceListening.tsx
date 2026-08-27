import { Microphone, X } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useDisplayFont, useLocale, useT } from '../../i18n';
import { color, font, frame, shadow } from '../../theme/tokens';
import { LISTEN_DELAY_MS, nextCannedPhrase } from './cannedPhrases';

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** One pulse of the ring. Kept slow and soft — this is a vertigo app. */
const PULSE_MS = 1500;

/**
 * SIMULATED speech input. Nothing is recorded and no audio permission is requested.
 *
 * Expo SDK 57 has `expo-speech` for text-to-speech but no first-party speech-to-text, so a
 * real implementation would need one of:
 *   - web: the browser's SpeechRecognition API (webkitSpeechRecognition), no dependency
 *   - native: `expo-speech-recognition`, which wraps SFSpeechRecognizer / Android
 *     SpeechRecognizer and requires a native dev build plus microphone permissions
 * Both fit behind this component's `onHeard` callback without changing anything else.
 *
 * TODO(voice): swap the timer below for a real recogniser.
 */

type Props = {
  onHeard: (text: string) => void;
  onCancel: () => void;
};

export function VoiceListening({ onHeard, onCancel }: Props) {
  const t = useT();
  const locale = useLocale();
  const displayFont = useDisplayFont();
  const pulse = useRef(new Animated.Value(0)).current;

  // Callbacks live in refs so the timer effect never restarts on a parent re-render, which
  // would reset the countdown and make the mic feel stuck.
  const onHeardRef = useRef(onHeard);
  const onCancelRef = useRef(onCancel);
  useEffect(() => {
    onHeardRef.current = onHeard;
    onCancelRef.current = onCancel;
  }, [onHeard, onCancel]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: PULSE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    );
    loop.start();

    const timer = setTimeout(() => {
      onHeardRef.current(nextCannedPhrase(locale));
    }, LISTEN_DELAY_MS);

    return () => {
      clearTimeout(timer);
      loop.stop();
      pulse.stopAnimation();
    };
  }, [pulse, locale]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.28, 0],
  });

  return (
    <View style={styles.root}>
      <View style={styles.micWrap}>
        <Animated.View
          style={[styles.pulse, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
        />
        <View style={styles.mic}>
          <Microphone size={20} weight="fill" color={color.white} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, displayFont]}>{t('ui.voiceListening.title')}</Text>
        <Text style={styles.hint}>{t('ui.voiceListening.hint')}</Text>
      </View>

      <Pressable
        style={styles.stop}
        onPress={onCancel}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('ui.voiceListening.a11yStop')}
      >
        <X size={18} color={color.gray700} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: frame.gutter,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: color.white,
    ...shadow.xs,
  },
  micWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.brand500,
    pointerEvents: 'none',
  },
  mic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  hint: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 15,
    color: color.gray400,
  },
  stop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
