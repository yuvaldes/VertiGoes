import { Check, Phone, WarningCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { HELP_QUESTIONS, guidanceFor, type HelpAnswer } from '../data/helpFlow';
import { emergencyContact, type TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  /** Called once every question is answered, so the day record can be written. */
  onFinish: (answers: HelpAnswer[]) => void;
  onCallEmergencyContact: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/**
 * The in-app help flow: one yes/no question per step, then guidance.
 *
 * A pushed screen rather than a sheet because it is multi-step and the user may be mid-episode —
 * a full screen with two large targets is easier to hit than a sheet with small controls.
 *
 * The answers are written on completion, not per step, so an abandoned flow leaves no partial
 * record on the calendar.
 */
export function HelpFlowScreen({
  onBack,
  onFinish,
  onCallEmergencyContact,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const [answers, setAnswers] = useState<HelpAnswer[]>([]);

  const step = answers.length;
  const done = step >= HELP_QUESTIONS.length;
  const question = done ? null : HELP_QUESTIONS[step];

  const answer = (value: boolean) => {
    const next = [...answers, { questionId: HELP_QUESTIONS[step].id, answer: value }];
    setAnswers(next);
    if (next.length === HELP_QUESTIONS.length) onFinish(next);
  };

  const back = () => {
    // Within the flow, back steps a question; from the first question it leaves.
    if (answers.length === 0) onBack();
    else setAnswers(answers.slice(0, -1));
  };

  const guidance = done ? guidanceFor(answers) : null;

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={t('flows.help.title')} onBack={back} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {question && (
          <>
            <Text style={styles.progress}>
              {t('flows.help.progress', { step: step + 1, total: HELP_QUESTIONS.length })}
            </Text>
            <Text style={[styles.question, displayFont]}>{t(question.textKey)}</Text>

            <View style={styles.answers}>
              <Pressable
                style={styles.answerButton}
                onPress={() => answer(true)}
                accessibilityRole="button"
              >
                <Text style={[styles.answerLabel, displayFont]}>{t('common.answer.yes')}</Text>
                <Ring radius={12} color={color.gray200} />
              </Pressable>
              <Pressable
                style={styles.answerButton}
                onPress={() => answer(false)}
                accessibilityRole="button"
              >
                <Text style={[styles.answerLabel, displayFont]}>{t('common.answer.no')}</Text>
                <Ring radius={12} color={color.gray200} />
              </Pressable>
            </View>
          </>
        )}

        {guidance && (
          <>
            <View style={styles.resultHeader}>
              {guidance.urgent ? (
                <WarningCircle size={24} weight="fill" color={color.error500} />
              ) : (
                <Check size={24} weight="bold" color={color.success500} />
              )}
              <Text
                style={[
                  styles.resultTitle,
                  displayFont,
                  { color: guidance.urgent ? color.error500 : color.gray900 },
                ]}
              >
                {t(guidance.titleKey)}
              </Text>
            </View>

            <View style={styles.steps}>
              {guidance.stepKeys.map((stepKey, index) => (
                <View key={stepKey} style={styles.step}>
                  <View style={[styles.stepIndex, guidance.urgent && styles.stepIndexUrgent]}>
                    <Text
                      style={[
                        styles.stepIndexLabel,
                        guidance.urgent && styles.stepIndexLabelUrgent,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.stepLabel}>{t(stepKey)}</Text>
                </View>
              ))}
            </View>

            {/* Only offered when the answers actually warrant it. */}
            {guidance.urgent && (
              <Pressable
                style={styles.call}
                onPress={onCallEmergencyContact}
                accessibilityRole="button"
              >
                <Phone size={18} weight="fill" color={color.white} />
                <Text style={styles.callLabel}>
                  {t('flows.help.callContact', {
                    name: emergencyContact.name,
                    relationship: t(emergencyContact.relationshipKey),
                  })}
                </Text>
              </Pressable>
            )}

            <Pressable style={styles.done} onPress={onBack} accessibilityRole="button">
              <Text style={styles.doneLabel}>{t('flows.help.done')}</Text>
            </Pressable>

            <Text style={styles.recorded}>{t('flows.help.recorded')}</Text>
          </>
        )}
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
    marginTop: 16,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 12,
  },
  progress: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray400,
  },
  question: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.black,
  },
  answers: {
    marginTop: 8,
    gap: 12,
  },
  /** Deliberately large — the user may be dizzy while tapping these. */
  answerButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  answerLabel: {
    fontFamily: font.display,
    fontSize: 18,
    color: color.gray900,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.display,
    fontSize: 20,
    lineHeight: 27,
  },
  steps: {
    marginTop: 4,
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexUrgent: {
    backgroundColor: color.error50,
  },
  stepIndexLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    color: color.brand500,
  },
  stepIndexLabelUrgent: {
    color: color.error500,
  },
  stepLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray900,
  },
  call: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: color.error500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.white,
  },
  done: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.white,
  },
  recorded: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray400,
    textAlign: 'center',
  },
});
