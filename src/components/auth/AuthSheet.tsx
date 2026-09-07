import { CaretLeft, CaretRight, EnvelopeSimple } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppleGlyph, GoogleGlyph } from '../../assets/PaymentMarks';
import { UNLOCK_LINE, UNLOCK_LINE_GENERIC, type Capability } from '../../data/access';
import { useDirection, useT } from '../../i18n';
import { useAuth } from '../../state/AuthContext';
import { color, font } from '../../theme/tokens';
import { BottomSheet } from '../BottomSheet';
import { Ring } from '../Ring';

type Props = {
  visible: boolean;
  /**
   * What the refused tap was reaching for. It picks the one line that says what signing in
   * would have opened; `null` when the Menu opened the sheet with no intent behind it.
   */
  capability: Capability | null;
  onClose: () => void;
  /** Mocked one-tap sign-ins. The shell owns them, exactly as it owns the emergency sheet's. */
  onGoogle: () => void;
  onApple: () => void;
  /** Hands off to the email screen. This one navigates rather than signing anybody in. */
  onEmail: () => void;
};

/** Cap height of a provider mark. Apple's is set at 86% of it, as `PaymentMarks` itself does. */
const GLYPH = 20;

/**
 * The wall a guest meets when they tap something locked.
 *
 * Built on `BottomSheet` rather than hand-rolled: that routes through `SheetHost`, which is the
 * only reason a sheet paints above the pinned tab bar, and it is opened from the shell so there
 * is exactly one instance no matter which of a dozen gates asked for it.
 *
 * It offers one thing. No crown, no price, no mention of Premium even where the tapped row is
 * also paywalled — a visitor is being asked for an account, and asking for two things at once is
 * how a funnel dies. The unlock line is the whole reason it converts: a bare wall says no, a line
 * naming what this particular tap would have opened says "not yet".
 *
 * The brand marks come from `src/assets/PaymentMarks` unchanged. Google's G keeps its four
 * colours and neither mark is ever tinted or mirrored — an SVG does not flip under RTL on its
 * own, and nothing here should ask it to.
 */
export function AuthSheet({ visible, capability, onClose, onGoogle, onApple, onEmail }: Props) {
  const t = useT();
  const { isRTL } = useDirection();
  const { session } = useAuth();

  // Which button is mid-round-trip, so only that one spins while all three refuse a second tap.
  const pending = session.status === 'authenticating' ? session.method : null;
  const busy = pending !== null;

  // Dismissing mid-flight would clear the pending intent while the mock sign-in carried on
  // regardless, and the app would then appear to navigate by itself. It holds for the 600ms.
  const close = busy ? noop : onClose;

  // The email row leads somewhere; the two provider rows resolve in place. The caret says which.
  const Caret = isRTL ? CaretLeft : CaretRight;

  return (
    <BottomSheet visible={visible} onClose={close} title={t('auth.sheet.title')}>
      <Text style={styles.unlock}>
        {t(capability ? UNLOCK_LINE[capability] : UNLOCK_LINE_GENERIC)}
      </Text>

      <View style={styles.actions}>
        <ProviderRow
          glyph={<GoogleGlyph size={GLYPH} />}
          label={t('auth.sheet.google')}
          onPress={onGoogle}
          busy={busy}
          spinning={pending === 'google'}
          signingInLabel={t('auth.sheet.signingIn')}
          a11yBusy={t('auth.a11y.signingIn')}
        />

        <ProviderRow
          glyph={<AppleGlyph size={GLYPH * 0.86} tint={color.gray900} />}
          label={t('auth.sheet.apple')}
          onPress={onApple}
          busy={busy}
          spinning={pending === 'apple'}
          signingInLabel={t('auth.sheet.signingIn')}
          a11yBusy={t('auth.a11y.signingIn')}
        />

        <ProviderRow
          glyph={<EnvelopeSimple size={GLYPH} color={color.gray900} />}
          label={t('auth.sheet.email')}
          onPress={onEmail}
          busy={busy}
          spinning={false}
          signingInLabel={t('auth.sheet.signingIn')}
          a11yBusy={t('auth.a11y.signingIn')}
          trailing={<Caret size={20} color={color.gray400} />}
        />
      </View>

      {/* Before they choose a method, not after they have used one. */}
      <Text style={styles.demo}>{t('auth.sheet.demo')}</Text>
    </BottomSheet>
  );
}

function ProviderRow({
  glyph,
  label,
  onPress,
  busy,
  spinning,
  signingInLabel,
  a11yBusy,
  trailing,
}: {
  glyph: ReactNode;
  label: string;
  onPress: () => void;
  /** Some other row is signing in, so this one must not start a second round trip. */
  busy: boolean;
  spinning: boolean;
  signingInLabel: string;
  a11yBusy: string;
  trailing?: ReactNode;
}) {
  return (
    <Pressable
      style={[styles.row, busy && !spinning && styles.rowBusy]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      // Deliberately the row's own label even while it spins: a control that renames itself
      // under focus reads as a new control rather than as the same one working. The `busy`
      // state and the spinner's label carry the change instead.
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy: spinning }}
    >
      {/* A fixed column: Apple's mark is narrower than Google's, and without it the three
          labels would each start at a different x. */}
      <View style={styles.glyph}>{glyph}</View>

      <Text style={styles.label}>{spinning ? signingInLabel : label}</Text>

      {spinning ? (
        <ActivityIndicator size="small" color={color.gray500} accessibilityLabel={a11yBusy} />
      ) : (
        trailing
      )}

      <Ring radius={16} color={color.gray200} />
    </Pressable>
  );
}

function noop() {}

const styles = StyleSheet.create({
  unlock: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray600,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  row: {
    // Min rather than fixed: "Continue with Google" is one line in English and need not be in
    // every locale, and a row that grows is better than a label that is cut in half.
    minHeight: 56,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: color.white,
  },
  rowBusy: {
    opacity: 0.6,
  },
  glyph: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.gray900,
    // No textAlign: it follows the writing direction, which is the point under RTL.
  },
  demo: {
    marginTop: 16,
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: color.gray500,
    textAlign: 'center',
  },
});
