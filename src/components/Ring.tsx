import { StyleSheet, View } from 'react-native';

type Props = {
  radius: number;
  color: string;
  width?: number;
};

/**
 * A 1px stroke drawn as an overlay instead of a layout border.
 *
 * Figma auto-layout frames draw strokes *inside* the frame without shifting their
 * children, whereas a React Native `borderWidth` eats into the content box — which
 * offsets every child by 1px and shrinks it by 2px. Rendering the stroke as an
 * absolutely positioned ring keeps children on their exact Figma coordinates.
 */
export function Ring({ radius, color, width = 1 }: Props) {
  return (
    <View
      style={[
        styles.ring,
        { borderRadius: radius, borderColor: color, borderWidth: width },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
