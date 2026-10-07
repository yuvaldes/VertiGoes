import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, type LayoutChangeEvent, type ViewStyle } from 'react-native';

const SNAP_DISTANCE = 56;

/** Shared two-snap gesture for sheets: natural content height or the full viewport. */
export function useExpandableSheet(visible: boolean, onCollapsedDragDown?: () => void) {
  const progress = useRef(new Animated.Value(0)).current;
  const expanded = useRef(false);
  const gestureStartedExpanded = useRef(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const viewportHeightRef = useRef(0);
  const collapsedHeightRef = useRef(0);
  const onCollapsedDragDownRef = useRef(onCollapsedDragDown);

  useEffect(() => {
    onCollapsedDragDownRef.current = onCollapsedDragDown;
  }, [onCollapsedDragDown]);

  useEffect(() => {
    if (!visible) {
      expanded.current = false;
      progress.setValue(0);
    }
  }, [progress, visible]);

  const animateTo = (value: 0 | 1) => {
    expanded.current = value === 1;
    Animated.timing(progress, {
      toValue: value,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      gestureStartedExpanded.current = expanded.current;
    },
    onPanResponderMove: (_event, gesture) => {
      const travel = Math.max(1, viewportHeightRef.current - collapsedHeightRef.current);
      const start = gestureStartedExpanded.current ? 1 : 0;
      progress.setValue(Math.max(0, Math.min(1, start - gesture.dy / travel)));
    },
    onPanResponderRelease: (_event, gesture) => {
      if (!gestureStartedExpanded.current && gesture.dy > 80 && onCollapsedDragDownRef.current) {
        onCollapsedDragDownRef.current();
        return;
      }
      if (gestureStartedExpanded.current) animateTo(gesture.dy > SNAP_DISTANCE ? 0 : 1);
      else animateTo(gesture.dy < -SNAP_DISTANCE ? 1 : 0);
    },
    onPanResponderTerminate: () => animateTo(expanded.current ? 1 : 0),
  })).current;

  const onRootLayout = (event: LayoutChangeEvent) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    setViewportHeight(event.nativeEvent.layout.height);
  };
  const onSheetLayout = (event: LayoutChangeEvent) => {
    if (!expanded.current && collapsedHeightRef.current === 0) {
      collapsedHeightRef.current = event.nativeEvent.layout.height;
      setCollapsedHeight(event.nativeEvent.layout.height);
    }
  };

  const expandedStyle: Animated.WithAnimatedObject<ViewStyle> | undefined =
    viewportHeight > 0 && collapsedHeight > 0
      ? {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [Math.max(0, viewportHeight - collapsedHeight), 0],
          }),
        }
      : undefined;

  return { expandedStyle, onRootLayout, onSheetLayout, panHandlers: responder.panHandlers };
}
