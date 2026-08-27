/**
 * Plan catalogue for the subscription screen.
 *
 * Prices are mock — there is no billing backend yet — but they are shaped the way a real
 * store product is (minor units, a currency, a period) so swapping in RevenueCat or
 * StoreKit later is a data change rather than a screen rewrite.
 */

import { t, type Locale, type TKey } from '../i18n';

export type BillingPeriod = 'monthly' | 'annual';

/** How many days back the free plan can read, and therefore how far its insights can see. */
export const FREE_HISTORY_DAYS = 5;

/** Length of the introductory trial, in days. */
export const TRIAL_DAYS = 7;

type Price = {
  /** What the user is charged per billing cycle, in dollars. */
  amount: number;
  /** The same money spread over a month — what the two plans are actually compared on. */
  perMonth: number;
};

export const PREMIUM_PRICE: Record<BillingPeriod, Price> = {
  monthly: { amount: 9.99, perMonth: 9.99 },
  annual: { amount: 71.88, perMonth: 5.99 },
};

/** Rounded down, so the badge never overstates the discount. */
export const ANNUAL_SAVING_PERCENT = Math.floor(
  (1 - PREMIUM_PRICE.annual.perMonth / PREMIUM_PRICE.monthly.perMonth) * 100,
);

export const BILLING_LABEL_KEY: Record<BillingPeriod, TKey> = {
  monthly: 'data.billing.monthly',
  annual: 'data.billing.annual',
};

/** The same choice as an adverb, for sentences — "Billed annually", not "Billed annual". */
export const BILLING_ADVERB_KEY: Record<BillingPeriod, TKey> = {
  monthly: 'data.billingAdverb.monthly',
  annual: 'data.billingAdverb.annual',
};

export function formatPrice(locale: Locale, amount: number) {
  // Whole dollars stay whole — "$72/yr" reads better than "$72.00/yr" — but these prices
  // are all .99 in practice, so this is mostly future-proofing against a round price.
  //
  // The numeral is composed here and only the currency's placement comes from the string,
  // because Intl would render USD under en-GB as "US$9.99", which is not the design.
  const numeral = Number.isInteger(amount) ? `${amount}` : amount.toFixed(2);
  return t(locale, 'data.price.usd', { amount: numeral });
}

/** The three ways to pay. The wallets carry no details of their own — the wallet is the detail. */
export type PaymentKind = 'card' | 'apple' | 'google';

export type PaymentMethod = {
  kind: PaymentKind;
  /** Card only: the last four digits, for the "Visa ···· 4242" line. */
  last4?: string;
};

export const PAYMENT_LABEL_KEY: Record<PaymentKind, TKey> = {
  card: 'data.payment.card',
  apple: 'data.payment.apple',
  google: 'data.payment.google',
};

/**
 * One line naming a saved method, e.g. "Card ···· 4242" or "Apple Pay".
 *
 * Takes a locale rather than returning a key, because the card branch interpolates the last
 * four digits and the wallet branch does not — one return type is worth the argument.
 */
export function describePaymentMethod(locale: Locale, method: PaymentMethod) {
  if (method.kind !== 'card') return t(locale, PAYMENT_LABEL_KEY[method.kind]);
  return method.last4
    ? t(locale, 'data.payment.cardLast4', { last4: method.last4 })
    : t(locale, 'data.payment.cardShort');
}

/**
 * A single capability, stated once and answered for both plans, so the two columns can
 * never drift apart the way two hand-written lists would.
 */
export type PlanFeature = {
  id: string;
  labelKey: TKey;
  /** What the free plan gets: `false` for nothing, or the limited version in words. */
  free: false | TKey;
  /** What Premium gets: `true` for the plain feature, or the fuller version in words. */
  premium: true | TKey;
};

/**
 * `FREE_HISTORY_DAYS` used to be baked into two of these strings at module scope. It is now a
 * `{days}` marker, so resolve every `free`/`premium` key with `{ days: FREE_HISTORY_DAYS }` —
 * the rows without the marker ignore the parameter.
 */
export const planFeatures: PlanFeature[] = [
  {
    id: 'log',
    labelKey: 'data.plan.log.label',
    free: 'data.plan.log.free',
    premium: 'data.plan.log.premium',
  },
  {
    id: 'insights',
    labelKey: 'data.plan.insights.label',
    free: 'data.plan.insights.free',
    premium: 'data.plan.insights.premium',
  },
  {
    id: 'community',
    labelKey: 'data.plan.community.label',
    free: false,
    premium: true,
  },
  {
    id: 'professionals',
    labelKey: 'data.plan.professionals.label',
    free: 'data.plan.professionals.free',
    premium: true,
  },
  {
    id: 'meditation',
    labelKey: 'data.plan.meditation.label',
    free: 'data.plan.meditation.free',
    premium: true,
  },
  {
    id: 'liv',
    labelKey: 'data.plan.liv.label',
    free: false,
    premium: true,
  },
  {
    id: 'ads',
    labelKey: 'data.plan.ads.label',
    free: false,
    premium: true,
  },
];

/** The short pitch under the Premium heading — the same points, said as a sentence. */
export const PREMIUM_SUMMARY_KEY: TKey = 'data.plan.premiumSummary';
