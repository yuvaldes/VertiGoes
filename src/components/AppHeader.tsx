import type { ReactNode } from 'react';
import { View } from 'react-native';

import { BRAND_ROW_GAP, BRAND_ROW_HEIGHT } from './BrandRow';
import { frame } from '../theme/tokens';

type Props = {
  /** The row that used to sit beneath the brand row — a greeting, or a back button and title. */
  children?: ReactNode;
  /**
   * Space between the fixed brand row and this screen's own header content. The default suits
   * a title row; Home's newer layout opens on a 24 gap instead, and passes it through.
   */
  gap?: number;
};

/**
 * Reserves the space the fixed brand row occupies, then renders this screen's own row below it.
 *
 * The wordmark itself is rendered exactly once, by `AppShell`, positioned fixed on top of
 * every screen — including mid-slide during a push/pop — so it can never drift or animate.
 * This is what every screen renders instead: the same top offset as before, minus the logo,
 * which keeps every screen's own header content (greeting, back button, title) sitting exactly
 * where it always did without needing to know the logo moved out from under it.
 *
 * Works both inside a ScrollView (Home, Edit — this content scrolls, the fixed logo above it
 * does not) and above one (Calendar, Liv — this content is pinned too), because it only
 * contributes padding.
 */
export function AppHeader({ children, gap = BRAND_ROW_GAP }: Props) {
  return (
    <View style={{ paddingTop: frame.headerTop + BRAND_ROW_HEIGHT + gap }}>{children}</View>
  );
}
