import { ArrowUp, Microphone, Waveform } from 'phosphor-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useT } from '../../i18n';
import { color, font, frame, shadow } from '../../theme/tokens';
import { Ring } from '../Ring';

const LINE_HEIGHT = 20;
/** Slack over the measured one-line height before the layout switches to stacked. */
const WRAP_THRESHOLD = 6;
/** Roughly four lines, then the field scrolls instead of pushing the tab bar away. */
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 4;

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Mic: dictate into the field, leaving the text editable before it is sent. */
  onDictate: () => void;
  /** Waveform: hands-free voice mode — what is heard is sent straight away. */
  onVoiceMode: () => void;
  /** Send is blocked while Liv is still replying, so turns can't interleave. */
  disabled: boolean;
};

export function Composer({
  value,
  onChangeText,
  onSend,
  onDictate,
  onVoiceMode,
  disabled,
}: Props) {
  const t = useT();

  /**
   * Driven height, not auto. react-native-web renders a multiline TextInput as a
   * <textarea> whose intrinsic size is two rows, so leaving it to grow on its own both
   * makes an empty composer too tall and makes `onContentSizeChange` report the element's
   * height rather than the text's. Pinning the height gives a true content measurement and
   * lets the field hug one line when empty.
   */
  const [contentHeight, setContentHeight] = useState(LINE_HEIGHT);
  const inputHeight = Math.min(MAX_INPUT_HEIGHT, Math.max(LINE_HEIGHT, contentHeight));

  const hasText = value.trim().length > 0;
  const canSend = hasText && !disabled;

  /**
   * The mock puts the icons inline with a single line of placeholder, but below the text
   * once it wraps — so the text can run the full width instead of being squeezed beside
   * them. That means switching axis on content height rather than picking one layout.
   */
  const isMultiline = contentHeight > LINE_HEIGHT + WRAP_THRESHOLD;

  const actions = (
    <View style={styles.actions}>
      <Pressable
        style={styles.mic}
        onPress={onDictate}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('ui.composer.a11yDictate')}
      >
        <Microphone size={22} color={color.gray500} />
      </Pressable>

      {/* One primary slot: send when there's something to send, voice mode when there isn't. */}
      <Pressable
        style={[styles.primary, hasText && !canSend && styles.primaryDisabled]}
        onPress={hasText ? (canSend ? onSend : undefined) : onVoiceMode}
        disabled={hasText && !canSend}
        accessibilityRole="button"
        accessibilityLabel={t(hasText ? 'ui.composer.a11ySend' : 'ui.composer.a11yVoiceMode')}
      >
        {hasText ? (
          <ArrowUp size={20} weight="bold" color={color.white} />
        ) : (
          <Waveform size={20} weight="bold" color={color.white} />
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.field,
          isMultiline ? styles.fieldMultiline : styles.fieldSingleLine,
        ]}
      >
        <TextInput
          style={[styles.input, isMultiline && styles.inputMultiline, { height: inputHeight }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={t('ui.composer.placeholder')}
          placeholderTextColor={color.gray400}
          multiline
          onContentSizeChange={(event) => setContentHeight(event.nativeEvent.contentSize.height)}
          accessibilityLabel={t('ui.composer.a11yLabel')}
        />
        {actions}
        <Ring radius={isMultiline ? 16 : 22} color={color.gray200} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: frame.gutter,
    paddingTop: 8,
    paddingBottom: 8,
  },
  field: {
    backgroundColor: color.white,
    paddingVertical: 8,
    paddingStart: 14,
    paddingEnd: 8,
    ...shadow.xs,
  },
  /** A pill while it is one line tall. */
  fieldSingleLine: {
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  /** Once it wraps, the text gets the full width and the icons drop beneath it. */
  fieldMultiline: {
    borderRadius: 16,
    flexDirection: 'column',
    gap: 4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    maxHeight: MAX_INPUT_HEIGHT,
    padding: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: LINE_HEIGHT,
    color: color.gray900,
    // RN-web draws its own focus ring, which fights the Ring outline.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMultiline: {
    alignSelf: 'stretch',
    flex: undefined,
    paddingTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  mic: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: {
    backgroundColor: color.gray300,
  },
});
