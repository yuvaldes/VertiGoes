import { StyleSheet, View } from 'react-native';

import { Logo } from '../assets/Logo';

/** Height of the row, and the gap `AppHeader` leaves for it below `AppShell`'s fixed copy. */
export const BRAND_ROW_HEIGHT = 32;
export const BRAND_ROW_GAP = 12;

/**
 * The wordmark. Figma "Frame 15" — 361 x 32 — which is identical on the Home frame
 * (7338:214835) and the edit frame (7338:215290); account settings live in the Menu tab
 * instead of a header button.
 *
 * Rendered exactly once, by `AppShell`, fixed above every screen — see the note there. Screens
 * never render this themselves; `AppHeader` just reserves the space for it. Purely decorative:
 * tapping it does nothing.
 */
export function BrandRow() {
  return (
    <View style={styles.row}>
      <Logo />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BRAND_ROW_HEIGHT,
  },
});
