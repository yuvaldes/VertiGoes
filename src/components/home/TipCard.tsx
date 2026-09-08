import { StyleSheet, Text, View } from 'react-native';

import type { Tip } from '../../data/tips';
import { useT } from '../../i18n';
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
};

/**
 * A card in the Home strip, built to the status card's own layout: eyebrow, display headline,
 * then a block the height the week chart occupies. Matching it beat inventing a second card
 * shape, because the two sit in one scrolling row and any difference reads as a mistake.
 *
 * The headline slot holds the fact's emoji rather than a sentence — "Did you know" already
 * says what every card is, so it lives once in the eyebrow instead of repeating on each one.
 *
 * Purely informational: unlike the old insight/coach cards, nothing here opens another screen.
 */
export function TipCard({ tip, height }: Props) {
  const t = useT();
  const body = t(tip.bodyKey);

  return (
    <View
      style={[styles.card, { height }, WEB_SNAP_CARD]}
      accessibilityRole="text"
      accessibilityLabel={`${t('ui.tips.eyebrow.fact')}. ${body}`}
    >
      <Text style={[styles.eyebrow, { color: TINT }]}>{t('ui.tips.eyebrow.fact')}</Text>

      <Text style={styles.emoji}>{tip.emoji}</Text>

      {/* Stands where the chart stands on the status card, so the two share a baseline however
          long the copy runs. */}
      <View style={styles.block}>
        <Text style={styles.body} numberOfLines={2}>
          {body}
        </Text>
      </View>

      <Ring radius={16} color={color.gray100} />
    </View>
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
});
