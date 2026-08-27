import { MagnifyingGlass, X } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { PlayBadge } from '../components/PlayBadge';
import { PremiumGate } from '../components/PremiumGate';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { exerciseLibrary, type ExerciseDefinition, type TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { useSubscription } from '../state/SubscriptionContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  onOpenExercise: (exercise: ExerciseDefinition) => void;
  onUpgrade: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** How many cards are free to browse before the paywall kicks in. */
const FREE_COUNT = 3;

function ExerciseCard({
  exercise,
  onPress,
}: {
  exercise: ExerciseDefinition;
  onPress?: () => void;
}) {
  const t = useT();
  const displayFont = useDisplayFont();
  const title = t(exercise.titleKey);
  const duration = t('data.duration.minutes', { minutes: exercise.durationMinutes });

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('browse.library.a11yCard', { title, duration })}
    >
      <View style={styles.thumb}>
        <Image source={exercise.thumbnail} style={styles.thumbImage} resizeMode="cover" />
        {/* Absolute siblings paint above static ones, so the badge is lifted. */}
        <View style={styles.playLayer}>
          <PlayBadge size={28} />
        </View>
      </View>

      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, displayFont]}>{title}</Text>
        <Text style={styles.cardFocus}>{t(exercise.focusKey)}</Text>
        <Text style={styles.cardDuration}>{duration}</Text>
      </View>
    </Pressable>
  );
}

/** Every exercise as a card, with a search field above them; only the first few are free. */
export function ExerciseLibraryScreen({
  onBack,
  onOpenExercise,
  onUpgrade,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const { isPremium } = useSubscription();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return exerciseLibrary;
    // Title and focus both, so "seated" or "left" find things a title alone would miss.
    return exerciseLibrary.filter(
      (exercise) =>
        t(exercise.titleKey).toLowerCase().includes(needle) ||
        t(exercise.focusKey).toLowerCase().includes(needle),
    );
  }, [query, t]);

  const cut = isPremium ? results.length : FREE_COUNT;
  const free = results.slice(0, cut);
  const locked = results.slice(cut);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('browse.library.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <View style={styles.searchWrap}>
        {/* Source order is the affordance here — magnifier leads, clear button trails — and a
            plain `row` mirrors that on its own under RTL, so neither needs pinning. */}
        <View style={styles.search}>
          <MagnifyingGlass size={18} color={color.gray400} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={t('browse.library.searchPlaceholder')}
            placeholderTextColor={color.gray400}
            autoCorrect={false}
            accessibilityLabel={t('browse.library.a11ySearch')}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('browse.library.a11yClearSearch')}
            >
              <X size={16} color={color.gray500} />
            </Pressable>
          )}
          <Ring radius={20} color={color.gray200} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {results.length === 0 ? (
          <Text style={styles.empty}>
            {t('browse.library.noResults', { query: query.trim() })}
          </Text>
        ) : (
          <>
            {free.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={() => onOpenExercise(exercise)}
              />
            ))}

            <PremiumGate
              lockedCount={locked.length}
              itemLabel={t('browse.library.gateItemLabel')}
              onUpgrade={onUpgrade}
              body={t('browse.library.gateBody')}
            >
              {locked.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </PremiumGate>
          </>
        )}
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
  searchWrap: {
    paddingHorizontal: frame.gutter,
    paddingTop: 12,
  },
  search: {
    height: 40,
    borderRadius: 20,
    backgroundColor: color.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    ...shadow.xs,
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
    // RN-web draws its own focus ring, which fights the Ring outline.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  scroll: {
    flex: 1,
    marginTop: 12,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 12,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray500,
  },
  card: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadow.sm,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    position: 'absolute',
    top: 0,
    // `left`, not `start`: the wrap is exactly 72 wide, so the two coincide and flipping this
    // would only hide the two `left` values elsewhere in the sweep that genuinely had to move.
    left: 0,
    width: 72,
    height: 72,
  },
  playLayer: {
    zIndex: 1,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  cardTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  cardFocus: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray600,
  },
  cardDuration: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
});
