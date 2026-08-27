import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sleepOptions, type SleepOption } from '../../data/home';
import { useT } from '../../i18n';
import { color, font, shadow } from '../../theme/tokens';
import { TaskSheet } from './TaskSheet';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  /** Hours, not a chip: the day's record stores an hour count, and the chips are ranges. */
  onSubmit: (hours: number) => void;
};

/**
 * The sleep task's sheet. No Figma frame exists for it, so it reuses the feeling sheet's shell
 * exactly and swaps the thumbs pair for the five hour chips the old inline task used — pilled
 * to radius 99 to match the buttons it sits beside.
 */
export function SleepSheet({ visible, onDismiss, onSubmit }: Props) {
  const t = useT();
  const [draft, setDraft] = useState<SleepOption | null>(null);

  // Reopening starts blank: dismissing without Done is meant to discard the answer.
  useEffect(() => {
    if (visible) setDraft(null);
  }, [visible]);

  return (
    <TaskSheet
      visible={visible}
      title={t('ui.task.sleepQuestion')}
      canSubmit={draft !== null}
      onSubmit={() => draft && onSubmit(draft.hours)}
      onDismiss={onDismiss}
    >
      <View style={styles.row}>
        {sleepOptions.map((option, index) => {
          const active = draft?.id === option.id;
          return (
            <Pressable
              key={option.id}
              // As in the inline task: the wordy first chip hugs its label, the numerals
              // share what's left so the row spans the sheet.
              style={[styles.chip, index === 0 ? styles.chipHug : styles.chipFill, active && styles.chipActive]}
              onPress={() => setDraft(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {t(option.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </TaskSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 6,
    width: '100%',
  },
  chip: {
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: color.gray200,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  /** Hugs its label — "Less than 6" is much wider than a numeral and shouldn't be squeezed. */
  chipHug: {
    paddingHorizontal: 14,
  },
  chipFill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  chipActive: {
    backgroundColor: color.brand50,
    borderColor: color.brand200,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
  },
  labelActive: {
    color: color.brand500,
  },
});
