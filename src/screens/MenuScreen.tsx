import {
  Brain,
  Check,
  Briefcase,
  FirstAid,
  MusicNotes,
  PlayCircle,
  CrownSimple,
  SignOut,
  Translate,
  User,
  UsersThree,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { BottomSheet } from '../components/BottomSheet';
import { MenuGroup, MenuRow } from '../components/MenuList';
import { Ring } from '../components/Ring';
import type { TabKey } from '../data/home';
import { useDirection, useDisplayFont, useT } from '../i18n';
import {
  LANGUAGE_FLAG,
  LANGUAGE_LABEL,
  usePreferences,
  type Language,
} from '../state/PreferencesContext';
import { useSubscription } from '../state/SubscriptionContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onOpenMeditationDrills: () => void;
  onOpenExercises: () => void;
  onOpenProfessionals: () => void;
  onOpenOnboarding: () => void;
  onOpenSubscription: () => void;
  onOpenPlaceholder: (title: string, note: string) => void;
};

const ICON_SIZE = 24;
const LANGUAGES: Language[] = ['en', 'he'];

/**
 * The Menu tab — everything the app offers beyond the daily loop, plus the account settings
 * that used to live behind the header avatar. A tab root, like Liv.
 */
export function MenuScreen({
  activeTab,
  onChangeTab,
  onOpenMeditationDrills,
  onOpenExercises,
  onOpenProfessionals,
  onOpenOnboarding,
  onOpenSubscription,
  onOpenPlaceholder,
}: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { restartRequired } = useDirection();
  const { language, setLanguage } = usePreferences();
  const { isPremium } = useSubscription();
  const [pickingLanguage, setPickingLanguage] = useState(false);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <Text style={[styles.title, displayFont]}>{t('browse.menu.title')}</Text>
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MenuGroup>
          <MenuRow
            icon={<Brain size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowMeditation')}
            onPress={onOpenMeditationDrills}
          />
          <MenuRow
            icon={<PlayCircle size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowExercises')}
            onPress={onOpenExercises}
          />
          <MenuRow
            icon={<Briefcase size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowProfessionals')}
            onPress={onOpenProfessionals}
          />
          {/* Directly above Community, per the requested order. */}
          <MenuRow
            icon={<MusicNotes size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowPlaylists')}
            variant="external"
            onPress={() =>
              onOpenPlaceholder(
                t('browse.menu.rowPlaylists'),
                t('browse.menu.playlistsNote'),
              )
            }
          />
          {/* Crowned only while it's actually gated — on Premium it's a plain row like the
              others, and there's nothing left to sell. */}
          <MenuRow
            icon={<UsersThree size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowCommunity')}
            variant={isPremium ? 'push' : 'premium'}
            onPress={
              isPremium
                ? () =>
                    onOpenPlaceholder(
                      t('browse.menu.rowCommunity'),
                      t('browse.menu.communityNote'),
                    )
                : onOpenSubscription
            }
          />
        </MenuGroup>

        <MenuGroup>
          {/* Onboarding is the real flow that collects this; there's no separate edit-later
              screen yet, so this reopens the same flow rather than a placeholder. */}
          <MenuRow
            icon={<User size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowPersonalInfo')}
            onPress={onOpenOnboarding}
          />
          <MenuRow
            icon={<FirstAid size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowSymptoms')}
            onPress={() =>
              onOpenPlaceholder(
                t('browse.menu.rowSymptoms'),
                t('browse.menu.symptomsNote'),
              )
            }
          />
        </MenuGroup>

        <MenuGroup>
          {/* Above Language, so the plan sits with the account rows rather than the content ones. */}
          <MenuRow
            icon={<CrownSimple size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowSubscription')}
            value={isPremium ? t('browse.menu.planPremium') : t('browse.menu.planFree')}
            onPress={onOpenSubscription}
          />
          <MenuRow
            icon={<Translate size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowLanguage')}
            value={LANGUAGE_LABEL[language]}
            onPress={() => setPickingLanguage(true)}
          />
          <MenuRow
            icon={<SignOut size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowSignOut')}
            onPress={() => console.log('[stub] sign out — no auth until the login pass')}
          />
        </MenuGroup>

        {restartRequired && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{t('browse.menu.restartNotice')}</Text>
            <Ring radius={12} color={color.brand100} />
          </View>
        )}
      </ScrollView>

      <BottomBarSlot />

      <BottomSheet
        visible={pickingLanguage}
        onClose={() => setPickingLanguage(false)}
        title={t('browse.menu.languageSheetTitle')}
      >
        {/* Names and flags stay out of t(): a language is written the same way in every locale,
            so the picker reads identically whichever one is currently active. */}
        {LANGUAGES.map((option) => {
          const selected = option === language;
          return (
            <Pressable
              key={option}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => {
                setLanguage(option);
                setPickingLanguage(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={LANGUAGE_LABEL[option]}
            >
              {/* Flags are emoji, not images — they inherit the row's font size and need no asset. */}
              <Text style={styles.optionFlag}>{LANGUAGE_FLAG[option]}</Text>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {LANGUAGE_LABEL[option]}
              </Text>
              {selected && <Check size={20} weight="bold" color={color.brand500} />}
              <Ring radius={16} color={selected ? color.brand200 : color.gray200} />
            </Pressable>
          );
        })}
      </BottomSheet>
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
  title: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.black,
  },
  scroll: {
    flex: 1,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 24,
  },
  option: {
    height: 56,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: color.white,
  },
  optionSelected: {
    backgroundColor: color.brand50,
  },
  optionFlag: {
    fontSize: 22,
    lineHeight: 28,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 16,
    color: color.gray900,
  },
  optionLabelSelected: {
    fontFamily: font.bodySemiBold,
    color: color.brand500,
  },
  /**
   * Only ever seen on native, and only until the next launch: the strings switch immediately
   * but Yoga's direction was fixed at process start, so the layout cannot turn around with them.
   */
  notice: {
    backgroundColor: color.brand50,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray700,
  },
});
