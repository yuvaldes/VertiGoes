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

import { useDisplayFont, useT } from '../../i18n';
import { color, font, shadow } from '../../theme/tokens';
import { SheetPortal } from '../SheetHost';
import { useExpandableSheet } from '../useExpandableSheet';

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** Fallback slide distance, used only until the sheet has measured itself once. */
const ASSUMED_HEIGHT = 320;

type Props = {
  visible: boolean;
  title: string;
  /** Done stays disabled until the sheet's control reports an answer. */
  canSubmit: boolean;
  onSubmit: () => void;
  onDismiss: () => void;
  children: ReactNode;
};

/**
 * The bottom sheet the first two Home tasks answer into.
 *
 * Same construction as `EmergencySheet` — RN's own `Modal` plus an animated slide rather than
 * @gorhom/bottom-sheet, and skipped entirely on web where react-native-web portals the modal
 * out of the 393px device frame. See that file for the full reasoning.
 *
 * Dismissing by backdrop or drag is deliberately destructive: the answer only commits through
 * Done, so a half-made choice never reaches the day's record.
 */
export function TaskSheet({ visible, title, canSubmit, onSubmit, onDismiss, children }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const slide = useRef(new Animated.Value(0)).current;
  // Kept mounted through the close animation so the slide-out is actually visible.
  const [mounted, setMounted] = useState(visible);
  const [height, setHeight] = useState(ASSUMED_HEIGHT);
  const expandable = useExpandableSheet(visible, onDismiss);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }

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
    <View style={styles.root} onLayout={expandable.onRootLayout}>
      <Animated.View style={[styles.backdrop, { opacity: slide }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={onDismiss}
          accessibilityLabel={t('ui.task.a11yDismissSheet', { title })}
        />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, expandable.expandedStyle, { transform: [{ translateY }] }]}
        onLayout={(event) => {
          setHeight(event.nativeEvent.layout.height);
          expandable.onSheetLayout(event);
        }}
      >
        <View style={styles.grabberArea} {...expandable.panHandlers}>
          <View style={styles.grabber} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, displayFont]}>{title}</Text>

          {children}

          <Pressable
            style={[styles.done, canSubmit ? styles.doneEnabled : styles.doneDisabled]}
            onPress={canSubmit ? onSubmit : undefined}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit }}
          >
            <Text style={[styles.doneLabel, !canSubmit && styles.doneLabelDisabled]}>
              {t('common.action.done')}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') {
    return <SheetPortal>{content}</SheetPortal>;
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      {content}
    </Modal>
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
    backgroundColor: color.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    // The design's 32 already reads as safe-area room; native gets a little more.
    paddingBottom: Platform.OS === 'web' ? 32 : 40,
    gap: 16,
    alignItems: 'center',
    ...shadow.xxl,
  },
  /** Padded well past the 4px grabber so there is something real to grab. */
  grabberArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: -8,
  },
  grabber: {
    width: 58,
    height: 4,
    borderRadius: 100,
    backgroundColor: color.gray300,
  },
  body: {
    width: '100%',
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: font.display,
    fontSize: 16,
    lineHeight: 22,
    color: color.gray900,
    textAlign: 'center',
  },
  done: {
    width: '100%',
    borderRadius: 99,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.xs,
  },
  doneEnabled: {
    backgroundColor: color.brand500,
    borderColor: color.brand500,
  },
  /** The one state the design draws: a washed-out fill with the label barely separated. */
  doneDisabled: {
    backgroundColor: color.brand300,
    borderColor: color.brand200,
  },
  doneLabel: {
    fontFamily: font.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: color.white,
  },
  doneLabelDisabled: {
    color: color.brand100,
  },
});
