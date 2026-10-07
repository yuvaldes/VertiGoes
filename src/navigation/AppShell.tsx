import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthSheet } from '../components/auth/AuthSheet';
import { BottomBar } from '../components/BottomBar';
import { BrandRow } from '../components/BrandRow';
import { EmergencySheet } from '../components/EmergencySheet';
import { SheetHostProvider } from '../components/SheetHost';
import { HeaderDateButton } from '../components/home/HeaderDateButton';
import type { Capability } from '../data/access';
import { type TabKey } from '../data/home';
import type { HelpAnswer } from '../data/helpFlow';
import type { OnboardingAnswers } from '../data/onboarding';
import type { BillingPeriod, PaymentMethod } from '../data/subscription';
import { useDateFormat, useDirection, useT } from '../i18n';
import { isFeatureReady, pendingFeatureForRoute, type PendingFeature } from '../lib/featureAvailability';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { BugReportScreen } from '../screens/BugReportScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { DayDetailScreen } from '../screens/DayDetailScreen';
import { EditExercisesScreen } from '../screens/EditExercisesScreen';
import { ExerciseLibraryScreen } from '../screens/ExerciseLibraryScreen';
import { ExerciseVideosScreen } from '../screens/ExerciseVideosScreen';
import { HelpFlowScreen } from '../screens/HelpFlowScreen';
import { HomeStatusScreen } from '../screens/HomeStatusScreen';
import { LivScreen } from '../screens/LivScreen';
import { LegalDocumentScreen } from '../screens/LegalDocumentScreen';
import { MeditationDrillsScreen } from '../screens/MeditationDrillsScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { ProfessionalDetailScreen } from '../screens/ProfessionalDetailScreen';
import { ProfessionalsScreen } from '../screens/ProfessionalsScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { useAuth } from '../state/AuthContext';
import type { LegalDocumentKey } from '../data/legal';
import { AuthGateProvider, useGate } from '../state/AuthGateContext';
import { useDayRecords } from '../state/DayRecordsContext';
import { useExercises } from '../state/ExercisesContext';
import { useLivChat } from '../state/LivChatContext';
import { usePreferences } from '../state/PreferencesContext';
import { useSubscription } from '../state/SubscriptionContext';
import { useOnboardingDraft } from '../state/OnboardingDraftContext';
import { color, font, frame } from '../theme/tokens';
import { useEdgeSwipeBack } from './useEdgeSwipeBack';

/**
 * Screens that push over a tab root, sliding in from the trailing edge. `dayDetail` carries
 * which day it is showing, which is why this is a union of objects rather than a string.
 */
type Pushed =
  | { route: 'editExercises' }
  | { route: 'exerciseVideos' }
  | { route: 'calendar' }
  | { route: 'dayDetail'; date: string }
  | { route: 'helpFlow' }
  | { route: 'onboarding'; guest?: boolean }
  | { route: 'meditationDrills' }
  | { route: 'exerciseLibrary' }
  | { route: 'professionals' }
  | { route: 'professional'; id: string }
  | { route: 'subscription' }
  /** `update` reuses the checkout screen to swap the card on an existing subscription. */
  | { route: 'checkout'; mode: 'subscribe' | 'update' }
  /**
   * The email half of the auth sheet. Payload-free, and chromed like every other push rather
   * than full-bleed: signing up is not a takeover the way the medical wizard is, and leaving
   * the tab bar there means a visitor who changes their mind can walk away instead of
   * hunting for Back.
   */
  | { route: 'signUp' }
  | { route: 'signIn' }
  | { route: 'bugReport' }
  | { route: 'legal'; document: LegalDocumentKey }
  | { route: 'comingSoon'; feature: PendingFeature }
  | { route: 'placeholder'; title: string; note: string };

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const ENTER_DURATION = 280;
const EXIT_DURATION = 240;


/** Each pushed screen owns its own slide progress — see the note on `StackItem` below. */
function animateTo(value: Animated.Value, toValue: 0 | 1, duration: number, onEnd?: () => void) {
  Animated.timing(value, {
    toValue,
    duration,
    easing: toValue === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    useNativeDriver: USE_NATIVE_DRIVER,
  }).start(onEnd);
}

/**
 * A stack entry paired with the Animated.Value driving its slide. Each push mints a fresh
 * value starting at 0, rather than every entry sharing one clock — a shared value sits
 * parked at 1 once its entrance finishes, so the *next* push's first render would read that
 * stale 1 (translateX already at rest) before an effect got a chance to reset it, flashing
 * the new screen in at its final position for a frame before it snapped back off-screen and
 * slid in again. Per-entry values start clean every time, so there is nothing to flash.
 */
type StackItem = { id: number; entry: Pushed; anim: Animated.Value };

/**
 * Tab roots with a push stack on top.
 *
 * The stack is a real array rather than a single slot because day detail pushes over the
 * calendar, so going back from it has to land on the calendar and not on Home. Only the
 * topmost entry animates; the ones beneath sit still at rest, which is invisible anyway
 * since every screen is opaque and full-bleed.
 *
 * Hand-rolled rather than react-navigation — that would pull in Reanimated, Gesture Handler
 * and react-native-screens for one transition, and the shell also needs to stay inside the
 * 393px device box in the web preview.
 */
export function AppShell() {
  return (
    <SheetHostProvider>
      {/*
        The gate wraps the shell rather than sitting in `App.tsx`, because the only thing that
        acts on a refusal is navigation, and navigation lives here. Everything below can read
        `useGate()` - the tab bar, the Menu rows, Home's task cards.
      */}
      <AuthGateProvider>
        <Shell />
      </AuthGateProvider>
    </SheetHostProvider>
  );
}

function Shell() {
  const {
    today,
    todayKey,
    recordInAppHelp,
    reset: resetDayRecords,
    syncStatus,
    retrySync,
  } = useDayRecords();
  const { refreshDaySummary, reset: resetLivChat } = useLivChat();
  const { reset: resetExercises } = useExercises();
  const { setLanguage } = usePreferences();
  const { subscribe, setPaymentMethod, paymentMethod, cancel: resetSubscription } =
    useSubscription();
  const { session, onboarding, signInWithProvider, completeOnboarding, skipOnboarding, signOut,
    deleteAccount,
    isRestoring, authError, retryProfile, clearAuthError, recoveringPassword } =
    useAuth();
  const {
    can,
    gate,
    sheet: authSheet,
    closeSheet,
    hideSheet,
    consumeIntent,
    promptAuth,
    promptSignIn,
  } = useGate();
  const t = useT();
  const date = useDateFormat();
  const { isRTL } = useDirection();
  const { draft, ready: draftReady } = useOnboardingDraft();

  /**
   * Where a pushed screen starts and where a popped one goes. Off the trailing edge, which is
   * the right in English and the left in Hebrew — a transform is a raw pixel offset, so neither
   * platform mirrors it for us. It has to match `useEdgeSwipeBack`'s edge, or a committed back
   * swipe would drag the screen one way and then snap it the other to finish.
   */
  const offscreenX = isRTL ? -frame.width : frame.width;

  const [stack, setStack] = useState<StackItem[]>([]);
  /** The entry being popped, kept mounted so its slide-out is visible. */
  const [leaving, setLeaving] = useState<StackItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [callError, setCallError] = useState(false);
  const contactName = session.status === 'authed' ? session.answers?.emergencyContactName.trim() : undefined;
  const contactPhone = session.status === 'authed' ? session.answers?.emergencyContactPhone.replace(/[^+\d]/g, '') : undefined;
  const hasContact = Boolean(contactPhone && /^\+?\d{7,15}$/.test(contactPhone));
  /**
   * Which cycle the pricing page is showing. It lives here rather than in the screen so the
   * choice survives the push to checkout — checkout has to charge what the toggle said.
   */
  const [billing, setBilling] = useState<BillingPeriod>('annual');
  /** Whether the help flow is still on a question — see `fullBleed` below. */
  const [helpAsking, setHelpAsking] = useState(true);
  const resumedDraft = useRef(false);

  const nextId = useRef(0);

  const push = useCallback((entry: Pushed) => {
    // Drop any screen still sliding out — a new push makes its exit moot, and leaving it
    // mounted would stack a stale screen on top of the new one.
    setLeaving(null);
    const item: StackItem = { id: nextId.current++, entry, anim: new Animated.Value(0) };
    setStack((current) => [...current, item]);
    animateTo(item.anim, 1, ENTER_DURATION);
  }, []);

  // A durable guest draft always wins over the ordinary guest home on a cold launch.  Do this
  // only once so closing the wizard remains a deliberate escape hatch.
  useEffect(() => {
    if (!draftReady || resumedDraft.current || session.status !== 'guest' || !draft.completed) return;
    resumedDraft.current = true;
    push({ route: 'onboarding', guest: true });
  }, [draftReady, draft.completed, session.status, push]);

  const enteredAccount = useRef<string | null>(null);
  useEffect(() => {
    if (session.status !== 'authed') {
      if (session.status === 'guest' && !isRestoring) enteredAccount.current = null;
      return;
    }
    if (recoveringPassword || enteredAccount.current === session.account.id) return;
    enteredAccount.current = session.account.id;
    hideSheet();
    if (session.onboarding === 'pending') push({ route: 'onboarding' });
    else consumeIntent()?.();
  }, [session, isRestoring, recoveringPassword, hideSheet, push, consumeIntent]);

  // Also clear account-scoped demo state on automatic expiry or a login in another tab.
  const previousAccount = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = session.status === 'authed' ? session.account.id : null;
    if (session.status === 'authenticating' || previousAccount.current === id) return;
    if (previousAccount.current !== null) {
      // Drop private screens and their local form/chat state before another account loads.
      setStack([]);
      setLeaving(null);
      setActiveTab('home');
      consumeIntent();
    }
    previousAccount.current = id;
    resetLivChat();
    resetExercises();
    resetSubscription();
  }, [session, resetLivChat, resetExercises, resetSubscription, consumeIntent]);

  const dismiss = useCallback((item: StackItem) => {
    setLeaving(item);
    // Unconditionally, not only on `finished`. An interrupted animation — a backgrounded
    // tab, or another navigation landing mid-slide — would otherwise leave the screen
    // mounted for good.
    animateTo(item.anim, 0, EXIT_DURATION, () => setLeaving(null));
  }, []);

  const pop = useCallback(() => {
    setStack((current) => {
      if (current.length === 0) return current;
      dismiss(current[current.length - 1]);
      return current.slice(0, -1);
    });
  }, [dismiss]);

  /**
   * Empties the stack, dismissing the top so its slide-out is visible. Signing in uses it to
   * drop the sign-up screen before onboarding takes its place; changing tab has always done
   * exactly this and now shares it.
   */
  const popAll = useCallback(() => {
    setStack((current) => {
      if (current.length > 0) dismiss(current[current.length - 1]);
      return [];
    });
  }, [dismiss]);

  /**
   * Edge swipe to go back. It reads the live stack through a callback rather than being
   * rebuilt per navigation, and hands a committed swipe straight to `pop`.
   */
  const { rootRef, panHandlers } = useEdgeSwipeBack({
    getTarget: () => (stack.length > 0 && leaving === null ? stack[stack.length - 1] : null),
    onPop: () => pop(),
    onCancel: (anim) => animateTo(anim, 1, ENTER_DURATION),
  });

  /**
   * Tapping a tab also clears the stack. Without this the tab highlights while the pushed
   * screen stays on top of it, so the tap looks like it did nothing.
   */
  const selectTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      popAll();
    },
    [popAll],
  );

  /**
   * Liv is the one tab a guest cannot open, and a refused tap must leave `activeTab` exactly
   * where it was: a pill highlighting a tab you are not on reads worse than the wall itself,
   * and `selectTab` would also have emptied the stack on the way. All three tabs stay visible
   * and unmarked - the bar's geometry is fixed by the design, and a Liv tab you can see is
   * part of what there is to want.
   */
  const changeTab = useCallback(
    (tab: TabKey) => {
      if (tab === 'liv' && isFeatureReady('liv')) {
        gate('useLiv', () => selectTab('liv'))();
        return;
      }
      selectTab(tab);
    },
    [gate, selectTab],
  );

  // Keep unavailable features reachable without a sign-in/paywall promising access.
  const openFeature = (feature: PendingFeature, capability: Capability, entry: Pushed) => {
    if (!isFeatureReady(feature)) {
      push({ route: 'comingSoon', feature });
      return;
    }
    gate(capability, () => push(entry))();
  };

  /** Open the real dialer using only this account's saved contact. */
  const callEmergencyContact = () => {
    setCallError(false);
    if (!hasContact) {
      setEmergencyOpen(false);
      gate('manageProfile', () => push({ route: 'onboarding' }))();
      return;
    }
    // Opening a dialer cannot confirm a call happened, so do not log a completed call.
    void Linking.openURL(`tel:${contactPhone}`).then(() => {
      setEmergencyOpen(false);
    }).catch(() => {
      setCallError(true);
      setEmergencyOpen(true);
    });
  };

  const startHelpFlow = () => {
    setEmergencyOpen(false);
    setHelpAsking(true);
    push({ route: 'helpFlow' });
  };

  /**
   * Written when the flow completes, not when it opens, so an abandoned session leaves nothing
   * on the calendar. Refreshing the summary afterwards is what puts it in the day's line.
   */
  const finishHelpFlow = (answers: HelpAnswer[]) => {
    // Both writes go or neither does: the summary refresh puts a Liv line on the same day
    // record, so skipping only the first would leave a guest with half a day they never had.
    // The flow itself has already run to the end by the time we are here.
    if (!isFeatureReady('guidedHelp') || !can('recordDay')) return;
    recordInAppHelp(todayKey, { answers });
    refreshDaySummary(todayKey);
  };

  const openPlaceholder = (title: string, note: string) =>
    push({ route: 'placeholder', title, note });

  /**
   * Every paywall in the app — the blurred list tails, the gated menu rows — lands here, which
   * is why gating it once covers all of them. A guest gets the account wall instead: selling a
   * subscription to someone with no account to attach it to is two walls in a row, and it is
   * the worse of the two to meet first.
   */
  const openSubscription = () => openFeature('subscription', 'subscribe', { route: 'subscription' });

  /**
   * Mock purchase. Popping back to the pricing page rather than all the way out is deliberate:
   * that screen swaps to its "Premium is active" state, which is the receipt.
   */
  const confirmPurchase = (method: PaymentMethod) => {
    subscribe(billing, method);
    pop();
  };

  const savePaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    pop();
  };

  const topRoute = stack.length > 0 ? stack[stack.length - 1].entry.route : null;

  /**
   * The date button belongs to Home's design, and its design puts the same header on the
   * exercise videos screen — so it survives that one push rather than being Home-only.
   */
  const showHeaderDate =
    activeTab === 'home' &&
    leaving === null &&
    (topRoute === null || topRoute === 'exerciseVideos');

  /**
   * The Emergency drawer is not on every screen: it belongs to Home and — because the design
   * carries the same bar across — the exercise videos pushed over it. Everywhere else the bar
   * is the tab pill alone.
   */
  const showEmergency =
    (activeTab === 'home' && topRoute === null) || topRoute === 'exerciseVideos';

  /**
   * Two screens own the whole frame and render no shell chrome: onboarding, and the emergency
   * help flow while it is asking its questions. The help flow's design (Figma 484:10276) gives
   * the entire viewport to one question and two very large targets, and a wordmark and tab bar
   * above it would be both noise and a way to wander off mid-episode.
   *
   * The flow drops back into the ordinary chrome for its guidance step, which is a page to read
   * rather than a prompt to answer - so this follows the screen's own state, not just the route.
   */
  const fullBleed = topRoute === 'onboarding' ||
    (topRoute === 'helpFlow' && isFeatureReady('guidedHelp') && helpAsking);
  const showBottomBar = !fullBleed;

  /** Runs whatever the visitor was reaching for when the wall went up, at most once. */
  const replayIntent = () => {
    consumeIntent()?.();
  };

  /**
   * Both ways in land here: a provider button on the sheet resolving, and either email screen
   * reporting success.
   *
   * Profile restoration drives onboarding in the effect above. Returning users retain
   * their saved onboarding state instead of being sent through the questions again.
   */
  const onAuthenticated = () => {
    // Keep the report screen mounted underneath email auth so its draft survives.
    setLeaving(null);
    setStack((current) => current.filter(({ entry }) =>
      entry.route !== 'signIn' && entry.route !== 'signUp'));
  };

  const signInWith = async (method: 'google') => {
    if (!isFeatureReady('googleAuth')) return;
    const result = await signInWithProvider(method);
    if (!result.ok || result.cancelled) return;
    hideSheet();
    onAuthenticated();
  };

  /** Not `closeSheet`: the sheet is handing off mid-ask, so the intent has to survive it. */
  const startEmailAuth = () => {
    hideSheet();
    // Account creation follows the guest questionnaire. Its data remains a device draft
    // until the consent-backed account write succeeds.
    push({ route: 'onboarding', guest: true });
  };

  /**
   * The language is still the one answer with somewhere else to be — `PreferencesContext` owns
   * it and it outlives a sign-out. The rest now has an account to belong to.
   */
  const finishOnboarding = async (answers: OnboardingAnswers) => {
    const result = await completeOnboarding(answers);
    if (!result.ok) return;
    setLanguage(answers.language);
    pop();
    replayIntent();
  };

  /**
   * Skipping and backing out of step 0 are the same act: either way the answers are not in
   * hand, and the status has to say so or the Menu goes on offering the flow as though it had
   * never been seen.
   */
  const leaveOnboardingUnfinished = async (step = 0) => {
    const result = await skipOnboarding(step);
    if (!result.ok) return;
    pop();
    replayIntent();
  };

  /**
   * The shell's full sign-out: `useAuth().signOut` drops the account itself, and everything
   * else account-shaped — the day records, the Liv threads, today's exercises, the plan — goes
   * with it, so the next sign-in (or guest browse) doesn't inherit this one's history.
   */
  const signOutEverything = async () => {
    if (!(await signOut())) return;
    resetDayRecords();
    resetLivChat();
    resetExercises();
    resetSubscription();
  };

  const deleteEverything = async () => {
    const result = await deleteAccount();
    if (!result.ok) return false;
    resetDayRecords();
    resetLivChat();
    resetExercises();
    resetSubscription();
    return true;
  };

  const renderPushed = (entry: Pushed) => {
    const pending = pendingFeatureForRoute(entry.route);
    if (pending) return <ComingSoonScreen feature={pending} onBack={pop} />;
    switch (entry.route) {
      case 'comingSoon':
        return <ComingSoonScreen feature={entry.feature} onBack={pop} />;
      case 'editExercises':
        return (
          <EditExercisesScreen onBack={pop} activeTab={activeTab} onChangeTab={changeTab} />
        );
      case 'exerciseVideos':
        return (
          <ExerciseVideosScreen
            onBack={pop}
            onEdit={() => push({ route: 'editExercises' })}
            onOpenEmergency={() => setEmergencyOpen(true)}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
            onOpenDay={(date) => push({ route: 'dayDetail', date })}
            onPendingFeature={(feature) => push({ route: 'comingSoon', feature })}
          />
        );
      case 'dayDetail':
        return (
          <DayDetailScreen
            date={entry.date}
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'helpFlow':
        return (
          <HelpFlowScreen
            onBack={pop}
            onFinish={finishHelpFlow}
            onAskingChange={setHelpAsking}
            onCallEmergencyContact={callEmergencyContact}
            contactName={hasContact ? contactName : undefined}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'onboarding': {
        if (entry.guest) return (
          <OnboardingScreen
            mode="guest"
            initialAnswers={draft.answers}
            onBack={pop}
            onSkip={pop}
            onComplete={() => undefined}
            onRequireSignUp={() => push({ route: 'signUp' })}
          />
        );
        // Nothing to skip once the answers are in: reopening from the Menu to edit a field is
        // an edit, and offering to abandon it would be offering to lose the edit.
        const unfinished = onboarding !== 'complete';
        return (
          <OnboardingScreen
            mode={unfinished ? 'setup' : 'edit'}
            initialAnswers={session.status === 'authed' ? session.answers : null}
            onBack={unfinished ? leaveOnboardingUnfinished : pop}
            onComplete={finishOnboarding}
            onSkip={leaveOnboardingUnfinished}
          />
        );
      }
      case 'meditationDrills':
        return (
          <MeditationDrillsScreen
            onBack={pop}
            onUpgrade={openSubscription}
            onOpenDrill={(drill) =>
              openPlaceholder(
                t(drill.titleKey),
                t('flows.shell.drillPlaceholderNote', {
                  title: t(drill.titleKey),
                  duration: t('data.duration.minutes', { minutes: drill.durationMinutes }),
                }),
              )
            }
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'exerciseLibrary':
        return (
          <ExerciseLibraryScreen
            onBack={pop}
            onUpgrade={openSubscription}
            onOpenExercise={(exercise) =>
              openPlaceholder(
                t(exercise.titleKey),
                t('flows.shell.exercisePlaceholderNote', {
                  title: t(exercise.titleKey),
                  duration: t('data.duration.minutes', { minutes: exercise.durationMinutes }),
                }),
              )
            }
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'professionals':
        return (
          <ProfessionalsScreen
            onBack={pop}
            onOpenProfessional={(id) => push({ route: 'professional', id })}
            onUpgrade={openSubscription}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'professional':
        return (
          <ProfessionalDetailScreen
            id={entry.id}
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'subscription':
        return (
          <SubscriptionScreen
            billing={billing}
            onChangeBilling={setBilling}
            onStartTrial={() => push({ route: 'checkout', mode: 'subscribe' })}
            onChangePaymentMethod={() => push({ route: 'checkout', mode: 'update' })}
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'checkout':
        return (
          <CheckoutScreen
            mode={entry.mode}
            billing={billing}
            current={paymentMethod}
            onConfirm={entry.mode === 'update' ? savePaymentMethod : confirmPurchase}
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'signUp':
        return (
          <SignUpScreen
            onBack={pop}
            onSignedUp={onAuthenticated}
            onSwitchToSignIn={() => push({ route: 'signIn' })}
            onOpenLegal={(document) => push({ route: 'legal', document })}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'signIn':
        return (
          <SignInScreen
            onBack={pop}
            onSignedIn={onAuthenticated}
            onSwitchToSignUp={() => push({ route: 'signUp' })}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'bugReport':
        return <BugReportScreen onBack={pop} onRequestSignIn={() => push({ route: 'signIn' })} />;
      case 'legal':
        return <LegalDocumentScreen document={entry.document} onBack={pop} />;
      case 'placeholder':
        return (
          <PlaceholderScreen
            title={entry.title}
            note={entry.note}
            onBack={pop}
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
    }
  };

  return (
    <View style={styles.root} ref={rootRef}>
      {/*
        The base slot is the current tab root. Liv is a tab, not a push — the bottom bar
        already has it. Menu has no screen yet, so it still falls through to Home.

        It also stays put during a push. An earlier version drifted it left to mimic a
        native transition, but the design only calls for the new page sliding in — and the
        offset content bled past the device's left edge in the web preview.
      */}
      <View style={styles.screen}>
        {activeTab === 'liv' ? (
          !isFeatureReady('liv') ? <ComingSoonScreen feature="liv" /> : <LivScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            onStartHelpFlow={startHelpFlow}
          />
        ) : activeTab === 'menu' ? (
          <MenuScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            /*
              Gated here as well as on the row itself. The Menu decides which rows wear a lock;
              these decide that a locked row cannot navigate even if one forgets to.
            */
            onOpenMeditationDrills={() => openFeature('meditation', 'useMeditation', { route: 'meditationDrills' })}
            onOpenExercises={() => openFeature('exercises', 'browseExercises', { route: 'exerciseLibrary' })}
            onOpenProfessionals={() => openFeature('professionals', 'viewProfessionals', { route: 'professionals' })}
            onOpenOnboarding={gate('manageProfile', () => push({ route: 'onboarding' }))}
            onOpenSubscription={openSubscription}
            onReportBug={() => push({ route: 'bugReport' })}
            onOpenLegal={(document) => push({ route: 'legal', document })}
            onOpenPlaceholder={openPlaceholder}
            onRequestSignIn={(capability) =>
              capability ? promptAuth(capability) : promptSignIn()
            }
            onSignOut={signOutEverything}
            onDeleteAccount={deleteEverything}
          />
        ) : (
          <HomeStatusScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            onOpenEmergency={() => { setCallError(false); setEmergencyOpen(true); }}
            /* Both the exercises task card and the tips carousel's action come through here. */
            onOpenExercises={() => openFeature('exercises', 'browseExercises', { route: 'exerciseVideos' })}
          />
        )}
      </View>

      {stack.map((item, index) => {
        // Later siblings paint on top, so stack order needs no zIndex juggling. Only the
        // top entry animates, and only while nothing is leaving.
        const isTop = index === stack.length - 1 && leaving === null;
        const translateX = item.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [offscreenX, 0],
        });
        return (
          <Animated.View
            key={item.id}
            style={[styles.screen, styles.pushed, isTop && { transform: [{ translateX }] }]}
            {...(isTop ? panHandlers : null)}
          >
            {renderPushed(item.entry)}
          </Animated.View>
        );
      })}

      {leaving && (
        <Animated.View
          style={[
            styles.screen,
            styles.pushed,
            {
              transform: [
                {
                  translateX: leaving.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offscreenX, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {renderPushed(leaving.entry)}
        </Animated.View>
      )}

      {/*
        The wordmark, rendered exactly once and fixed on top of everything below it — the base
        screen, every pushed screen, and both while they're mid-slide. Every screen still renders
        `AppHeader`, but that only reserves the space now; it stopped rendering `BrandRow` itself
        so the logo would stop sliding along with the screen underneath it on every push and pop.
        Purely decorative: tapping it does nothing.
      */}
      {!fullBleed && (
      <View style={styles.brandBar} pointerEvents="box-none">
        <BrandRow
          trailing={
            showHeaderDate ? (
              <HeaderDateButton
                label={date.monthDay(today)}
                onPress={gate('viewHistory', () => push({ route: 'calendar' }))}
              />
            ) : null
          }
        />
      </View>
      )}

      {/*
        The tab bar, rendered exactly once and pinned over every screen — the same treatment
        the wordmark gets above, and for the same reason: it used to slide in and out with each
        pushed screen, so navigating from the Menu visibly dragged the tab bar across with it.
        Screens render `BottomBarSlot` instead, which only reserves the height.
      */}
      {showBottomBar && (
        <View style={styles.bottomBar} pointerEvents="box-none">
          <BottomBar
            activeTab={activeTab}
            onChangeTab={changeTab}
            onOpenEmergency={() => setEmergencyOpen(true)}
            showEmergency={showEmergency}
          />
        </View>
      )}

      {(isRestoring || authError?.key === 'auth.error.oauthReturn' || authError?.key === 'auth.error.profileLoad' || syncStatus === 'error' || syncStatus === 'saving') && (
        <View style={styles.syncNotice} accessibilityLiveRegion="polite">
          {(isRestoring || syncStatus === 'saving') && <ActivityIndicator size="small" color={color.brand600} />}
          <Text style={styles.syncText}>
            {isRestoring ? t('auth.status.restoring') :
              authError?.key === 'auth.error.profileLoad' || authError?.key === 'auth.error.oauthReturn' ? t(authError.key) :
                syncStatus === 'error' ? t('auth.status.syncError') : t('auth.status.saving')}
          </Text>
          {!isRestoring && authError?.key === 'auth.error.oauthReturn' && (
            <Pressable accessibilityRole="button" onPress={clearAuthError}>
              <Text style={styles.syncRetry}>{t('common.action.close')}</Text>
            </Pressable>
          )}
          {!isRestoring && (authError?.key === 'auth.error.profileLoad' || syncStatus === 'error') && (
            <Pressable accessibilityRole="button"
              onPress={authError?.key === 'auth.error.profileLoad' ? retryProfile : retrySync}>
              <Text style={styles.syncRetry}>{t('auth.status.retry')}</Text>
            </Pressable>
          )}
        </View>
      )}

      {recoveringPassword && (
        <View style={[styles.screen, { zIndex: 5 }]}>
          <ResetPasswordScreen />
        </View>
      )}

      {/* Above the pinned bars, which sit at 2 — otherwise the tab bar paints over it. */}
      <View style={styles.overlay} pointerEvents="box-none">
        <EmergencySheet
          visible={emergencyOpen}
          onClose={() => setEmergencyOpen(false)}
          onCall={callEmergencyContact}
          onHelp={startHelpFlow}
          contactName={contactName}
          hasContact={hasContact}
          callError={callError}
        />

        {/*
          One instance for the whole app, beside the emergency sheet and for the same reason:
          every locked tap in every screen opens this one, so there is nothing to drift. The
          capability it was opened for is what picks its "here is what this unlocks" line.
        */}
        <AuthSheet
          visible={authSheet.visible}
          capability={authSheet.capability}
          onClose={() => { clearAuthError(); closeSheet(); }}
          onGoogle={() => signInWith('google')}
          onEmail={startEmailAuth}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  syncNotice: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 4,
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    backgroundColor: color.brand50,
  },
  syncText: { flex: 1, fontFamily: font.body, fontSize: 12, lineHeight: 17, color: color.gray700 },
  syncRetry: { fontFamily: font.bodySemiBold, fontSize: 12, color: color.brand600 },
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pushed: {
    zIndex: 1,
    // The browser would otherwise claim a horizontal drag for text selection and cancel the
    // pointer mid-swipe. `pan-y` leaves vertical scrolling to it, which is what we want.
    ...(Platform.OS === 'web'
      ? ({ touchAction: 'pan-y', userSelect: 'none' } as object)
      : null),
  },
  brandBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: frame.headerTop,
    paddingHorizontal: frame.gutter,
    // Above the base screen (unset) and every pushed one (1), so it never slides with them.
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: frame.gutter,
    zIndex: 2,
  },
});
