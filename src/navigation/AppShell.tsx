import { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Linking, Platform, StyleSheet, View } from 'react-native';

import { BottomBar } from '../components/BottomBar';
import { BrandRow } from '../components/BrandRow';
import { EmergencySheet } from '../components/EmergencySheet';
import { SheetHostProvider } from '../components/SheetHost';
import { HeaderDateButton } from '../components/home/HeaderDateButton';
import { emergencyContact, type TabKey } from '../data/home';
import type { HelpAnswer } from '../data/helpFlow';
import type { OnboardingAnswers } from '../data/onboarding';
import type { BillingPeriod, PaymentMethod } from '../data/subscription';
import { useDateFormat, useDirection, useT } from '../i18n';
import { CalendarScreen } from '../screens/CalendarScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { DayDetailScreen } from '../screens/DayDetailScreen';
import { EditExercisesScreen } from '../screens/EditExercisesScreen';
import { ExerciseLibraryScreen } from '../screens/ExerciseLibraryScreen';
import { ExerciseVideosScreen } from '../screens/ExerciseVideosScreen';
import { HelpFlowScreen } from '../screens/HelpFlowScreen';
import { HomeStatusScreen } from '../screens/HomeStatusScreen';
import { LivScreen } from '../screens/LivScreen';
import { MeditationDrillsScreen } from '../screens/MeditationDrillsScreen';
import { MenuScreen } from '../screens/MenuScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { ProfessionalDetailScreen } from '../screens/ProfessionalDetailScreen';
import { ProfessionalsScreen } from '../screens/ProfessionalsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { useDayRecords } from '../state/DayRecordsContext';
import { useLivChat } from '../state/LivChatContext';
import { usePreferences } from '../state/PreferencesContext';
import { useSubscription } from '../state/SubscriptionContext';
import { frame } from '../theme/tokens';
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
  | { route: 'onboarding' }
  | { route: 'meditationDrills' }
  | { route: 'exerciseLibrary' }
  | { route: 'professionals' }
  | { route: 'professional'; id: string }
  | { route: 'subscription' }
  /** `update` reuses the checkout screen to swap the card on an existing subscription. */
  | { route: 'checkout'; mode: 'subscribe' | 'update' }
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
      <Shell />
    </SheetHostProvider>
  );
}

function Shell() {
  const { today, todayKey, recordEmergencyCall, recordInAppHelp } = useDayRecords();
  const { refreshDaySummary } = useLivChat();
  const { setLanguage } = usePreferences();
  const { subscribe, setPaymentMethod, paymentMethod } = useSubscription();
  const t = useT();
  const date = useDateFormat();
  const { isRTL } = useDirection();

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
  /**
   * Which cycle the pricing page is showing. It lives here rather than in the screen so the
   * choice survives the push to checkout — checkout has to charge what the toggle said.
   */
  const [billing, setBilling] = useState<BillingPeriod>('annual');
  /** Whether the help flow is still on a question — see `fullBleed` below. */
  const [helpAsking, setHelpAsking] = useState(true);

  const nextId = useRef(0);

  const push = useCallback((entry: Pushed) => {
    // Drop any screen still sliding out — a new push makes its exit moot, and leaving it
    // mounted would stack a stale screen on top of the new one.
    setLeaving(null);
    const item: StackItem = { id: nextId.current++, entry, anim: new Animated.Value(0) };
    setStack((current) => [...current, item]);
    animateTo(item.anim, 1, ENTER_DURATION);
  }, []);

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
  const changeTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      setStack((current) => {
        if (current.length > 0) dismiss(current[current.length - 1]);
        return [];
      });
    },
    [dismiss],
  );

  /** Mocked: dials the placeholder contact so the wiring is real end to end. */
  const callEmergencyContact = () => {
    setEmergencyOpen(false);
    recordEmergencyCall(todayKey);

    const url = `tel:${emergencyContact.phone.replace(/[^+\d]/g, '')}`;
    if (Platform.OS === 'web') {
      console.log(`[mock] would dial ${emergencyContact.name} at ${url}`);
      return;
    }
    Linking.openURL(url).catch(() => {
      console.warn(`[mock] no dialer available for ${url}`);
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
    recordInAppHelp(todayKey, { answers });
    refreshDaySummary(todayKey);
  };

  const openPlaceholder = (title: string, note: string) =>
    push({ route: 'placeholder', title, note });

  /** Every paywall in the app — the blurred list tails, the gated menu rows — lands here. */
  const openSubscription = () => push({ route: 'subscription' });

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
  const fullBleed = topRoute === 'onboarding' || (topRoute === 'helpFlow' && helpAsking);
  const showBottomBar = !fullBleed;

  /**
   * No account/profile store exists yet, so this is a stub like `finishHelpFlow` used to be —
   * only the language choice has somewhere real to go, since `PreferencesContext` already
   * owns it. Everything else just logs until there's a login flow to persist it against.
   */
  const finishOnboarding = (answers: OnboardingAnswers) => {
    setLanguage(answers.language);
    console.log('[stub] onboarding complete', answers);
    pop();
  };

  const renderPushed = (entry: Pushed) => {
    switch (entry.route) {
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
            activeTab={activeTab}
            onChangeTab={changeTab}
          />
        );
      case 'onboarding':
        return <OnboardingScreen onBack={pop} onComplete={finishOnboarding} />;
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
          <LivScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            onStartHelpFlow={startHelpFlow}
          />
        ) : activeTab === 'menu' ? (
          <MenuScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            onOpenMeditationDrills={() => push({ route: 'meditationDrills' })}
            onOpenExercises={() => push({ route: 'exerciseLibrary' })}
            onOpenProfessionals={() => push({ route: 'professionals' })}
            onOpenOnboarding={() => push({ route: 'onboarding' })}
            onOpenSubscription={openSubscription}
            onOpenPlaceholder={openPlaceholder}
          />
        ) : (
          <HomeStatusScreen
            activeTab={activeTab}
            onChangeTab={changeTab}
            onOpenEmergency={() => setEmergencyOpen(true)}
            onOpenExercises={() => push({ route: 'exerciseVideos' })}
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
                onPress={() => push({ route: 'calendar' })}
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

      {/* Above the pinned bars, which sit at 2 — otherwise the tab bar paints over it. */}
      <View style={styles.overlay} pointerEvents="box-none">
        <EmergencySheet
          visible={emergencyOpen}
          onClose={() => setEmergencyOpen(false)}
          onCall={callEmergencyContact}
          onHelp={startHelpFlow}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
