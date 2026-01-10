import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  makeMutable,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { CloseIcon, GreenCheck, InfoIcon, RedX } from "./icons";
import { type Toast as ToastData, type ToastState, type ToastType, toastStore } from "./toast-store";
import type { IconRenderFn, ToastPosition, ToastTheme } from "./types";

// ============================================================================
// Constants
// ============================================================================

const ICON_SIZE = 28;
const POOL_SIZE = 5;

// Animation timing
const ENTRY_DURATION = 400;
const EXIT_DURATION = 350;
const STACK_TRANSITION_DURATION = 300;
const SPRING_BACK_DURATION = 650;
const ICON_ANIMATION_DURATION = 350;

// Animation values
const ENTRY_OFFSET = 80;
const EXIT_OFFSET = 100;
const SWIPE_EXIT_OFFSET = 200;
const MAX_DRAG_CLAMP = 180;
const MAX_DRAG_RESISTANCE = 60;
const DISMISS_THRESHOLD = 40;
const DISMISS_VELOCITY_THRESHOLD = 300;

// Stack animation
const STACK_OFFSET_PER_ITEM = 10;
const STACK_SCALE_PER_ITEM = 0.05;

// Shared easing curve
const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);

// ============================================================================
// Animation Pool - Module level, created once outside React
// ============================================================================

// Animation values only - passed to worklets
interface AnimSlot {
  progress: SharedValue<number>;
  translationY: SharedValue<number>;
  stackIndex: SharedValue<number>;
}

// JS-only tracking state - never passed to worklets
interface SlotTracker {
  wasExiting: boolean;
  prevIndex: number;
  initialized: boolean;
}

// Pre-create all animation state outside React - no per-toast hook overhead
const animationPool: AnimSlot[] = Array.from({ length: POOL_SIZE }, () => ({
  progress: makeMutable(0),
  translationY: makeMutable(0),
  stackIndex: makeMutable(0),
}));

// JS-only tracking state - kept separate to avoid worklet serialization issues
const slotTrackers: SlotTracker[] = Array.from({ length: POOL_SIZE }, () => ({
  wasExiting: false,
  prevIndex: 0,
  initialized: false,
}));

// Track slot assignments
const slotAssignments = new Map<string, number>();
const usedSlots = new Set<number>();

const getSlotIndex = (toastId: string): number => {
  if (slotAssignments.has(toastId)) {
    return slotAssignments.get(toastId) ?? 0;
  }
  // Find free slot
  for (let i = 0; i < POOL_SIZE; i++) {
    if (!usedSlots.has(i)) {
      slotAssignments.set(toastId, i);
      usedSlots.add(i);
      // Reset tracker state for new assignment
      slotTrackers[i].initialized = false;
      slotTrackers[i].wasExiting = false;
      slotTrackers[i].prevIndex = 0;
      return i;
    }
  }
  // Fallback to first slot if all used
  return 0;
};

const releaseSlot = (toastId: string) => {
  const idx = slotAssignments.get(toastId);
  if (idx !== undefined) {
    usedSlots.delete(idx);
    slotAssignments.delete(toastId);
    // Reset the tracker
    slotTrackers[idx].initialized = false;
    slotTrackers[idx].wasExiting = false;
    slotTrackers[idx].prevIndex = 0;
  }
};

// ============================================================================
// Types
// ============================================================================

interface TopToastRef {
  slot: AnimSlot;
  dismiss: () => void;
}

interface ToastItemProps {
  toast: ToastData;
  index: number;
  theme: ToastTheme;
  position: ToastPosition;
  isTopToast: boolean;
  registerTopToast: (values: TopToastRef | null) => void;
}

// Icon resolution - handles custom, config, and default icons
const resolveIcon = (type: ToastType, color: string, custom?: ReactNode | IconRenderFn, config?: IconRenderFn) => {
  if (custom) return typeof custom === "function" ? custom({ color, size: ICON_SIZE }) : custom;
  if (config) return config({ color, size: ICON_SIZE });
  switch (type) {
    case "success":
      return <GreenCheck width={36} height={36} fill={color} />;
    case "error":
      return <RedX width={ICON_SIZE} height={ICON_SIZE} fill={color} />;
    case "loading":
      return <ActivityIndicator size={ICON_SIZE} color={color} />;
    case "info":
      return <InfoIcon width={ICON_SIZE} height={ICON_SIZE} fill={color} />;
    default:
      return <GreenCheck width={36} height={36} fill={color} />;
  }
};

// Only used for promise resolution (loading -> success/error)
const AnimatedIcon = memo(
  ({
    type,
    color,
    custom,
    config,
  }: {
    type: ToastType;
    color: string;
    custom?: ReactNode | IconRenderFn;
    config?: IconRenderFn;
  }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
      progress.value = withTiming(1, {
        duration: ICON_ANIMATION_DURATION,
        easing: Easing.out(Easing.back(1.5)),
      });
    }, [progress]);

    const style = useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [{ scale: 0.7 + progress.value * 0.3 }],
    }));

    return <Animated.View style={style}>{resolveIcon(type, color, custom, config)}</Animated.View>;
  }
);

// ============================================================================
// Toast Container (singleton)
// ============================================================================

export const ToastContainer = () => {
  const [visibleToasts, setVisibleToasts] = useState<ToastData[]>([]);
  const [theme, setTheme] = useState<ToastTheme>(() => toastStore.getTheme());
  const { top, bottom } = useSafeAreaInsets();

  // Mutable refs accessible from worklets - avoids gesture recreation
  const topToastRef = useRef(makeMutable<TopToastRef | null>(null));
  const isBottomRef = useRef(makeMutable(theme.position === "bottom"));
  const isDismissibleRef = useRef(makeMutable(true));
  const shouldDismiss = useSharedValue(false);

  useEffect(() => {
    setVisibleToasts(toastStore.getState().visibleToasts);

    // RAF batching to prevent iOS FPS drops from rapid state updates
    let pendingToasts: ToastData[] | null = null;
    let rafId: number | null = null;

    return toastStore.subscribe((state: ToastState) => {
      pendingToasts = state.visibleToasts;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingToasts) {
            setVisibleToasts(pendingToasts);
            pendingToasts = null;
          }
          rafId = null;
          const newTheme = toastStore.getTheme();
          setTheme(prev => (prev === newTheme ? prev : newTheme));
        });
      }
    });
  }, []);

  // Pre-compute visual indices once
  const toastsWithIndex = useMemo(() => {
    const indices = new Map<string, number>();
    let visualIndex = 0;
    for (const t of visibleToasts) {
      indices.set(t.id, t.isExiting ? -1 : visualIndex);
      if (!t.isExiting) visualIndex++;
    }
    // Reverse for rendering (newest on top in z-order)
    return [...visibleToasts].reverse().map(t => ({
      toast: t,
      index: indices.get(t.id) ?? 0,
    }));
  }, [visibleToasts]);

  const isBottom = theme.position === "bottom";
  const topToast = visibleToasts.find(t => !t.isExiting);
  const isTopDismissible = topToast?.options?.dismissible ?? theme.dismissible;

  // Update mutable refs when values change (in effect to avoid render-time writes)
  useEffect(() => {
    isBottomRef.current.value = isBottom;
    isDismissibleRef.current.value = isTopDismissible;
  }, [isBottom, isTopDismissible]);

  // Single gesture handler - reads from refs so it never needs recreation
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          "worklet";
          shouldDismiss.value = false;
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
            // Dragging toward dismiss direction
            const clampedY = bottom ? Math.min(rawY, MAX_DRAG_CLAMP) : Math.max(rawY, -MAX_DRAG_CLAMP);
            slot.translationY.value = clampedY;

            const shouldTriggerDismiss =
              dismissDrag > DISMISS_THRESHOLD ||
              (bottom ? event.velocityY > DISMISS_VELOCITY_THRESHOLD : event.velocityY < -DISMISS_VELOCITY_THRESHOLD);
            shouldDismiss.value = shouldTriggerDismiss;
          } else {
            // Dragging away from edge - apply exponential resistance
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
    [shouldDismiss]
  );

  const registerTopToast = useCallback((values: TopToastRef | null) => {
    topToastRef.current.value = values;
  }, []);

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

// ============================================================================
// Toast Item - Animations triggered directly via shared value assignments
// ============================================================================

const ToastItem = ({ toast, index, theme, position, isTopToast, registerTopToast }: ToastItemProps) => {
  // Get slot index from pool - store in ref so it persists
  const slotIndexRef = useRef<number | null>(null);
  if (slotIndexRef.current === null) {
    slotIndexRef.current = getSlotIndex(toast.id);
  }
  const slotIdx = slotIndexRef.current;
  const slot = animationPool[slotIdx];
  const tracker = slotTrackers[slotIdx];

  const isBottom = position === "bottom";
  const entryFromY = isBottom ? ENTRY_OFFSET : -ENTRY_OFFSET;
  const exitToY = isBottom ? EXIT_OFFSET : -EXIT_OFFSET;

  const prevType = useRef(toast.type);
  const [showIcon, setShowIcon] = useState(false);

  // Release slot on unmount
  useEffect(() => {
    return () => {
      releaseSlot(toast.id);
    };
  }, [toast.id]);

  // Trigger entry animation on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useEffect(() => {
    // Initialize and trigger entry animation
    slot.progress.value = 0;
    slot.translationY.value = 0;
    slot.stackIndex.value = index;
    slot.progress.value = withTiming(1, { duration: ENTRY_DURATION, easing: EASING });
  }, []);

  // Trigger exit animation when isExiting changes
  useEffect(() => {
    if (toast.isExiting && !tracker.wasExiting) {
      tracker.wasExiting = true;
      slot.progress.value = withTiming(0, { duration: EXIT_DURATION, easing: EASING });
      slot.translationY.value = withTiming(exitToY, { duration: EXIT_DURATION, easing: EASING });
    }
  }, [toast.isExiting, slot, tracker, exitToY]);

  // Trigger stack position animation when index changes
  useEffect(() => {
    if (tracker.initialized && index !== tracker.prevIndex) {
      slot.stackIndex.value = withTiming(index, { duration: STACK_TRANSITION_DURATION, easing: EASING });
    }
    tracker.prevIndex = index;
    tracker.initialized = true;
  }, [index, slot, tracker]);

  // Defer icon rendering until after entry animation starts
  useEffect(() => {
    const timeout = setTimeout(() => setShowIcon(true), 50);
    return () => clearTimeout(timeout);
  }, []);

  // Only animate icon when transitioning from loading (promise resolution)
  const shouldAnimateIcon = prevType.current === "loading" && toast.type !== "loading";
  prevType.current = toast.type;

  const dismissToast = useCallback(() => {
    toastStore.hide(toast.id);
  }, [toast.id]);

  // Register with container when this is the top toast
  useEffect(() => {
    if (isTopToast) {
      registerTopToast({ slot, dismiss: dismissToast });
      return () => registerTopToast(null);
    }
  }, [isTopToast, registerTopToast, slot, dismissToast]);

  // Animated style - all computation happens on UI thread
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

// ============================================================================
// Styles
// ============================================================================

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
