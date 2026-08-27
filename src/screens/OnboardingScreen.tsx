import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BackButton } from '../components/BackButton';
import { initialOnboardingAnswers, type OnboardingAnswers } from '../data/onboarding';
import { useT } from '../i18n';
import { color, frame, font } from '../theme/tokens';
import { OnboardingBasicInfoStep } from './OnboardingBasicInfoStep';
import { OnboardingDiagnosisStep } from './OnboardingDiagnosisStep';
import { OnboardingEmergencyContactStep } from './OnboardingEmergencyContactStep';
import { OnboardingMedicalHistoryStep } from './OnboardingMedicalHistoryStep';

type Props = {
  onBack: () => void;
  onComplete: (answers: OnboardingAnswers) => void;
};

const STEP_COUNT = 4;

/**
 * The onboarding flow: basic info, medical history, an optional diagnosis questionnaire, then
 * an emergency contact. A self-contained wizard rather than a pushed tab screen — it has no
 * bottom bar and owns its own Back/Continue footer, since it runs ahead of the app proper
 * rather than alongside it.
 *
 * Answers live as one object in this container and are only handed off on `onComplete` — same
 * "write on finish, not per field" rule as `HelpFlowScreen`, so an abandoned flow leaves nothing
 * half-saved anywhere else in the app.
 */
export function OnboardingScreen({ onBack, onComplete }: Props) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialOnboardingAnswers);

  const patch = (partial: Partial<OnboardingAnswers>) =>
    setAnswers((current) => ({ ...current, ...partial }));

  const back = () => {
    if (step === 0) onBack();
    else setStep(step - 1);
  };

  const isLastStep = step === STEP_COUNT - 1;
  // Age is the only field the source spec marks required; everything else is free to skip.
  const canContinue = step !== 0 || answers.age.trim().length > 0;

  const continueOrFinish = () => {
    if (isLastStep) onComplete(answers);
    else setStep(step + 1);
  };

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <View style={styles.topRow}>
            <BackButton onPress={back} />
            <View style={styles.progressTrack}>
              {Array.from({ length: STEP_COUNT }, (_, index) => (
                <View
                  key={index}
                  style={[styles.segment, index <= step && styles.segmentFilled]}
                />
              ))}
            </View>
          </View>
        </AppHeader>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <OnboardingBasicInfoStep answers={answers} patch={patch} />}
          {step === 1 && <OnboardingMedicalHistoryStep answers={answers} patch={patch} />}
          {step === 2 && <OnboardingDiagnosisStep answers={answers} patch={patch} />}
          {step === 3 && <OnboardingEmergencyContactStep answers={answers} patch={patch} />}
        </ScrollView>

        <View style={styles.gutter}>
          <Pressable
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={continueOrFinish}
            disabled={!canContinue}
            accessibilityRole="button"
          >
            <Text style={styles.continueLabel}>
              {isLastStep ? t('flows.onboarding.finish') : t('flows.onboarding.continue')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 32,
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: color.gray200,
  },
  segmentFilled: {
    backgroundColor: color.brand500,
  },
  scroll: {
    flex: 1,
    marginTop: 16,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
  },
  continueButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: color.gray200,
  },
  continueLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 15,
    color: color.white,
  },
});
