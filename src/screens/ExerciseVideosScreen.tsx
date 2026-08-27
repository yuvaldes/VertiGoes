import { CheckCircle, PencilSimple } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { Celebration } from '../components/Celebration';
import { PartyPopper } from '../components/PartyPopper';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { Exercise, TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { useDayRecords } from '../state/DayRecordsContext';
import { useExercises } from '../state/ExercisesContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  /** The pencil hands off to the existing edit screen rather than duplicating it. */
  onEdit: () => void;
  onOpenEmergency: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** Figma 8971:26305 — the card is a fixed 100 tall with the thumbnail filling its padding box. */
const CARD_HEIGHT = 100;

/**
 * Today's exercise videos, reached from the status Home's exercises card.
 *
 * TODO(video): tapping a card should open the guided player. Until that exists, a tap marks the
 * exercise done — which is also the only way to complete one from the status layout.
 */
export function ExerciseVideosScreen({
  onBack,
  onEdit,
  onOpenEmergency,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { exercises, complete, dismissAll } = useExercises();
  const { todayKey, recordExerciseSlot } = useDayRecords();

  // `burst` bumps on every completion so the Celebration remounts and replays; `celebrating`
  // unmounts it once finished, rather than leaving spent particles in the tree forever.
  const [burst, setBurst] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const celebrate = useCallback(() => {
    setBurst((n) => n + 1);
    setCelebrating(true);
  }, []);

  const start = (key: string) => {
    if (!complete(key)) return;
    celebrate();
    // One flat session, so it lands in the day's single morning slot — as Home does.
    const done = exercises.filter((exercise) => exercise.completed).length + 1;
    recordExerciseSlot(todayKey, 'morning', { done, total: exercises.length });
  };

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow
            title={t('home.exercises.title')}
            onBack={onBack}
            trailing={
              <Pressable
                style={styles.pencil}
                onPress={onEdit}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('home.exerciseVideos.a11yEdit')}
              >
                <PencilSimple size={20} color={color.gray700} />
              </Pressable>
            }
          />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 ? (
          <View style={styles.empty}>
            <PartyPopper size={32} />
            <Text style={[styles.emptyTitle, displayFont]}>
              {t('home.exerciseVideos.emptyTitle')}
            </Text>
            <Text style={styles.emptyBody}>{t('home.exerciseVideos.emptyBody')}</Text>
          </View>
        ) : (
          <>
            {exercises.map((exercise) => (
              <VideoCard
                key={exercise.key}
                exercise={exercise}
                onPress={() => start(exercise.key)}
              />
            ))}

            <Pressable
              style={styles.dismiss}
              onPress={dismissAll}
              accessibilityRole="button"
            >
              <Text style={styles.dismissLabel}>{t('home.exerciseVideos.dismissAll')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <BottomBarSlot showEmergency />

      {celebrating && <Celebration key={burst} onDone={() => setCelebrating(false)} />}
    </View>
  );
}

function VideoCard({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const t = useT();
  const { completed } = exercise;
  const title = t(exercise.titleKey);
  const duration = t('data.duration.minutes', { minutes: exercise.durationMinutes });

  return (
    <Pressable
      style={[styles.card, completed ? styles.cardDone : styles.cardOpen]}
      onPress={completed ? undefined : onPress}
      disabled={completed}
      accessibilityRole="button"
      accessibilityState={{ disabled: completed }}
      accessibilityLabel={t('home.exerciseVideos.a11yCard', {
        title,
        duration,
        state: completed
          ? t('home.exerciseVideos.a11yCompleted')
          : t('home.exerciseVideos.a11yNotStarted'),
      })}
    >
      <View style={styles.thumb}>
        <Image source={exercise.thumbnail} style={styles.thumbImage} resizeMode="cover" />
        {/* The design washes the finished still out rather than greying the card wholesale. */}
        {completed && <View style={styles.thumbWash} />}
      </View>

      <View style={styles.row}>
        <View style={styles.textCol}>
          <Text style={[styles.title, completed && styles.titleDone]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>

        {completed ? (
          <View style={styles.status}>
            <CheckCircle size={16} color={color.success500} />
            <Text style={styles.statusDone}>{t('home.exerciseVideos.statusCompleted')}</Text>
          </View>
        ) : (
          <Text style={styles.statusOpen}>{t('home.exerciseVideos.statusNotStarted')}</Text>
        )}
      </View>
    </Pressable>
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
    marginTop: 16,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 16,
    gap: 16,
  },
  pencil: {
    padding: 4,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: color.gray200,
    // Asymmetric: the thumbnail sits 8 from the leading edge, the status text 16 from the
    // trailing one — so it follows the reading direction rather than the screen's sides.
    paddingStart: 8,
    paddingEnd: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  cardOpen: {
    backgroundColor: color.white,
    ...shadow.sm,
  },
  /** Finished cards drop to the off-white surface and lose their lift. */
  cardDone: {
    backgroundColor: color.gray25,
  },
  /** Square, filling the card's padding box — so its size follows CARD_HEIGHT. */
  thumb: {
    height: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  row: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  /**
   * The design pairs these 14px labels with a 16 line height; 19 instead, matching the app-wide
   * ratio that stops Android clipping descenders (see the sweep in `TaskSwoosh`'s siblings).
   * The card's height is fixed and the text is centred, so nothing shifts.
   */
  title: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.black,
  },
  titleDone: {
    color: color.gray500,
  },
  duration: {
    fontFamily: font.body,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray500,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDone: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.success500,
  },
  statusOpen: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray400,
  },
  dismiss: {
    width: '100%',
    borderRadius: 99,
    borderWidth: 1,
    borderColor: color.gray200,
    backgroundColor: color.white,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  dismissLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray700,
  },
  empty: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray600,
  },
  emptyBody: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray600,
  },
});
