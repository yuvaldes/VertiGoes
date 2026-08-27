import { CaretDown } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDateFormat, useDisplayFont, useT } from '../../i18n';
import { color, font } from '../../theme/tokens';

type Props = {
  month: number;
  year: number;
  onPressYear: () => void;
};

/** Figma node 7338:215687 "Frame 9" — month + year picker over the weekday initials. */
export function MonthYearHeader({ month, year, onPressYear }: Props) {
  const t = useT();
  const date = useDateFormat();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={[styles.month, displayFont]}>{date.monthNames()[month]}</Text>

        <Pressable
          style={styles.yearButton}
          onPress={onPressYear}
          accessibilityRole="button"
          accessibilityLabel={t('ui.calendar.a11yChangeYear', { year })}
          hitSlop={8}
        >
          <Text style={[styles.year, displayFont]}>{year}</Text>
          <CaretDown size={16} color={color.black} />
        </Pressable>
      </View>

      {/*
        Sunday-first in both languages — Hebrew weeks start on Sunday too. The row is a plain
        `row`, which RTL reverses on its own, so Sunday lands on the right the way a Hebrew
        calendar is printed. WeekRow's cells reverse with it, keeping the columns aligned.
      */}
      <View style={styles.weekdayRow}>
        {date.weekdayNames('narrow').map((initial, index) => (
          // Duplicated initials (S, T) need a positional key.
          <Text key={`${initial}-${index}`} style={styles.weekday}>
            {initial}
          </Text>
        ))}
      </View>

      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: {
    fontFamily: font.display,
    fontSize: 20,
    color: color.black,
  },
  yearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  year: {
    fontFamily: font.display,
    fontSize: 20,
    color: color.black,
  },
  weekdayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weekday: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 12,
    color: color.black,
    textAlign: 'center',
  },
  /** Figma's border-b, drawn as a line so it can't affect the header's height. */
  rule: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: color.gray300,
    pointerEvents: 'none',
  },
});
