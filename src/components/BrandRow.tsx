import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Logo } from '../assets/Logo';
import { useT } from '../i18n';

/** Height of the row, and the gap `AppHeader` leaves for it below `AppShell`'s fixed copy. */
export const BRAND_ROW_HEIGHT = 32;
export const BRAND_ROW_GAP = 12;

type Props = {
  /** Set only where tapping the wordmark does something — today, Home's layout toggle. */
  onPressLogo?: () => void;
  /** Trailing content pushed to the far right, e.g. Home's date + calendar button. */
  trailing?: ReactNode;
};

/**
 * The wordmark. Figma "Frame 15" — 361 x 32 — which is identical on the Home frame
 * (7338:214835) and the edit frame (7338:215290); account settings live in the Menu tab
 * instead of a header button.
 *
 * Rendered exactly once, by `AppShell`, fixed above every screen — see the note there. Screens
 * never render this themselves; `AppHeader` just reserves the space for it.
 */
export function BrandRow({ onPressLogo, trailing }: Props) {
  const t = useT();

  return (
    <View style={styles.row}>
      {onPressLogo ? (
        <Pressable
          onPress={onPressLogo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.brandRow.a11ySwitchLayout')}
        >
          <Logo />
        </Pressable>
      ) : (
        <Logo />
      )}

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
