import {
  CaretLeft,
  CaretRight,
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
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SLOT_ORDER, type DayRecord, type ExerciseSlot } from '../../data/dayRecords';
import { useDirection, useDisplayFont, useT, type TKey } from '../../i18n';
import { color, font } from '../../theme/tokens';
import { Ring } from '../Ring';

type Props = {
  record: DayRecord | undefined;
  onOpenConversation: () => void;
  onShowExercises: () => void;
  /** Opens the full day — everything recorded, including the Liv transcript. */
  onOpenDay: () => void;
};

type TitleLine = {
  key: string;
  icon: React.ReactNode;
  text: string;
  tint: string;
};

const SLOT_ICON: Record<ExerciseSlot, typeof Sun> = {
  morning: Sun,
  midday: SunHorizon,
  evening: Moon,
};

/**
 * The same three words `data.slot.*` holds. Keyed here rather than read off the data module,
 * so the breakdown keeps rendering whatever shape that module settles on for its labels.
 */
const SLOT_LABEL_KEY: Record<ExerciseSlot, TKey> = {
  morning: 'ui.dayBreakdown.slotMorning',
  midday: 'ui.dayBreakdown.slotMidday',
  evening: 'ui.dayBreakdown.slotEvening',
};

/**
 * What was recorded on the selected day (Figma node 7338:215769).
 *
 * The design only draws the "You had 1 episode" title. Per the agreed behaviour the
 * titles stack — one line per thing that happened — so the emergency-call, no-episode and
 * in-app-help lines are derived from the existing palette and want design review.
 */
export function DayBreakdown({ record, onOpenConversation, onShowExercises, onOpenDay }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { isRTL } = useDirection();
  /** Points the way the day opens, which is the reading direction. */
  const CaretForward = isRTL ? CaretLeft : CaretRight;

  const episodes = record?.episodes ?? 0;
  const slots = record ? SLOT_ORDER.filter((slot) => record.exercises[slot]) : [];

  // Built as a list so the caret can go on the first line only. One caret per stacked title
  // would be three affordances pointing at the same screen.
  const titles: TitleLine[] = [];
  if (record?.emergencyCall) {
    titles.push({
      key: 'emergency',
      icon: <Phone size={20} weight="fill" color={color.error500} />,
      text: t('ui.dayBreakdown.emergencyCall'),
      tint: color.error500,
    });
  }
  titles.push(
    episodes > 0
      ? {
          key: 'episodes',
          icon: <WarningCircle size={20} color={color.orange500} />,
          text: t(
            episodes === 1 ? 'ui.dayBreakdown.episodesOne' : 'ui.dayBreakdown.episodesOther',
            { count: episodes },
          ),
          tint: color.orange500,
        }
      : {
          key: 'no-episodes',
          icon: <CheckCircle size={20} color={color.success500} />,
          text: t(record ? 'ui.dayBreakdown.noRecordedEpisodes' : 'home.dayDetail.empty'),
          tint: color.success500,
        },
  );
  if (record?.inAppHelp) {
    titles.push({
      key: 'help',
      icon: <Sparkle size={20} weight="fill" color={color.brand500} />,
      text: t('ui.dayBreakdown.inAppHelp'),
      tint: color.brand500,
    });
  }

  return (
    <View style={styles.root}>
      {/* Titles, most severe first. The first one opens the day in full. */}
      {titles.map((line, index) =>
        index === 0 ? (
          <Pressable
            key={line.key}
            style={styles.titleRow}
            onPress={onOpenDay}
            accessibilityRole="button"
            accessibilityLabel={t('ui.dayBreakdown.a11yOpenDay', { line: line.text })}
          >
            {line.icon}
            <Text style={[styles.title, displayFont, styles.titleLink, { color: line.tint }]}>
              {line.text}
            </Text>
            <CaretForward size={16} color={line.tint} />
          </Pressable>
        ) : (
          <View key={line.key} style={styles.titleRow}>
            {line.icon}
            <Text style={[styles.title, displayFont, { color: line.tint }]}>{line.text}</Text>
          </View>
        ),
      )}

      {/* Liv summary */}
      {record?.liv && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Sparkle size={20} color={color.black} />
              <Text style={[styles.sectionTitle, displayFont]}>
                {t('ui.dayBreakdown.livHeading')}
              </Text>
            </View>
            <Pressable onPress={onOpenConversation} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>{t('ui.dayBreakdown.openConversation')}</Text>
            </Pressable>
          </View>

          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{record.liv.summary}</Text>
            <Ring radius={16} color={color.brand100} />
          </View>
        </View>
      )}

      {/* Exercises */}
      {slots.length > 0 && (
        <View style={styles.exercisesSection}>
          <View style={styles.exercisesHeader}>
            <View style={styles.exercisesHeaderLeft}>
              <Play size={20} color={color.black} />
              <Text style={[styles.sectionTitle, displayFont]}>
                {t('ui.dayBreakdown.exercisesHeading')}
              </Text>
            </View>
            <Pressable onPress={onShowExercises} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>{t('ui.dayBreakdown.showExercises')}</Text>
            </Pressable>
          </View>

          {/* Deliberately full-bleed — the slot row has no horizontal padding in Figma. */}
          <View style={styles.slotRow}>
            {slots.map((slot) => {
              const Icon = SLOT_ICON[slot];
              const progress = record!.exercises[slot]!;
              return (
                <View key={slot} style={styles.slot}>
                  <Icon size={32} color={color.black} />
                  <View style={styles.slotLabelRow}>
                    <Text style={styles.slotLabel}>{t(SLOT_LABEL_KEY[slot])}</Text>
                    <Text style={styles.slotLabel}>
                      {progress.done}/{progress.total}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Sleep */}
      {record?.sleepHours != null && (
        <View style={styles.sleepRow}>
          <MoonStars size={20} color={color.black} />
          <Text style={[styles.sectionTitle, displayFont]}>
            {t('ui.dayBreakdown.sleptHours', { hours: record.sleepHours })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
  },
  /** Pushes the caret to the trailing edge on the tappable line. */
  titleLink: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    gap: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  /** Liv's header uses an 8px gap after the icon (Figma "Frame 83"). */
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** The exercises header uses 4, not 8 (Figma "Frame 86") — easy to conflate. */
  exercisesHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
  link: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.brand500,
  },
  /**
   * Radius 16 except the bottom corner on the leading edge, which tapers to 4 like a chat
   * bubble. Logical rather than left/right so the tail stays on the side Liv speaks from.
   */
  bubble: {
    backgroundColor: color.brand50,
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    borderBottomEndRadius: 16,
    borderBottomStartRadius: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleText: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 19,
    color: color.black,
  },
  exercisesSection: {
    gap: 8,
  },
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slot: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  slotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  slotLabel: {
    fontFamily: font.body,
    fontSize: 12,
    color: color.black,
    textAlign: 'center',
  },
  sleepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
});
