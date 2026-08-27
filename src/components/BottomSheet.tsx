import { useEffect, useRef, useState, type ReactNode } from 'react';
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

import { useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';
import { SheetPortal } from './SheetHost';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Centred in the handle row, like the Emergency sheet's. */
  title: string;
  children: ReactNode;
};

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** Until the sheet has measured itself, slide from a distance no sheet will exceed. */
const FALLBACK_HEIGHT = 400;

/**
 * A generic slide-up sheet: backdrop, grab handle, title, and whatever the caller puts in it.
 *
 * The mechanics are lifted from `EmergencySheet`, which predates this and keeps its own copy
 * — its layout is bespoke enough that folding it in would be a rewrite, not a reuse. Anything
 * new should build on this instead of copying that file a third time.
 *
 * On web the `Modal` is skipped entirely — react-native-web portals it to the document root,
 * which escapes the 393px device frame and anchors the sheet to the browser window. There it
 * renders in-tree as an absolute overlay so it stays inside the device. Native gets a real modal.
 */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const slide = useRef(new Animated.Value(0)).current;
  // Kept mounted through the close animation so the slide-out is actually visible.
  const [mounted, setMounted] = useState(visible);
  /**
   * Measured rather than fixed: these sheets size to their copy, and a hardcoded distance
   * would either leave a gap under a tall sheet or overshoot a short one.
   */
  const [height, setHeight] = useState(FALLBACK_HEIGHT);

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

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  const content = (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: slide }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={onClose}
          accessibilityLabel={t('common.action.dismiss')}
        />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        <Text style={[styles.title, displayFont]}>{title}</Text>

        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') return <SheetPortal>{content}</SheetPortal>;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Absolute rather than flex so the same tree works in-place on web and inside the native
  // Modal's full-screen container.
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
  title: {
    marginTop: 12,
    marginHorizontal: 16,
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.black,
    textAlign: 'center',
  },
  content: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
