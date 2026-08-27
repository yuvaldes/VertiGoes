import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApplyDirection } from '../i18n';
import { color, frame } from '../theme/tokens';
import { HomeIndicator, StatusBarChrome } from './DeviceChrome';

/**
 * On web, pins the app to the exact Figma canvas (393 x 852) and draws the iOS status
 * bar and home indicator that the design frame includes, so the preview can be
 * compared against the Figma export 1:1.
 *
 * On device those two are drawn by the OS, so we substitute real safe-area insets.
 *
 * Also the one place the app's writing direction is applied, because this is the only
 * component that wraps the whole tree on both platforms.
 */
export function PhonePreview({ children }: { children: ReactNode }) {
  const direction = useApplyDirection();

  if (Platform.OS !== 'web') {
    return <NativeShell>{children}</NativeShell>;
  }

  return (
    <View style={styles.stage}>
      <View style={styles.device}>
        <StatusBarChrome />
        {/*
          `dir` sits on the body rather than the device so the simulated iOS chrome above and
          below it stays left-to-right, matching the Figma frame it exists to be diffed
          against. Everything the user actually touches is a descendant of this View —
          including every sheet, since SheetHost mounts inside AppShell — and
          react-native-web propagates direction by context from whichever element carries
          `dir`, which is the only thing that flips its logical style props.
        */}
        <View style={styles.deviceBody} dir={direction}>
          {children}
        </View>
        <HomeIndicator />
      </View>
    </View>
  );
}

/**
 * Android's navigation bar is not part of the safe-area inset when the app isn't drawing
 * edge-to-edge, so the bottom menu ended up sitting flush against it. iOS already has the home
 * indicator in `insets.bottom` and needs nothing extra.
 */
const ANDROID_BOTTOM_LIFT = Platform.OS === 'android' ? 16 : 0;

function NativeShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.native,
        { paddingTop: insets.top, paddingBottom: insets.bottom + ANDROID_BOTTOM_LIFT },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.gray200,
  },
  device: {
    width: frame.width,
    height: frame.height,
    backgroundColor: color.gray50,
    overflow: 'hidden',
  },
  deviceBody: {
    flex: 1,
    // The outgoing screen translates off to the left during a push; nothing it paints
    // should escape the simulated device.
    overflow: 'hidden',
  },
  native: {
    flex: 1,
    backgroundColor: color.gray50,
  },
});
