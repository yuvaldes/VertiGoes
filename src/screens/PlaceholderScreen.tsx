import { Hammer } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { BottomBarSlot } from '../components/BottomBar';
import { ScreenTitleRow } from '../components/ScreenTitleRow';
import type { TabKey } from '../data/home';
import { useDisplayFont, useT } from '../i18n';
import { color, font, frame } from '../theme/tokens';

type Props = {
  /**
   * Already translated by whoever navigated here — the caller knows which destination it
   * stood in for, this screen only has a `title` and a `note` to render.
   */
  title: string;
  note: string;
  onBack: () => void;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
};

/**
 * A titled screen for destinations that exist in the menus but aren't built yet.
 *
 * One component for all of them, so a menu row navigates honestly instead of doing nothing —
 * a tap that silently fails is worse than a screen that says "not yet".
 */
export function PlaceholderScreen({ title, note, onBack, activeTab, onChangeTab }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();

  return (
    <View style={styles.body}>
      <View style={styles.gutter}>
        <AppHeader>
          <ScreenTitleRow title={title} onBack={onBack} />
        </AppHeader>
      </View>

      <View style={styles.center}>
        <View style={styles.badge}>
          <Hammer size={28} color={color.gray400} />
        </View>
        <Text style={[styles.heading, displayFont]}>{t('browse.placeholder.heading')}</Text>
        <Text style={styles.note}>{note}</Text>
      </View>

      <BottomBarSlot />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: color.gray50,
  },
  gutter: {
    paddingHorizontal: frame.gutter,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heading: {
    fontFamily: font.display,
    fontSize: 20,
    color: color.gray900,
  },
  note: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray500,
    textAlign: 'center',
  },
});
