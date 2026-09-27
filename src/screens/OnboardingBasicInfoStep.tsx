import { StyleSheet, Text, View } from 'react-native';

import { ChipSelect } from '../components/ChipSelect';
import { LabeledInput } from '../components/LabeledInput';
import { GENDER_OPTIONS, LANGUAGE_OPTIONS, type OnboardingAnswers } from '../data/onboarding';
import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  answers: OnboardingAnswers;
  patch: (partial: Partial<OnboardingAnswers>) => void;
};

export function OnboardingBasicInfoStep({ answers, patch }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      <Text style={[styles.title, displayFont]}>{t('flows.basicInfo.title')}</Text>

      <View style={styles.row}>
        <View style={styles.half}>
          <LabeledInput
            label={t('flows.basicInfo.firstNameLabel')}
            value={answers.firstName}
            maxLength={100}
            onChangeText={(firstName) => patch({ firstName })}
            placeholder={t('flows.basicInfo.firstNamePlaceholder')}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.half}>
          <LabeledInput
            label={t('flows.basicInfo.lastNameLabel')}
            value={answers.lastName}
            maxLength={100}
            onChangeText={(lastName) => patch({ lastName })}
            placeholder={t('flows.basicInfo.lastNamePlaceholder')}
            autoCapitalize="words"
          />
        </View>
      </View>

      <LabeledInput
        label={t('flows.basicInfo.ageLabel')}
        required
        value={answers.age}
        maxLength={3}
        onChangeText={(age) => patch({ age: age.replace(/[^0-9]/g, '') })}
        placeholder={t('flows.basicInfo.agePlaceholder')}
        keyboardType="number-pad"
      />

      <View style={styles.field}>
        <Text style={styles.label}>{t('flows.basicInfo.genderLabel')}</Text>
        <ChipSelect
          options={GENDER_OPTIONS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }))}
          selectedIds={answers.gender ? [answers.gender] : []}
          onToggle={(id) => patch({ gender: id as OnboardingAnswers['gender'] })}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('flows.basicInfo.languageLabel')}</Text>
        <ChipSelect
          options={LANGUAGE_OPTIONS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }))}
          selectedIds={[answers.language]}
          onToggle={(id) => patch({ language: id as OnboardingAnswers['language'] })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 20,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 30,
    color: color.black,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
    minWidth: 0,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray700,
  },
});
