import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '../assets/Logo';

/** Height of the row, and the gap `AppHeader` leaves for it below `AppShell`'s fixed copy. */
export const BRAND_ROW_HEIGHT = 32;
export const BRAND_ROW_GAP = 12;

type Props = {
  /** Trailing content pushed to the far right, e.g. Home's date + calendar button. */
  trailing?: ReactNode;
};

/**
 * The wordmark. Figma "Frame 15" — 361 x 32 — which is identical on the Home frame
 * (7338:214835) and the edit frame (7338:215290); account settings live in the Menu tab
 * instead of a header button.
 *
 * Rendered exactly once, by `AppShell`, fixed above every screen — see the note there. Screens
 * never render this themselves; `AppHeader` just reserves the space for it. Purely decorative:
 * tapping it does nothing.
 */
export function BrandRow({ trailing }: Props) {
  return (
    <View style={styles.row}>
      <Logo />
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BRAND_ROW_HEIGHT,
  },
  trailing: {
    // Pushed to the far end of the row, whichever end that is.
    marginStart: 'auto',
  },
});
