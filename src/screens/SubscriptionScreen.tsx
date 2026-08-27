import {
  BellRinging,
  Check,
  CreditCard,
  CrownSimple,
  Minus,
  XCircle,
} from 'phosphor-react-native';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { BottomSheet } from '../components/BottomSheet';
import { MenuGroup, MenuRow } from '../components/MenuList';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import {
  ANNUAL_SAVING_PERCENT,
  BILLING_ADVERB_KEY,
  BILLING_LABEL_KEY,
  describePaymentMethod,
  FREE_HISTORY_DAYS,
  PREMIUM_PRICE,
  PREMIUM_SUMMARY_KEY,
  TRIAL_DAYS,
  formatPrice,
  planFeatures,
  type BillingPeriod,
  type PlanFeature,
} from '../data/subscription';
import { useDateFormat, useDisplayFont, useLocale, useT } from '../i18n';
import { useSubscription } from '../state/SubscriptionContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  billing: BillingPeriod;
  onChangeBilling: (billing: BillingPeriod) => void;
  onStartTrial: () => void;
  onChangePaymentMethod: () => void;
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

const PERIODS: BillingPeriod[] = ['monthly', 'annual'];

/**
 * Pins a run left to right, for money that must keep its numeral order under RTL.
 *
 * The two platforms spell it differently: react-native-web throws out Yoga's `direction` and
 * wants `writingDirection`, which it compiles to CSS `direction`; on native `writingDirection`
 * is iOS text-only and `direction` is the Yoga prop that stops a row reordering.
 */
const LTR_RUN = (
  Platform.OS === 'web' ? ({ writingDirection: 'ltr' } as object) : { direction: 'ltr' }
) as ViewStyle;

/** Monthly / Annual, with the saving called out on the option that earns it. */
function BillingToggle({
  billing,
  onChange,
}: {
  billing: BillingPeriod;
  onChange: (billing: BillingPeriod) => void;
}) {
  const t = useT();

  return (
    <View style={styles.toggle}>
      {PERIODS.map((period) => {
        const active = period === billing;
        return (
          <Pressable
            key={period}
            style={[styles.toggleOption, active && styles.toggleOptionActive]}
            onPress={() => onChange(period)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={
              period === 'annual'
                ? t('flows.subscription.a11yAnnual', { percent: ANNUAL_SAVING_PERCENT })
                : t('flows.subscription.a11yMonthly')
            }
          >
            <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
              {t(BILLING_LABEL_KEY[period])}
            </Text>
            {period === 'annual' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>
                  {t('flows.subscription.saveBadge', { percent: ANNUAL_SAVING_PERCENT })}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * One capability, answered for both plans side by side.
 *
 * The free answer is a dash when the plan doesn't have it at all and the limit in words when
 * it has a smaller version — "Last 5 days" says far more than a cross would.
 */
function FeatureRow({ feature }: { feature: PlanFeature }) {
  const t = useT();

  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureLabel}>{t(feature.labelKey)}</Text>

      <View style={styles.featureCell}>
        {feature.free === false ? (
          <Minus size={16} color={color.gray400} />
        ) : (
          // The two capped rows carry a {days} marker; the rest ignore the parameter.
          <Text style={styles.featureFree}>{t(feature.free, { days: FREE_HISTORY_DAYS })}</Text>
        )}
      </View>

      <View style={styles.featureCell}>
        {feature.premium === true ? (
          <Check size={16} weight="bold" color={color.success500} />
        ) : (
          <Text style={styles.featurePremium}>
            {t(feature.premium, { days: FREE_HISTORY_DAYS })}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * The pricing page: what each plan includes, what Premium costs monthly versus annually, and
 * the trial that starts the purchase. Checkout is a separate screen — this one only decides
 * *what* is being bought.
 */
export function SubscriptionScreen({
  billing,
  onChangeBilling,
  onStartTrial,
  onChangePaymentMethod,
  onBack,
  activeTab,
  onChangeTab,
}: Props) {
  const { isPremium, trialEndsOn, billing: currentBilling, paymentMethod, cancel } =
    useSubscription();
  const t = useT();
  const locale = useLocale();
  const displayFont = useDisplayFont();
  const date = useDateFormat();
  /**
   * Cancelling asks first, in a sheet — it is the one destructive action on this screen.
   *
   * Holds whether the trial was running when the sheet opened, and closing only flips `open`
   * rather than clearing the whole thing. Both halves matter: confirming ends the trial while
   * the sheet is still sliding out, so reading the trial live — or dropping the state outright
   * — would visibly rewrite the sheet's own copy on its way down.
   */
  const [cancelPrompt, setCancelPrompt] = useState<{ inTrial: boolean; open: boolean } | null>(
    null,
  );

  const closeCancelPrompt = () =>
    setCancelPrompt((prompt) => (prompt ? { ...prompt, open: false } : null));
  const price = PREMIUM_PRICE[billing];

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('flows.subscription.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isPremium ? (
          <View style={styles.activeCard}>
            <View style={styles.activeIcon}>
              <CrownSimple size={20} weight="fill" color={color.white} />
            </View>
            <Text style={[styles.activeTitle, displayFont]}>
              {t('flows.subscription.activeTitle')}
            </Text>
            <Text style={styles.activeBody}>
              {trialEndsOn
                ? // Through the app's own formatter, not `toLocaleDateString(undefined, …)`:
                  // that followed the device locale, so a Hebrew UI on an English phone showed
                  // an English date, and vice versa.
                  t('flows.subscription.trialUntil', { date: date.monthDay(trialEndsOn) })
                : t('flows.subscription.thanks')}
              {currentBilling
                ? ` ${t('flows.subscription.billedAdverb', {
                    period: t(BILLING_ADVERB_KEY[currentBilling]),
                  })}`
                : ''}
            </Text>
            <Ring radius={16} color={color.brand200} />
          </View>
        ) : null}

        {isPremium ? (
          <MenuGroup>
            <MenuRow
              icon={<CreditCard size={24} color={color.gray900} />}
              label={t('flows.subscription.rowPaymentMethod')}
              value={
                paymentMethod
                  ? describePaymentMethod(locale, paymentMethod)
                  : t('flows.subscription.paymentNone')
              }
              onPress={onChangePaymentMethod}
            />
            <MenuRow
              icon={<XCircle size={24} weight="bold" color={color.gray900} />}
              label={t('flows.subscription.rowCancel')}
              onPress={() => setCancelPrompt({ inTrial: trialEndsOn !== null, open: true })}
            />
          </MenuGroup>
        ) : null}

        {!isPremium ? (
          <>
            <BillingToggle billing={billing} onChange={onChangeBilling} />

            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <View style={styles.crown}>
                  <CrownSimple size={18} weight="fill" color={color.brand500} />
                </View>
                <Text style={[styles.pricePlan, displayFont]}>
                  {t('flows.subscription.planName')}
                </Text>
                <View style={styles.trialPill}>
                  <Text style={styles.trialPillText}>
                    {t('flows.subscription.trialPill', { days: TRIAL_DAYS })}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.priceAmount, displayFont]}>
                  {formatPrice(locale, price.perMonth)}
                </Text>
                <Text style={styles.priceUnit}>{t('flows.subscription.perMonth')}</Text>
              </View>
              <Text style={styles.priceNote}>
                {billing === 'annual'
                  ? t('flows.subscription.priceNoteAnnual', {
                      price: formatPrice(locale, price.amount),
                      percent: ANNUAL_SAVING_PERCENT,
                    })
                  : t('flows.subscription.priceNoteMonthly', {
                      percent: ANNUAL_SAVING_PERCENT,
                    })}
              </Text>

              <Text style={styles.priceSummary}>{t(PREMIUM_SUMMARY_KEY)}</Text>

              <Pressable
                style={styles.cta}
                onPress={onStartTrial}
                accessibilityRole="button"
                accessibilityLabel={t('flows.subscription.a11yCta', {
                  days: TRIAL_DAYS,
                  price: formatPrice(locale, price.amount),
                  // The adverb, not the raw `billing` id — this used to announce "then $71.88
                  // annual", and an untranslated identifier once the rest of this is Hebrew.
                  period: t(BILLING_ADVERB_KEY[billing]),
                })}
              >
                <Text style={styles.ctaLabel}>
                  {t('flows.subscription.cta', { days: TRIAL_DAYS })}
                </Text>
              </Pressable>

              <Ring radius={16} color={color.brand200} />
            </View>

            {/* The promise that makes the trial safe to take, given its own card so it can't
                be mistaken for fine print. */}
            <View style={styles.reminder}>
              <BellRinging size={18} color={color.brand600} />
              <Text style={styles.reminderText}>{t('flows.subscription.reminder')}</Text>
              <Ring radius={12} color={color.brand100} />
            </View>
          </>
        ) : null}

        <View style={styles.compare}>
          <Text style={[styles.compareTitle, displayFont]}>
            {t('flows.subscription.compareTitle')}
          </Text>

          {/*
            The three columns are plain `flexDirection: 'row'`, so RTL reverses them to
            Premium / Free / Features — head and body together, since `FeatureRow` has the
            same shape. Reading order follows the language, and the cells stay under their
            own heading. Nothing to pin here.
          */}
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.featureLabel, styles.columnHead, styles.columnHeadLabel]}>
                {t('flows.subscription.columnFeatures')}
              </Text>
              <View style={styles.featureCell}>
                <Text style={styles.columnHead}>{t('flows.subscription.columnFree')}</Text>
              </View>
              <View style={styles.featureCell}>
                <Text style={[styles.columnHead, styles.columnHeadPremium]}>
                  {t('flows.subscription.columnPremium')}
                </Text>
              </View>
            </View>

            {planFeatures.map((feature, index) => (
              <View key={feature.id}>
                {index > 0 && <View style={styles.divider} />}
                <FeatureRow feature={feature} />
              </View>
            ))}

            <Ring radius={16} color={color.gray200} />
          </View>
        </View>
      </ScrollView>

      <BottomBarSlot />

      {/* Last in the tree so it paints over the bottom bar as well as the scroll. */}
      <BottomSheet
        visible={cancelPrompt?.open ?? false}
        onClose={closeCancelPrompt}
        title={t('flows.subscription.cancelTitle')}
      >
        <Text style={styles.cancelBody}>
          {cancelPrompt?.inTrial
            ? t('flows.subscription.cancelInTrial')
            : t('flows.subscription.cancelNotInTrial')}{' '}
          {t('flows.subscription.cancelHistoryNote', { days: FREE_HISTORY_DAYS })}
        </Text>

        <View style={styles.cancelActions}>
          <Pressable
            style={styles.cancelKeep}
            onPress={closeCancelPrompt}
            accessibilityRole="button"
          >
            <Text style={styles.cancelKeepLabel}>{t('flows.subscription.cancelKeep')}</Text>
            <Ring radius={24} color={color.gray300} />
          </Pressable>
          <Pressable
            style={styles.cancelConfirm}
            onPress={() => {
              closeCancelPrompt();
              cancel();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.cancelConfirmLabel}>{t('flows.subscription.cancelConfirm')}</Text>
          </Pressable>
        </View>
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
  scroll: {
    flex: 1,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 16,
  },

  /** Segmented control, sized and rounded like the chips elsewhere in the app. */
  toggle: {
    flexDirection: 'row',
    backgroundColor: color.gray100,
    borderRadius: 22,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: color.white,
    ...shadow.xs,
  },
  toggleLabel: {
    fontFamily: font.body,
    fontSize: 14,
    color: color.gray600,
  },
  toggleLabelActive: {
    fontFamily: font.bodySemiBold,
    color: color.gray900,
  },
  saveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: color.success100,
  },
  saveBadgeText: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: color.success500,
    // "−23%" holds no strong character, so an RTL paragraph would order it "23%−". Money and
    // percentages are read left to right in Hebrew too, so pin the run rather than flip it.
    ...LTR_RUN,
  },

  priceCard: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    ...shadow.sm,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  crown: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: color.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePlan: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 24,
    color: color.black,
  },
  trialPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: color.brand50,
  },
  trialPillText: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: color.brand600,
  },
  /** Baseline-aligned so "/mo" sits on the bottom of the numeral, not its middle. */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    // "$5.99" and "/mo" are one price, not two words: RTL must not reorder them into "/mo$5.99".
    ...LTR_RUN,
  },
  priceAmount: {
    fontFamily: font.display,
    fontSize: 36,
    lineHeight: 42,
    color: color.black,
  },
  priceUnit: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 26,
    color: color.gray500,
  },
  priceNote: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray600,
  },
  priceSummary: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray700,
  },
  cta: {
    marginTop: 4,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  ctaLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
  },

  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.brand50,
    borderRadius: 12,
    padding: 12,
  },
  reminderText: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray700,
  },

  activeCard: {
    backgroundColor: color.brand50,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitle: {
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 24,
    color: color.black,
  },
  activeBody: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray700,
  },

  cancelBody: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray700,
    textAlign: 'center',
  },
  cancelActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelKeep: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelKeepLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.gray700,
  },
  cancelConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
  },
  compare: {
    gap: 8,
  },
  compareTitle: {
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 24,
    color: color.black,
  },
  table: {
    backgroundColor: color.white,
    borderRadius: 16,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  columnHead: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
    textAlign: 'center',
  },
  columnHeadPremium: {
    color: color.brand600,
  },
  /**
   * The label column's head tracks the feature names beneath it, not centred.
   * `'auto'` rather than a hardcoded `'left'`: a literal `left` stays physically pinned under
   * RTL, while `featureLabel` below has no textAlign override and so auto-mirrors with the
   * platform's writing direction. `'auto'` keeps this header aligned with that body text in
   * both directions.
   */
  columnHeadLabel: {
    textAlign: 'auto',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  featureLabel: {
    // Wider than the two answer columns: the labels are prose, the answers are short.
    flex: 1.4,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray900,
  },
  featureCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  featureFree: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 15,
    color: color.gray500,
    textAlign: 'center',
  },
  featurePremium: {
    fontFamily: font.bodySemiBold,
    fontSize: 11,
    lineHeight: 15,
    color: color.gray900,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    backgroundColor: color.gray200,
  },

});
