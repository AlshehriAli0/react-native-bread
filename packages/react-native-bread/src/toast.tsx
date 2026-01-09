import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { CloseIcon, GreenCheck, InfoIcon, RedX } from "./icons";
import { type Toast as ToastData, type ToastState, type ToastType, toastStore } from "./toast-store";
import type { IconRenderFn, ToastPosition, ToastTheme } from "./types";

const ICON_SIZE = 28;

/** Memoized default icons to prevent SVG re-renders */
const MemoizedGreenCheck = memo(({ fill }: { fill: string }) => <GreenCheck width={36} height={36} fill={fill} />);
const MemoizedRedX = memo(({ fill }: { fill: string }) => <RedX width={ICON_SIZE} height={ICON_SIZE} fill={fill} />);
const MemoizedInfoIcon = memo(({ fill }: { fill: string }) => (
  <InfoIcon width={ICON_SIZE} height={ICON_SIZE} fill={fill} />
));
const MemoizedCloseIcon = memo(() => <CloseIcon width={20} height={20} />);

/** Default icon for each toast type - memoized */
const DefaultIcon = memo(({ type, accentColor }: { type: ToastType; accentColor: string }) => {
  switch (type) {
    case "success":
      return <MemoizedGreenCheck fill={accentColor} />;
    case "error":
      return <MemoizedRedX fill={accentColor} />;
    case "loading":
      return <ActivityIndicator size={ICON_SIZE} color={accentColor} />;
    case "info":
      return <MemoizedInfoIcon fill={accentColor} />;
    default:
      return <MemoizedGreenCheck fill={accentColor} />;
  }
});

interface AnimatedIconProps {
  type: ToastType;
  accentColor: string;
  customIcon?: ReactNode | IconRenderFn;
  configIcon?: IconRenderFn;
}

/** Resolves the icon to render - checks per-toast, then config, then default */
const resolveIcon = (
  type: ToastType,
  accentColor: string,
  customIcon?: ReactNode | IconRenderFn,
  configIcon?: IconRenderFn
): ReactNode => {
  if (customIcon) {
    if (typeof customIcon === "function") {
      return customIcon({ color: accentColor, size: ICON_SIZE });
    }
    return customIcon;
  }
  if (configIcon) {
    return configIcon({ color: accentColor, size: ICON_SIZE });
  }
  return <DefaultIcon type={type} accentColor={accentColor} />;
};

/** Animated icon wrapper with scale/fade animation */
const AnimatedIcon = memo(({ type, accentColor, customIcon, configIcon }: AnimatedIconProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.back(1.5)) });
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + progress.value * 0.3 }],
  }));

  return <Animated.View style={style}>{resolveIcon(type, accentColor, customIcon, configIcon)}</Animated.View>;
});

interface ToastContentProps {
  type: ToastType;
  title: string;
  description?: string;
  accentColor: string;
  customIcon?: ReactNode | IconRenderFn;
  configIcon?: IconRenderFn;
  showCloseButton: boolean;
  onDismiss: () => void;
  titleStyle?: object;
  descriptionStyle?: object;
  optionsTitleStyle?: object;
  optionsDescriptionStyle?: object;
}

/** Memoized toast content to prevent inline JSX recreation */
const ToastContent = memo(
  ({
    type,
    title,
    description,
    accentColor,
    customIcon,
    configIcon,
    showCloseButton,
    onDismiss,
    titleStyle,
    descriptionStyle,
    optionsTitleStyle,
    optionsDescriptionStyle,
  }: ToastContentProps) => (
    <View style={styles.content}>
      <View style={styles.icon}>
        <AnimatedIcon key={type} type={type} accentColor={accentColor} customIcon={customIcon} configIcon={configIcon} />
      </View>
      <View style={styles.textContainer}>
        <Text
          maxFontSizeMultiplier={1.35}
          allowFontScaling={false}
          style={[styles.title, { color: accentColor }, titleStyle, optionsTitleStyle]}
        >
          {title}
        </Text>
        {description && (
          <Text
            allowFontScaling={false}
            maxFontSizeMultiplier={1.35}
            style={[styles.description, descriptionStyle, optionsDescriptionStyle]}
          >
            {description}
          </Text>
        )}
      </View>
      {showCloseButton && (
        <Pressable style={styles.closeButton} onPress={onDismiss} hitSlop={12}>
          <MemoizedCloseIcon />
        </Pressable>
      )}
    </View>
  )
);

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

  // Refs for tracking previous values to avoid unnecessary animations
  const lastHandledType = useRef(toast.type);
  const prevIndex = useRef(index);
  const hasEntered = useRef(false);

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

    // Track type changes (for icon animation via key)
    if (toast.type !== lastHandledType.current) {
      lastHandledType.current = toast.type;
    }

    // Stack position animation when index changes
    if (index >= 0 && prevIndex.current !== index) {
      stackIndex.value = withTiming(index, { duration: 300, easing: EASING });
      prevIndex.current = index;
    }
  }, [toast.isExiting, toast.type, index, progress, translationY, stackIndex, exitToY]);

  const dismissToast = useCallback(() => {
    toastStore.hide(toast.id);
  }, [toast.id]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
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
        }),
    [isBottom, dismissToast, progress, translationY, shouldDismiss, isBeingDragged]
  );

  // Memoize disabled gesture to avoid recreation on every render
  const disabledGesture = useMemo(() => Gesture.Pan().enabled(false), []);

  // Derive zIndex separately - it's not animatable and shouldn't trigger worklet re-runs
  const zIndex = useDerivedValue(() => 1000 - Math.round(stackIndex.value));

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
      zIndex: zIndex.value,
    };
  });

  const accentColor = theme.colors[toast.type].accent;
  const backgroundColor = theme.colors[toast.type].background;
  const verticalAnchor = isBottom ? { bottom: 0 } : { top: 0 };

  // Per-toast overrides from options
  const { options } = toast;
  const customIcon = options?.icon;
  const configIcon = theme.icons[toast.type];

  // Resolve dismissible and showCloseButton (per-toast overrides config)
  const isDismissible = options?.dismissible ?? theme.dismissible;
  const shouldShowCloseButton = toast.type !== "loading" && (options?.showCloseButton ?? theme.showCloseButton);

  // Enable/disable gesture based on dismissible setting
  const gesture = isDismissible ? panGesture : disabledGesture;

  const animStyle = [
    styles.toast,
    verticalAnchor,
    { backgroundColor },
    theme.toastStyle,
    options?.style,
    animatedStyle,
  ];

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animStyle}>
        <ToastContent
          type={toast.type}
          title={toast.title}
          description={toast.description}
          accentColor={accentColor}
          customIcon={customIcon}
          configIcon={configIcon}
          showCloseButton={shouldShowCloseButton}
          onDismiss={dismissToast}
          titleStyle={theme.titleStyle}
          descriptionStyle={theme.descriptionStyle}
          optionsTitleStyle={options?.titleStyle}
          optionsDescriptionStyle={options?.descriptionStyle}
        />
      </Animated.View>
    </GestureDetector>
  );
};

// Custom comparison to prevent re-renders when toast object reference changes but content is same
const MemoizedToastItem = memo(ToastItem, (prev, next) => {
  return (
    prev.toast.id === next.toast.id &&
    prev.toast.type === next.toast.type &&
    prev.toast.title === next.toast.title &&
    prev.toast.description === next.toast.description &&
    prev.toast.isExiting === next.toast.isExiting &&
    prev.index === next.index &&
    prev.position === next.position &&
    prev.theme === next.theme
  );
});

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
    marginLeft: 8,
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
    gap: 1,
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
