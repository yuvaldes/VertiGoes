import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { hasMarker, toKey, type DayRecord } from '../../data/dayRecords';
import { useDateFormat } from '../../i18n';
import { color, font } from '../../theme/tokens';

/** Figma "Frame 38/32/33/34" — 40 tall, with 24 between rows (see CalendarGrid). */
export const WEEK_ROW_HEIGHT = 40;

type Props = {
  days: Date[];
  /**
   * The selected day's key, but only when it falls in *this* week — otherwise null.
   * Passing the selection itself would change every row's props on each tap and defeat
   * the memo, which is what made VirtualizedList complain about slow updates.
   */
  selectedKey: string | null;
  records: Map<string, DayRecord>;
  onSelectDay: (date: Date) => void;
};

/** Figma node 7338:215720 — seven day cells under a Gray/300 rule. */
export const WeekRow = memo(function WeekRow({ days, selectedKey, records, onSelectDay }: Props) {
  const date = useDateFormat();

  return (
    <View style={styles.row}>
      {/*
        Figma draws the rule as an inside stroke, which doesn't displace children. A
        borderTopWidth would eat into the 40px box and shrink the cells, so it's an
        absolute line instead — same approach as `Ring`.
      */}
      <View style={styles.rule} />

      {days.map((day) => {
        const key = toKey(day);
        const isSelected = key === selectedKey;
        const marked = hasMarker(records.get(key));

        return (
          <Pressable
            key={key}
            style={[styles.cell, isSelected && styles.cellSelected]}
            onPress={() => onSelectDay(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            // The map key, which is what this used to announce, reads out as "2026-08-27".
            accessibilityLabel={date.longDate(day)}
          >
            <Text style={[styles.day, isSelected && styles.daySelected]}>{day.getDate()}</Text>
            {marked && <View style={styles.marker} />}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    height: WEEK_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 4,
    paddingHorizontal: 16,
  },
  rule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: color.gray300,
    pointerEvents: 'none',
  },
  cell: {
    flex: 1,
    minWidth: 0,
    height: 36,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  cellSelected: {
    backgroundColor: color.brand500,
    borderRadius: 8,
  },
  day: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
    textAlign: 'center',
  },
  daySelected: {
    color: color.white,
  },
  marker: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.orange400,
  },
});
