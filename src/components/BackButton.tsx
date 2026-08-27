import { CaretLeft, CaretRight } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useDirection, useT } from '../i18n';
import { color, shadow } from '../theme/tokens';

/**
 * The back chevron, in the one style every screen should use.
 *
 * `ScreenTitleRow` used to define its own, and it's exactly the kind of thing that drifts if
 * it's copy-pasted instead of shared — `OnboardingScreen` needed the same button for its own
 * header row, which is the reason this got pulled out rather than left inline.
 */
export function BackButton({ onPress }: { onPress: () => void }) {
  const t = useT();
  const { isRTL } = useDirection();
  // The chevron points back the way the screen came from, and that edge swaps under RTL.
  // Swapping the component rather than mirroring one keeps the hairline rendering identical.
  const Caret = isRTL ? CaretRight : CaretLeft;

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('common.action.back')}
      hitSlop={8}
    >
      <Caret size={20} color={color.gray900} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
});
