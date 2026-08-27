import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BottomBarSlot } from '../components/BottomBar';
import { Celebration } from '../components/Celebration';
import { ExercisesCard } from '../components/ExercisesCard';
import { Header } from '../components/Header';
import { InsightSection } from '../components/InsightSection';
import { TaskFeeling, type Feeling } from '../components/TaskFeeling';
import { TaskSleep } from '../components/TaskSleep';
import { insight, today, user, type TabKey } from '../data/home';
import { useDateFormat, useT } from '../i18n';
import { useDayRecords } from '../state/DayRecordsContext';
import { useExercises } from '../state/ExercisesContext';
import { color, frame } from '../theme/tokens';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onOpenEmergency: () => void;
  onEditExercises: () => void;
  onOpenCalendar: () => void;
};

/**
 * Figma node 7338:214828 "Home" — the `body` frame (7338:214832), 393 x 759.
 *
 * Vertical rhythm: Frame 17 sits at x=16 y=8 and stacks its blocks with a uniform
 * 24px gap (Frame 24 -> Frame 26, and every child of Frame 26), so the nested frames
 * flatten into one column without changing any measurement. Frame 45 is pinned to the
 * bottom of `body`.
 */
export function HomeScreen({
  activeTab,
  onChangeTab,
  onOpenEmergency,
  onEditExercises,
  onOpenCalendar,
}: Props) {
  const t = useT();
  const dateFormat = useDateFormat();
  const { exercises, complete } = useExercises();
  const {
    today: todayDate,
    todayKey,
    getRecord,
    recordSleep,
    recordFeeling,
    recordExerciseSlot,
  } = useDayRecords();

  /**
   * Read back from the day's record rather than held locally, so these answers survive
   * navigating away and stay consistent with the status layout the wordmark toggles to.
   */
  const record = getRecord(todayKey);
  const feeling = record?.feeling ?? null;
  const sleepHours = record?.sleepHours ?? null;

  // `burst` bumps on every completion so the Celebration remounts and replays; `celebrating`
  // unmounts it once finished, rather than leaving spent particles in the tree forever.
  const [burst, setBurst] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const celebrate = useCallback(() => {
    setBurst((n) => n + 1);
    setCelebrating(true);
  }, []);

  // On first load this evaluates to 3, matching the "3 tasks" in the design.
  const openTasks =
    (feeling === null ? 1 : 0) +
    (sleepHours === null ? 1 : 0) +
    (exercises.some((exercise) => !exercise.completed) ? 1 : 0);

  const answerFeeling = (value: Feeling) => {
    recordFeeling(todayKey, value);
    if (feeling === null) celebrate();
  };

  const answerSleep = (hours: number) => {
    recordSleep(todayKey, hours);
    if (sleepHours === null) celebrate();
  };

  const completeExercise = (key: string) => {
    if (!complete(key)) return;
    celebrate();
    // Home schedules one flat session, so it lands in the day's single morning slot.
    const done = exercises.filter((exercise) => exercise.completed).length + 1;
    recordExerciseSlot(todayKey, 'morning', { done, total: exercises.length });
  };

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <Header firstName={user.firstName} taskCount={openTasks} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <InsightSection
          dateLabel={t(today.labelKey, { date: dateFormat.monthDay(todayDate) })}
          insight={t(insight.textKey)}
          onOpenCalendar={onOpenCalendar}
        />

        <TaskFeeling value={feeling} onChange={answerFeeling} />

        <TaskSleep value={sleepHours} onChange={answerSleep} />

        <ExercisesCard
          exercises={exercises}
          onPressExercise={completeExercise}
          onEdit={onEditExercises}
        />
      </ScrollView>

      <BottomBarSlot showEmergency />

      {celebrating && <Celebration key={burst} onDone={() => setCelebrating(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
  },
  gutter: {
    paddingHorizontal: frame.gutter,
  },
  scroll: {
    flex: 1,
    marginTop: 24,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 16,
    gap: 32,
  },
});
