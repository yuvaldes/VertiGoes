import { ArrowSquareOut, CaretLeft, CaretRight, CrownSimple } from 'phosphor-react-native';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDirection, useT } from '../i18n';
import { color, font } from '../theme/tokens';
import { Ring } from './Ring';

/** Row height and the inset the divider aligns to (16 padding + 24 icon + 12 gap). */
const ROW_HEIGHT = 56;
const DIVIDER_INSET = 52;

/**
 * A grouped settings-style list, from the reference the user supplied.
 *
 * Used by the Menu tab, and intended for the onboarding screens too — the whole point is that
 * a new menu is a list of `MenuRow`s rather than another hand-rolled card.
 */
export function MenuGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {/* Between rows only — never a trailing rule against the card edge. */}
          {index > 0 && <View style={styles.divider} />}
          {row}
        </Fragment>
      ))}
      {/* A ring rather than a border, so row content keeps its exact coordinates. */}
      <Ring radius={16} color={color.gray200} />
    </View>
  );
}

type MenuRowProps = {
  icon: ReactNode;
  label: string;
  /** Trailing detail, e.g. the current language. */
  value?: string;
  /**
   * `external` swaps the caret for an out-arrow, telling the user they're about to leave the
   * app. `premium` swaps it for a crown, telling them the row itself is gated.
   */
  variant?: 'push' | 'external' | 'premium';
  onPress?: () => void;
};

export function MenuRow({ icon, label, value, variant = 'push', onPress }: MenuRowProps) {
  const t = useT();
  const { isRTL } = useDirection();
  // The caret points at the screen this row opens, which is the other way under RTL.
  const Caret = isRTL ? CaretLeft : CaretRight;

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        variant === 'premium'
          ? t('common.menuRow.a11yPremium', { label })
          : value
            ? t('common.menuRow.a11yWithValue', { label, value })
            : label
      }
    >
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      {value !== undefined && <Text style={styles.value}>{value}</Text>}
      {variant === 'external' ? (
        // Phosphor ships no mirrored out-arrow, so this is the one icon here that gets
        // flipped rather than swapped. Both the HIG and Material send the arrow out through
        // the leading-away corner in RTL, and the stroke is uniform so mirroring is free.
        <ArrowSquareOut size={20} color={color.gray400} mirrored={isRTL} />
      ) : variant === 'premium' ? (
        <CrownSimple size={18} weight="fill" color={color.brand500} />
      ) : (
        <Caret size={20} color={color.gray400} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: color.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray900,
  },
  value: {
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray500,
  },
  divider: {
    height: 1,
    // Inset to sit under the label rather than the icon, so it tracks the leading edge.
    marginStart: DIVIDER_INSET,
    backgroundColor: color.gray200,
  },
});
