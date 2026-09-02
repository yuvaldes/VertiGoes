import { ArrowRight } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Tip } from '../../data/tips';
import { useDirection, useT } from '../../i18n';
import { color, font } from '../../theme/tokens';
import { Ring } from '../Ring';
import { CARD_WIDTH, WEB_SNAP_CARD } from './carousel';

/** Every fact card shares one tint — unlike the old insight/progress/coach cards, they are all
 * the same kind of thing, so there is no second hue to tell them apart by. */
const TINT = color.turquoise600;

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
 *
 * The headline slot holds the fact's emoji rather than a sentence — "Did you know" already
 * says what every card is, so it lives once in the eyebrow instead of repeating on each one.
 */
export function TipCard({ tip, height, onPress }: Props) {
  const t = useT();
  const { isRTL } = useDirection();
  const actionable = tip.action !== undefined && onPress !== undefined;

  const body = t(tip.bodyKey);

  return (
    <Pressable
      style={[styles.card, { height }, WEB_SNAP_CARD]}
      onPress={actionable ? onPress : undefined}
      disabled={!actionable}
      accessibilityRole={actionable ? 'button' : 'text'}
      accessibilityLabel={`${t('ui.tips.eyebrow.fact')}. ${body}`}
    >
      <Text style={[styles.eyebrow, { color: TINT }]}>{t('ui.tips.eyebrow.fact')}</Text>

      <Text style={styles.emoji}>{tip.emoji}</Text>

      {/* Stands where the chart stands on the status card, so the two share a baseline however
          long the copy runs. */}
      <View style={styles.block}>
        <Text style={styles.body} numberOfLines={actionable ? 2 : 3}>
          {body}
        </Text>

        {actionable && (
          <View style={styles.action}>
            <Text style={[styles.actionLabel, { color: TINT }]}>{t('ui.tips.open')}</Text>
            {/* The arrow points the way reading runs, so it flips with the language. */}
            <ArrowRight size={13} color={TINT} style={isRTL ? styles.arrowFlipped : undefined} />
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
  emoji: {
    fontSize: 16,
    lineHeight: 19,
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
