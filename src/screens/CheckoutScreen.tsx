import { CreditCard, LockSimple } from 'phosphor-react-native';
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

import {
  AppleGlyph,
  ApplePayMark,
  GoogleGlyph,
  GooglePayMark,
} from '../assets/PaymentMarks';
import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { LabeledInput } from '../components/LabeledInput';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import {
  BILLING_ADVERB_KEY,
  PAYMENT_LABEL_KEY,
  PREMIUM_PRICE,
  TRIAL_DAYS,
  formatPrice,
  type BillingPeriod,
  type PaymentKind,
  type PaymentMethod,
} from '../data/subscription';
import { useDisplayFont, useLocale, useT, type TKey } from '../i18n';
import { ENABLE_DEMO_BILLING } from '../lib/features';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  /**
   * `subscribe` is the purchase; `update` is an existing subscriber swapping their card or
   * wallet. Same picker either way — only the summary, the CTA and the title differ.
   */
  mode: 'subscribe' | 'update';
  billing: BillingPeriod;
  /** What's already on file, so `update` opens on it rather than resetting to card. */
  current: PaymentMethod | null;
  onConfirm: (method: PaymentMethod) => void;
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

type Method = PaymentKind;

/**
 * Pins a run left to right — the price, and the wallet acceptance marks. Spelled differently
 * per platform: react-native-web throws out Yoga's `direction` and wants `writingDirection`,
 * which it compiles to CSS `direction`, while on native `direction` is the Yoga prop.
 */
const LTR_RUN = (
  Platform.OS === 'web' ? ({ writingDirection: 'ltr' } as object) : { direction: 'ltr' }
) as ViewStyle;

/** Both wallets are offered on every platform here — this is a mock, and the web preview is
 *  neither iOS nor Android. A real build would offer only the one the device supports. */
const METHODS: { id: Method; detailKey: TKey }[] = [
  { id: 'card', detailKey: 'flows.checkout.methodCardDetail' },
  { id: 'apple', detailKey: 'flows.checkout.methodAppleDetail' },
  { id: 'google', detailKey: 'flows.checkout.methodGoogleDetail' },
];

/** The leading glyph in a method row. The wallets use their own brand marks, not icon-font
 *  lookalikes — Google's G keeps its four colours, Apple's apple is monochrome by design. */
function MethodIcon({ method }: { method: Method }) {
  if (method === 'apple') return <AppleGlyph size={20} tint={color.gray900} />;
  if (method === 'google') return <GoogleGlyph size={20} />;
  return <CreditCard size={22} color={color.gray900} />;
}

/** Digits only, grouped in fours — enough formatting to feel real without a card library. */
function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/**
 * Mock checkout. Nothing is sent anywhere: confirming flips the local subscription state and
 * pops back. The card fields are deliberately plain `LabeledInput`s rather than a real card
 * element — a payment SDK owns those inputs in a shipping build, and hand-rolling one that
 * looks convincing would invite someone to type a real number into it.
 */
export function CheckoutScreen({
  mode,
  billing,
  current,
  onConfirm,
  onBack,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const locale = useLocale();
  const displayFont = useDisplayFont();
  const [method, setMethod] = useState<Method>(current?.kind ?? 'card');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  // Never invite real card/CVC input or pretend to activate a paid plan without a provider.
  if (!ENABLE_DEMO_BILLING) {
    return (
      <View style={styles.body}>
        <View style={styles.gutter}>
          <AppHeader>
            <ScreenTitleRow title={t('flows.checkout.unavailableTitle')} onBack={onBack} />
          </AppHeader>
          <Text style={styles.updateNote}>{t('flows.checkout.unavailableBody')}</Text>
        </View>
        <BottomBarSlot />
      </View>
    );
  }

  const price = PREMIUM_PRICE[billing];
  // The wallet's own name, taken from the payment catalogue rather than spelled again here —
  // it is a brand, so it reads the same in both languages and there is one place to change it.
  const wallet = method === 'card' ? null : t(PAYMENT_LABEL_KEY[method]);

  const confirm = () =>
    onConfirm(
      // Only the last four are kept — nothing else about the card is stored, mock or not.
      method === 'card'
        ? { kind: 'card', last4: number.replace(/\D/g, '').slice(-4) || undefined }
        : { kind: method },
    );

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow
            title={
              mode === 'update'
                ? t('flows.checkout.titleUpdate')
                : t('flows.checkout.titleSubscribe')
            }
            onBack={onBack}
          />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* What they're agreeing to, stated before the payment fields rather than after.
            An existing subscriber isn't agreeing to anything new, so they don't see it. */}
        {mode === 'subscribe' ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {t('flows.checkout.summaryPlan', { period: t(BILLING_ADVERB_KEY[billing]) })}
              </Text>
              <Text style={styles.summaryValue}>
                {formatPrice(locale, price.amount)}
                {billing === 'annual'
                  ? t('flows.checkout.perYear')
                  : t('flows.checkout.perMonth')}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('flows.checkout.dueToday')}</Text>
              <Text style={styles.summaryFree}>{t('flows.checkout.dueTodayAmount')}</Text>
            </View>
            <Text style={styles.summaryNote}>
              {t('flows.checkout.summaryNote', { days: TRIAL_DAYS })}
            </Text>
            <Ring radius={16} color={color.gray200} />
          </View>
        ) : (
          <Text style={styles.updateNote}>{t('flows.checkout.updateNote')}</Text>
        )}

        <Text style={[styles.sectionTitle, displayFont]}>
          {t('flows.checkout.sectionPayWith')}
        </Text>

        <View style={styles.methods}>
          {METHODS.map((option, index) => {
            const active = option.id === method;
            const detail = t(option.detailKey);
            return (
              <View key={option.id}>
                {index > 0 && <View style={styles.methodDivider} />}
                <Pressable
                  style={styles.method}
                  onPress={() => setMethod(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t('flows.checkout.a11yMethod', {
                    label: t(PAYMENT_LABEL_KEY[option.id]),
                    detail,
                  })}
                >
                  <MethodIcon method={option.id} />
                  <View style={styles.methodText}>
                    <Text style={styles.methodLabel}>{t(PAYMENT_LABEL_KEY[option.id])}</Text>
                    <Text style={styles.methodDetail}>{detail}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              </View>
            );
          })}
          <Ring radius={16} color={color.gray200} />
        </View>

        {method === 'card' ? (
          <View style={styles.card}>
            <LabeledInput
              label={t('flows.checkout.cardNumberLabel')}
              placeholder={t('flows.checkout.cardNumberPlaceholder')}
              keyboardType="number-pad"
              value={number}
              onChangeText={(text) => setNumber(formatCardNumber(text))}
            />
            <View style={styles.pair}>
              <View style={styles.pairItem}>
                <LabeledInput
                  label={t('flows.checkout.expiryLabel')}
                  placeholder={t('flows.checkout.expiryPlaceholder')}
                  keyboardType="number-pad"
                  value={expiry}
                  onChangeText={(text) => setExpiry(formatExpiry(text))}
                />
              </View>
              <View style={styles.pairItem}>
                <LabeledInput
                  label={t('flows.checkout.cvcLabel')}
                  placeholder={t('flows.checkout.cvcPlaceholder')}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={cvc}
                  onChangeText={(text) => setCvc(text.replace(/\D/g, ''))}
                />
              </View>
            </View>
            <LabeledInput
              label={t('flows.checkout.nameLabel')}
              placeholder={t('flows.checkout.namePlaceholder')}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        ) : (
          <View style={styles.wallet}>
            {/* An acceptance mark is artwork: the glyph sits before the word in every locale,
                and both programs forbid altering it. Pinned LTR so the row around it can
                mirror without taking the mark with it. */}
            <View style={styles.brandMark}>
              {method === 'apple' ? <ApplePayMark size={18} /> : <GooglePayMark size={18} />}
            </View>
            <Text style={styles.walletText}>
              {t('flows.checkout.walletNote', { wallet: wallet ?? '' })}
            </Text>
            <Ring radius={12} color={color.gray200} />
          </View>
        )}

        <Pressable
          style={styles.cta}
          onPress={confirm}
          accessibilityRole="button"
          accessibilityLabel={
            mode === 'update'
              ? t('flows.checkout.a11ySave')
              : t('flows.checkout.a11yTrial', {
                  price: formatPrice(locale, price.amount),
                  // The adverb rather than the raw `billing` id, which would be announced
                  // untranslated.
                  period: t(BILLING_ADVERB_KEY[billing]),
                  days: TRIAL_DAYS,
                })
          }
        >
          <LockSimple size={16} weight="fill" color={color.white} />
          <Text style={styles.ctaLabel}>
            {mode === 'update'
              ? t('flows.checkout.ctaSave')
              : wallet
                ? t('flows.checkout.ctaWallet', { wallet })
                : t('flows.checkout.ctaTrial', { days: TRIAL_DAYS })}
          </Text>
        </Pressable>

        <Text style={styles.legal}>{t('flows.checkout.legal')}</Text>
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
    gap: 16,
  },

  summary: {
    backgroundColor: color.white,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    ...shadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray700,
  },
  summaryValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray900,
    // "$71.88/yr" is a price with a unit stuck to it, and bidi would happily reorder it to
    // "yr/$71.88" in an RTL paragraph. The row around it still mirrors; only the figure is pinned.
    ...LTR_RUN,
  },
  summaryFree: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: color.success500,
  },
  summaryNote: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: color.gray200,
  },

  updateNote: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray600,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 18,
    lineHeight: 24,
    color: color.black,
    marginBottom: -8,
  },

  methods: {
    backgroundColor: color.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  methodDivider: {
    height: 1,
    // Inset past the icon column, which moves to the other edge under RTL.
    marginStart: 52,
    backgroundColor: color.gray200,
  },
  methodText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  methodLabel: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 20,
    color: color.gray900,
  },
  methodDetail: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: color.brand500,
    borderWidth: 2,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.brand500,
  },

  card: {
    gap: 12,
  },
  pair: {
    flexDirection: 'row',
    gap: 12,
  },
  pairItem: {
    flex: 1,
    minWidth: 0,
  },

  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.white,
    borderRadius: 12,
    padding: 12,
  },
  brandMark: {
    ...LTR_RUN,
  },
  walletText: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray700,
  },

  cta: {
    height: 48,
    borderRadius: 24,
    backgroundColor: color.brand500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.xs,
  },
  ctaLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
  },
  legal: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: color.gray500,
    textAlign: 'center',
  },
});
