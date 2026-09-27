import { ClipboardText } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { LabeledInput } from '../components/LabeledInput';
import { YesNoToggle } from '../components/YesNoToggle';
import { DIAGNOSIS_QUESTIONS, type OnboardingAnswers } from '../data/onboarding';
import { useDisplayFont, useT } from '../i18n';
import { isFeatureReady } from '../lib/featureAvailability';
import { color, font } from '../theme/tokens';

type Props = {
  answers: OnboardingAnswers;
  patch: (partial: Partial<OnboardingAnswers>) => void;
};

/**
 * Every question as an optional yes/no row rather than a forced one-at-a-time stepper — the
 * whole step is skippable, so nothing here should ever block on being answered in order.
 *
 * `DIAGNOSIS_QUESTIONS` is empty until a real question set exists (see `data/onboarding.ts`);
 * until then this renders a plain "nothing here yet" state so the screen is ready to receive
 * content without pretending to have any.
 */
export function OnboardingDiagnosisStep({ answers, patch }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      <Text style={[styles.title, displayFont]}>{t('flows.diagnosis.title')}</Text>
      <Text style={styles.hint}>{t('flows.diagnosis.hint')}</Text>

      {!isFeatureReady('diagnosis') || DIAGNOSIS_QUESTIONS.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <ClipboardText size={24} color={color.gray400} />
          </View>
          <Text style={[styles.emptyTitle, displayFont]}>{t('browse.placeholder.heading')}</Text>
          <Text style={styles.emptyBody}>{t('browse.pending.diagnosis')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {DIAGNOSIS_QUESTIONS.map((question) => (
            <View key={question.id} style={styles.row}>
              <Text style={styles.question}>{t(question.textKey)}</Text>
              <YesNoToggle
                value={answers.diagnosisAnswers[question.id] ?? null}
                onChange={(value) =>
                  patch({
                    diagnosisAnswers: { ...answers.diagnosisAnswers, [question.id]: value },
                  })
                }
              />
            </View>
          ))}
        </View>
      )}

      <LabeledInput
        label={t('flows.diagnosis.manualLabel')}
        value={answers.manualDiagnosis}
        maxLength={2000}
        onChangeText={(manualDiagnosis) => patch({ manualDiagnosis })}
        placeholder={t('flows.diagnosis.manualPlaceholder')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 30,
    color: color.black,
  },
  hint: {
    marginTop: -8,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  list: {
    gap: 16,
  },
  row: {
    gap: 8,
  },
  question: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: color.gray900,
  },
  empty: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  emptyBody: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray500,
    textAlign: 'center',
  },
});
