import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { color, frame } from '../theme/tokens';

/**
 * The Figma frame includes the iOS status bar and home indicator (nodes 7318:214532
 * and 7318:214615). On a real device the OS draws these, so they are rendered only in
 * the web preview — see PhonePreview.
 */

export function StatusBarChrome() {
  return (
    <View style={styles.statusBar}>
      <View style={styles.timeSlot}>
        <Text style={styles.time}>9:41</Text>
      </View>

      <View style={styles.dynamicIsland} />

      <View style={styles.levels}>
        <CellularConnection />
        <Wifi />
        <Battery />
      </View>
    </View>
  );
}

/** Figma node 0:15 "Cellular Connection" — 19.2 x 12.23, four bars. */
function CellularConnection() {
  const heights = [4.3, 6.9, 9.5, 12.23];
  return (
    <View style={styles.cellular}>
      {heights.map((height, index) => (
        <View key={index} style={[styles.cellularBar, { height }]} />
      ))}
    </View>
  );
}

/** Figma node 0:16 "Wifi" — 17.14 x 12.33, dot plus two arcs. */
function Wifi() {
  return (
    <Svg width={17.14} height={12.33} viewBox="0 0 17.14 12.33">
      <Path
        d="M1.1 4.55a11.2 11.2 0 0 1 14.94 0"
        stroke={color.black}
        strokeWidth={2.1}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M4.55 8.2a6.35 6.35 0 0 1 8.04 0"
        stroke={color.black}
        strokeWidth={2.1}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={8.57} cy={11.15} r={1.18} fill={color.black} />
    </Svg>
  );
}

/** Figma node 0:17 — 27.33 x 13. */
function Battery() {
  return (
    <View style={styles.batteryRow}>
      <View style={styles.batteryShell}>
        <View style={styles.batteryFill} />
      </View>
      <View style={styles.batteryNub} />
    </View>
  );
}

export function HomeIndicator() {
  return (
    <View style={styles.homeIndicator}>
      <View style={styles.homeIndicatorBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    height: frame.statusBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeSlot: {
    // Figma: Time frame at x=16, width 112, text centred within it.
    marginLeft: 16,
    width: 112,
    alignItems: 'center',
  },
  time: {
    // SF Pro on device; Inter is the closest face this project ships.
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: color.black,
  },
  dynamicIsland: {
    width: 125,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: color.black,
  },
  levels: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    paddingRight: 15,
  },
  cellular: {
    width: 19.2,
    height: 12.23,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2.2,
  },
  cellularBar: {
    width: 3,
    borderRadius: 1,
    backgroundColor: color.black,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryShell: {
    width: 25,
    height: 13,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.35)',
    padding: 1.5,
  },
  batteryFill: {
    flex: 1,
    borderRadius: 2.5,
    backgroundColor: color.black,
  },
  batteryNub: {
    width: 1.5,
    height: 4,
    marginLeft: 1,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  homeIndicator: {
    height: frame.homeIndicatorHeight,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  homeIndicatorBar: {
    width: 139,
    height: 5,
    borderRadius: 100,
    backgroundColor: color.black,
  },
});
