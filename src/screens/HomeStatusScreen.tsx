import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fire } from 'phosphor-react-native';

import { WAVING_HAND } from '../assets/placeholders';
import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { Celebration } from '../components/Celebration';
import { FeelingSheet } from '../components/home/FeelingSheet';
import { SleepSheet } from '../components/home/SleepSheet';
import { TaskCard } from '../components/home/TaskCard';
import { HomeCarousel } from '../components/home/HomeCarousel';
import {
  describeSleep,
  episodeTrendKey,
  episodeWeek,
  streakEndingToday,
  type Feeling,
} from '../data/dayRecords';
import { user, type TabKey } from '../data/home';
import { selectTips } from '../data/tips';
import { useDisplayFont, useLocale, useT, type TKey } from '../i18n';
import { useDayRecords } from '../state/DayRecordsContext';
import { useExercises } from '../state/ExercisesContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onOpenEmergency: () => void;
  onOpenExercises: () => void;
};

/** Which sheet is open, if any. The third task navigates instead of opening one. */
type OpenSheet = 'feeling' | 'sleep' | null;

/** Each greeting carries the name, so Hebrew can order the two however it reads best. */
function greetingKeyFor(date: Date): TKey {
  const hour = date.getHours();
  if (hour < 12) return 'home.status.greeting.morning';
  if (hour < 18) return 'home.status.greeting.afternoon';
  return 'home.status.greeting.evening';
}

/**
 * Figma 11010:79563 (open) and 11010:79706 (all done) — the status-led Home.
 *
 * The two Figma frames are the same screen in two states, not two screens: which one you see
 * follows from whether the day's three tasks are actually answered.
 *
 * The first two tasks answer in a bottom sheet rather than inline, and the answer only
 * commits on Done — so dismissing the sheet leaves the day untouched.
 */
export function HomeStatusScreen({
  activeTab,
  onChangeTab,
  onOpenEmergency,
  onOpenExercises,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const displayFont = useDisplayFont();
  const { records, today, todayKey, getRecord, recordFeeling, recordSleep } = useDayRecords();
  const { exercises } = useExercises();

  const [sheet, setSheet] = useState<OpenSheet>(null);

  // `burst` bumps on every completion so the Celebration remounts and replays; `celebrating`
  // unmounts it once finished, rather than leaving spent particles in the tree forever.
  const [burst, setBurst] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const celebrate = useCallback(() => {
    setBurst((n) => n + 1);
    setCelebrating(true);
  }, []);

  const record = getRecord(todayKey);
  const feeling = record?.feeling ?? null;
  const sleepHours = record?.sleepHours ?? null;
  /** Dismissing the whole list counts as done for the day, same as the original card. */
  const exercisesDone =
    exercises.length === 0 || exercises.every((exercise) => exercise.completed);

  const openTasks =
    (feeling === null ? 1 : 0) + (sleepHours === null ? 1 : 0) + (exercisesDone ? 0 : 1);
  const allDone = openTasks === 0;

  /**
   * Stays in Monday-to-Sunday order in both languages: the card lays the bars out in a row,
   * which reverses itself under RTL, so the axis already reads from the leading edge.
   */
  const week = useMemo(() => episodeWeek(locale, records, today), [locale, records, today]);
  const headline = useMemo(() => episodeTrendKey(records, today), [records, today]);
  const streak = useMemo(
    () => streakEndingToday(records, today, allDone),
    [records, today, allDone],
  );
  /** Recomputed only when the log or the day changes, so scrolling the page never reshuffles it. */
  const tips = useMemo(() => selectTips(records, today), [records, today]);

  const answerFeeling = (value: Feeling) => {
    setSheet(null);
    recordFeeling(todayKey, value);
    celebrate();
  };

  const answerSleep = (hours: number) => {
    setSheet(null);
    recordSleep(todayKey, hours);
    celebrate();
  };

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        {/* Empty: the wordmark and calendar button are the shell's fixed header. */}
        <AppHeader gap={24} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingBlock}>
          <View style={styles.greetingRow}>
            <Text style={[styles.greeting, displayFont]}>
              {t(greetingKeyFor(today), { firstName: user.firstName })}
            </Text>
            {/* Not mirrored under RTL: the emoji is a hand, not an arrow, and every platform
                draws it facing the reader in both directions. */}
            <Text style={styles.wave}>{WAVING_HAND}</Text>
          </View>
        </View>

        <HomeCarousel
          headline={t(headline)}
          week={week}
          tips={tips}
          onOpenExercises={onOpenExercises}
        />

        <View style={styles.tasks}>
          <View style={styles.streakRow}>
            <Text style={styles.tasksLabel}>
              {allDone
                ? t('home.status.allDone')
                : t(
                    openTasks === 1
                      ? 'home.status.tasksWaiting.one'
                      : 'home.status.tasksWaiting.other',
                    { count: openTasks },
                  )}
            </Text>
            <View style={styles.streak}>
              <Fire size={16} weight="fill" color={color.orange500} />
              <Text style={styles.streakLabel}>{t('home.status.streak', { days: streak })}</Text>
            </View>
          </View>

          <TaskCard
            tone="feeling"
            completed={feeling !== null}
            title={feeling === null ? t('home.status.feelingOpen') : t('home.status.feelingDone')}
            onPress={() => setSheet('feeling')}
          />

          <TaskCard
            tone="sleep"
            completed={sleepHours !== null}
            title={
              sleepHours === null ? t('home.status.sleepOpen') : describeSleep(locale, sleepHours)
            }
            onPress={() => setSheet('sleep')}
          />

          <TaskCard
            tone="exercises"
            completed={exercisesDone}
            title={t('home.exercises.title')}
            onPress={onOpenExercises}
          />
        </View>
      </ScrollView>

      <BottomBarSlot showEmergency />

      <FeelingSheet
        visible={sheet === 'feeling'}
        onDismiss={() => setSheet(null)}
        onSubmit={answerFeeling}
      />
      <SleepSheet
        visible={sheet === 'sleep'}
        onDismiss={() => setSheet(null)}
        onSubmit={answerSleep}
      />

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
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 16,
    gap: 24,
    // Lets the greeting below grow into whatever height the scroll viewport has spare.
    flexGrow: 1,
  },
  /**
   * The design fixes this band at 140, but that is more than the column actually has spare on a
   * 852pt device — so a hard 140 both stranded the slack and pushed the page into scrolling.
   * Growing instead makes the greeting exactly the leftover height, which on most phones lands
   * just under the design's 140 and removes the overflow.
   *
   * `flexGrow` alone rather than `flex: 1` — RN defaults `flexShrink` to 0, so this fills spare
   * space without ever being squeezed below its content. The floor only matters on a short
   * screen, where the page scrolls again.
   */
  greetingBlock: {
    flexGrow: 1,
    minHeight: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  /**
   * The design pairs 24px Cal Sans with a 24 line height. Figma renders that happily, but
   * Android confines the glyphs to the line box and clips whatever hangs outside it — which
   * lopped the tail off the capital G in "Good". The extra room is invisible here because the
   * greeting is centred in a block that grows.
   */
  greeting: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.black,
  },
  wave: {
    fontSize: 24,
    lineHeight: 32,
  },
  tasks: {
    gap: 14,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasksLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.black,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.orange500,
  },
});
