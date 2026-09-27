import { randomUUID } from 'expo-crypto';
import { CheckCircle } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';

import appConfig from '../../app.json';
import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { useDirection, useDisplayFont, useLocale, useT } from '../i18n';
import { BUG_REPORT_MAX_LENGTH, submitBugReport } from '../lib/bugReports';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  onRequestSignIn: () => void;
};

type Status = 'editing' | 'sending' | 'error' | 'limited' | 'success';

export function BugReportScreen({ onBack, onRequestSignIn }: Props) {
  const t = useT();
  const locale = useLocale();
  const { direction, isRTL } = useDirection();
  const displayFont = useDisplayFont();
  const { isAuthed, isAuthenticating, account } = useAuth();
  const [description, setDescription] = useState('');
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<Status>('editing');
  const submittingRef = useRef(false);
  const reportIdRef = useRef<string | null>(null);

  const isSending = status === 'sending';
  const isAvailable = supabase !== null;
  const needsSignIn = !isAuthed || !account;
  const busy = isSending || isAuthenticating;
  const sendDisabled =
    !isAvailable || busy || needsSignIn || description.trim().length === 0;
  const textDirection: TextStyle = {
    textAlign: isRTL ? 'right' : 'left',
    ...(Platform.OS === 'web' ? { writingDirection: direction } : { direction }),
  };

  const changeDescription = (value: string) => {
    if (submittingRef.current) return;
    const next = value.slice(0, BUG_REPORT_MAX_LENGTH);
    if (next === description) return;
    setDescription(next);
    // An unchanged draft keeps its ID after failure, including an uncertain network result.
    reportIdRef.current = null;
    setStatus('editing');
  };

  const submit = async () => {
    if (submittingRef.current || sendDisabled || status === 'success') return;
    submittingRef.current = true;
    setStatus('sending');
    Keyboard.dismiss();

    try {
      reportIdRef.current ??= randomUUID();
      await submitBugReport({
        id: reportIdRef.current,
        description: description.trim(),
        platform: Platform.OS,
        locale,
        appVersion: appConfig.expo.version,
      });
      setStatus('success');
      setDescription('');
      reportIdRef.current = null;
    } catch (error) {
      // Preserve the draft and ID, and never expose backend error details to the user.
      setStatus((error as { code?: string })?.code === 'PT429' ? 'limited' : 'error');
    } finally {
      submittingRef.current = false;
    }
  };

  const goBack = () => {
    if (submittingRef.current) return;
    Keyboard.dismiss();
    onBack();
  };

  const requestSignIn = () => {
    if (busy || submittingRef.current || !isAvailable) return;
    Keyboard.dismiss();
    // The shell opens sign-in over this screen; keep its local draft intact.
    onRequestSignIn();
  };

  return (
    <View style={styles.body}>
      <View
        style={styles.gutter}
        pointerEvents={isSending ? 'none' : 'auto'}
        accessibilityState={{ disabled: isSending }}
      >
        <AppHeader>
          <ScreenTitleRow title={t('feedback.bugReport.title')} onBack={goBack} />
        </AppHeader>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            status === 'success' && styles.successContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {status === 'success' ? (
            <>
              <View style={styles.confirmation} accessibilityLiveRegion="polite">
                <View style={styles.successBadge} accessible={false}>
                  <CheckCircle size={32} color={color.success600} weight="bold" />
                </View>
                <Text style={[styles.successTitle, displayFont]} accessibilityRole="header">
                  {t('feedback.bugReport.successTitle')}
                </Text>
                <Text style={[styles.bodyText, styles.centerText]}>
                  {t('feedback.bugReport.successMessage')}
                </Text>
              </View>
              <Pressable style={styles.cta} onPress={goBack} accessibilityRole="button">
                <Text style={styles.ctaLabel}>{t('common.action.done')}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.bodyText, textDirection]}>
                {t('feedback.bugReport.intro')}
              </Text>

              <View style={styles.field}>
                <Text style={[styles.label, textDirection]}>
                  {t('feedback.bugReport.descriptionLabel')}
                </Text>
                <View style={[styles.inputWrap, busy && styles.disabled]}>
                  {focused && <View pointerEvents="none" style={styles.focusRing} />}
                  <TextInput
                    style={[styles.input, textDirection]}
                    value={description}
                    onChangeText={changeDescription}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={t('feedback.bugReport.descriptionPlaceholder')}
                    placeholderTextColor={color.gray400}
                    accessibilityLabel={t('feedback.bugReport.descriptionLabel')}
                    accessibilityState={{ disabled: busy || !isAvailable }}
                    editable={!busy && isAvailable}
                    multiline
                    maxLength={BUG_REPORT_MAX_LENGTH}
                    textAlignVertical="top"
                    underlineColorAndroid="transparent"
                  />
                  <Ring radius={12} color={color.gray200} />
                </View>
                <Text style={[styles.count, textDirection]}>
                  {t('feedback.bugReport.count', {
                    count: description.length,
                    max: BUG_REPORT_MAX_LENGTH,
                  })}
                </Text>
              </View>

              {!isAvailable ? (
                <Text style={[styles.bodyText, textDirection]} accessibilityLiveRegion="polite">
                  {t('feedback.bugReport.unavailable')}
                </Text>
              ) : needsSignIn ? (
                <Text style={[styles.bodyText, textDirection]}>
                  {t('feedback.bugReport.signInNote')}
                </Text>
              ) : null}

              {(status === 'error' || status === 'limited') && (
                <Text
                  style={[styles.error, textDirection]}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  {t(status === 'limited' ? 'feedback.bugReport.rateLimited' : 'feedback.bugReport.error')}
                </Text>
              )}

              {isAvailable && needsSignIn ? (
                <Pressable
                  style={[styles.cta, busy && styles.ctaDisabled]}
                  onPress={requestSignIn}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy, busy }}
                >
                  {busy && <ActivityIndicator size="small" color={color.gray500} />}
                  <Text style={[styles.ctaLabel, busy && styles.ctaLabelDisabled]}>
                    {isAuthenticating
                      ? t('feedback.bugReport.signingIn')
                      : t('feedback.bugReport.signInCta')}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.cta, sendDisabled && styles.ctaDisabled]}
                  onPress={submit}
                  disabled={sendDisabled}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: sendDisabled, busy: isSending }}
                >
                  {isSending && <ActivityIndicator size="small" color={color.gray500} />}
                  <Text style={[styles.ctaLabel, sendDisabled && styles.ctaLabelDisabled]}>
                    {isSending
                      ? t('feedback.bugReport.sending')
                      : status === 'error'
                        ? t('feedback.bugReport.retry')
                        : t('feedback.bugReport.send')}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.cancel, isSending && styles.disabled]}
                onPress={goBack}
                disabled={isSending}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSending }}
              >
                <Text style={styles.cancelLabel}>{t('common.action.cancel')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomBarSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
  },
  flex: {
    flex: 1,
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
  bodyText: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray600,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray700,
  },
  inputWrap: {
    borderRadius: 12,
    backgroundColor: color.white,
  },
  input: {
    borderRadius: 12,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
    minHeight: 176,
    maxHeight: 280,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 22,
    color: color.gray900,
  },
  focusRing: {
    position: 'absolute',
    top: -4, left: -4, right: -4, bottom: -4,
    borderWidth: 4,
    borderRadius: 16,
    borderColor: color.brand100,
  },
  count: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray500,
  },
  error: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.error500,
  },
  cta: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flexShrink: 1,
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
    textAlign: 'center',
  },
  ctaLabelDisabled: {
    color: color.gray500,
  },
  cancel: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    color: color.brand600,
  },
  disabled: {
    opacity: 0.6,
  },
  successContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
  },
  confirmation: {
    alignItems: 'center',
    gap: 12,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.success100,
  },
  successTitle: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.gray900,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
