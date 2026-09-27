import { CaretLeft, CaretRight, EnvelopeSimple } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { GoogleGlyph } from '../../assets/PaymentMarks';
import { UNLOCK_LINE, UNLOCK_LINE_GENERIC, type Capability } from '../../data/access';
import { useDirection, useT } from '../../i18n';
import { isFeatureReady } from '../../lib/featureAvailability';
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
  /** Provider redirects are handled by the shell and the auth provider. */
  onGoogle: () => void;
  /** Hands off to the email screen. This one navigates rather than signing anybody in. */
  onEmail: () => void;
};

/** Cap height of the Google mark. */
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
export function AuthSheet({ visible, capability, onClose, onGoogle, onEmail }: Props) {
  const t = useT();
  const { isRTL } = useDirection();
  const { session, isAuthenticating, authError } = useAuth();

  // Only the active method spins while both buttons refuse a second tap.
  const pending = session.status === 'authenticating' ? session.method : null;
  const busy = isAuthenticating;

  // Keep the intent intact while a provider round trip is in progress.
  const close = busy ? noop : onClose;

  // The email row opens a form; Google starts a provider redirect.
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
          unavailable={!isFeatureReady('googleAuth')}
          busy={busy}
          spinning={pending === 'google'}
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
      {authError && (
        <Text style={[styles.demo, { color: color.error500 }]} accessibilityRole="alert">
          {t(authError.key, authError.params)}
        </Text>
      )}
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
  unavailable = false,
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
  unavailable?: boolean;
}) {
  const t = useT();
  return (
    <Pressable
      style={[styles.row, (unavailable || busy && !spinning) && styles.rowBusy]}
      onPress={unavailable ? undefined : onPress}
      disabled={busy || unavailable}
      accessibilityRole="button"
      // Deliberately the row's own label even while it spins: a control that renames itself
      // under focus reads as a new control rather than as the same one working. The `busy`
      // state and the spinner's label carry the change instead.
      accessibilityLabel={unavailable ? `${label}, ${t('browse.placeholder.heading')}` : label}
      accessibilityState={{ disabled: busy || unavailable, busy: spinning }}
    >
      {/* Keep both labels aligned despite different icon widths. */}
      <View style={styles.glyph}>{glyph}</View>

      <View style={styles.labelBlock}>
        <Text style={styles.label}>{spinning ? signingInLabel : label}</Text>
        {unavailable && <Text style={styles.unavailable}>{t('browse.placeholder.heading')}</Text>}
      </View>

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
  labelBlock: {
    flex: 1,
    minWidth: 0,
  },
  unavailable: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: color.gray600,
  },
  label: {
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
