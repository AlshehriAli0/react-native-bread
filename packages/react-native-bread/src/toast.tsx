import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { CloseIcon, GreenCheck, InfoIcon, RedX } from "./icons";
import { type Toast as ToastData, type ToastState, type ToastType, toastStore } from "./toast-store";
import type { ToastPosition, ToastTheme } from "./types";

const ToastIcon = ({ type, accentColor }: { type: ToastType; accentColor: string }) => {
  switch (type) {
    case "success":
      return <GreenCheck width={36} height={36} fill={accentColor} />;
    case "error":
      return <RedX width={28} height={28} fill={accentColor} />;
    case "loading":
      return <ActivityIndicator size={28} color={accentColor} />;
    case "info":
      return <InfoIcon width={28} height={28} fill={accentColor} />;
    default:
      return <GreenCheck width={36} height={36} fill={accentColor} />;
  }
};

const AnimatedIcon = ({ type, accentColor }: { type: ToastType; accentColor: string }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.5)) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + progress.value * 0.3 }],
  }));

  return (
    <Animated.View style={style}>
      <ToastIcon type={type} accentColor={accentColor} />
    </Animated.View>
  );
};

// singleton instance
export const ToastContainer = () => {
  const [visibleToasts, setVisibleToasts] = useState<ToastData[]>([]);
  const [theme, setTheme] = useState<ToastTheme>(() => toastStore.getTheme());
  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    const initialState = toastStore.getState();
    setVisibleToasts(initialState.visibleToasts);
    setTheme(toastStore.getTheme());

    return toastStore.subscribe((state: ToastState) => {
      setVisibleToasts(state.visibleToasts);
      setTheme(toastStore.getTheme());
    });
  }, []);

  // Calculate visual index for each toast (exiting toasts don't count)
  const getVisualIndex = useCallback(
    (toastId: string) => {
      let visualIndex = 0;
      for (const t of visibleToasts) {
        if (t.id === toastId) break;
        if (!t.isExiting) visualIndex++;
      }
      return visualIndex;
    },
    [visibleToasts]
  );

  // Memoize the reversed array to avoid recreating on each render
  const reversedToasts = useMemo(() => [...visibleToasts].reverse(), [visibleToasts]);

  if (visibleToasts.length === 0) {
    return null;
  }

  const isBottom = theme.position === "bottom";
  const inset = isBottom ? bottom : top;
  const positionStyle = isBottom ? { bottom: inset + theme.offset + 2 } : { top: inset + theme.offset + 2 };

  return (
    <View style={[styles.container, positionStyle]} pointerEvents="box-none">
      {reversedToasts.map(toast => {
        const index = toast.isExiting ? -1 : getVisualIndex(toast.id);
        return <MemoizedToastItem key={toast.id} toast={toast} index={index} theme={theme} position={theme.position} />;
      })}
    </View>
  );
};

interface ToastItemProps {
  toast: ToastData;
  index: number;
  theme: ToastTheme;
  position: ToastPosition;
}

const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);
const ToY = 0;
const Duration = 400;
const ExitDuration = 350;
const MaxDragDown = 60;

const ToastItem = ({ toast, index, theme, position }: ToastItemProps) => {
  const progress = useSharedValue(0);
  const translationY = useSharedValue(0);
  const isBeingDragged = useSharedValue(false);
  const shouldDismiss = useSharedValue(false);

  // Position-based animation values
  const isBottom = position === "bottom";
  const entryFromY = isBottom ? 80 : -80;
  const exitToY = isBottom ? 100 : -100;

  // Stack position animation
  const stackIndex = useSharedValue(index);

  // Title color animation on variant change
  const colorProgress = useSharedValue(1);
  const fromColor = useSharedValue(theme.colors[toast.type].accent);
  const toColor = useSharedValue(theme.colors[toast.type].accent);

  // Refs for tracking previous values to avoid unnecessary animations
  const lastHandledType = useRef(toast.type);
  const prevIndex = useRef(index);
  const hasEntered = useRef(false);

  // Combined animation effect for entry, exit, color transitions, and stack position
  useEffect(() => {
    // Entry animation (only once on mount)
    if (!hasEntered.current && !toast.isExiting) {
      progress.value = withTiming(1, { duration: Duration, easing: EASING });
      hasEntered.current = true;
    }

    // Exit animation when isExiting becomes true
    if (toast.isExiting) {
      progress.value = withTiming(0, { duration: ExitDuration, easing: EASING });
      translationY.value = withTiming(exitToY, { duration: ExitDuration, easing: EASING });
    }

    // Color transition when type changes
    if (toast.type !== lastHandledType.current) {
      fromColor.value = theme.colors[lastHandledType.current].accent;
      toColor.value = theme.colors[toast.type].accent;
      lastHandledType.current = toast.type;
      colorProgress.value = 0;
      colorProgress.value = withTiming(1, { duration: 300, easing: EASING });
    }

    // Stack position animation when index changes
    if (index >= 0 && prevIndex.current !== index) {
      stackIndex.value = withTiming(index, { duration: 300, easing: EASING });
      prevIndex.current = index;
    }
  }, [
    toast.isExiting,
    toast.type,
    index,
    progress,
    translationY,
    fromColor,
    toColor,
    colorProgress,
    stackIndex,
    exitToY,
    theme.colors,
  ]);

  const titleColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(colorProgress.value, [0, 1], [fromColor.value, toColor.value]),
  }));

  const dismissToast = useCallback(() => {
    toastStore.hide(toast.id);
  }, [toast.id]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      isBeingDragged.value = true;
      shouldDismiss.value = false;
    })
    .onUpdate(event => {
      "worklet";
      const rawY = event.translationY;
      // For top: negative Y = dismiss direction, positive Y = resistance
      // For bottom: positive Y = dismiss direction, negative Y = resistance
      const dismissDrag = isBottom ? rawY : -rawY;
      const resistDrag = isBottom ? -rawY : rawY;

      if (dismissDrag > 0) {
        // Moving toward dismiss direction
        const clampedY = isBottom ? Math.min(rawY, 180) : Math.max(rawY, -180);
        translationY.value = clampedY;
        if (dismissDrag > 40 || (isBottom ? event.velocityY > 300 : event.velocityY < -300)) {
          shouldDismiss.value = true;
        }
      } else {
        // Moving away from edge - apply resistance
        const exponentialDrag = MaxDragDown * (1 - Math.exp(-resistDrag / 250));
        translationY.value = isBottom
          ? -Math.min(exponentialDrag, MaxDragDown)
          : Math.min(exponentialDrag, MaxDragDown);
        shouldDismiss.value = false;
      }
    })
    .onEnd(() => {
      "worklet";
      isBeingDragged.value = false;

      if (shouldDismiss.value) {
        progress.value = withTiming(0, {
          duration: ExitDuration,
          easing: EASING,
        });
        const exitOffset = isBottom ? 200 : -200;
        translationY.value = withTiming(translationY.value + exitOffset, {
          duration: ExitDuration,
          easing: EASING,
        });
        scheduleOnRN(dismissToast);
      } else {
        translationY.value = withTiming(0, {
          duration: 650,
          easing: EASING,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const baseTranslateY = interpolate(progress.value, [0, 1], [entryFromY, ToY]);

    // Stack offset: each toast behind moves away from edge (up for top, down for bottom)
    const stackOffsetY = isBottom ? stackIndex.value * 10 : stackIndex.value * -10;

    // Stack scale: each toast behind scales down by 0.05
    const stackScale = 1 - stackIndex.value * 0.05;

    const finalTranslateY = baseTranslateY + translationY.value + stackOffsetY;

    const progressOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    // For top: dragging up (negative) fades out. For bottom: dragging down (positive) fades out
    const dismissDirection = isBottom ? translationY.value : -translationY.value;
    const dragOpacity = dismissDirection > 0 ? interpolate(dismissDirection, [0, 130], [1, 0], "clamp") : 1;
    const opacity = progressOpacity * dragOpacity;

    const dragScale = interpolate(Math.abs(translationY.value), [0, 50], [1, 0.98], "clamp");
    const scale = stackScale * dragScale;

    return {
      transform: [{ translateY: finalTranslateY }, { scale }],
      opacity,
      zIndex: 1000 - stackIndex.value,
    };
  });

  const accentColor = theme.colors[toast.type].accent;
  const backgroundColor = theme.colors[toast.type].background;
  const verticalAnchor = isBottom ? { bottom: 0 } : { top: 0 };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.toast, verticalAnchor, { backgroundColor }, theme.toastStyle, animatedStyle]}>
        <View style={styles.content}>
          <View style={styles.icon}>
            <AnimatedIcon key={toast.type} type={toast.type} accentColor={accentColor} />
          </View>
          <View style={styles.textContainer}>
            <Animated.Text
              maxFontSizeMultiplier={1.35}
              allowFontScaling={false}
              style={[styles.title, theme.titleStyle, titleColorStyle]}
            >
              {toast.title}
            </Animated.Text>
            {toast.description && (
              <Text
                allowFontScaling={false}
                maxFontSizeMultiplier={1.35}
                style={[styles.description, theme.descriptionStyle]}
              >
                {toast.description}
              </Text>
            )}
          </View>
          {toast.type !== "loading" && (
            <Pressable style={styles.closeButton} onPress={dismissToast} hitSlop={12}>
              <CloseIcon width={20} height={20} />
            </Pressable>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const MemoizedToastItem = memo(ToastItem);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  closeButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 20,
    paddingRight: 16,
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 36,
  },
  description: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  textContainer: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  toast: {
    borderRadius: 20,
    borderCurve: "continuous",
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 8,
  },
});
