import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { initialsOf } from '../data/professionals';
import { useDisplayFont } from '../i18n';
import { color, font } from '../theme/tokens';

/** A stable tint per person, so the same face is always the same colour. */
const TINTS = [
  { bg: color.brand100, fg: color.brand500 },
  { bg: color.success100, fg: color.success500 },
  { bg: color.orange100, fg: color.orange500 },
  { bg: color.error100, fg: color.error500 },
  { bg: color.brand200, fg: color.brand500 },
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % TINTS.length;
  return TINTS[hash];
}

/** Renders the portrait; falls back to tinted initials if there is none or it fails to load. */
export function ProfessionalAvatar({
  name,
  photoUrl,
  size = 56,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  const tint = tintFor(name);
  const displayFont = useDisplayFont();
  const [failed, setFailed] = useState(false);

  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl && !failed) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.root, circle]}
        onError={() => setFailed(true)}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View style={[styles.root, circle, { backgroundColor: tint.bg }]}>
      <Text style={[styles.initials, displayFont, { color: tint.fg, fontSize: size * 0.34 }]}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  initials: {
    fontFamily: font.display,
  },
});
