import { Check } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { LabeledInput } from '../components/LabeledInput';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { useT } from '../i18n';
import {
  MIN_PASSWORD_LENGTH,
  useAuth,
  validateSignUp,
  type AuthError,
  type AuthField,
  type FieldErrors,
  type SignUpForm,
} from '../state/AuthContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  /** The shell pops this screen and goes on to onboarding, or to whatever the refused tap was. */
  onSignedUp: () => void;
  onSwitchToSignIn: () => void;
  /**
   * The two legal documents. Same signature as the Menu's, because they land on the same
   * `PlaceholderScreen` — which is the honest answer while neither document has been written.
   */
  onOpenPlaceholder: (title: string, note: string) => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/**
 * An address is not Hebrew text. It keeps its own direction and its own edge even when the form
 * around it mirrors, or "name@example.com" would be laid out as "com.example@name" the moment
 * bidi got hold of it. Spelled per platform exactly as `CheckoutScreen` pins its price runs:
 * react-native-web throws out Yoga's `direction` and wants `writingDirection`, native the reverse.
 */
const LTR_EMAIL: TextStyle =
  Platform.OS === 'web'
    ? { writingDirection: 'ltr', textAlign: 'left' }
    : { direction: 'ltr', textAlign: 'left' };

/**
 * Mock email sign up, and a sibling of `CheckoutScreen` in both look and honesty: a plain form
 * over a thing that does not exist, saying so in its own copy rather than letting the polish
 * imply otherwise. No account is created and nothing leaves the device.
 *
 * The password is held in local state only while it is being typed, is handed to
 * `signUpWithEmail` as an argument, and is cleared on success. It never reaches `Account`, an
 * error object, or a log line — the same discipline `CheckoutScreen` applies by keeping only a
 * card's last four digits.
 *
 * The checkbox is local rather than shared: this is the only checkbox in the app, and a
 * `components/Checkbox` with one caller is a component invented on spec. Promote it if a second
 * screen ever needs one.
 */
export function SignUpScreen({
  onBack,
  onSignedUp,
  onSwitchToSignIn,
  onOpenPlaceholder,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const { signUpWithEmail, isAuthenticating } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const form: SignUpForm = { email, password, confirm, acceptedDisclaimers: accepted };
  const complete = Object.keys(validateSignUp(form)).length === 0;
  const disabled = !complete || isAuthenticating;

  /**
   * Blur is what first reveals an error. Nothing complains while a field still has the cursor,
   * so "j" is never told it is not an email address on its way to becoming one.
   */
  const revealOnBlur = (field: AuthField) =>
    setErrors((current) => ({ ...current, [field]: validateSignUp(form)[field] }));

  /**
   * Change re-checks only the fields that are already complaining, so an error clears the moment
   * it is fixed and no new one appears mid-typing. `confirm` rides along with `password` because
   * a mismatch is just as often fixed from the first field as from the second.
   */
  const reviseShown = (next: SignUpForm, fields: AuthField[]) =>
    setErrors((current) => {
      const found = validateSignUp(next);
      const revised: FieldErrors = { ...current };
      for (const field of fields) if (current[field]) revised[field] = found[field];
      return revised;
    });

  const toggleConsent = () => {
    const next = !accepted;
    setAccepted(next);
    // The one control with no blur of its own. Unticking is the only way to get it wrong, and
    // when the button greys out again it is worth saying which of the two things went missing.
    setErrors((current) => ({
      ...current,
      consent: validateSignUp({ ...form, acceptedDisclaimers: next }).consent,
    }));
  };

  const submit = async () => {
    const result = await signUpWithEmail(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    // The context never took them and the shell is about to pop this screen, but clearing here
    // means they are gone even if either of those ever stops being true.
    setPassword('');
    setConfirm('');
    setErrors({});
    onSignedUp();
  };

  // Resolved once: every error carries its own params, and `auth.error.passwordShort`
  // interpolates {min}, so `t(key)` alone would render the placeholder.
  const message = (error: AuthError | undefined) => (error ? t(error.key, error.params) : undefined);
  const emailError = message(errors.email);
  const passwordError = message(errors.password);
  const confirmError = message(errors.confirm);
  const consentError = message(errors.consent);
  const formError = message(errors.form);

  const emailLabel = t('auth.signUp.emailLabel');
  const passwordLabel = t('auth.signUp.passwordLabel');
  const confirmLabel = t('auth.signUp.confirmLabel');

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('auth.signUp.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{t('auth.signUp.subtitle')}</Text>

        <View style={styles.fields}>
          <View>
            <LabeledInput
              label={emailLabel}
              required
              placeholder={t('auth.signUp.emailPlaceholder')}
              style={LTR_EMAIL}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(next) => {
                setEmail(next);
                reviseShown({ ...form, email: next }, ['email']);
              }}
              onBlur={() => revealOnBlur('email')}
              // The message is announced with the field rather than left as loose text below it,
              // which a screen reader on the input would never reach.
              accessibilityLabel={emailError ? `${emailLabel}. ${emailError}` : undefined}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          <View>
            <LabeledInput
              label={passwordLabel}
              required
              placeholder={t('auth.signUp.passwordPlaceholder', { min: MIN_PASSWORD_LENGTH })}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              value={password}
              onChangeText={(next) => {
                setPassword(next);
                reviseShown({ ...form, password: next }, ['password', 'confirm']);
              }}
              onBlur={() => revealOnBlur('password')}
              accessibilityLabel={passwordError ? `${passwordLabel}. ${passwordError}` : undefined}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>

          <View>
            <LabeledInput
              label={confirmLabel}
              required
              placeholder={t('auth.signUp.confirmPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              value={confirm}
              onChangeText={(next) => {
                setConfirm(next);
                reviseShown({ ...form, confirm: next }, ['confirm']);
              }}
              onBlur={() => revealOnBlur('confirm')}
              accessibilityLabel={confirmError ? `${confirmLabel}. ${confirmError}` : undefined}
            />
            {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
          </View>
        </View>

        {/* Above the checkbox, not under the button: it has to be read before they type a
            password rather than after they have handed one over. */}
        <Text style={styles.demo}>{t('auth.signUp.demo')}</Text>

        <View style={styles.consent}>
          <Pressable
            style={styles.consentRow}
            onPress={toggleConsent}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            accessibilityLabel={t('auth.a11y.consentCheckbox')}
          >
            <View style={[styles.box, accepted && styles.boxChecked]}>
              {accepted ? (
                <Check size={14} weight="bold" color={color.white} />
              ) : (
                <Ring radius={6} color={consentError ? color.error500 : color.gray300} />
              )}
            </View>
            <Text style={styles.consentLabel}>{t('auth.signUp.consent')}</Text>
          </Pressable>

          {consentError ? <Text style={styles.fieldError}>{consentError}</Text> : null}

          {/* Separate links under the sentence rather than pressable spans inside it: spans
              cannot survive Hebrew word order, and a label that is partly a link makes
              "read the policy" toggle the box. */}
          <Pressable
            onPress={() =>
              onOpenPlaceholder(
                t('auth.signUp.disclaimersTitle'),
                t('auth.signUp.disclaimersNote'),
              )
            }
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('auth.signUp.linkDisclaimers')}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              onOpenPlaceholder(t('auth.signUp.privacyTitle'), t('auth.signUp.privacyNote'))
            }
            accessibilityRole="link"
          >
            <Text style={styles.link}>{t('auth.signUp.linkPrivacy')}</Text>
          </Pressable>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Pressable
          style={[styles.cta, disabled && styles.ctaDisabled]}
          onPress={submit}
          disabled={disabled}
          accessibilityRole="button"
          // Deliberately stable while it works: a control that renames itself under focus reads
          // as a new control rather than as the same one busy.
          accessibilityLabel={t('auth.signUp.cta')}
          accessibilityState={{ disabled, busy: isAuthenticating }}
        >
          {isAuthenticating && (
            <ActivityIndicator
              size="small"
              color={color.white}
              accessibilityLabel={t('auth.a11y.signingIn')}
            />
          )}
          <Text style={[styles.ctaLabel, disabled && styles.ctaLabelDisabled]}>
            {isAuthenticating ? t('auth.sheet.signingIn') : t('auth.signUp.cta')}
          </Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchPrompt}>{t('auth.signUp.switchPrompt')}</Text>
          <Pressable onPress={onSwitchToSignIn} accessibilityRole="link">
            <Text style={styles.link}>{t('auth.signUp.switchCta')}</Text>
          </Pressable>
        </View>
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

  subtitle: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray600,
  },
  fields: {
    gap: 12,
  },
  fieldError: {
    marginTop: 6,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.error500,
  },
  formError: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.error500,
    textAlign: 'center',
  },
  demo: {
    fontFamily: font.body,
    fontSize: 11,
    lineHeight: 16,
    color: color.gray500,
  },

  consent: {
    gap: 10,
  },
  consentRow: {
    flexDirection: 'row',
    // Top-aligned, because the sentence wraps to two lines in most locales and a centred box
    // would then float beside the middle of a paragraph.
    alignItems: 'flex-start',
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: color.brand500,
  },
  consentLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray700,
  },
  link: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand600,
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
  ctaDisabled: {
    backgroundColor: color.gray200,
  },
  ctaLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
  },
  ctaLabelDisabled: {
    // Onboarding's disabled button keeps a white label on gray200, where it is all but
    // invisible. This form leans on the disabled state to say "not yet", so it has to be read.
    color: color.gray500,
  },

  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  switchPrompt: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray600,
  },
});
