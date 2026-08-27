import { CalendarBlank } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useT } from '../../i18n';
import { color, font } from '../../theme/tokens';

/**
 * Today's date plus a calendar icon, sitting at the trailing end of the status Home's top row.
 *
 * Lives in the shell's fixed brand row rather than in the screen, because that row paints over
 * every screen — a copy inside Home would collide with it. Only the status Home supplies it.
 */
export function HeaderDateButton({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useT();

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('ui.headerDate.a11yOpenCalendar', { label })}
    >
      <Text style={styles.label}>{label}</Text>
      <CalendarBlank size={20} color={color.gray700} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  label: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray700,
  },
});
