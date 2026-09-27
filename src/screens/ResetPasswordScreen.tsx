import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { LabeledInput } from '../components/LabeledInput';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { useT } from '../i18n';
import { MIN_PASSWORD_LENGTH, useAuth } from '../state/AuthContext';
import { color, font, frame } from '../theme/tokens';

export function ResetPasswordScreen() {
  const t = useT();
  const { updatePassword, cancelPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const submit = async () => {
    if (busy.current) return;
    if (password !== confirm) { setError(t('auth.error.passwordMismatch')); return; }
    busy.current = true;
    setSaving(true);
    const result = await updatePassword(password);
    busy.current = false;
    setSaving(false);
    if (!result.ok) {
      const issue = result.errors.password ?? result.errors.form;
      setError(issue ? t(issue.key, issue.params) : t('auth.error.connection'));
    } else { setPassword(''); setConfirm(''); }
  };
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader>
        <ScreenTitleRow title={t('auth.resetPassword.title')}
          onBack={() => { if (!saving) cancelPasswordRecovery(); }} />
      </AppHeader>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.text}>{t('auth.resetPassword.body')}</Text>
        <LabeledInput label={t('auth.signUp.passwordLabel')} value={password}
          onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false}
          autoComplete="new-password" textContentType="newPassword" editable={!saving} />
        <LabeledInput label={t('auth.signUp.confirmLabel')} value={confirm}
          onChangeText={setConfirm} secureTextEntry autoCapitalize="none" autoCorrect={false}
          autoComplete="new-password" textContentType="newPassword" editable={!saving} />
        {!!error && <Text style={[styles.text, { color: color.error500 }]} accessibilityRole="alert">{error}</Text>}
        <Pressable onPress={submit}
          disabled={saving || password.length < MIN_PASSWORD_LENGTH || !confirm}
          accessibilityRole="button"
          style={[styles.button, (saving || password.length < MIN_PASSWORD_LENGTH || !confirm) && { opacity: 0.5 }]}>
          {saving && <ActivityIndicator color={color.white} />}
          <Text style={styles.label}>{t('auth.resetPassword.cta')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.gray50, paddingHorizontal: frame.gutter },
  content: { gap: 16, paddingVertical: 24 },
  text: { fontFamily: font.body, fontSize: 14, lineHeight: 20, color: color.gray600 },
  button: { minHeight: 48, padding: 14, borderRadius: 12, backgroundColor: color.brand600,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  label: { fontFamily: font.bodySemiBold, fontSize: 15, color: color.white },
});
