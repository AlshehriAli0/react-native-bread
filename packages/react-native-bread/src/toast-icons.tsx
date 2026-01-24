import { memo, type ReactNode, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { ICON_ANIMATION_DURATION, ICON_SIZE } from "./constants";
import { GreenCheck, InfoIcon, RedX } from "./icons";
import type { IconRenderFn, ToastType } from "./types";

export const resolveIcon = (
  type: ToastType,
  color: string,
  custom?: ReactNode | IconRenderFn,
  config?: IconRenderFn
) => {
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

export const AnimatedIcon = memo(
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