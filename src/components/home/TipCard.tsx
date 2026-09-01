import { ArrowRight } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Tip, TipTone } from '../../data/tips';
import { useDirection, useDisplayFont, useT } from '../../i18n';
import { color, font } from '../../theme/tokens';
import { Ring } from '../Ring';
import { CARD_WIDTH, WEB_SNAP_CARD } from './carousel';

type ToneStyle = {
  tint: string;
  eyebrowKey: 'insight' | 'progress' | 'coach';
};

/**
 * One hue per kind, reusing ramps the task cards already established: turquoise reads as an
 * observation, green as something going well, brand blue as an instruction.
 *
 * The hue is stated in the eyebrow and nowhere else. Surface and border are the status card's,
 * because the cards sit in one strip and swapping the fill under them made each page look like
 * a different component rather than the next page of the same one.
 */
const TONES: Record<TipTone, ToneStyle> = {
  insight: { tint: color.turquoise600, eyebrowKey: 'insight' },
  progress: { tint: color.success500, eyebrowKey: 'progress' },
  coach: { tint: color.brand600, eyebrowKey: 'coach' },
};

type Props = {
  tip: Tip;
  /** Measured off the status card, so every card in the strip is exactly as tall as it is. */
  height: number;
  /** Only passed for cards that carry an action; a card without one is not pressable. */
  onPress?: () => void;
};

/**
 * A card in the Home strip, built to the status card's own layout: eyebrow, display headline,
 * then a block the height the week chart occupies. Matching it beat inventing a second card
 * shape, because the two sit in one scrolling row and any difference reads as a mistake.
 */
export function TipCard({ tip, height, onPress }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { isRTL } = useDirection();
  const tone = TONES[tip.tone];
  const actionable = tip.action !== undefined && onPress !== undefined;

  const title = t(tip.titleKey, tip.params);
  const body = t(tip.bodyKey, tip.params);

  return (
    <Pressable
      style={[styles.card, { height }, WEB_SNAP_CARD]}
      onPress={actionable ? onPress : undefined}
      disabled={!actionable}
      accessibilityRole={actionable ? 'button' : 'text'}
      accessibilityLabel={`${t(`ui.tips.eyebrow.${tone.eyebrowKey}`)}. ${title}. ${body}`}
    >
      <Text style={[styles.eyebrow, { color: tone.tint }]}>
        {t(`ui.tips.eyebrow.${tone.eyebrowKey}`)}
      </Text>

      <Text style={[styles.title, displayFont]} numberOfLines={1}>
        {title}
      </Text>

      {/* Stands where the chart stands on the status card, so the two share a baseline however
          long the copy runs. */}
      <View style={styles.block}>
        <Text style={styles.body} numberOfLines={actionable ? 2 : 3}>
          {body}
        </Text>

        {actionable && (
          <View style={styles.action}>
            <Text style={[styles.actionLabel, { color: tone.tint }]}>{t('ui.tips.open')}</Text>
            {/* The arrow points the way reading runs, so it flips with the language. */}
            <ArrowRight
              size={13}
              color={tone.tint}
              style={isRTL ? styles.arrowFlipped : undefined}
            />
          </View>
        )}
      </View>

      <Ring radius={16} color={color.gray100} />
    </Pressable>
  );
}

/** Every metric below is the status card's, so the two line up rule for rule. */
const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: color.white,
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 12,
    gap: 8,
    overflow: 'hidden',
  },
  eyebrow: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: font.display,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
  },
  /** The chart's 56, filled with copy instead of bars. */
  block: {
    height: 56,
    justifyContent: 'space-between',
  },
  body: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 17,
    color: color.gray600,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  /** Mirrored rather than swapped for a left-pointing icon: same glyph, same optical weight. */
  arrowFlipped: {
    transform: [{ scaleX: -1 }],
  },
});
