import { CaretUp, House, List, Sparkle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TabKey } from '../data/home';
import { useT } from '../i18n';
import { isFeatureReady } from '../lib/featureAvailability';
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

/** Height of the tab pill, and of the Emergency drawer that sits above it on some screens. */
export const BOTTOM_BAR_HEIGHT = 60;
export const EMERGENCY_ROW_HEIGHT = 40;

/**
 * Reserves the space the fixed bar occupies, the way `AppHeader` does for the brand row.
 *
 * The bar itself is rendered exactly once by `AppShell` and pinned above every screen — see
 * the note there. Screens render this instead, so their content still stops above the bar
 * without them having to know it moved out from under them.
 */
export function BottomBarSlot({ showEmergency = false }: { showEmergency?: boolean }) {
  return (
    <View
      style={{ height: showEmergency ? EMERGENCY_ROW_HEIGHT + BOTTOM_BAR_HEIGHT : BOTTOM_BAR_HEIGHT }}
    />
  );
}

/** Figma node 7338:214900 "Frame 45" — 361 x 92, or 60 without the drawer. */
export function BottomBar({
  activeTab,
  onChangeTab,
  onOpenEmergency,
  showEmergency = true,
}: Props) {
  const t = useT();
  const emergencyPending = !isFeatureReady('guidedHelp') && !isFeatureReady('emergencyContact');

  return (
    <View style={showEmergency ? styles.root : styles.rootMenuOnly}>
      {showEmergency && (
        <Pressable
          style={styles.emergencyRow}
          onPress={onOpenEmergency}
          accessibilityRole="button"
          accessibilityLabel={emergencyPending ? `${t('common.bottomBar.emergency')}, ${t('browse.placeholder.heading')}` : t('common.bottomBar.a11yOpenEmergency')}
        >
          <Text style={styles.emergencyLabel}>{t('common.bottomBar.emergency')}</Text>
          {emergencyPending && <Text style={styles.pendingLabel}>{t('browse.placeholder.heading')}</Text>}
          <CaretUp size={16} color={color.error25} />
        </Pressable>
      )}

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
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuButton, active && styles.menuButtonActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      {icon}
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pendingLabel: {
    fontFamily: font.body,
    fontSize: 10,
    lineHeight: 14,
    color: color.error25,
  },
  root: {
    borderRadius: 24,
    backgroundColor: color.error400,
  },
  /** No red drawer behind it, so no tinted surface to show through. */
  rootMenuOnly: {
    borderRadius: 24,
  },
  emergencyRow: {
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  emergencyLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 12,
    color: color.error25,
  },
  mainMenu: {
    height: 60,
    padding: 4,
    borderRadius: 24,
    backgroundColor: color.gray25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    overflow: 'hidden',
    ...shadow.xxl,
  },
  menuButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 24,
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
