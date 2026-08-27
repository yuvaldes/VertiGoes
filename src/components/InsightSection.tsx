import { LinearGradient } from 'expo-linear-gradient';
import { Sparkle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  dateLabel: string;
  insight: string;
  onOpenCalendar?: () => void;
};

/** Figma node 7318:214554 "Frame 9" — 361 x 88. */
export function InsightSection({ dateLabel, insight, onOpenCalendar }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      <View style={styles.dateRow}>
        <Text style={[styles.date, displayFont]}>{dateLabel}</Text>
        <Pressable onPress={onOpenCalendar} hitSlop={8}>
          <Text style={styles.link}>{t('common.insight.openCalendar')}</Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={[color.brand100, color.brand50]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.banner}
      >
        <Sparkle size={24} weight="fill" color={color.brand400} />
        <Text style={[styles.bannerText, displayFont]}>{insight}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  dateRow: {
    minHeight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  link: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.brand500,
  },
  banner: {
    // minHeight: the two wrapped lines now measure 38, which with 16 padding either side
    // overflows a hard 64 — and this box clips, so they would have been cut off.
    minHeight: 64,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  bannerText: {
    flex: 1,
    // Without this, native Yoga sizes the Text to its single-line intrinsic width first and
    // lets it overflow past the row instead of wrapping — `flex: 1` alone isn't enough here,
    // unlike on web where flex-basis: 0 already implies a shrinkable minimum width.
    minWidth: 0,
    fontFamily: font.display,
    fontSize: 14,
    lineHeight: 19,
    color: color.black,
  },
});
