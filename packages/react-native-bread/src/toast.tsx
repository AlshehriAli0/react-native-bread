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

const TOAST_VARIANT_COLORS = {
  loading: "#232323",
  success: "#28B770",
  error: "#F05964",
  info: "#EDBE43",
} as const;

const ToastIcon = ({ type }: { type: ToastType }) => {
  switch (type) {
    case "success":
      return <GreenCheck width={36} height={36} />;
    case "error":
      return <RedX width={28} height={28} />;
    case "loading":
      return <ActivityIndicator size={28} color="#232323" />;
    case "info":
      return <InfoIcon width={28} height={28} fill="#EDBE43" />;
    default:
      return <GreenCheck width={36} height={36} />;
  }
};

const AnimatedIcon = ({ type }: { type: ToastType }) => {
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
      <ToastIcon type={type} />
    </Animated.View>
  );
};

// singleton instance
export const ToastContainer = () => {
  const [visibleToasts, setVisibleToasts] = useState<ToastData[]>([]);
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    const initialState = toastStore.getState();
    setVisibleToasts(initialState.visibleToasts);

    return toastStore.subscribe((state: ToastState) => {
      setVisibleToasts(state.visibleToasts);
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

  return (
    <View style={[styles.container, { top: top + 2 }]} pointerEvents="box-none">
      {reversedToasts.map(toast => {
        const index = toast.isExiting ? -1 : getVisualIndex(toast.id);
        return <MemoizedToastItem key={toast.id} toast={toast} index={index} />;
      })}
    </View>
  );
};

interface ToastItemProps {
  toast: ToastData;
  index: number;
}

const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);
const FromY = -80;
const ToY = 0;
const Duration = 400;
const ExitDuration = 350;
const MaxDragDown = 60;

const ToastItem = ({ toast, index }: ToastItemProps) => {
  const progress = useSharedValue(0);
  const translationY = useSharedValue(0);
  const isBeingDragged = useSharedValue(false);
  const shouldDismiss = useSharedValue(false);

  // Stack position animation
  const stackIndex = useSharedValue(index);

  // Title color animation on variant change
  const colorProgress = useSharedValue(1);
  const fromColor = useSharedValue(TOAST_VARIANT_COLORS[toast.type]);
  const toColor = useSharedValue(TOAST_VARIANT_COLORS[toast.type]);

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
      translationY.value = withTiming(-100, { duration: ExitDuration, easing: EASING });
    }

    // Color transition when type changes
    if (toast.type !== lastHandledType.current) {
      fromColor.value = TOAST_VARIANT_COLORS[lastHandledType.current];
      toColor.value = TOAST_VARIANT_COLORS[toast.type];
      lastHandledType.current = toast.type;
      colorProgress.value = 0;
      colorProgress.value = withTiming(1, { duration: 300, easing: EASING });
    }

    // Stack position animation when index changes
    if (index >= 0 && prevIndex.current !== index) {
      stackIndex.value = withTiming(index, { duration: 300, easing: EASING });
      prevIndex.current = index;
    }
  }, [toast.isExiting, toast.type, index, progress, translationY, fromColor, toColor, colorProgress, stackIndex]);

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

      if (rawY < 0) {
        translationY.value = Math.max(rawY, -180);
        if (rawY < -40 || event.velocityY < -300) {
          shouldDismiss.value = true;
        }
      } else {
        // Exponential resistance: gets slower the further you drag
        const exponentialDrag = MaxDragDown * (1 - Math.exp(-rawY / 250));
        translationY.value = Math.min(exponentialDrag, MaxDragDown);
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
        translationY.value = withTiming(translationY.value - 200, {
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
    const baseTranslateY = interpolate(progress.value, [0, 1], [FromY, ToY]);

    // Stack offset: each toast behind moves up by 10px
    const stackOffsetY = stackIndex.value * -10;

    // Stack scale: each toast behind scales down by 0.05
    const stackScale = 1 - stackIndex.value * 0.05;

    const finalTranslateY = baseTranslateY + translationY.value + stackOffsetY;

    const progressOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    const dragOpacity = translationY.value < 0 ? interpolate(translationY.value, [0, -130], [1, 0], "clamp") : 1;
    const opacity = progressOpacity * dragOpacity;

    const dragScale = interpolate(Math.abs(translationY.value), [0, 50], [1, 0.98], "clamp");
    const scale = stackScale * dragScale;

    return {
      transform: [{ translateY: finalTranslateY }, { scale }],
      opacity,
      zIndex: 1000 - stackIndex.value,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.toast, animatedStyle]}>
        <View style={styles.content}>
          <View style={styles.icon}>
            <AnimatedIcon key={toast.type} type={toast.type} />
          </View>
          <View style={styles.textContainer}>
            <Animated.Text
              maxFontSizeMultiplier={1.35}
              allowFontScaling={false}
              style={[styles.title, titleColorStyle]}
            >
              {toast.title}
            </Animated.Text>
            {toast.description && (
              <Text allowFontScaling={false} maxFontSizeMultiplier={1.35} style={styles.description}>
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
    backgroundColor: "black",
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
    backgroundColor: "#FFFFFF",
  },
});
