import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useT } from '../i18n';
import { color, font } from '../theme/tokens';

type Props = {
  value: boolean | null;
  onChange: (value: boolean) => void;
};

/** A Yes/No pair that stays changeable — unlike `HelpFlowScreen`'s answer buttons, which lock in. */
export function YesNoToggle({ value, onChange }: Props) {
  const t = useT();

  return (
    <View style={styles.row}>
      <Option
        label={t('common.answer.yes')}
        active={value === true}
        onPress={() => onChange(true)}
      />
      <Option
        label={t('common.answer.no')}
        active={value === false}
        onPress={() => onChange(false)}
      />
    </View>
  );
}

function Option({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.gray200,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: color.brand50,
    borderColor: color.brand200,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.gray700,
  },
  labelActive: {
    color: color.brand500,
  },
});
