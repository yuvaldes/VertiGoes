import { Image, StyleSheet } from 'react-native';

import { useT } from '../../i18n';

/** Mock: 64pt at the trailing end of the Liv title row. */
export const LIV_AVATAR_SIZE = 64;

const source = require('../../assets/liv-avatar.png');

/**
 * Liv's face.
 *
 * The asset is a 384x384 transparent cutout, so it is deliberately NOT clipped to a circle
 * and has no background — a circular mask would crop the hair silhouette and the chin. It
 * floats on the page, which is how the mock shows it.
 *
 * 384px is sized off the largest slot she appears in — 128pt in the help flow — at 3x
 * density. The 64pt and 88pt slots are then comfortably oversampled.
 */
export function LivAvatar({ size = LIV_AVATAR_SIZE }: { size?: number }) {
  const t = useT();

  return (
    <Image
      source={source}
      style={[styles.image, { width: size, height: size }]}
      // `contain` so the head never distorts if the slot's aspect ratio changes.
      resizeMode="contain"
      accessibilityLabel={t('ui.livAvatar.a11yLabel')}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
  },
});
