import { CaretLeft, CaretRight, Heart, Phone, X } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { emergencyContact } from '../data/home';
import { useDirection, useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCall: () => void;
  onHelp: () => void;
};

const SHEET_HEIGHT = 300;

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * The Emergency drawer opens this as a bottom sheet.
 *
 * Built on React Native's own `Modal` plus an animated slide rather than
 * @gorhom/bottom-sheet: that pulls in Reanimated and Gesture Handler, and this screen
 * has to keep rendering in the web preview.
 *
 * On web the `Modal` is skipped entirely — react-native-web portals it to the document
 * root, which escapes the 393px device frame and anchors the sheet to the browser
 * window instead of the phone. There it renders in-tree as an absolute overlay so it
 * stays inside the device. Native still gets a real modal.
 */
export function EmergencySheet({ visible, onClose, onCall, onHelp }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const { isRTL } = useDirection();
  const slide = useRef(new Animated.Value(0)).current;
  // Kept mounted through the close animation so the slide-out is actually visible.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);

    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, slide]);

  if (!mounted) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  // The drill-in caret points the way the row will take you, which is the other way under RTL.
  const Caret = isRTL ? CaretLeft : CaretRight;

  const content = (
    <View style={styles.root}>
      <AnimatedBackdrop
        opacity={slide}
        onPress={onClose}
        label={t('common.emergency.a11yDismiss')}
      />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        <View style={styles.header}>
          <Pressable
            style={styles.close}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.action.close')}
            hitSlop={8}
          >
            <X size={20} color={color.gray900} />
          </Pressable>
          <Text style={[styles.title, displayFont]}>{t('common.emergency.title')}</Text>
        </View>

        <View style={styles.actions}>
          <SheetAction
            onPress={onHelp}
            tint={styles.helpSurface}
            badgeColor={color.brand500}
            icon={<Heart size={20} weight="fill" color={color.white} />}
            title={t('common.emergency.helpTitle')}
            subtitle={t('common.emergency.helpSubtitle')}
            trailing={<Caret size={20} color={color.brand500} />}
          />

          <SheetAction
            onPress={onCall}
            tint={styles.callSurface}
            badgeColor={color.error400}
            icon={<Phone size={20} weight="fill" color={color.white} />}
            title={t('common.emergency.callTitle')}
            subtitle={t('common.emergency.callSubtitle', {
              name: emergencyContact.name,
              relationship: t(emergencyContact.relationshipKey),
            })}
          />
        </View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    return content;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

function AnimatedBackdrop({
  opacity,
  onPress,
  label,
}: {
  opacity: Animated.Value;
  onPress: () => void;
  label: string;
}) {
  return (
    <Animated.View style={[styles.backdrop, { opacity }]}>
      <Pressable style={styles.backdropPress} onPress={onPress} accessibilityLabel={label} />
    </Animated.View>
  );
}

function SheetAction({
  onPress,
  tint,
  badgeColor,
  icon,
  title,
  subtitle,
  trailing,
}: {
  onPress: () => void;
  tint: object;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable style={[styles.action, tint]} onPress={onPress} accessibilityRole="button">
      <View style={[styles.badge, { backgroundColor: badgeColor }]}>{icon}</View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Absolute rather than flex so the same tree works in-place on web and inside
  // the native Modal's full-screen container.
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 13, 18, 0.45)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: color.gray50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'web' ? 24 : 40,
    ...shadow.xxl,
  },
  handleArea: {
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 100,
    backgroundColor: color.gray400,
  },
  header: {
    height: 40,
    marginTop: 8,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    // The title is centred in this header, so the X belongs on whichever edge reads first.
    start: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  action: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callSurface: {
    backgroundColor: color.error50,
    borderColor: color.error100,
  },
  helpSurface: {
    backgroundColor: color.brand50,
    borderColor: color.brand100,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionTitle: {
    fontFamily: font.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: color.gray900,
  },
  actionSubtitle: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: color.gray700,
  },
});
