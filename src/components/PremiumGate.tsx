import { BlurView } from 'expo-blur';
import { CrownSimple, LockSimple } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';

type Props = {
  /** How many items are hidden behind the blur — nothing renders if this is 0. */
  lockedCount: number;
  /** Plural noun for the count, already translated by the screen that owns the list. */
  itemLabel: string;
  /** Second line of copy — what upgrading gets them, specific to this list. */
  body: string;
  /** Opens the subscription screen. */
  onUpgrade: () => void;
  /** The locked cards/rows themselves, rendered blurred and non-interactive beneath the CTA. */
  children: ReactNode;
};

/**
 * Blurs a tail of a list behind a "Get Premium" prompt. Shared by every screen that gives away
 * a handful of items for free — Professionals, the exercise library, meditation drills — so the
 * paywall look stays one component instead of drifting across three copies.
 */
export function PremiumGate({ lockedCount, itemLabel, body, onUpgrade, children }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  if (lockedCount <= 0) return null;

  return (
    <View style={styles.section}>
      <View style={[styles.cards, styles.noPointerEvents]}>{children}</View>

      {/*
        `experimentalBlurMethod` is required on Android, where it defaults to 'none' — without it
        the BlurView is just a translucent wash and the locked cards stay perfectly readable,
        which rather defeats a paywall. iOS ignores the prop.
      */}
      <BlurView
        intensity={40}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        style={styles.overlay}
        onPress={onUpgrade}
        accessibilityRole="button"
        accessibilityLabel={t('ui.premiumGate.a11yUnlock', { count: lockedCount, itemLabel })}
      >
        <View style={styles.icon}>
          <LockSimple size={20} weight="fill" color={color.brand500} />
        </View>
        <Text style={[styles.title, displayFont]}>
          {t('ui.premiumGate.title', { count: lockedCount, itemLabel })}
        </Text>
        <Text style={styles.body}>{body}</Text>
        <View style={styles.button}>
          <CrownSimple size={16} weight="fill" color={color.white} />
          <Text style={styles.buttonLabel}>{t('ui.premiumGate.cta')}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Clips the blur to the same rounded footprint as the cards underneath. */
  section: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cards: {
    gap: 12,
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
    textAlign: 'center',
  },
  body: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 18,
    color: color.gray700,
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: 8,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: color.brand500,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...shadow.xs,
  },
  buttonLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    color: color.white,
  },
});
