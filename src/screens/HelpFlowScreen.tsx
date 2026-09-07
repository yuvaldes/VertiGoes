import { LinearGradient } from 'expo-linear-gradient';
import { Check, Phone, WarningCircle } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { LivAvatar } from '../components/liv/LivAvatar';
import { Ring } from '../components/Ring';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import {
  currentNodeFor,
  guidanceFor,
  HELP_START,
  type HelpAnswer,
  type HelpQuestionNode,
} from '../data/helpFlow';
import { emergencyContact, type TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { color, font, frame, shadow } from '../theme/tokens';

type Props = {
  onBack: () => void;
  /** Called once a full path is answered, so the day record can be written. */
  onFinish: (answers: HelpAnswer[]) => void;
  /**
   * Reports whether the flow is still asking. `AppShell` hides its wordmark and tab bar while
   * it is, because the question state is a full-bleed takeover; the guidance step is an
   * ordinary page and gets the chrome back.
   */
  onAskingChange: (asking: boolean) => void;
  onCallEmergencyContact: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/** Figma 484:10276 sizes Liv at 128 on this screen - far larger than the 64 she gets elsewhere. */
const AVATAR_SIZE = 128;

/**
 * A question is "yes/no" when it has exactly the two common answers, in that order — every Q0
 * safety-gate item, plus a handful of the tree's own questions. Everything else — three- and
 * four-way branches like "How did the dizziness start?" — gets the vertical choice list below.
 */
function isYesNo(question: HelpQuestionNode): boolean {
  return (
    question.options.length === 2 &&
    question.options[0].labelKey === 'common.answer.yes' &&
    question.options[1].labelKey === 'common.answer.no'
  );
}

/**
 * One of the two answer buttons: a full-width gradient pill, 84 tall with a 36pt label.
 *
 * Deliberately enormous. Every other button in the app is 48; these are the only controls a
 * user might be reaching for while the room is spinning, and the design trades all the page's
 * spare height for target size.
 */
function BigAnswer({
  label,
  from,
  to,
  border,
  onPress,
}: {
  label: string;
  from: string;
  to: string;
  border: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        // Pressing inverts the gradient. The button reads as lit from above at rest and from
        // below once held, which is the whole feedback here: at this size a tint or a scale
        // would be easy to miss, and these are the two controls that most need to feel
        // answered under a thumb.
        <LinearGradient
          colors={pressed ? ([to, from] as const) : ([from, to] as const)}
          style={styles.bigAnswer}
        >
          {/* Uppercase in the style rather than the string: Hebrew has no case, so the same key
              renders "YES" in English and an unchanged "כן" in Hebrew. */}
          <Text style={styles.bigAnswerLabel}>{label}</Text>
          <Ring radius={64} color={border} />
        </LinearGradient>
      )}
    </Pressable>
  );
}

/**
 * A choice in a three- or four-way question. Sized generously — this still reaches for the
 * "hittable while dizzy" goal the yes/no pair has, just without the room to be quite as huge
 * once there are more than two.
 */
function ChoiceAnswer({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      <Ring radius={20} color={color.gray200} />
    </Pressable>
  );
}

/**
 * The in-app help flow: a branching triage tree, one question at a time, then guidance.
 *
 * A pushed screen rather than a sheet because it is multi-step and the user may be mid-episode —
 * a full screen with large targets is easier to hit than a sheet with small controls.
 *
 * The answers are written on completion, not per step, so an abandoned flow leaves no partial
 * record on the calendar. "Completion" is reaching any outcome node rather than answering a
 * fixed count of questions — which node that is, and how many questions it took, depends on
 * the path the answers actually took through the tree.
 */
export function HelpFlowScreen({
  onBack,
  onFinish,
  onAskingChange,
  onCallEmergencyContact,
  activeTab,
  onChangeTab,
}: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const [answers, setAnswers] = useState<HelpAnswer[]>([]);

  const node = currentNodeFor(answers);
  const done = node.kind === 'outcome';
  const question = done ? null : node;
  const step = answers.length;

  const answer = (optionIndex: number) => {
    if (!question) return;
    const next = [...answers, { questionId: question.id, optionIndex }];
    setAnswers(next);
    if (currentNodeFor(next).kind === 'outcome') onFinish(next);
  };

  const back = () => {
    // Within the flow, back steps a question; from the first question it leaves.
    if (answers.length === 0) onBack();
    else setAnswers(answers.slice(0, -1));
  };

  const guidance = done ? guidanceFor(answers) : null;

  // Reported from an effect rather than during render: the shell re-renders on it, and the
  // back button can step from guidance back into a question, so it has to stay live.
  useEffect(() => {
    onAskingChange(!done);
  }, [done, onAskingChange]);

  /**
   * The question state is a full-screen takeover, per Figma 484:10276 - no wordmark, no tab
   * bar, no title row. Someone reaching this screen is mid-episode and possibly on the floor,
   * so the design gives the whole viewport to one sentence and controls big enough to hit
   * without aiming. `AppShell` hides its fixed chrome for this route.
   */
  if (question) {
    const yesNo = isYesNo(question);
    const progressLabel = `${t('flows.help.progress', { step: step + 1 })}. ${t(question.textKey)}`;

    return (
      <View style={styles.askBody}>
        <View style={styles.askTop}>
          {/* Liv, not a generic icon: the flow reads as her talking you through it. */}
          <LivAvatar size={AVATAR_SIZE} />

          <Pressable
            style={styles.cancel}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('common.action.cancel')}
          >
            <Text style={styles.cancelLabel}>{t('common.action.cancel')}</Text>
            <Ring radius={64} color={color.gray300} />
          </Pressable>
        </View>

        {yesNo ? (
          <>
            <View style={styles.askQuestionBlock}>
              {/* The step count is gone from the design, so it survives here - a screen reader
                  user would otherwise have no idea how far through the flow they are. */}
              <Text style={styles.askQuestion} accessibilityLabel={progressLabel}>
                {t(question.textKey)}
              </Text>
            </View>

            <View style={styles.askAnswers}>
              <BigAnswer
                label={t('common.answer.yes')}
                from={color.success500}
                to={color.success600}
                border={color.success600}
                onPress={() => answer(0)}
              />
              <BigAnswer
                label={t('common.answer.no')}
                from={color.orange500}
                to={color.orange600}
                border={color.orange600}
                onPress={() => answer(1)}
              />
            </View>
          </>
        ) : (
          // Three- and four-way branches don't fit the huge yes/no pair, and some of their
          // option text runs long — this scrolls instead of trying to cram everything in.
          <ScrollView
            style={styles.choicesScroll}
            contentContainerStyle={styles.choicesContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.askQuestionChoices} accessibilityLabel={progressLabel}>
              {t(question.textKey)}
            </Text>
            <View style={styles.choices}>
              {question.options.map((option, index) => (
                <ChoiceAnswer
                  key={index}
                  label={t(option.labelKey)}
                  onPress={() => answer(index)}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  const severity = guidance?.severity;
  const isEmergency = severity === 'emergency';
  const isUrgent = severity === 'urgent';
  const emphasised = isEmergency || isUrgent;

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
        {guidance && (
          <>
            <View style={styles.resultHeader}>
              {emphasised ? (
                <WarningCircle
                  size={24}
                  weight="fill"
                  color={isEmergency ? color.error500 : color.orange500}
                />
              ) : (
                <Check size={24} weight="bold" color={color.success500} />
              )}
              <Text
                style={[
                  styles.resultTitle,
                  displayFont,
                  emphasised && { color: isEmergency ? color.error500 : color.orange600 },
                ]}
              >
                {t(guidance.titleKey)}
              </Text>
            </View>

            <View style={styles.steps}>
              {guidance.stepKeys.map((stepKey, index) => (
                <View key={stepKey} style={styles.step}>
                  <View style={[styles.stepIndex, isEmergency && styles.stepIndexUrgent]}>
                    <Text style={[styles.stepIndexLabel, isEmergency && styles.stepIndexLabelUrgent]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.stepLabel}>{t(stepKey)}</Text>
                </View>
              ))}
            </View>

            {/* Reference detail for outcomes that have it — not shown for ER/unknown, where
                there's nothing yet to describe. */}
            {guidance.about && (
              <View style={styles.about}>
                <Text style={[styles.aboutTitle, displayFont]}>{t('flows.help.about.title')}</Text>

                <View style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{t('flows.help.about.whatIsLabel')}</Text>
                  <Text style={styles.aboutText}>{t(guidance.about.whatIsKey)}</Text>
                </View>

                <View style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{t('flows.help.about.symptomsLabel')}</Text>
                  <Text style={styles.aboutText}>{t(guidance.about.symptomsKey)}</Text>
                </View>

                <View style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{t('flows.help.about.treatmentLabel')}</Text>
                  <Text style={styles.aboutText}>{t(guidance.about.treatmentKey)}</Text>
                </View>
              </View>
            )}

            {/* Only offered when the flow actually escalated — `urgent` outcomes get a
                prominent warning, per the source doc, but don't route to the ER contact. */}
            {isEmergency && (
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
  /** Figma 484:10276 "homeScreen" - the question state's own full-bleed layout. */
  askBody: {
    flex: 1,
    backgroundColor: color.gray50,
    paddingTop: 8,
    paddingHorizontal: frame.gutter,
    paddingBottom: 8,
    gap: 12,
  },
  askTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 64,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  cancelLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: color.gray700,
  },
  /**
   * Takes the slack between Liv and the buttons. The sentence sits at the top of it, not
   * centred: the design lets the gap fall below the text so the reading always starts in the
   * same place, however long the question runs.
   */
  askQuestionBlock: {
    flex: 1,
    minHeight: 0,
    paddingVertical: 8,
  },
  askQuestion: {
    fontFamily: font.bodyMedium,
    fontSize: 30,
    lineHeight: 42,
    color: color.gray900,
  },
  askAnswers: {
    gap: 20,
  },
  bigAnswer: {
    padding: 20,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.xs,
  },
  bigAnswerLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.72,
    color: color.white,
    textTransform: 'uppercase',
  },
  /** The multi-choice branches: same slack-taking idea as `askQuestionBlock`, but scrollable. */
  choicesScroll: {
    flex: 1,
  },
  choicesContent: {
    paddingVertical: 8,
    gap: 20,
  },
  askQuestionChoices: {
    fontFamily: font.bodyMedium,
    fontSize: 26,
    lineHeight: 36,
    color: color.gray900,
  },
  choices: {
    gap: 12,
  },
  choice: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: color.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    ...shadow.xs,
  },
  choicePressed: {
    backgroundColor: color.brand50,
  },
  choiceLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 18,
    lineHeight: 25,
    color: color.gray900,
  },
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
  about: {
    marginTop: 16,
    padding: 16,
    // White on the screen's gray50 body, per the card treatment used elsewhere — the panel
    // was gray50 itself at first, which made it vanish into the page.
    borderRadius: 16,
    backgroundColor: color.white,
    gap: 12,
  },
  aboutTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  aboutRow: {
    gap: 2,
  },
  aboutLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.brand500,
    textTransform: 'uppercase',
  },
  aboutText: {
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
