import { FirstAid, House, List, Sparkle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TabKey } from '../data/home';
import { useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';
import { Ring } from './Ring';

type Props = {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  onOpenEmergency?: () => void;
  /**
   * The edit screen's bottom bar is the mainMenu alone (Figma 7338:215346, 60 tall)
   * with no Emergency drawer above it.
   */
  showEmergency?: boolean;
};

/** Height of the tab pill. */
export const BOTTOM_BAR_HEIGHT = 60;

/**
 * Reserves the space the fixed bar occupies, the way `AppHeader` does for the brand row.
 *
 * The bar itself is rendered exactly once by `AppShell` and pinned above every screen — see
 * the note there. Screens render this instead, so their content still stops above the bar
 * without them having to know it moved out from under them.
 */
export function BottomBarSlot({ showEmergency: _showEmergency = false }: { showEmergency?: boolean }) {
  return <View style={{ height: BOTTOM_BAR_HEIGHT }} />;
}

/** Figma node 7338:214900 "Frame 45" — 361 x 92, or 60 without the drawer. */
export function BottomBar({
  activeTab,
  onChangeTab,
  onOpenEmergency,
  showEmergency: _showEmergency = true,
}: Props) {
  const t = useT();

  return (
    <View style={styles.rootMenuOnly}>
      <View style={styles.mainMenu}>
        <MenuButton
          label={t('common.bottomBar.tabHome')}
          active={activeTab === 'home'}
          onPress={() => onChangeTab('home')}
          icon={
            <House
              size={24}
              weight={activeTab === 'home' ? 'fill' : 'regular'}
              color={activeTab === 'home' ? color.brand500 : color.gray900}
            />
          }
        />
        <MenuButton
          label={t('common.bottomBar.tabLiv')}
          active={activeTab === 'liv'}
          onPress={() => onChangeTab('liv')}
          icon={
            <Sparkle
              size={24}
              weight={activeTab === 'liv' ? 'fill' : 'regular'}
              color={activeTab === 'liv' ? color.brand500 : color.gray900}
            />
          }
        />
        <MenuButton
          label={t('common.bottomBar.emergency')}
          active={false}
          action
          onPress={onOpenEmergency ?? (() => undefined)}
          icon={<FirstAid size={24} weight="regular" color={color.error400} />}
        />
        <MenuButton
          label={t('common.bottomBar.tabMenu')}
          active={activeTab === 'menu'}
          onPress={() => onChangeTab('menu')}
          icon={
            <List
              size={24}
              weight={activeTab === 'menu' ? 'fill' : 'regular'}
              color={activeTab === 'menu' ? color.brand500 : color.gray900}
            />
          }
        />
        <Ring radius={24} color={color.gray200} />
      </View>
    </View>
  );
}

function MenuButton({
  label,
  icon,
  active,
  onPress,
  action = false,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
  action?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuButton, active && styles.menuButtonActive]}
      onPress={onPress}
      accessibilityRole={action ? 'button' : 'tab'}
      accessibilityState={action ? undefined : { selected: active }}
    >
      {icon}
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** No red drawer behind it, so no tinted surface to show through. */
  rootMenuOnly: {
    borderRadius: 24,
  },
  mainMenu: {
    height: 60,
    padding: 4,
    borderRadius: 24,
    backgroundColor: color.gray25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    ...shadow.xxl,
  },
  menuButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  menuButtonActive: {
    backgroundColor: color.brand50,
  },
  menuLabel: {
    fontFamily: font.body,
    fontSize: 10,
    lineHeight: 12,
    color: color.gray700,
  },
  menuLabelActive: {
    color: color.brand500,
  },
});
