import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDisplayFont, useT, type TKey } from '../../i18n';
import { color, font, shadow } from '../../theme/tokens';
import { Ring } from '../Ring';
import { LivAvatar } from './LivAvatar';

/**
 * Openers for the empty state. Phrased as the user, since tapping one sends it verbatim —
 * which is also why these are keys rather than strings: the chip has to be sent in whatever
 * language the user is reading it in.
 */
export const PROMPT_KEYS: TKey[] = [
  'ui.promptChips.dizzyNow',
  'ui.promptChips.episodeEarlier',
  'ui.promptChips.sleep',
  'ui.promptChips.exercises',
];

type Props = {
  firstName: string;
  onPick: (prompt: string) => void;
};

/**
 * The empty state: a short greeting from Liv plus tappable openers.
 *
 * A blank chat with a text field asks the user to work out what this is for. Naming a few
 * things she can actually help with is the cheapest way to answer that.
 */
export function PromptChips({ firstName, onPick }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.root}>
      {/* Her actual face, not a sparkle — the header already shows her, and two different
          symbols for the same assistant on one screen reads as an oversight. */}
      <LivAvatar size={88} />

      <Text style={[styles.title, displayFont]}>{t('ui.promptChips.greeting', { firstName })}</Text>
      <Text style={styles.body}>{t('ui.promptChips.body')}</Text>

      <View style={styles.chips}>
        {PROMPT_KEYS.map((key) => {
          const prompt = t(key);
          return (
            <Pressable
              key={key}
              style={styles.chip}
              onPress={() => onPick(prompt)}
              accessibilityRole="button"
            >
              <Text style={styles.chipLabel}>{prompt}</Text>
              <Ring radius={16} color={color.brand100} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 24,
    gap: 8,
  },
  title: {
    fontFamily: font.display,
    fontSize: 20,
    color: color.black,
    textAlign: 'center',
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray600,
    textAlign: 'center',
    maxWidth: 300,
  },
  chips: {
    marginTop: 12,
    gap: 8,
    alignSelf: 'stretch',
  },
  chip: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  chipLabel: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
    textAlign: 'center',
  },
});
