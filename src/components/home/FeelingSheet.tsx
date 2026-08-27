import { ThumbsDown, ThumbsUp } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Feeling } from '../../data/dayRecords';
import { useT } from '../../i18n';
import { color, shadow } from '../../theme/tokens';
import { TaskSheet } from './TaskSheet';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (feeling: Feeling) => void;
};

/** Figma 11010:79938 — the thumbs pair, then Done. */
export function FeelingSheet({ visible, onDismiss, onSubmit }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<Feeling | null>(null);

  // Reopening starts blank: dismissing without Done is meant to discard the answer.
  useEffect(() => {
    if (visible) setDraft(null);
  }, [visible]);

  return (
    <TaskSheet
      visible={visible}
      title={t('ui.task.feelingQuestion')}
      canSubmit={draft !== null}
      onSubmit={() => draft && onSubmit(draft)}
      onDismiss={onDismiss}
    >
      <View style={styles.row}>
        <Choice
          feeling="good"
          active={draft === 'good'}
          onPress={() => setDraft('good')}
        />
        <Choice feeling="bad" active={draft === 'bad'} onPress={() => setDraft('bad')} />
      </View>
    </TaskSheet>
  );
}

/**
 * The design draws only the resting state. The selected treatment reuses the tints the old
 * inline Good/Bad buttons already used — success for the thumbs-up, orange for the thumbs-down.
 */
function Choice({
  feeling,
  active,
  onPress,
}: {
  feeling: Feeling;
  active: boolean;
  onPress: () => void;
}) {
  const t = useT();
  const Glyph = feeling === 'good' ? ThumbsUp : ThumbsDown;
  const activeStyle = feeling === 'good' ? styles.activeGood : styles.activeBad;
  const activeTint = feeling === 'good' ? color.success500 : color.orange500;

  return (
    <Pressable
      style={[styles.choice, active && activeStyle]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t(
        feeling === 'good' ? 'ui.task.a11yFeelingGood' : 'ui.task.a11yFeelingBad',
      )}
    >
      <Glyph size={20} color={active ? activeTint : color.gray900} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  choice: {
    flex: 1,
    minWidth: 0,
    padding: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: color.gray200,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  activeGood: {
    backgroundColor: color.success100,
    borderColor: color.success200,
  },
  activeBad: {
    backgroundColor: color.orange100,
    borderColor: color.orange200,
  },
});
