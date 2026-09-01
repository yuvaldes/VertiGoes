import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { WeekBar } from '../../data/dayRecords';
import type { Tip } from '../../data/tips';
import { useT } from '../../i18n';
import { color, frame } from '../../theme/tokens';
import {
  CARD_GAP,
  CARD_WIDTH,
  DEFAULT_CARD_HEIGHT,
  WEB_SNAP_CARD,
  WEB_SNAP_STRIP,
} from './carousel';
import { TipCard } from './TipCard';
import { WeeklyStatusCard } from './WeeklyStatusCard';

/** One card plus the gap after it: the distance a single page turn covers. */
const PAGE = CARD_WIDTH + CARD_GAP;

type Props = {
  headline: string;
  week: WeekBar[];
  tips: Tip[];
  /** Where a card with the `exercises` action goes. */
  onOpenExercises: () => void;
};

/**
 * One horizontal strip: this week's status first, then the insight and coaching cards.
 *
 * The status card leads rather than sitting above because the two answer the same question at
 * different zoom levels - what happened, then what to do about it - and splitting them into a
 * fixed block and a scrolling one made the page read as two unrelated widgets.
 *
 * Every card is the same width and height as the status card, which makes this a pager rather
 * than a shelf: one card on screen at a time, each landing in the same place. That leaves no
 * sliver of the next card showing, so the dots underneath carry the "there is more" signal the
 * peek used to.
 *
 * Full-bleed on purpose: it cancels the page gutter with a negative margin and restores it as
 * content padding, so the cards line up with everything else on the page while the strip runs
 * to both screen edges.
 *
 * Direction needs no special handling. The row reverses under RTL like any other, and both
 * platforms start a horizontal scroll view at the leading edge, so the status card sits where
 * reading begins in either language.
 */
export function HomeCarousel({ headline, week, tips, onOpenExercises }: Props) {
  const t = useT();

  /**
   * Measured rather than assumed. The status card sizes itself to its headline, which is one
   * line in English and can be two in Hebrew, so the only way every card matches it in both
   * languages is to read its height back and hand that to the rest.
   */
  const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_HEIGHT);
  const [page, setPage] = useState(0);

  const pageCount = tips.length + 1;

  /**
   * Which card is in front. Derived from the offset rather than from a snap callback, because
   * the web build snaps in CSS and never fires one.
   */
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(Math.abs(event.nativeEvent.contentOffset.x) / PAGE);
    setPage(Math.min(Math.max(next, 0), pageCount - 1));
  };

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.strip, WEB_SNAP_STRIP]}
        contentContainerStyle={styles.content}
        // Uniform card widths, so one interval lands every card against the gutter.
        snapToInterval={PAGE}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        accessibilityLabel={t('ui.tips.a11yStrip', { count: pageCount })}
      >
        {/* Width fixed on the wrapper rather than in the card: `width: 100%` has nothing to
            resolve against inside a horizontally scrolling row. */}
        <View
          style={[styles.lead, WEB_SNAP_CARD]}
          onLayout={(event) => setCardHeight(event.nativeEvent.layout.height)}
        >
          <WeeklyStatusCard headline={headline} week={week} />
        </View>

        {tips.map((tip) => (
          <TipCard
            key={tip.id}
            tip={tip}
            height={cardHeight}
            onPress={tip.action === 'exercises' ? onOpenExercises : undefined}
          />
        ))}
      </ScrollView>

      {/* Decoration, not a control: the strip already announces itself, and a row of unlabelled
          dots would only add noise to a screen reader. */}
      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no">
        {Array.from({ length: pageCount }, (_, index) => (
          <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  /** Cancels the page gutter so the strip is full-bleed; the content padding puts it back. */
  strip: {
    marginHorizontal: -frame.gutter,
  },
  content: {
    paddingHorizontal: frame.gutter,
    // The shadow under each card is clipped by the scroll view's bounds without this.
    paddingVertical: 2,
    gap: CARD_GAP,
    // Cards carry their own height, so the row must not stretch them to the tallest - that
    // would defeat the measurement above the moment one card wrapped.
    alignItems: 'flex-start',
  },
  lead: {
    width: CARD_WIDTH,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.gray300,
  },
  dotActive: {
    backgroundColor: color.brand500,
  },
});
