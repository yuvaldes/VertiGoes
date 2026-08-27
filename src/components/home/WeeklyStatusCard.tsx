import { StyleSheet, Text, View } from 'react-native';

import type { WeekBar } from '../../data/dayRecords';
import { useDisplayFont, useT } from '../../i18n';
import { color, font } from '../../theme/tokens';
import { Ring } from '../Ring';

/**
 * The chart row is exactly 56 tall, and a column is
 * `padding 2 + value 12 + gap 2 + bar + gap 2 + label 12 + padding 2`, so the tallest bar
 * the design draws (24) fills the row precisely. Everything below scales inside that.
 */
const MAX_BAR = 24;
const MIN_BAR = 12;
const EMPTY_BAR = 4;

type BarStyle = { height: number; radius: number; fill: string; label: string };

/**
 * Bar geometry and colour for an episode count.
 *
 * The design only draws 0, 1 and 3, which fixes the ends and the middle: zero is a flat green
 * rule, and anything from 3 up is the orange top of the scale. Heights in between interpolate
 * against the week's own worst day, so a quiet week still reads as a chart rather than a row
 * of stubs.
 */
function barFor(episodes: number, weekMax: number): BarStyle {
  if (episodes === 0) {
    return {
      height: EMPTY_BAR,
      radius: 8,
      fill: color.success500,
      label: color.success400,
    };
  }

  const span = Math.max(weekMax - 1, 1);
  const height = Math.round(
    MIN_BAR + ((Math.min(episodes, weekMax) - 1) / span) * (MAX_BAR - MIN_BAR),
  );
  const tint = episodes >= 3 ? color.orange400 : color.yellow;

  return { height, radius: height > MIN_BAR ? 6 : 4, fill: tint, label: tint };
}

export function WeeklyStatusCard({ headline, week }: { headline: string; week: WeekBar[] }) {
  const t = useT();
  const displayFont = useDisplayFont();
  const weekMax = week.reduce((max, day) => Math.max(max, day.episodes ?? 0), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{t('ui.weeklyStatus.eyebrow')}</Text>
      <Text style={[styles.headline, displayFont]}>{headline}</Text>

      {/*
        A plain `row`, so RTL reverses it and the week runs right to left. That is how a
        Hebrew reader scans a time axis; pinning it LTR would be the change, not this.
      */}
      <View style={styles.chart}>
        {week.map((day) => {
          // A day that hasn't happened yet gets the flat grey rule and no count above it.
          if (day.episodes === null) {
            return (
              <View key={day.key} style={styles.column}>
                <View style={[styles.bar, styles.barFuture]} />
                <Text style={[styles.dayLabel, styles.dayLabelFuture]}>{day.label}</Text>
              </View>
            );
          }

          const bar = barFor(day.episodes, weekMax);
          return (
            <View key={day.key} style={styles.column}>
              {/*
                Only days that actually had an episode are numbered. A row of zeros reads as
                data when it is really the absence of it, and the flat green rule already says
                "nothing happened". The column is bottom-aligned, so dropping the label leaves
                the bars and day names exactly where they were.
              */}
              {day.episodes > 0 && (
                <Text style={[styles.value, { color: bar.label }]}>{day.episodes}</Text>
              )}
              <View
                style={[
                  styles.bar,
                  { height: bar.height, borderRadius: bar.radius, backgroundColor: bar.fill },
                ]}
              />
              <Text style={styles.dayLabel}>{day.label}</Text>
            </View>
          );
        })}
      </View>

      <Ring radius={16} color={color.gray100} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: color.white,
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eyebrow: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray400,
  },
  headline: {
    fontFamily: font.display,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
  },
  chart: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 2,
    gap: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  value: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    width: '100%',
    textAlign: 'center',
  },
  bar: {
    width: '100%',
  },
  barFuture: {
    height: EMPTY_BAR,
    borderRadius: 8,
    backgroundColor: color.gray200,
  },
  dayLabel: {
    fontFamily: font.body,
    fontSize: 10,
    lineHeight: 12,
    width: '100%',
    textAlign: 'center',
    color: color.gray400,
  },
  dayLabelFuture: {
    color: color.gray300,
  },
});
