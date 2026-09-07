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
import {
  initialOnboardingAnswers,
  ONBOARDING_STEP_COUNT,
  type OnboardingAnswers,
} from '../data/onboarding';
import { useT } from '../i18n';
import { color, frame, font } from '../theme/tokens';
import { OnboardingBasicInfoStep } from './OnboardingBasicInfoStep';
import { OnboardingDiagnosisStep } from './OnboardingDiagnosisStep';
import { OnboardingEmergencyContactStep } from './OnboardingEmergencyContactStep';
import { OnboardingMedicalHistoryStep } from './OnboardingMedicalHistoryStep';

type Props = {
  /**
   * Which of the two runs this is, stated by the caller rather than inferred from the session.
   * `setup` is the first run straight after sign-up: it can be skipped, which leaves onboarding
   * pending rather than dismissed. `edit` is reopening a finished profile from the Menu, where
   * there is nothing to skip — the answers already exist and the user came here on purpose.
   */
  mode: 'setup' | 'edit';
  /** The answers on file, seeding an `edit` run. Absent starts the wizard empty. */
  initialAnswers?: OnboardingAnswers | null;
  onBack: () => void;
  onComplete: (answers: OnboardingAnswers) => void;
  /**
   * `setup` only. Leaves the questions pending so the Menu can offer them again. Carries the
   * step they backed out on, so the Menu can show how far they got.
   */
  onSkip: (step: number) => void;
};

/**
 * The onboarding flow: basic info, medical history, an optional diagnosis questionnaire, then
 * an emergency contact. A self-contained wizard rather than a pushed tab screen — it has no
 * bottom bar and owns its own Back/Continue footer, since it runs ahead of the app proper
 * rather than alongside it.
 *
 * Answers live as one object in this container and are only handed off on `onComplete` — same
 * "write on finish, not per field" rule as `HelpFlowScreen`, so an abandoned flow leaves nothing
 * half-saved anywhere else in the app. Skipping therefore keeps nothing either: resuming from
 * the Menu restarts at step 0, which is honest about what a half-answered form is worth.
 *
 * The skip control sits in the header on every step, not only the first. Someone who opened
 * this app because they are dizzy has to be able to leave at any point; a way out you can only
 * find on page one is a way out you cannot find once you are three pages in. It reads as chrome
 * rather than as an equal-weight peer of Continue, which is right — finishing is what we want.
 */
export function OnboardingScreen({
  mode,
  initialAnswers,
  onBack,
  onComplete,
  onSkip,
}: Props) {
  const t = useT();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(
    initialAnswers ?? initialOnboardingAnswers,
  );

  const canSkip = mode === 'setup';

  const patch = (partial: Partial<OnboardingAnswers>) =>
    setAnswers((current) => ({ ...current, ...partial }));

  const back = () => {
    if (step > 0) setStep(step - 1);
    // Backing out of the first run is skipping it, whatever control they used to do it —
    // otherwise the status stays `pending` and the shell pushes this screen straight back.
    else if (canSkip) onSkip(step);
    else onBack();
  };

  const isLastStep = step === ONBOARDING_STEP_COUNT - 1;
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
              {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) => (
                <View
                  key={index}
                  style={[styles.segment, index <= step && styles.segmentFilled]}
                />
              ))}
            </View>
            {canSkip && (
              <Pressable
                style={styles.skip}
                onPress={() => onSkip(step)}
                accessibilityRole="button"
                accessibilityLabel={t('auth.onboarding.a11ySkip')}
              >
                <Text style={styles.skipLabel}>{t('auth.onboarding.skip')}</Text>
              </Pressable>
            )}
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
  /** Fills the header's 32pt row so the tap target is the full height of the chrome. */
  skip: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  skipLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray600,
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
