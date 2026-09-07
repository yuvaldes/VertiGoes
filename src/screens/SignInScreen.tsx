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
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { useT } from '../i18n';
import {
  useAuth,
  validateSignIn,
  type AuthError,
  type AuthField,
  type FieldErrors,
  type SignInForm,
} from '../state/AuthContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  /** The shell pops this screen and replays whatever the refused tap was reaching for. */
  onSignedIn: () => void;
  onSwitchToSignUp: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** See the note on the same constant in `SignUpScreen` — an address keeps its own direction. */
const LTR_EMAIL: TextStyle =
  Platform.OS === 'web'
    ? { writingDirection: 'ltr', textAlign: 'left' }
    : { direction: 'ltr', textAlign: 'left' };

/**
 * Mock email sign in. Two fields and no legal checkbox — the disclaimers were agreed to at sign
 * up, and asking again would imply they had been recorded somewhere, which they have not.
 *
 * Every attempt succeeds, because there is no store to check credentials against. That would
 * read as a bug, so `auth.signIn.demo` says it outright rather than leaving it to be discovered.
 * The password is an argument to `signInWithEmail` and nothing else: never stored, never logged,
 * and cleared here the moment the call comes back.
 */
export function SignInScreen({
  onBack,
  onSignedIn,
  onSwitchToSignUp,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const { signInWithEmail, isAuthenticating } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const form: SignInForm = { email, password };
  const complete = Object.keys(validateSignIn(form)).length === 0;
  const disabled = !complete || isAuthenticating;

  /** Blur reveals; nothing complains while a field still has the cursor. */
  const revealOnBlur = (field: AuthField) =>
    setErrors((current) => ({ ...current, [field]: validateSignIn(form)[field] }));

  /** Change re-checks only a field that is already complaining, so it clears as it is fixed. */
  const reviseShown = (field: AuthField, next: SignInForm) =>
    setErrors((current) =>
      current[field] ? { ...current, [field]: validateSignIn(next)[field] } : current,
    );

  const submit = async () => {
    const result = await signInWithEmail(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setPassword('');
    setErrors({});
    onSignedIn();
  };

  const message = (error: AuthError | undefined) => (error ? t(error.key, error.params) : undefined);
  const emailError = message(errors.email);
  const passwordError = message(errors.password);
  const formError = message(errors.form);

  const emailLabel = t('auth.signIn.emailLabel');
  const passwordLabel = t('auth.signIn.passwordLabel');

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('auth.signIn.title')} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>

        <View style={styles.fields}>
          <View>
            <LabeledInput
              label={emailLabel}
              placeholder={t('auth.signIn.emailPlaceholder')}
              style={LTR_EMAIL}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(next) => {
                setEmail(next);
                reviseShown('email', { ...form, email: next });
              }}
              onBlur={() => revealOnBlur('email')}
              accessibilityLabel={emailError ? `${emailLabel}. ${emailError}` : undefined}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
          </View>

          <View>
            <LabeledInput
              label={passwordLabel}
              placeholder={t('auth.signIn.passwordPlaceholder')}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              value={password}
              onChangeText={(next) => {
                setPassword(next);
                reviseShown('password', { ...form, password: next });
              }}
              onBlur={() => revealOnBlur('password')}
              accessibilityLabel={passwordError ? `${passwordLabel}. ${passwordError}` : undefined}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>
        </View>

        <Text style={styles.demo}>{t('auth.signIn.demo')}</Text>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <Pressable
          style={[styles.cta, disabled && styles.ctaDisabled]}
          onPress={submit}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('auth.signIn.cta')}
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
            {isAuthenticating ? t('auth.sheet.signingIn') : t('auth.signIn.cta')}
          </Text>
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchPrompt}>{t('auth.signIn.switchPrompt')}</Text>
          <Pressable onPress={onSwitchToSignUp} accessibilityRole="link">
            <Text style={styles.link}>{t('auth.signIn.switchCta')}</Text>
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
    // Matches `SignUpScreen`: white on gray200 is all but invisible, and this form uses the
    // disabled state to say "not yet".
    color: color.gray500,
  },

  link: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.brand600,
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
