import { StyleSheet, Text, View } from 'react-native';

import { ChipSelect } from '../components/ChipSelect';
import { LabeledInput } from '../components/LabeledInput';
import { YesNoToggle } from '../components/YesNoToggle';
import {
  KNOWN_DIAGNOSES,
  KNOWN_MEDICATIONS,
  NONE_OPTION_ID,
  OTHER_OPTION_ID,
  type OnboardingAnswers,
} from '../data/onboarding';
import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  answers: OnboardingAnswers;
  patch: (partial: Partial<OnboardingAnswers>) => void;
};

/** Toggles one id in an array, keeping "none" and the real options mutually exclusive. */
function togglePick(current: string[], id: string): string[] {
  if (id === NONE_OPTION_ID) {
    return current.includes(NONE_OPTION_ID) ? [] : [NONE_OPTION_ID];
  }
  const withoutNone = current.filter((existing) => existing !== NONE_OPTION_ID);
  return withoutNone.includes(id)
    ? withoutNone.filter((existing) => existing !== id)
    : [...withoutNone, id];
}

export function OnboardingMedicalHistoryStep({ answers, patch }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  // The clinical lists arrive as keys; the two escape hatches belong to this step, so both
  // are resolved here and the chips only ever see finished labels.
  const diagnosisOptions = [
    ...KNOWN_DIAGNOSES.map(({ id, labelKey }) => ({ id, label: t(labelKey) })),
    { id: OTHER_OPTION_ID, label: t('flows.medicalHistory.diagnosisOther') },
    { id: NONE_OPTION_ID, label: t('flows.medicalHistory.diagnosisNone') },
  ];
  const medicationOptions = [
    ...KNOWN_MEDICATIONS.map(({ id, labelKey }) => ({ id, label: t(labelKey) })),
    { id: OTHER_OPTION_ID, label: t('flows.medicalHistory.medicationOther') },
    { id: NONE_OPTION_ID, label: t('flows.medicalHistory.medicationNone') },
  ];

  return (
    <View style={styles.root}>
      <Text style={[styles.title, displayFont]}>{t('flows.medicalHistory.title')}</Text>

      <View style={styles.section}>
        <Text style={styles.question}>{t('flows.medicalHistory.diagnosedQuestion')}</Text>
        <Text style={styles.hint}>{t('flows.medicalHistory.diagnosedHint')}</Text>
        <YesNoToggle
          value={answers.diagnosedBefore}
          onChange={(diagnosedBefore) => patch({ diagnosedBefore })}
        />

        {answers.diagnosedBefore === true && (
          <View style={styles.subsection}>
            <ChipSelect
              options={diagnosisOptions}
              selectedIds={answers.diagnoses}
              onToggle={(id) => patch({ diagnoses: togglePick(answers.diagnoses, id) })}
            />
            {answers.diagnoses.includes(OTHER_OPTION_ID) && (
              <LabeledInput
                label={t('flows.medicalHistory.otherDiagnosisLabel')}
                value={answers.otherDiagnosis}
                onChangeText={(otherDiagnosis) => patch({ otherDiagnosis })}
                placeholder={t('flows.medicalHistory.otherDiagnosisPlaceholder')}
              />
            )}
          </View>
        )}

        {answers.diagnosedBefore === false && (
          <Text style={styles.info}>{t('flows.medicalHistory.notDiagnosedInfo')}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.question}>{t('flows.medicalHistory.medicationQuestion')}</Text>
        <ChipSelect
          options={medicationOptions}
          selectedIds={answers.medications}
          onToggle={(id) => patch({ medications: togglePick(answers.medications, id) })}
        />
        {answers.medications.includes(OTHER_OPTION_ID) && (
          <LabeledInput
            label={t('flows.medicalHistory.otherMedicationLabel')}
            value={answers.otherMedication}
            onChangeText={(otherMedication) => patch({ otherMedication })}
            placeholder={t('flows.medicalHistory.otherMedicationPlaceholder')}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 30,
    color: color.black,
  },
  section: {
    gap: 12,
  },
  question: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    color: color.gray900,
  },
  hint: {
    marginTop: -8,
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  subsection: {
    gap: 12,
  },
  info: {
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray700,
    backgroundColor: color.brand50,
    borderRadius: 12,
    padding: 12,
  },
});
