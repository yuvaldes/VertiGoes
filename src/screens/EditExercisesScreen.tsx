import { PlusCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ExerciseListRow } from '../components/ExerciseListRow';
import { ReorderableExerciseList } from '../components/ReorderableExerciseList';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { exerciseLibrary, type TabKey } from '../data/home';
import { useT } from '../i18n';
import { useExercises } from '../state/ExercisesContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/**
 * Figma node 7338:215283 — manual editing of today's exercises.
 *
 * Note this frame's bottom bar is the mainMenu alone (7338:215346, 60 tall at y699);
 * the Emergency drawer does not appear here.
 */
export function EditExercisesScreen({ onBack, activeTab, onChangeTab }: Props) {
  const t = useT();
  const { exercises, reorder, remove, add, dismissAll } = useExercises();
  const [dragging, setDragging] = useState(false);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow
            title={t('home.exercises.title')}
            onBack={onBack}
            trailing={
              <Pressable onPress={dismissAll} hitSlop={8} accessibilityRole="button">
                <Text style={styles.dismiss}>{t('home.editExercises.dismissAll')}</Text>
              </Pressable>
            }
          />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // A drag would otherwise fight the scroll view for the gesture.
        scrollEnabled={!dragging}
      >
        <View style={styles.sections}>
          <ReorderableExerciseList
            exercises={exercises}
            onReorder={reorder}
            onRemove={remove}
            onDragStateChange={setDragging}
          />

          <View style={styles.librarySection}>
            <Text style={styles.libraryLabel}>{t('home.editExercises.libraryLabel')}</Text>
            <View style={styles.libraryList}>
              {exerciseLibrary.map((definition) => (
                <ExerciseListRow
                  key={definition.id}
                  title={t(definition.titleKey)}
                  duration={t('data.duration.minutes', {
                    minutes: definition.durationMinutes,
                  })}
                  thumbnail={definition.thumbnail}
                  trailing={
                    <Pressable
                      onPress={() => add(definition)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('home.editExercises.a11yAdd', {
                        title: t(definition.titleKey),
                      })}
                    >
                      <PlusCircle size={24} color={color.success500} />
                    </Pressable>
                  }
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomBarSlot />
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
    // Figma: Frame 24 (72) -> Frame 26 at y84.
    marginTop: 12,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 16,
  },
  dismiss: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.brand500,
  },
  /** Figma "Frame 26" — today's list then the library, 24 apart. */
  sections: {
    gap: 24,
  },
  /** Figma "Frame 81" — label then list, 8 apart. */
  librarySection: {
    gap: 8,
  },
  libraryLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray400,
  },
  libraryList: {
    gap: 8,
  },
});
