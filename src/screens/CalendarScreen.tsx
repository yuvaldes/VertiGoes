import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { CalendarGrid, YEARS_BACK, type CalendarGridHandle } from '../components/calendar/CalendarGrid';
import { DayBreakdown } from '../components/calendar/DayBreakdown';
import { MonthYearHeader } from '../components/calendar/MonthYearHeader';
import { YearPickerSheet } from '../components/YearPickerSheet';
import { toKey } from '../data/dayRecords';
import type { TabKey } from '../data/home';
import { useT } from '../i18n';
import { useDayRecords } from '../state/DayRecordsContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  /** Pushes the full record for a day, including its Liv transcript. */
  onOpenDay: (date: string) => void;
};

/**
 * Figma node 7338:215666 — calendar on top, breakdown of the selected day below.
 *
 * Two things differ from the other screens: this frame's content root is full-bleed 393
 * (each section applies its own 16px padding, and the exercise-slot row is intentionally
 * edge to edge), and the bottom bar is the mainMenu alone with no Emergency drawer.
 */
export function CalendarScreen({ onBack, activeTab, onChangeTab, onOpenDay }: Props) {
  const t = useT();
  const { records, today } = useDayRecords();

  const [selected, setSelected] = useState<Date>(today);
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  const gridRef = useRef<CalendarGridHandle>(null);

  const years = useMemo(() => {
    const latest = today.getFullYear();
    return Array.from({ length: YEARS_BACK + 1 }, (_, i) => latest - YEARS_BACK + i);
  }, [today]);

  const selectedRecord = records.get(toKey(selected));

  const jumpToYear = (year: number) => {
    setYearPickerOpen(false);
    // Apple's behaviour: hold the month, change the year.
    gridRef.current?.scrollToMonth(year, visibleMonth);
  };

  const jumpToToday = () => {
    setSelected(today);
    gridRef.current?.scrollToMonth(today.getFullYear(), today.getMonth());
  };

  return (
    <View style={styles.body}>
      {/* This screen is full-bleed, so the header opts into the gutter here. */}
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow
            title={t('home.calendar.title')}
            onBack={onBack}
            trailing={
              <Pressable onPress={jumpToToday} hitSlop={8} accessibilityRole="button">
                <Text style={styles.today}>{t('home.calendar.today')}</Text>
              </Pressable>
            }
          />
        </AppHeader>
      </View>

      <View style={styles.calendar}>
        <MonthYearHeader
          month={visibleMonth}
          year={visibleYear}
          onPressYear={() => setYearPickerOpen(true)}
        />

        {/*
          Closes off the calendar against the breakdown. Not in the design — the rule
          visible there is the next clipped week row's own border-t, which only lands in
          that spot at one scroll position. An explicit rule holds at any offset.
        */}
        <View style={styles.calendarRule} />

        <View style={styles.grid}>
          <CalendarGrid
            ref={gridRef}
            today={today}
            selected={selected}
            records={records}
            onSelectDay={setSelected}
            onVisibleMonthChange={(month, year) => {
              setVisibleMonth(month);
              setVisibleYear(year);
            }}
          />
        </View>
      </View>

      <ScrollView
        style={styles.breakdown}
        contentContainerStyle={styles.breakdownContent}
        showsVerticalScrollIndicator={false}
      >
        <DayBreakdown
          record={selectedRecord}
          onOpenConversation={() => console.log('[stub] open Liv conversation for', toKey(selected))}
          onShowExercises={() => console.log('[stub] show exercises for', toKey(selected))}
          onOpenDay={() => onOpenDay(toKey(selected))}
        />
      </ScrollView>

      <BottomBarSlot />

      <YearPickerSheet
        visible={yearPickerOpen}
        years={years}
        selected={visibleYear}
        onClose={() => setYearPickerOpen(false)}
        onSelect={jumpToYear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
    // No paddingTop — AppHeader owns the offset to the brand row.
  },
  /** Sections opt into the 16px gutter individually; the root is full-bleed. */
  gutter: {
    paddingHorizontal: frame.gutter,
  },
  today: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.brand500,
  },
  /** Figma "Frame 36" — 393 x 325, sitting 16 below the header. */
  calendar: {
    height: 325,
    marginTop: 16,
  },
  /**
   * No top margin. Figma's 24px gap between the weekday header and the first week is a
   * static-composition detail; in a scrolling list it becomes a dead strip the rows can
   * never fill, so weeks run right up under the rule instead. The 24 between rows is
   * still there — it lives on the groups inside the list.
   */
  grid: {
    flex: 1,
  },
  calendarRule: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: color.gray300,
    zIndex: 1,
    pointerEvents: 'none',
  },
  breakdown: {
    flex: 1,
    marginTop: 16,
  },
  breakdownContent: {
    paddingBottom: 16,
  },
});
