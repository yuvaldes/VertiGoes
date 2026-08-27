import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { color, font, shadow } from '../theme/tokens';

export const EDIT_ROW_HEIGHT = 56;
export const EDIT_ROW_GAP = 8;
/** Distance between two consecutive rows — the unit a drag moves by. */
export const EDIT_ROW_PITCH = EDIT_ROW_HEIGHT + EDIT_ROW_GAP;

type Props = {
  title: string;
  duration: string;
  thumbnail: ImageSourcePropType;
  /** The DotsSixVertical drag handle; only today's list has one. */
  handle?: ReactNode;
  trailing: ReactNode;
};

/**
 * A row in either list on the edit screen (Figma 7338:215304 and 7338:215328).
 * Both variants share the same 56px box, padding and type — they differ only in the
 * leading handle and the trailing action.
 */
export function ExerciseListRow({ title, duration, thumbnail, handle, trailing }: Props) {
  return (
    <View style={styles.row}>
      {handle}
      <Image source={thumbnail} style={styles.thumb} resizeMode="cover" />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.duration}>{duration}</Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: EDIT_ROW_HEIGHT,
    paddingStart: 8,
    paddingEnd: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: color.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadow.sm,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  // Figma "Frame 13" is 28 tall = 16 + 12, so the two lines sit flush with no gap.
  text: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.black,
  },
  duration: {
    fontFamily: font.body,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray500,
  },
});
