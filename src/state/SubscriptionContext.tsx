import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { TRIAL_DAYS, type BillingPeriod, type PaymentMethod } from '../data/subscription';
import { ENABLE_DEMO_BILLING } from '../lib/features';

export type PlanId = 'free' | 'premium';

type Subscription = {
  plan: PlanId;
  /** Only set once they've subscribed — the free plan has nothing to bill. */
  billing: BillingPeriod | null;
  /** What the next charge goes to. Changeable from the subscription screen. */
  paymentMethod: PaymentMethod | null;
  /** Set while the introductory trial is running; null once it converts or if they never took it. */
  trialEndsOn: Date | null;
};

type SubscriptionValue = Subscription & {
  isPremium: boolean;
  /** Mock purchase. Real billing lands here later; nothing else on the app has to change. */
  subscribe: (billing: BillingPeriod, method: PaymentMethod) => void;
  /** Swaps the card or wallet without touching the plan or the trial clock. */
  setPaymentMethod: (method: PaymentMethod) => void;
  cancel: () => void;
};

const FREE: Subscription = {
  plan: 'free',
  billing: null,
  paymentMethod: null,
  trialEndsOn: null,
};

const SubscriptionContext = createContext<SubscriptionValue | null>(null);

function trialEnd(from: Date) {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

/**
 * Which plan the user is on, and what it's billed to.
 *
 * Mocked end to end: subscribing flips the flag in memory and resets on reload. It is a
 * context rather than a prop so the paywalls scattered across the app — the blurred list
 * tails, the Liv tab, the calendar's history window — can all read one answer.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Subscription>(FREE);

  const subscribe = useCallback((billing: BillingPeriod, method: PaymentMethod) => {
    if (!ENABLE_DEMO_BILLING) return;
    // Every new subscription opens on the trial — that is the offer on the screen, and there
    // is no returning-subscriber case to distinguish while this is all in memory.
    setState({
      plan: 'premium',
      billing,
      paymentMethod: method,
      trialEndsOn: trialEnd(new Date()),
    });
  }, []);

  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    if (!ENABLE_DEMO_BILLING) return;
    setState((current) => ({ ...current, paymentMethod: method }));
  }, []);

  /**
   * Ends it outright, dropping the saved method with it. A real cancellation would keep
   * Premium until the paid period runs out; that needs a renewal date this mock doesn't have,
   * so the screen says plainly that access ends now rather than implying otherwise.
   */
  const cancel = useCallback(() => setState(FREE), []);

  const value = useMemo(
    () => ({
      ...state,
      isPremium: state.plan === 'premium',
      subscribe,
      setPaymentMethod,
      cancel,
    }),
    [state, subscribe, setPaymentMethod, cancel],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) throw new Error('useSubscription must be used inside a SubscriptionProvider');
  return value;
}
