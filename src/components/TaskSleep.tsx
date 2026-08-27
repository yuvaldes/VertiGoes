import { MoonStars } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sleepOptions, sleepOptionForHours } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';
import { Ring } from './Ring';
import { TaskHeading } from './TaskHeading';

type Props = {
  /**
   * Hours already recorded for today, or null. Hours rather than a chip, because that is what
   * the day's record holds and the chips are ranges over it — `sleepOptionForHours` picks the
   * one that covers it.
   */
  value: number | null;
  onChange: (hours: number) => void;
};

/** Figma node 7338:214863 "Task - hours slept" — 361 x 80. */
export function TaskSleep({ value, onChange }: Props) {
  const t = useT();
  const selected = value === null ? undefined : sleepOptionForHours(value);

  return (
    <View style={styles.root}>
      <TaskHeading
        completed={value !== null}
        icon={<MoonStars size={20} color={color.black} />}
        title={t('ui.task.sleepQuestion')}
      />

      <View style={styles.chipRow}>
        {sleepOptions.map((option, index) => (
          <HourButton
            key={option.id}
            label={t(option.labelKey)}
            active={option.id === selected?.id}
            answered={value !== null}
            onPress={() => onChange(option.hours)}
            // Figma: the first chip hugs its label, the rest share the remainder.
            hug={index === 0}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Figma component "Hour button" (7338:214998) defines four states:
 * Enabled, Pressed, Active, Inactive. Pressed and Active differ only in surface
 * (Brand/25 vs Brand/50) and both share the Brand/200 stroke and Brand/500 label.
 */
function HourButton({
  label,
  active,
  answered,
  onPress,
  hug,
}: {
  label: string;
  active: boolean;
  /** Any chip chosen — the unchosen ones dim rather than staying enabled-looking. */
  answered: boolean;
  onPress: () => void;
  hug: boolean;
}) {
  const displayFont = useDisplayFont();
  const isActive = active;
  const isInactive = answered && !isActive;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive, disabled: isActive }}
      onPress={onPress}
      disabled={isActive}
      style={({ pressed }) => [
        styles.chip,
        hug ? styles.chipHug : styles.chipFill,
        isActive && styles.active,
        pressed && !isActive && styles.pressed,
      ]}
    >
      {({ pressed }) => (
        <>
          <Text
            style={[
              styles.chipLabel,
              displayFont,
              (isActive || pressed) && styles.chipLabelBrand,
              isInactive && !pressed && styles.chipLabelInactive,
            ]}
          >
            {label}
          </Text>
          <Ring radius={8} color={isActive || pressed ? color.brand200 : color.gray200} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** State=Enabled */
  chip: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: color.white,
    ...shadow.xs,
  },
  chipHug: {
    flexShrink: 0,
  },
  chipFill: {
    flex: 1,
    minWidth: 0,
  },
  /** State=Pressed */
  pressed: {
    backgroundColor: color.brand25,
  },
  /** State=Active */
  active: {
    backgroundColor: color.brand50,
  },
  chipLabel: {
    fontFamily: font.display,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
  },
  chipLabelBrand: {
    color: color.brand500,
  },
  /** State=Inactive */
  chipLabelInactive: {
    color: color.gray300,
  },
});
