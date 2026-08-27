import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDisplayFont } from '../i18n';
import { color, font } from '../theme/tokens';
import { BackButton } from './BackButton';

type Props = {
  title: string;
  onBack: () => void;
  /** An action at the trailing end, e.g. "Dismiss all" — rare, so most callers omit it. */
  trailing?: ReactNode;
};

/**
 * Back button + screen title. Figma "Frame 72" — 361 x 28.
 *
 * Shared by every pushed screen; it was copy-pasted into the edit and calendar screens,
 * which is exactly how the two drifted apart.
 */
export function ScreenTitleRow({ title, onBack, trailing }: Props) {
  const displayFont = useDisplayFont();

  return (
    <View style={styles.row}>
      <BackButton onPress={onBack} />
      <Text style={[styles.title, displayFont]}>{title}</Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  /** No horizontal padding — the caller supplies the gutter, as with AppHeader. */
  row: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.display,
    fontSize: 24,
    // 32, not the design's 24: Android clips glyphs to the line box, which cost titles like
    // "Today's exercises" their descenders. The row is already 32 tall, so nothing moves.
    lineHeight: 32,
    color: color.black,
  },
});
