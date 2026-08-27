import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { addDays, startOfWeek, toKey, type DayRecord } from '../../data/dayRecords';
import { useDateFormat, useDisplayFont } from '../../i18n';
import { color, font } from '../../theme/tokens';
import { WEEK_ROW_HEIGHT, WeekRow } from './WeekRow';

/** Figma: the calendar column has a 24px gap between week groups. */
const GROUP_GAP = 24;
/** Figma "Frame 82" — the inline month label, 19 tall with a 4px gap below. */
const MONTH_LABEL_HEIGHT = 19;
const MONTH_LABEL_GAP = 4;

/** How far back the grid reaches. Bounded rather than infinite. */
export const YEARS_BACK = 3;

type WeekGroup = {
  key: string;
  days: Date[];
  /** Set when this week introduces a new month, per the design's inline labels. */
  label: string | null;
  /** Month/year this week mostly belongs to — drives the sticky header. */
  month: number;
  year: number;
  height: number;
  offset: number;
};

export type CalendarGridHandle = {
  /** Jumps to the same month in another year. */
  scrollToMonth: (year: number, month: number) => void;
};

type Props = {
  today: Date;
  selected: Date;
  records: Map<string, DayRecord>;
  onSelectDay: (date: Date) => void;
  onVisibleMonthChange: (month: number, year: number) => void;
};

function buildGroups(today: Date, monthsShort: string[]): WeekGroup[] {
  const start = startOfWeek(new Date(today.getFullYear() - YEARS_BACK, 0, 1));
  const end = new Date(today.getFullYear(), 11, 31);

  const groups: WeekGroup[] = [];
  let cursor = start;
  let offset = 0;
  let previousMonth = -1;

  while (cursor <= end) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
    // The week's midpoint decides which month it belongs to when it straddles two.
    const midpoint = days[3];
    const month = midpoint.getMonth();
    const year = midpoint.getFullYear();

    // Label the first week that *belongs* to a new month, keyed off the same midpoint the
    // sticky header uses. Triggering on "contains the 1st" instead would label a week
    // that's mostly the old month, contradicting the header above it.
    const label = month !== previousMonth ? monthsShort[month] : null;
    previousMonth = month;

    const height = label
      ? MONTH_LABEL_HEIGHT + MONTH_LABEL_GAP + WEEK_ROW_HEIGHT
      : WEEK_ROW_HEIGHT;

    groups.push({ key: toKey(cursor), days, label, month, year, height, offset });

    offset += height + GROUP_GAP;
    cursor = addDays(cursor, 7);
  }

  return groups;
}

/**
 * The continuously-scrolling week list (Figma 7338:215686). Months are not paged — they
 * run together with an inline short-month label introducing each one, Apple-style.
 *
 * Virtualised via FlatList because a 3-year range is ~1,100 day cells. Every group's
 * height is known up front, so `getItemLayout` can hand back exact offsets, which is also
 * what makes the year jump and the initial scroll land precisely.
 */
export const CalendarGrid = forwardRef<CalendarGridHandle, Props>(function CalendarGrid(
  { today, selected, records, onSelectDay, onVisibleMonthChange },
  ref,
) {
  const date = useDateFormat();
  const displayFont = useDisplayFont();
  // Rebuilt on a language change: the labels are baked into the group, and so is the height
  // each one adds to `getItemLayout`.
  const groups = useMemo(() => buildGroups(today, date.monthNames('short')), [today, date]);
  const listRef = useRef<FlatList<WeekGroup>>(null);
  const lastReported = useRef<string>('');
  const selectedKey = toKey(selected);

  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Settles the list on a group boundary so a week is never left half-clipped under the
   * weekday rule.
   *
   * Done by hand rather than with `snapToOffsets`: react-native-web ignores that on a
   * virtualised list (verified — the offset stayed mid-row), and group heights vary
   * anyway, so `snapToInterval` wouldn't fit either.
   */
  const scheduleSnap = (offset: number) => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      let nearest = groups[0].offset;
      for (const group of groups) {
        if (Math.abs(group.offset - offset) < Math.abs(nearest - offset)) nearest = group.offset;
      }
      // Tolerance keeps this from re-firing on the scroll event it triggers itself.
      if (Math.abs(nearest - offset) > 1) {
        listRef.current?.scrollToOffset({ offset: nearest, animated: true });
      }
    }, 140);
  };

  useEffect(() => () => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
  }, []);

  const initialIndex = useMemo(() => {
    // Open on the start of the current month rather than today's week, so today sits in
    // context with the rest of the month — landing on today's week would push every
    // earlier week off the top.
    const found = groups.findIndex(
      (group) => group.year === today.getFullYear() && group.month === today.getMonth(),
    );
    if (found !== -1) return found;
    const todayWeek = toKey(startOfWeek(today));
    const fallback = groups.findIndex((group) => group.key === todayWeek);
    return fallback === -1 ? Math.max(0, groups.length - 1) : fallback;
  }, [groups, today]);

  useImperativeHandle(ref, () => ({
    scrollToMonth: (year, month) => {
      const index = groups.findIndex((group) => group.year === year && group.month === month);
      if (index === -1) return;
      // Not animated: a year is thousands of pixels away, and smooth-scrolling it takes
      // seconds. A jump should land immediately.
      listRef.current?.scrollToOffset({ offset: groups[index].offset, animated: false });
    },
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    // Offsets are precomputed, so the topmost group is a plain scan rather than a measure.
    let current = groups[0];
    for (const group of groups) {
      if (group.offset > y + 1) break;
      current = group;
    }
    const stamp = `${current.year}-${current.month}`;
    if (stamp !== lastReported.current) {
      lastReported.current = stamp;
      onVisibleMonthChange(current.month, current.year);
    }

    scheduleSnap(y);
  };

  return (
    <FlatList
      ref={listRef}
      data={groups}
      keyExtractor={(group) => group.key}
      getItemLayout={(_data, index) => ({
        length: groups[index].height + GROUP_GAP,
        offset: groups[index].offset,
        index,
      })}
      initialScrollIndex={initialIndex}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      // Defaults render ~21 screens either side; against a 248px viewport that's a few
      // hundred day cells and VirtualizedList warns the list is slow to update.
      windowSize={5}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <View style={styles.group}>
          {item.label && (
            <View style={styles.labelRow}>
              <Text style={[styles.label, displayFont]}>{item.label}</Text>
            </View>
          )}
          <WeekRow
            days={item.days}
            // Narrow to this week so a tap only re-renders the two affected rows.
            selectedKey={item.days.some((day) => toKey(day) === selectedKey) ? selectedKey : null}
            records={records}
            onSelectDay={onSelectDay}
          />
        </View>
      )}
    />
  );
});

const styles = StyleSheet.create({
  group: {
    marginBottom: GROUP_GAP,
  },
  labelRow: {
    height: MONTH_LABEL_HEIGHT,
    marginBottom: MONTH_LABEL_GAP,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  label: {
    fontFamily: font.display,
    fontSize: 16,
    color: color.black,
  },
});
