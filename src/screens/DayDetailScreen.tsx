import {
  CheckCircle,
  Moon,
  MoonStars,
  Phone,
  Play,
  Sparkle,
  Sun,
  SunHorizon,
  WarningCircle,
} from 'phosphor-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ChatBubble } from '../components/liv/ChatBubble';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import { SLOT_LABEL_KEY, SLOT_ORDER, fromKey, type ExerciseSlot } from '../data/dayRecords';
import { helpQuestionById } from '../data/helpFlow';
import { emergencyContact, type TabKey } from '../data/home';
import { useDateFormat, useDisplayFont, useT } from '../i18n';
import { useDayRecords } from '../state/DayRecordsContext';
import { useLivChat } from '../state/LivChatContext';
import { color, font, frame } from '../theme/tokens';

type Props = {
  /** 'YYYY-MM-DD' */
  date: string;
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

const SLOT_ICON: Record<ExerciseSlot, typeof Sun> = {
  morning: Sun,
  midday: SunHorizon,
  evening: Moon,
};

/**
 * Everything recorded on one day, reached from the caret on the calendar's day title.
 *
 * This is where the two loose ends from the calendar land: the in-app help breakdown that
 * was a stub, and the day's Liv conversation — which is why the transcript is rendered here
 * in full rather than only summarised.
 */
export function DayDetailScreen({ date, onBack, activeTab, onChangeTab }: Props) {
  const t = useT();
  const dateFormat = useDateFormat();
  const { getRecord } = useDayRecords();
  const { getThread } = useLivChat();

  const record = getRecord(date);
  const thread = getThread(date);
  const messages = thread?.messages ?? [];

  const slots = record ? SLOT_ORDER.filter((slot) => record.exercises[slot]) : [];
  const hasAnything =
    Boolean(record) &&
    (record!.episodes > 0 ||
      record!.emergencyCall ||
      record!.inAppHelp !== null ||
      record!.sleepHours !== null ||
      record!.liv !== null ||
      slots.length > 0 ||
      messages.length > 0);

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={dateFormat.longDate(fromKey(date))} onBack={onBack} />
        </AppHeader>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!hasAnything && <Text style={styles.empty}>{t('home.dayDetail.empty')}</Text>}

        {/* What happened, most serious first — the same order as the calendar's titles. */}
        {record?.emergencyCall && (
          <Section
            icon={<Phone size={20} weight="fill" color={color.error500} />}
            title={t('home.dayDetail.emergencyTitle')}
          >
            <Text style={styles.body14}>
              {t('home.dayDetail.emergencyContact', {
                name: emergencyContact.name,
                relationship: t(emergencyContact.relationshipKey),
                phone: emergencyContact.phone,
              })}
            </Text>
          </Section>
        )}

        {record && record.episodes > 0 && (
          <Section
            icon={<WarningCircle size={20} color={color.orange500} />}
            title={t(
              record.episodes === 1
                ? 'home.dayDetail.episodes.one'
                : 'home.dayDetail.episodes.other',
              { count: record.episodes },
            )}
          />
        )}

        {record?.inAppHelp && (
          <Section
            icon={<Sparkle size={20} weight="fill" color={color.brand500} />}
            title={t('home.dayDetail.helpTitle')}
          >
            {/* Every question with the answer given, so a session can be reviewed later. */}
            <View style={styles.steps}>
              {record.inAppHelp.answers.map(({ questionId, answer }) => {
                // A stored session outlives the question set, so an id we can no longer
                // name has nothing to show and is dropped rather than printed raw.
                const question = helpQuestionById(questionId);
                if (!question) return null;
                return (
                  <View key={questionId} style={styles.answerRow}>
                    <Text style={styles.answerQuestion}>{t(question.textKey)}</Text>
                    <Text style={[styles.answerValue, answer && styles.answerValueYes]}>
                      {answer ? t('common.answer.yes') : t('common.answer.no')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {slots.length > 0 && (
          <Section
            icon={<Play size={20} color={color.black} />}
            title={t('home.dayDetail.exercisesTitle')}
          >
            <View style={styles.slots}>
              {slots.map((slot) => {
                const Icon = SLOT_ICON[slot];
                const progress = record!.exercises[slot]!;
                const complete = progress.done >= progress.total;
                return (
                  <View key={slot} style={styles.slotRow}>
                    <Icon size={24} color={color.black} />
                    <Text style={styles.slotLabel}>{t(SLOT_LABEL_KEY[slot])}</Text>
                    <Text style={[styles.slotCount, complete && styles.slotCountDone]}>
                      {progress.done}/{progress.total}
                    </Text>
                    {complete && <CheckCircle size={14} weight="fill" color={color.success500} />}
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {record?.sleepHours != null && (
          <Section
            icon={<MoonStars size={20} color={color.black} />}
            title={t('home.dayDetail.sleptHours', { hours: record.sleepHours })}
          />
        )}

        {(messages.length > 0 || record?.liv) && (
          <Section
            icon={<Sparkle size={20} color={color.black} />}
            title={t('home.dayDetail.livTitle')}
          >
            {messages.length > 0 ? (
              // The full transcript, read-only — there is no composer on a past day.
              <View style={styles.thread}>
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </View>
            ) : (
              // A day can have a summary without a transcript: the seeded history carries
              // summaries only. Falling back keeps this screen consistent with the calendar,
              // which is already showing that summary.
              <Text style={styles.body14}>{record!.liv!.summary}</Text>
            )}
          </Section>
        )}
      </ScrollView>

      <BottomBarSlot />
    </View>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  const displayFont = useDisplayFont();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, displayFont]}>{title}</Text>
      </View>
      {children}
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
    marginTop: 8,
  },
  content: {
    paddingHorizontal: frame.gutter,
    paddingBottom: 24,
    gap: 24,
  },
  empty: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray500,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  body14: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray700,
    // Indents past the 20px section icon and its 4 gap, so it tracks the leading edge.
    paddingStart: 24,
  },
  steps: {
    gap: 8,
    paddingStart: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  answerQuestion: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray700,
  },
  answerValue: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray500,
  },
  answerValueYes: {
    color: color.brand500,
  },
  slots: {
    gap: 10,
    paddingStart: 24,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray900,
  },
  slotCount: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray500,
  },
  slotCountDone: {
    color: color.success500,
  },
  thread: {
    gap: 12,
  },
});
