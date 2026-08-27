import { Pressable, StyleSheet, Text, View } from 'react-native';

import { color, font } from '../theme/tokens';
import { Ring } from './Ring';

type Option = { id: string; label: string };

type Props = {
  options: Option[];
  /** Which ids read as active. Whether that's one or many is entirely up to the caller. */
  selectedIds: string[];
  onToggle: (id: string) => void;
};

/**
 * A wrapping row of pill toggles, styled after the app's hour-chip pattern.
 *
 * Purely presentational — it reports taps via `onToggle` and leaves single- vs multi-select
 * semantics to the caller. A single-select caller just always replaces the selection on toggle;
 * a multi-select caller adds/removes from an array. Neither needs a different component.
 */
export function ChipSelect({ options, selectedIds, onToggle }: Props) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selectedIds.includes(option.id);
        return (
          <Pressable
            key={option.id}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(option.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            <Ring radius={20} color={active ? color.brand200 : color.gray200} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: color.brand50,
  },
  label: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 19,
    color: color.gray900,
  },
  labelActive: {
    fontFamily: font.bodySemiBold,
    color: color.brand500,
  },
});
