import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { PremiumGate } from '../components/PremiumGate';
import { ProfessionalAvatar } from '../components/ProfessionalAvatar';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { professionals, type Professional } from '../data/professionals';
import { useDirection, useDisplayFont, useT } from '../i18n';
import { useSubscription } from '../state/SubscriptionContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  onOpenProfessional: (id: string) => void;
  onUpgrade: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** How many cards are free to browse before the paywall kicks in. */
const FREE_COUNT = 1;

function ProCard({
  professional,
  onPress,
}: {
  professional: Professional;
  onPress?: () => void;
}) {
  const t = useT();
  const displayFont = useDisplayFont();
  // The caret points the way the push travels, and under RTL that is towards the start edge.
  const Caret = useDirection().isRTL ? CaretLeft : CaretRight;
  const profession = t(professional.professionKey);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('browse.professionals.a11yCard', {
        name: professional.name,
        profession,
      })}
    >
      <ProfessionalAvatar name={professional.name} photoUrl={professional.photoUrl} size={56} />

      <View style={styles.cardText}>
        <Text style={[styles.name, displayFont]}>{professional.name}</Text>
        <Text style={styles.profession}>{profession}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {t('browse.professionals.yearsExperience', { years: professional.yearsExperience })}
          </Text>
          {/* Worth surfacing on the card — it decides whether tapping is worth it. */}
          {!professional.acceptingPatients && (
            <Text style={styles.waitlist}>{t('browse.professionals.waitlistBadge')}</Text>
          )}
        </View>
      </View>

      <Caret size={20} color={color.gray400} />
    </Pressable>
  );
}

/** Cards for everyone in the directory; only the first is free, the rest sit behind a paywall. */
export function ProfessionalsScreen({
  onBack,
  onOpenProfessional,
  onUpgrade,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const { isPremium } = useSubscription();
  const cut = isPremium ? professionals.length : FREE_COUNT;
  const free = professionals.slice(0, cut);
  const locked = professionals.slice(cut);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('browse.professionals.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.note}>{t('browse.professionals.note')}</Text>

        {free.map((professional) => (
          <ProCard
            key={professional.id}
            professional={professional}
            onPress={() => onOpenProfessional(professional.id)}
          />
        ))}

        <PremiumGate
          lockedCount={locked.length}
          itemLabel={t('browse.professionals.gateItemLabel')}
          onUpgrade={onUpgrade}
          body={t('browse.professionals.gateBody')}
        >
          {locked.map((professional) => (
            <ProCard key={professional.id} professional={professional} />
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
  note: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
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
  cardText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  profession: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray600,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  waitlist: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    color: color.orange500,
  },
});
