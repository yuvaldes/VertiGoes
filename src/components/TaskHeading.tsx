import { CheckCircle } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDisplayFont, useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  completed: boolean;
  icon: ReactNode;
  title: string;
  /** An action at the trailing end of the title row, e.g. the exercises card's edit pencil. */
  trailing?: ReactNode;
};

/**
 * The "NOT COMPLETED" eyebrow + icon/title row shared by both task cards
 * (Figma nodes 7318:214145-148 and 7318:214238-241).
 *
 * Only the NOT COMPLETED state is drawn in Figma. The completed treatment reuses
 * Success/500 and the filled CheckCircle, matching the exercise row's Completed label.
 */
export function TaskHeading({ completed, icon, title, trailing }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <>
      <View style={styles.eyebrowRow}>
        {completed && <CheckCircle size={12} weight="fill" color={color.success500} />}
        <Text style={[styles.eyebrow, completed && styles.eyebrowDone]}>
          {completed ? t('ui.task.completed') : t('ui.task.notCompleted')}
        </Text>
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleGroup}>
          {icon}
          <Text style={[styles.title, displayFont]}>{title}</Text>
        </View>
        {trailing}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  eyebrowRow: {
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    fontFamily: font.bodySemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray400,
  },
  eyebrowDone: {
    color: color.success500,
  },
  // minHeight: the 22 line height below is what keeps Android from clipping descenders in
  // titles like "How are you feeling currently?", and a fixed 20 would undo it.
  titleRow: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
  },
});
