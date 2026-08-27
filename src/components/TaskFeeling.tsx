import { Smiley, ThumbsDown, ThumbsUp } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useT } from '../i18n';
import { color, shadow } from '../theme/tokens';
import { TaskHeading } from './TaskHeading';

export type Feeling = 'good' | 'bad';

type Props = {
  value: Feeling | null;
  onChange: (value: Feeling) => void;
};

/** Figma node 7338:214862 "Task - how are you feeling" — 361 x 84. */
export function TaskFeeling({ value, onChange }: Props) {
  const t = useT();

  return (
    <View style={styles.root}>
      <TaskHeading
        completed={value !== null}
        icon={<Smiley size={20} color={color.black} />}
        title={t(value === null ? 'ui.task.feelingQuestion' : 'ui.task.feelingAnswered')}
      />

      <View style={styles.buttonRow}>
        <FeelingButton feeling="good" answer={value} onPress={() => onChange('good')} />
        <FeelingButton feeling="bad" answer={value} onPress={() => onChange('bad')} />
      </View>
    </View>
  );
}

/**
 * Figma component "Good / Bad" (7338:214981) defines four states:
 * Enabled, Pressed, Active, Inactive.
 *
 * Active is type-specific — Success/100 for the thumbs-up, Orange/100 for the
 * thumbs-down — and is rendered as a non-interactive frame in Figma, so the chosen
 * option stops responding while the other stays tappable to change the answer.
 */
function FeelingButton({
  feeling,
  answer,
  onPress,
}: {
  feeling: Feeling;
  answer: Feeling | null;
  onPress: () => void;
}) {
  const t = useT();
  const Glyph = feeling === 'good' ? ThumbsUp : ThumbsDown;
  const isActive = answer === feeling;
  const isInactive = answer !== null && !isActive;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isActive }}
      accessibilityLabel={t(
        feeling === 'good' ? 'ui.task.a11yFeelingGood' : 'ui.task.a11yFeelingBad',
      )}
      onPress={onPress}
      disabled={isActive}
      style={({ pressed }) => [
        styles.button,
        isActive && (feeling === 'good' ? styles.activeGood : styles.activeBad),
        isInactive && styles.inactive,
        // Pressed only reads on an otherwise-enabled button.
        pressed && !isActive && styles.pressed,
      ]}
    >
      {({ pressed }) => (
        <Glyph
          size={20}
          color={
            isActive
              ? feeling === 'good'
                ? color.success400
                : color.orange400
              : isInactive && !pressed
                ? color.gray300
                : color.black
          }
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  /** State=Enabled */
  button: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: color.gray200,
    backgroundColor: color.white,
    overflow: 'hidden',
    ...shadow.xs,
  },
  /** State=Pressed — same for both types. */
  pressed: {
    backgroundColor: color.brand50,
    borderColor: color.brand200,
  },
  /** State=Active, Type=Good */
  activeGood: {
    backgroundColor: color.success100,
    borderColor: color.success200,
  },
  /** State=Active, Type=Bad */
  activeBad: {
    backgroundColor: color.orange100,
    borderColor: color.orange200,
  },
  /** State=Inactive — surface matches Enabled; only the glyph dims. */
  inactive: {
    backgroundColor: color.white,
    borderColor: color.gray200,
  },
});
