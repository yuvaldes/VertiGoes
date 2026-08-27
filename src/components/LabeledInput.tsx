import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { color, font } from '../theme/tokens';
import { Ring } from './Ring';

type Props = TextInputProps & {
  label: string;
  required?: boolean;
};

/** A labeled text field, `Ring`-bordered to match the search bar and menu cards. */
export function LabeledInput({ label, required, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={color.gray400}
          {...inputProps}
        />
        <Ring radius={12} color={color.gray200} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: color.gray700,
  },
  required: {
    color: color.error500,
  },
  inputWrap: {
    height: 48,
    borderRadius: 12,
    backgroundColor: color.white,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
    padding: 0,
    fontFamily: font.body,
    fontSize: 15,
    color: color.gray900,
    // RN-web draws its own focus ring, which fights the Ring outline.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
});
