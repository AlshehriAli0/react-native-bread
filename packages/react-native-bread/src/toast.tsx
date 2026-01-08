import { memo, useCallback, useEffect, useMemo, useState } from "react";
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

  // Variant animation (loading -> success/error)
  const variantProgress = useSharedValue(1);
  const previousType = useSharedValue<ToastType | null>(null);
  const [prevType, setPrevType] = useState<ToastType | null>(null);
  const prevColor = useSharedValue<string>(TOAST_VARIANT_COLORS.loading);
  const nextColor = useSharedValue<string>(TOAST_VARIANT_COLORS.loading);

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

  // Entry animation
  useEffect(() => {
    progress.value = withTiming(1, {
      duration: Duration,
      easing: EASING,
    });
  }, [progress]);

  // Exit animation when isExiting becomes true
  useEffect(() => {
    if (toast.isExiting) {
      progress.value = withTiming(0, {
        duration: ExitDuration,
        easing: EASING,
      });
      translationY.value = withTiming(-100, {
        duration: ExitDuration,
        easing: EASING,
      });
    }
  }, [toast.isExiting, progress, translationY]);

  // Update stack position when index changes (skip if exiting)
  useEffect(() => {
    if (index >= 0) {
      stackIndex.value = withTiming(index, {
        duration: 300,
        easing: EASING,
      });
    }
  }, [index, stackIndex]);

  // Variant change animation (loading -> success/error)
  useEffect(() => {
    if (toast.type && toast.type !== previousType.value) {
      setPrevType(previousType.value);

      const fromClr = previousType.value ? TOAST_VARIANT_COLORS[previousType.value] : TOAST_VARIANT_COLORS.loading;
      prevColor.value = fromClr;
      nextColor.value = TOAST_VARIANT_COLORS[toast.type] ?? TOAST_VARIANT_COLORS.loading;

      previousType.value = toast.type;

      variantProgress.value = 0;
      variantProgress.value = withTiming(1, {
        duration: 350,
        easing: EASING,
      });
    }
  }, [toast.type, previousType, prevColor, nextColor, variantProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseTranslateY = interpolate(progress.value, [0, 1], [FromY, ToY]);

    // Stack offset: each toast behind moves up by 10px
    const stackOffsetY = stackIndex.value * -10;

    // Stack scale: each toast behind scales down by 0.05
    const stackScale = 1 - stackIndex.value * 0.05;

    const finalTranslateY = baseTranslateY + translationY.value + stackOffsetY;

    const progressOpacity = interpolate(progress.value, [0, 1], [0, 1]);
    const dragOpacity = translationY.value < 0 ? interpolate(translationY.value, [0, -90], [1, 0], "clamp") : 1;
    const opacity = progressOpacity * dragOpacity;

    const dragScale = interpolate(Math.abs(translationY.value), [0, 50], [1, 0.98], "clamp");
    const scale = stackScale * dragScale;

    return {
      transform: [{ translateY: finalTranslateY }, { scale }],
      opacity,
      zIndex: 1000 - stackIndex.value,
    };
  });

  const prevIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - variantProgress.value,
    transform: [{ scale: interpolate(variantProgress.value, [0, 1], [1, 0.8], "clamp") }],
  }));

  const currentIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: variantProgress.value,
    transform: [{ scale: interpolate(variantProgress.value, [0, 1], [0.8, 1], "clamp") }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(variantProgress.value, [0, 1], [prevColor.value, nextColor.value]),
  }));

  const renderPlainIcon = (type: ToastType) => {
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.toast, animatedStyle]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {prevType && (
              <Animated.View style={[StyleSheet.absoluteFill, styles.icon, prevIconAnimatedStyle]}>
                {renderPlainIcon(prevType)}
              </Animated.View>
            )}
            <Animated.View style={[styles.icon, currentIconAnimatedStyle]}>{renderPlainIcon(toast.type)}</Animated.View>
          </View>
          <View style={styles.textContainer}>
            <Animated.Text
              maxFontSizeMultiplier={1.35}
              allowFontScaling={false}
              style={[styles.title, titleAnimatedStyle]}
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
    minHeight: 80,
  },
  description: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
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
