import { Platform, type ViewStyle } from 'react-native';

import { frame } from '../../theme/tokens';

/** Shared metrics and platform shims for the Home carousel, in one place so the strip, the
 *  cards and the snap offsets cannot drift apart. Its own module rather than the carousel's,
 *  because the cards need it too and importing it back off the carousel would be a cycle. */

/** Gap between cards, and therefore part of the distance the strip snaps by. */
export const CARD_GAP = 12;

/**
 * Every card is the full content width - the status card's width, which the week chart's seven
 * columns need and which the page's other blocks already line up with.
 *
 * One width for all of them means the strip is a pager: one card on screen at a time, each
 * landing in exactly the same place. It also leaves no room for the next card to peek, which
 * is why the strip carries page dots.
 */
export const CARD_WIDTH = frame.width - frame.gutter * 2;

/**
 * What the status card measures with a one-line headline:
 * `12 top + 12 eyebrow + 8 + 19 headline + 8 + 56 chart + 8 bottom`.
 *
 * Only the starting value. The strip measures the real status card and matches every other
 * card to it, because a two-line headline is a line taller and Hebrew wraps differently from
 * English - hardcoding either language's height would leave the other ragged.
 */
export const DEFAULT_CARD_HEIGHT = 123;

/**
 * CSS scroll-snap for the strip, web only.
 *
 * `snapToOffsets` is a native-only prop: react-native-web accepts it and emits nothing, so the
 * web build free-scrolled while a device snapped. These supply the CSS equivalent, which works
 * the stops out from the children themselves and so copes with the mixed card widths without
 * the offsets being restated.
 */
export const WEB_SNAP_STRIP = (
  Platform.OS === 'web'
    ? ({
        scrollSnapType: 'x mandatory',
        // Snapping aligns a card to the scrollport edge, which is inside the content padding -
        // so without this the browser parks the first card hard against the frame and eats the
        // gutter. `inline-start` rather than `left`, so it follows the language.
        scrollPaddingInlineStart: `${frame.gutter}px`,
      } as object)
    : null
) as ViewStyle | null;

export const WEB_SNAP_CARD = (
  Platform.OS === 'web' ? ({ scrollSnapAlign: 'start' } as object) : null
) as ViewStyle | null;
