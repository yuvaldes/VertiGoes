import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { color, font } from '../theme/tokens';

type Props = {
  /** Out of `total` — the completed count, not a 0-1 fraction. */
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * A ring chart with the steps left printed in the middle, rather than a percentage — this
 * only ever sits next to "Finish setting up" copy, where "2 left" reads faster than "50%".
 *
 * Drawn as two stacked circles (a full track, then the progress arc cut short with
 * `strokeDasharray`) rather than an image: the fraction changes per account, and native has
 * no conic-gradient to fall back on. The arc starts at 12 o'clock and turns the same way in
 * both writing directions — a ring has no "leading edge" for RTL to flip.
 */
export function ProgressDonut({ completed, total, size = 56, strokeWidth = 6 }: Props) {
  const remaining = Math.max(total - completed, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? Math.min(Math.max(completed / total, 0), 1) : 0;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color.brand100}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {fraction > 0 && (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color.brand500}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - fraction)}
            // Starts the arc at 12 o'clock instead of Svg's default 3 o'clock.
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <Text style={styles.count}>{remaining}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    color: color.brand600,
  },
});
