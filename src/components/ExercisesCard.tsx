import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  PencilSimple,
  PersonSimpleWalk,
} from 'phosphor-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Exercise } from '../data/home';
import { useDirection, useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';
import { PartyPopper } from './PartyPopper';
import { PlayBadge } from './PlayBadge';
import { TaskHeading } from './TaskHeading';

type Props = {
  exercises: Exercise[];
  onPressExercise: (key: string) => void;
  onEdit?: () => void;
};

const CARD_WIDTH = 140;
const IMAGE_HEIGHT = 132;

/** A horizontally-scrolling row of cards, one per exercise, under the day's task heading. */
export function ExercisesCard({ exercises, onPressExercise, onEdit }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const allDone = exercises.length === 0 || exercises.every((exercise) => exercise.completed);

  const editButton = (
    <Pressable onPress={onEdit} hitSlop={8} accessibilityLabel={t('common.exercises.a11yEdit')}>
      <PencilSimple size={20} color={color.brand500} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <TaskHeading
        completed={allDone}
        icon={<PersonSimpleWalk size={20} color={color.black} />}
        title={t('common.exercises.title')}
        trailing={editButton}
      />

      {allDone ? (
        <View style={styles.doneBody}>
          <PartyPopper size={32} />
          <Text style={[styles.doneTitle, displayFont]}>{t('common.exercises.allDoneTitle')}</Text>
          <Text style={styles.doneSubtitle}>{t('common.exercises.allDoneSubtitle')}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {exercises.map((exercise) => (
            <ExerciseTile
              key={exercise.key}
              exercise={exercise}
              onPress={() => onPressExercise(exercise.key)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function ExerciseTile({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { isRTL } = useDirection();
  // "Start" points forward into the exercise, and forward swaps ends under RTL.
  const Caret = isRTL ? CaretLeft : CaretRight;

  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button">
      <View style={styles.imageWrap}>
        <Image source={exercise.thumbnail} style={styles.image} resizeMode="cover" />
        {/* Absolute sibling paints above the static image, so the badge needs to be lifted. */}
        <View style={styles.playLayer}>
          <PlayBadge size={44} />
        </View>
      </View>

      <View style={styles.tileText}>
        <Text style={[styles.tileTitle, displayFont]} numberOfLines={1}>
          {t(exercise.titleKey)}
        </Text>
        <Text style={styles.tileDuration}>
          {t('data.duration.minutes', { minutes: exercise.durationMinutes })}
        </Text>

        {exercise.completed ? (
          <View style={styles.status}>
            <Text style={styles.statusDone}>{t('common.exercises.statusCompleted')}</Text>
            <CheckCircle size={16} color={color.success500} />
          </View>
        ) : (
          <View style={styles.status}>
            <Text style={styles.statusStart}>{t('common.exercises.statusStart')}</Text>
            <Caret size={14} color={color.gray500} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
    justifyContent: 'center',
  },
  doneBody: {
    paddingTop: 4,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray600,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray600,
    textAlign: 'center',
  },
  row: {
    gap: 12,
  },
  tile: {
    width: CARD_WIDTH,
    borderRadius: 16,
    backgroundColor: color.white,
    overflow: 'hidden',
    ...shadow.sm,
  },
  imageWrap: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  playLayer: {
    zIndex: 1,
  },
  tileText: {
    padding: 12,
    gap: 4,
  },
  tileTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  tileDuration: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray500,
  },
  status: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDone: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: color.success500,
  },
  statusStart: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: color.gray600,
  },
});
