import { CheckCircle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LivAction } from '../../data/livChat';
import { useT, type TKey } from '../../i18n';
import { color, font, shadow } from '../../theme/tokens';

/** Keyed by kind, so a new action cannot ship without a label. */
const ACCEPT_LABEL_KEY: Record<LivAction['kind'], TKey> = {
  startHelp: 'ui.livAction.startHelp',
  completeExercise: 'ui.livAction.completeExercise',
};

type Props = {
  action: LivAction;
  taken: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

/**
 * The accept/dismiss affordance under a Liv message that proposes something.
 *
 * Sits under her bubble rather than inside it, so the offer reads as a control and not as
 * part of what she said. Once taken it collapses to a confirmation — the offer must not
 * stay tappable, or a user could log the same episode twice.
 */
export function ActionCard({ action, taken, onAccept, onDismiss }: Props) {
  const t = useT();

  if (taken) {
    return (
      <View style={styles.taken}>
        <CheckCircle size={14} weight="fill" color={color.success500} />
        <Text style={styles.takenLabel}>{t('ui.livAction.taken')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable style={styles.accept} onPress={onAccept} accessibilityRole="button">
        <Text style={styles.acceptLabel}>{t(ACCEPT_LABEL_KEY[action.kind])}</Text>
      </Pressable>
      <Pressable style={styles.dismiss} onPress={onDismiss} accessibilityRole="button">
        <Text style={styles.dismissLabel}>{t('ui.livAction.dismiss')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accept: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: color.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  acceptLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.white,
  },
  dismiss: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray500,
  },
  taken: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
  },
  takenLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.success500,
  },
});
