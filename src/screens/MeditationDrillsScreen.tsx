import { Wind } from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { PremiumGate } from '../components/PremiumGate';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { meditationDrills, type MeditationDrill } from '../data/meditation';
import { useDisplayFont, useT } from '../i18n';
import { useSubscription } from '../state/SubscriptionContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  onOpenDrill: (drill: MeditationDrill) => void;
  onUpgrade: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** How many cards are free to try before the paywall kicks in. */
const FREE_COUNT = 3;

function DrillCard({ drill, onPress }: { drill: MeditationDrill; onPress?: () => void }) {
  const t = useT();
  const displayFont = useDisplayFont();
  const title = t(drill.titleKey);
  const duration = t('data.duration.minutes', { minutes: drill.durationMinutes });

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('browse.meditation.a11yCard', { title, duration })}
    >
      <View style={styles.icon}>
        <Wind size={28} color={color.brand500} />
      </View>

      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, displayFont]}>{title}</Text>
        <Text style={styles.cardFocus}>{t(drill.focusKey)}</Text>
        <Text style={styles.cardDuration}>{duration}</Text>
      </View>
    </Pressable>
  );
}

/** Breathing and grounding drills as cards; only the first few are free. */
export function MeditationDrillsScreen({
  onBack,
  onOpenDrill,
  onUpgrade,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const { isPremium } = useSubscription();
  // Premium takes the cut off entirely rather than raising it — `locked` empties, and the
  // gate renders nothing on an empty list.
  const cut = isPremium ? meditationDrills.length : FREE_COUNT;
  const free = meditationDrills.slice(0, cut);
  const locked = meditationDrills.slice(cut);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('browse.meditation.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {free.map((drill) => (
          <DrillCard key={drill.id} drill={drill} onPress={() => onOpenDrill(drill)} />
        ))}

        <PremiumGate
          lockedCount={locked.length}
          itemLabel={t('browse.meditation.gateItemLabel')}
          onUpgrade={onUpgrade}
          body={t('browse.meditation.gateBody')}
        >
          {locked.map((drill) => (
            <DrillCard key={drill.id} drill={drill} />
          ))}
        </PremiumGate>
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
    marginTop: 8,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 12,
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
  icon: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: color.brand50,
    alignItems: 'center',
    justifyContent: 'center',
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
