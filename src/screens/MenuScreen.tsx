import {
  Brain,
  Bug,
  Check,
  Briefcase,
  FirstAid,
  FileText,
  MusicNotes,
  PlayCircle,
  CrownSimple,
  SignIn,
  SignOut,
  Trash,
  Translate,
  User,
  UserCircle,
  UsersThree,
} from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { BottomSheet } from '../components/BottomSheet';
import { MenuGroup, MenuRow } from '../components/MenuList';
import { ProgressDonut } from '../components/ProgressDonut';
import { Ring } from '../components/Ring';
import { useCapabilities, type Capability } from '../data/access';
import type { TabKey } from '../data/home';
import { ONBOARDING_STEP_COUNT, onboardingPercent } from '../data/onboarding';
import type { LegalDocumentKey } from '../data/legal';
import { useDirection, useDisplayFont, useT } from '../i18n';
import { isFeatureReady } from '../lib/featureAvailability';
import { useAuth } from '../state/AuthContext';
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
  onReportBug: () => void;
  onOpenLegal: (document: LegalDocumentKey) => void;
  onOpenPlaceholder: (title: string, note: string) => void;
  /**
   * Opens the auth sheet. The capability picks the line that says what signing in unlocks;
   * the Menu's own sign-in affordances pass none and get the generic one, because nothing
   * specific was being reached for.
   */
  onRequestSignIn: (capability?: Capability) => void;
  /**
   * The shell's full sign-out, not `useAuth().signOut` on its own — the plan, the day records,
   * the Liv threads and today's exercises are all account-shaped and have to go with it.
   */
  onSignOut: () => void;
  onDeleteAccount: () => Promise<boolean>;
};

const ICON_SIZE = 24;
const LANGUAGES: Language[] = ['en', 'he'];

/** Keep the account row stable on narrow phones while preserving a useful part of the address. */
function truncateEmail(value: string, maxLength = 27): string {
  if (value.length <= maxLength) return value;
  const at = value.lastIndexOf('@');
  if (at > 0 && at < value.length - 1) {
    const domain = value.slice(at);
    const available = maxLength - domain.length - 1;
    if (available > 2) return `${value.slice(0, available)}…${domain}`;
  }
  return `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

/**
 * The Menu tab — everything the app offers beyond the daily loop, plus the account settings
 * that used to live behind the header avatar. A tab root, like Liv.
 *
 * It is also the app's account surface, and it has to be honest in three states. A guest sees
 * an invitation and a locked catalogue: no profile rows, no plan, no sign-out, because there is
 * no account for any of those to describe. A signed-in user with the medical questions still
 * outstanding sees a card that offers them again and says what they buy. A finished user sees
 * the settings, unadorned.
 *
 * Language is the one row that ignores all of it: it is a device preference, so a guest keeps
 * it — and it is the only way a guest reads the auth sheet in Hebrew.
 */
export function MenuScreen({
  activeTab,
  onChangeTab,
  onOpenMeditationDrills,
  onOpenExercises,
  onOpenProfessionals,
  onOpenOnboarding,
  onOpenSubscription,
  onReportBug,
  onOpenLegal,
  onOpenPlaceholder,
  onRequestSignIn,
  onSignOut,
  onDeleteAccount,
}: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { restartRequired } = useDirection();
  const { language, setLanguage } = usePreferences();
  const { isPremium } = useSubscription();
  const { isGuest, account, needsOnboarding, session } = useAuth();
  const { can, reasonFor } = useCapabilities();
  const [pickingLanguage, setPickingLanguage] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  /**
   * Auth outranks premium, so the crown only survives for a signed-in free user. A guest shown
   * a crown is being sold a subscription for an account that does not exist, which is two walls
   * in a row and the worst path in the funnel.
   */
  const communityLock = reasonFor('viewCommunity');

  /** Steps finished on the last (skipped) run — 0 once complete or never opened. */
  const onboardingStepsDone = session.status === 'authed' ? (session.progressStep ?? 0) : 0;
  /** How far a skipped run got, as a whole percentage — 0 once complete or never opened. */
  const onboardingProgress = onboardingPercent(
    session.status === 'authed' ? session.progressStep : null,
  );

  // An address if we were given one; otherwise which wallet signed them in. Never a fiction.
  const accountValue =
    account === null
      ? t('auth.menu.accountGuest')
      : (account.email ??
        t(account.method === 'google' ? 'auth.menu.accountGoogle' : 'auth.menu.accountLabel'));
  const accountDisplayValue = account?.email ? truncateEmail(accountValue) : accountValue;

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
        {isGuest && (
          <PromptCard
            title={t('auth.menu.guestCardTitle')}
            body={t('auth.menu.guestCardBody')}
            cta={t('auth.menu.guestCardCta')}
            onPress={() => onRequestSignIn()}
          />
        )}

        {/* Only ever seen after a skip: while the questions are still `pending` the shell has
            already pushed them, so nobody gets this far without having declined once. */}
        {!isGuest && needsOnboarding && (
          <PromptCard
            title={t('auth.onboarding.resumeTitle')}
            body={t('auth.onboarding.resumeBody')}
            cta={t('auth.onboarding.resumeCta')}
            onPress={onOpenOnboarding}
            progress={{ completed: onboardingStepsDone, total: ONBOARDING_STEP_COUNT }}
          />
        )}

        <MenuGroup>
          <MenuRow
            icon={<Brain size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowMeditation')}
            comingSoon={!isFeatureReady('meditation')}
            variant={!isFeatureReady('meditation') || can('useMeditation') ? 'push' : 'locked'}
            onPress={onOpenMeditationDrills}
          />
          <MenuRow
            icon={<PlayCircle size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowExercises')}
            comingSoon={!isFeatureReady('exercises')}
            variant={!isFeatureReady('exercises') || can('browseExercises') ? 'push' : 'locked'}
            onPress={onOpenExercises}
          />
          <MenuRow
            icon={<Briefcase size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowProfessionals')}
            comingSoon={!isFeatureReady('professionals')}
            variant={!isFeatureReady('professionals') || can('viewProfessionals') ? 'push' : 'locked'}
            onPress={onOpenProfessionals}
          />
          {/* Directly above Community, per the requested order. */}
          <MenuRow
            icon={<MusicNotes size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowPlaylists')}
            comingSoon={!isFeatureReady('playlists')}
            variant={!isFeatureReady('playlists') ? 'push' : can('viewPlaylists') ? 'external' : 'locked'}
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
            comingSoon={!isFeatureReady('community')}
            variant={
              !isFeatureReady('community') ? 'push' : communityLock === 'auth' ? 'locked' : communityLock === 'premium' ? 'premium' : 'push'
            }
            onPress={
              // The only content row whose destination is decided here rather than by the
              // shell, so it is also the only one that has to open the sheet itself.
              !isFeatureReady('community')
                ? () => onOpenPlaceholder(t('browse.menu.rowCommunity'), t('browse.menu.communityNote'))
                : communityLock === 'auth'
                ? () => onRequestSignIn('viewCommunity')
                : communityLock === 'premium'
                  ? onOpenSubscription
                  : () =>
                      onOpenPlaceholder(
                        t('browse.menu.rowCommunity'),
                        t('browse.menu.communityNote'),
                      )
            }
          />
        </MenuGroup>

        <View>
          <Text style={styles.groupTitle}>{t('legal.menuTitle')}</Text>
          <MenuGroup>
            <MenuRow icon={<FileText size={ICON_SIZE} color={color.gray900} />} label={t('legal.privacy.title')} onPress={() => onOpenLegal('privacy')} />
            <MenuRow icon={<FileText size={ICON_SIZE} color={color.gray900} />} label={t('legal.terms.title')} onPress={() => onOpenLegal('terms')} />
            <MenuRow icon={<FileText size={ICON_SIZE} color={color.gray900} />} label={t('legal.health.title')} onPress={() => onOpenLegal('health')} />
            <MenuRow icon={<FileText size={ICON_SIZE} color={color.gray900} />} label={t('legal.accessibility.title')} onPress={() => onOpenLegal('accessibility')} />
          </MenuGroup>
        </View>

        {/* Nothing here describes a guest: these two rows edit a profile, and a guest has none.
            A locked row would be a row about an account that does not exist. */}
        {!isGuest && (
          <MenuGroup>
            {/* Onboarding is the real flow that collects this; there's no separate edit-later
                screen yet, so this reopens the same flow rather than a placeholder. */}
            <MenuRow
              icon={<User size={ICON_SIZE} color={color.gray900} />}
              label={t('browse.menu.rowPersonalInfo')}
              value={
                needsOnboarding
                  ? t('auth.onboarding.percentComplete', { percent: onboardingProgress })
                  : undefined
              }
              onPress={onOpenOnboarding}
            />
            <MenuRow
              icon={<FirstAid size={ICON_SIZE} color={color.gray900} />}
              label={t('browse.menu.rowSymptoms')}
              comingSoon={!isFeatureReady('symptoms')}
              onPress={() =>
                onOpenPlaceholder(
                  t('browse.menu.rowSymptoms'),
                  t('browse.menu.symptomsNote'),
                )
              }
            />
          </MenuGroup>
        )}

        <MenuGroup>
          {isGuest ? (
            <MenuRow
              icon={<SignIn size={ICON_SIZE} color={color.gray900} />}
              label={t('auth.menu.rowSignIn')}
              onPress={() => onRequestSignIn()}
            />
          ) : (
            /* Static rather than a `MenuRow`: there is no account screen to open, and a caret
               pointing nowhere is the kind of small lie this whole pass exists to remove. */
            <View style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <UserCircle size={ICON_SIZE} color={color.gray900} />
              </View>
              <Text style={styles.accountLabel} numberOfLines={1}>{t('auth.menu.accountLabel')}</Text>
              <Text style={styles.accountValue} numberOfLines={1} ellipsizeMode="tail">
                {accountDisplayValue}
              </Text>
            </View>
          )}
          {/* A plan belongs to an account, so a guest is shown neither the plan nor the row.
              Above Language, so it sits with the account rows rather than the content ones. */}
          {!isGuest && (
            <MenuRow
              icon={<CrownSimple size={ICON_SIZE} color={color.gray900} />}
              label={t('browse.menu.rowSubscription')}
              comingSoon={!isFeatureReady('subscription')}
              value={isFeatureReady('subscription') ? (isPremium ? t('browse.menu.planPremium') : t('browse.menu.planFree')) : undefined}
              onPress={onOpenSubscription}
            />
          )}
          <MenuRow
            icon={<Translate size={ICON_SIZE} color={color.gray900} />}
            label={t('browse.menu.rowLanguage')}
            value={LANGUAGE_LABEL[language]}
            onPress={() => setPickingLanguage(true)}
          />
          <MenuRow
            icon={<Bug size={ICON_SIZE} color={color.gray900} />}
            label={t('feedback.bugReport.title')}
            onPress={onReportBug}
          />
          {!isGuest && (
            <MenuRow
              icon={<SignOut size={ICON_SIZE} color={color.gray900} />}
              label={t('browse.menu.rowSignOut')}
              onPress={onSignOut}
            />
          )}
          {!isGuest && (
            <MenuRow
              icon={<Trash size={ICON_SIZE} color={color.error500} />}
              label={t('auth.deleteAccount.row')}
              tone="destructive"
              onPress={() => { setDeleteFailed(false); setConfirmingDeletion(true); }}
            />
          )}
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

      <BottomSheet
        visible={confirmingDeletion}
        onClose={() => { if (!deleting) setConfirmingDeletion(false); }}
        title={t('auth.deleteAccount.title')}
      >
        <Text style={styles.deleteBody}>{t('auth.deleteAccount.body')}</Text>
        <Text style={styles.deleteRetention}>{t('auth.deleteAccount.retention')}</Text>
        {deleteFailed && (
          <Text style={styles.deleteError} accessibilityRole="alert">
            {t('auth.error.deleteAccount')}
          </Text>
        )}
        <View style={styles.deleteActions}>
          <Pressable
            disabled={deleting}
            onPress={() => setConfirmingDeletion(false)}
            style={styles.cancelButton}
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>{t('common.action.cancel')}</Text>
          </Pressable>
          <Pressable
            disabled={deleting}
            onPress={async () => {
              setDeleting(true);
              setDeleteFailed(false);
              const deleted = await onDeleteAccount();
              setDeleting(false);
              if (deleted) setConfirmingDeletion(false);
              else setDeleteFailed(true);
            }}
            style={[styles.deleteButton, deleting && styles.buttonDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>
              {t(deleting ? 'auth.deleteAccount.deleting' : 'auth.deleteAccount.confirm')}
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

/**
 * The one card above the lists: an invitation for a guest, an unfinished-profile nudge for
 * everyone else. Built on the brand-tinted `notice` treatment already on this screen rather
 * than as a shared component, because two callers one file apart is not yet an abstraction.
 */
function PromptCard({
  title,
  body,
  cta,
  onPress,
  progress,
}: {
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
  /** Onboarding only — the guest card has no progress to show. */
  progress?: { completed: number; total: number };
}) {
  const displayFont = useDisplayFont();

  return (
    <Pressable
      style={styles.prompt}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={body}
    >
      {progress && <ProgressDonut completed={progress.completed} total={progress.total} />}
      <View style={styles.promptText}>
        <Text style={[styles.promptTitle, displayFont]}>{title}</Text>
        <Text style={styles.promptBody}>{body}</Text>
        <Text style={styles.promptCta}>{cta}</Text>
      </View>
      <Ring radius={12} color={color.brand100} />
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
  groupTitle: {
    marginBottom: 8,
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    color: color.gray600,
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.brand50,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  promptText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  promptTitle: {
    fontFamily: font.display,
    fontSize: 17,
    lineHeight: 24,
    color: color.black,
  },
  promptBody: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray700,
  },
  promptCta: {
    marginTop: 4,
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.brand600,
  },
  /** Mirrors `MenuRow`'s geometry exactly, so it sits in the group without a seam. */
  accountRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  accountIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountLabel: {
    flexShrink: 0,
    maxWidth: 86,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray900,
  },
  accountValue: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray500,
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
  deleteBody: {
    fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.gray900,
  },
  deleteRetention: {
    marginTop: 10, fontFamily: font.body, fontSize: 13, lineHeight: 19, color: color.gray600,
  },
  deleteError: {
    marginTop: 10, fontFamily: font.body, fontSize: 13, lineHeight: 19, color: color.error500,
  },
  deleteActions: { marginTop: 20, flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    backgroundColor: color.white, borderWidth: 1, borderColor: color.gray300,
  },
  cancelButtonText: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.gray900 },
  deleteButton: {
    flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12,
    backgroundColor: color.error500,
  },
  deleteButtonText: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.white },
  buttonDisabled: { opacity: 0.55 },
});
