import { Check, X } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useDisplayFont, useT } from '../i18n';
import { color, font, shadow } from '../theme/tokens';

type Props = {
  visible: boolean;
  years: number[];
  selected: number;
  onClose: () => void;
  onSelect: (year: number) => void;
};

const SHEET_HEIGHT = 420;

/** react-native-web has no native animated module; asking for it only logs a warning. */
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Year picker for the calendar header.
 *
 * Same construction as EmergencySheet: RN's own Modal on native, rendered in-tree on web
 * because react-native-web portals Modal to the document root, which would escape the
 * 393px device frame in the preview.
 */
export function YearPickerSheet({ visible, years, selected, onClose, onSelect }: Props) {
  const t = useT();
  const displayFont = useDisplayFont();
  const slide = useRef(new Animated.Value(0)).current;
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

  const content = (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, { opacity: slide }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={onClose}
          accessibilityLabel={t('ui.calendar.a11yDismissYearPicker')}
        />
      </Animated.View>

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
          <Text style={[styles.title, displayFont]}>{t('ui.calendar.yearPickerTitle')}</Text>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {years.map((year) => {
            const isSelected = year === selected;
            return (
              <Pressable
                key={year}
                style={styles.row}
                onPress={() => onSelect(year)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.year, displayFont, isSelected && styles.yearSelected]}>
                  {year}
                </Text>
                {isSelected && <Check size={20} color={color.brand500} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'web') return content;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    height: SHEET_HEIGHT,
    backgroundColor: color.gray50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'web' ? 16 : 32,
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
  list: {
    flex: 1,
    marginTop: 8,
  },
  row: {
    height: 48,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  year: {
    fontFamily: font.display,
    fontSize: 20,
    color: color.black,
  },
  yearSelected: {
    color: color.brand500,
  },
});
