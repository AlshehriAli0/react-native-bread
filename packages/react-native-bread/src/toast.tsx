import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import {
  DISMISS_THRESHOLD,
  DISMISS_VELOCITY_THRESHOLD,
  EASING,
  ENTRY_DURATION,
  ENTRY_OFFSET,
  EXIT_DURATION,
  EXIT_OFFSET,
  ICON_ANIMATION_DURATION,
  MAX_DRAG_CLAMP,
  MAX_DRAG_RESISTANCE,
  SPRING_BACK_DURATION,
  STACK_OFFSET_PER_ITEM,
  STACK_SCALE_PER_ITEM,
  STACK_TRANSITION_DURATION,
  SWIPE_EXIT_OFFSET,
} from "./constants";
import { CloseIcon } from "./icons";
import { type AnimSlot, animationPool, getSlotIndex, releaseSlot, slotTrackers } from "./pool";
import { AnimatedIcon, resolveIcon } from "./toast-icons";
import { toastStore } from "./toast-store";
import type { ToastItemProps, TopToastRef } from "./types";
import { useToastState } from "./use-toast-state";

export const ToastContainer = () => {
  const { top, bottom } = useSafeAreaInsets();
  const { visibleToasts, theme, toastsWithIndex, isBottom, topToastRef, isBottomRef, isDismissibleRef } =
    useToastState();

  const shouldDismiss = useSharedValue(false);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          "worklet";
          shouldDismiss.set(false);
        })
        .onUpdate(event => {
          "worklet";
          if (!isDismissibleRef.current.value) return;
          const ref = topToastRef.current.value;
          if (!ref) return;

          const { slot } = ref;
          const bottom = isBottomRef.current.value;
          const rawY = event.translationY;
          const dismissDrag = bottom ? rawY : -rawY;
          const resistDrag = bottom ? -rawY : rawY;

          if (dismissDrag > 0) {
            const clampedY = bottom ? Math.min(rawY, MAX_DRAG_CLAMP) : Math.max(rawY, -MAX_DRAG_CLAMP);
            slot.translationY.value = clampedY;

            const shouldTriggerDismiss =
              dismissDrag > DISMISS_THRESHOLD ||
              (bottom ? event.velocityY > DISMISS_VELOCITY_THRESHOLD : event.velocityY < -DISMISS_VELOCITY_THRESHOLD);
            shouldDismiss.set(shouldTriggerDismiss);
          } else {
            const exponentialDrag = MAX_DRAG_RESISTANCE * (1 - Math.exp(-resistDrag / 250));
            slot.translationY.value = bottom
              ? -Math.min(exponentialDrag, MAX_DRAG_RESISTANCE)
              : Math.min(exponentialDrag, MAX_DRAG_RESISTANCE);
            shouldDismiss.value = false;
          }
        })
        .onEnd(() => {
          "worklet";
          if (!isDismissibleRef.current.value) return;
          const ref = topToastRef.current.value;
          if (!ref) return;

          const { slot } = ref;
          const bottom = isBottomRef.current.value;
          if (shouldDismiss.value) {
            slot.progress.value = withTiming(0, { duration: EXIT_DURATION, easing: EASING });
            const exitOffset = bottom ? SWIPE_EXIT_OFFSET : -SWIPE_EXIT_OFFSET;
            slot.translationY.value = withTiming(slot.translationY.value + exitOffset, {
              duration: EXIT_DURATION,
              easing: EASING,
            });
            scheduleOnRN(ref.dismiss);
          } else {
            slot.translationY.value = withTiming(0, { duration: SPRING_BACK_DURATION, easing: EASING });
          }
        }),
    [shouldDismiss, isDismissibleRef, topToastRef, isBottomRef]
  );

  const registerTopToast = useCallback(
    (values: TopToastRef | null) => {
      topToastRef.current.value = values;
    },
    [topToastRef]
  );

  if (visibleToasts.length === 0) return null;

  const inset = isBottom ? bottom : top;
  const positionStyle = isBottom ? { bottom: inset + theme.offset + 2 } : { top: inset + theme.offset + 2 };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, positionStyle]} pointerEvents="box-none">
        {toastsWithIndex.map(({ toast, index }) => (
          <MemoizedToastItem
            key={toast.id}
            toast={toast}
            index={index}
            theme={theme}
            position={theme.position}
            isTopToast={index === 0}
            registerTopToast={registerTopToast}
          />
        ))}
      </View>
    </GestureDetector>
  );
};

const ToastItem = ({ toast, index, theme, position, isTopToast, registerTopToast }: ToastItemProps) => {
  const [slotIdx] = useState(() => getSlotIndex(toast.id));
  const slot = animationPool[slotIdx];
  const tracker = slotTrackers[slotIdx];

  const isBottom = position === "bottom";
  const entryFromY = isBottom ? ENTRY_OFFSET : -ENTRY_OFFSET;
  const exitToY = isBottom ? EXIT_OFFSET : -EXIT_OFFSET;

  const [wasLoading, setWasLoading] = useState(toast.type === "loading");
  const [showIcon, setShowIcon] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    slot.progress.value = 0;
    slot.translationY.value = 0;
    slot.stackIndex.value = index;
    slot.progress.value = withTiming(1, { duration: ENTRY_DURATION, easing: EASING });

    const iconTimeout = setTimeout(() => setShowIcon(true), 50);

    return () => {
      clearTimeout(iconTimeout);
      releaseSlot(toast.id);
    };
  }, []);

  const dismissToast = useCallback(() => {
    toastStore.hide(toast.id);
  }, [toast.id]);

  useEffect(() => {
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    if (toast.isExiting && !tracker.wasExiting) {
      tracker.wasExiting = true;
      slot.progress.value = withTiming(0, { duration: EXIT_DURATION, easing: EASING });
      slot.translationY.value = withTiming(exitToY, { duration: EXIT_DURATION, easing: EASING });
    }

    if (tracker.initialized && index !== tracker.prevIndex) {
      slot.stackIndex.value = withTiming(index, { duration: STACK_TRANSITION_DURATION, easing: EASING });
    }
    tracker.prevIndex = index;
    tracker.initialized = true;

    if (toast.type === "loading") {
      setWasLoading(true);
    } else if (wasLoading) {
      loadingTimeout = setTimeout(() => setWasLoading(false), ICON_ANIMATION_DURATION + 50);
    }

    if (isTopToast) {
      registerTopToast({ slot: slot as AnimSlot, dismiss: dismissToast });
    }

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (isTopToast) registerTopToast(null);
    };
  }, [
    toast.isExiting,
    index,
    slot,
    tracker,
    exitToY,
    toast.type,
    wasLoading,
    isTopToast,
    registerTopToast,
    dismissToast,
  ]);

  const shouldAnimateIcon = wasLoading && toast.type !== "loading";

  const animatedStyle = useAnimatedStyle(() => {
    const baseTranslateY = interpolate(slot.progress.value, [0, 1], [entryFromY, 0]);
    const stackOffsetY = isBottom
      ? slot.stackIndex.value * STACK_OFFSET_PER_ITEM
      : slot.stackIndex.value * -STACK_OFFSET_PER_ITEM;
    const stackScale = 1 - slot.stackIndex.value * STACK_SCALE_PER_ITEM;

    const finalTranslateY = baseTranslateY + slot.translationY.value + stackOffsetY;

    const progressOpacity = interpolate(slot.progress.value, [0, 1], [0, 1]);
    const dismissDirection = isBottom ? slot.translationY.value : -slot.translationY.value;
    const dragOpacity = dismissDirection > 0 ? interpolate(dismissDirection, [0, 130], [1, 0], "clamp") : 1;
    const opacity = progressOpacity * dragOpacity;

    const dragScale = interpolate(Math.abs(slot.translationY.value), [0, 50], [1, 0.98], "clamp");
    const scale = stackScale * dragScale;

    return {
      transform: [{ translateY: finalTranslateY }, { scale }],
      opacity,
      zIndex: 1000 - Math.round(slot.stackIndex.value),
    };
  });

  const { options } = toast;
  const colors = theme.colors[toast.type];
  const shouldShowCloseButton = toast.type !== "loading" && (options?.showCloseButton ?? theme.showCloseButton);

  return (
    <Animated.View
      style={[
        styles.toast,
        isBottom ? styles.toastBottom : styles.toastTop,
        { backgroundColor: colors.background },
        theme.rtl && styles.rtl,
        theme.toastStyle,
        options?.style,
        animatedStyle,
      ]}
    >
      <View style={styles.iconContainer}>
        {showIcon &&
          (shouldAnimateIcon ? (
            <AnimatedIcon
              key={toast.type}
              type={toast.type}
              color={colors.accent}
              custom={options?.icon}
              config={theme.icons[toast.type]}
            />
          ) : (
            resolveIcon(toast.type, colors.accent, options?.icon, theme.icons[toast.type])
          ))}
      </View>
      <View style={styles.textContainer}>
        <Text
          maxFontSizeMultiplier={1.35}
          allowFontScaling={false}
          style={[
            styles.title,
            { color: colors.accent },
            theme.rtl && { textAlign: "right" },
            theme.titleStyle,
            options?.titleStyle,
          ]}
        >
          {toast.title}
        </Text>
        {toast.description && (
          <Text
            allowFontScaling={false}
            maxFontSizeMultiplier={1.35}
            style={[
              styles.description,
              theme.rtl && { textAlign: "right" },
              theme.descriptionStyle,
              options?.descriptionStyle,
            ]}
          >
            {toast.description}
          </Text>
        )}
      </View>
      {shouldShowCloseButton && (
        <Pressable style={styles.closeButton} onPress={dismissToast} hitSlop={12}>
          <CloseIcon width={20} height={20} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const MemoizedToastItem = memo(ToastItem, (prev, next) => {
  return (
    prev.toast.id === next.toast.id &&
    prev.toast.type === next.toast.type &&
    prev.toast.title === next.toast.title &&
    prev.toast.description === next.toast.description &&
    prev.toast.isExiting === next.toast.isExiting &&
    prev.index === next.index &&
    prev.position === next.position &&
    prev.theme === next.theme &&
    prev.isTopToast === next.isTopToast
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 36,
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
  rtl: {
    flexDirection: "row-reverse",
  },
  toastTop: {
    top: 0,
  },
  toastBottom: {
    bottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  textContainer: {
    flex: 1,
    gap: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  closeButton: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
