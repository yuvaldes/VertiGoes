import { CheckCircle, Fire } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { WAVING_HAND } from '../assets/placeholders';
import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';
import { AppHeader } from './AppHeader';

type Props = {
  firstName: string;
  taskCount: number;
};

/**
 * Figma node 7338:214834 "Frame 24" — the brand row plus the greeting.
 *
 * The brand row comes from AppHeader so its offset stays identical across the app.
 */
export function Header({ firstName, taskCount }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const allDone = taskCount === 0;
  const single = taskCount === 1;

  return (
    <AppHeader>
      <View style={styles.greetingBlock}>
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, displayFont]}>
            {t('common.header.greeting', { firstName })}
          </Text>
          <Text style={styles.wave}>{WAVING_HAND}</Text>
        </View>

        <View style={styles.streakRow}>
          {allDone ? (
            <CheckCircle size={16} weight="fill" color={color.success500} />
          ) : (
            <Fire size={16} weight="fill" color={color.orange500} />
          )}
          {/*
            Two Texts because the count is a different colour from the rest of the line, not
            because the sentence is assembled from words: each key below holds a whole phrase,
            so a translator can order the words inside one freely.
          */}
          <Text style={[styles.streakCount, allDone && styles.streakCountDone]}>
            {t(single ? 'common.header.taskCountOne' : 'common.header.taskCountOther', {
              count: taskCount,
            })}
          </Text>
          <Text style={styles.streakRest}>
            {t(single ? 'common.header.tasksWaitingOne' : 'common.header.tasksWaitingOther')}
          </Text>
        </View>
      </View>
    </AppHeader>
  );
}

const styles = StyleSheet.create({
  greetingBlock: {
    gap: 4,
  },
  // minHeight, not height: the line heights below carry the room Android needs for descenders,
  // and a fixed row would either clip them or let them overlap the streak line.
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 24,
  },
  greeting: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 32,
    color: color.black,
  },
  wave: {
    fontSize: 20,
    lineHeight: 27,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 16,
  },
  streakCount: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.orange500,
  },
  streakCountDone: {
    color: color.success500,
  },
  streakRest: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.black,
  },
});
