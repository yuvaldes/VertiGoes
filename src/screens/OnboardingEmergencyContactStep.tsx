import { StyleSheet, Text, View } from 'react-native';

import { LabeledInput } from '../components/LabeledInput';
import type { OnboardingAnswers } from '../data/onboarding';
import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  answers: OnboardingAnswers;
  patch: (partial: Partial<OnboardingAnswers>) => void;
};

export function OnboardingEmergencyContactStep({ answers, patch }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      <Text style={[styles.title, displayFont]}>{t('flows.emergencyContact.title')}</Text>
      <Text style={styles.hint}>{t('flows.emergencyContact.hint')}</Text>

      <LabeledInput
        label={t('flows.emergencyContact.nameLabel')}
        value={answers.emergencyContactName}
        maxLength={100}
        onChangeText={(emergencyContactName) => patch({ emergencyContactName })}
        placeholder={t('flows.emergencyContact.namePlaceholder')}
        autoCapitalize="words"
      />
      <LabeledInput
        label={t('flows.emergencyContact.phoneLabel')}
        value={answers.emergencyContactPhone}
        maxLength={40}
        onChangeText={(emergencyContactPhone) => patch({ emergencyContactPhone })}
        placeholder={t('flows.emergencyContact.phonePlaceholder')}
        keyboardType="phone-pad"
      />
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
  hint: {
    marginTop: -12,
    fontFamily: font.body,
    fontSize: 13,
    lineHeight: 19,
    color: color.gray500,
  },
});
