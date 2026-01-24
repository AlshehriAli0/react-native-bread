import { Easing } from "react-native-reanimated";

export const ICON_SIZE = 28;
export const POOL_SIZE = 5;

export const ENTRY_DURATION = 400;
export const EXIT_DURATION = 350;
export const STACK_TRANSITION_DURATION = 300;
export const SPRING_BACK_DURATION = 650;
export const ICON_ANIMATION_DURATION = 350;

export const ENTRY_OFFSET = 80;
export const EXIT_OFFSET = 100;
export const SWIPE_EXIT_OFFSET = 200;
export const MAX_DRAG_CLAMP = 180;
export const MAX_DRAG_RESISTANCE = 60;
export const DISMISS_THRESHOLD = 40;
export const DISMISS_VELOCITY_THRESHOLD = 300;

export const STACK_OFFSET_PER_ITEM = 10;
export const STACK_SCALE_PER_ITEM = 0.05;

export const EASING = Easing.bezier(0.25, 0.1, 0.25, 1.0);