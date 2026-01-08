import type { ReactNode } from "react";
import type { TextStyle, ViewStyle } from "react-native";

export type ToastType = "success" | "error" | "info" | "loading";

export type ToastPosition = "top" | "bottom";

export interface ToastTypeColors {
  /** Accent color used for title text and icons */
  accent: string;
  /** Background color of the toast */
  background: string;
}

/** Props passed to custom icon render functions */
export interface IconProps {
  /** The accent color from the theme for this toast type */
  color: string;
  /** Default icon size */
  size: number;
}

/** Custom icon render function */
export type IconRenderFn = (props: IconProps) => ReactNode;

export interface ToastTheme {
  /** Position of toasts on screen */
  position: ToastPosition;
  /** Extra offset from safe area edge (in addition to safe area insets) */
  offset: number;
  /** Whether to show multiple toasts stacked (default: true). When false, only one toast shows at a time. */
  stacking: boolean;
  /** Maximum number of toasts visible at once when stacking is enabled (default: 3) */
  maxStack: number;
  /** Whether toasts can be dismissed via swipe gesture (default: true) */
  dismissible: boolean;
  /** Whether to show the close button on toasts (default: true). Loading toasts never show close button. */
  showCloseButton: boolean;
  /** Colors for each toast type */
  colors: Record<ToastType, ToastTypeColors>;
  /** Custom icons for each toast type */
  icons: Partial<Record<ToastType, IconRenderFn>>;
  /** Style overrides for the toast container */
  toastStyle: ViewStyle;
  /** Style overrides for the title text */
  titleStyle: TextStyle;
  /** Style overrides for the description text */
  descriptionStyle: TextStyle;
  /** Default duration in ms for toasts (default: 4000) */
  defaultDuration: number;
}

/** Per-toast options for customizing individual toasts */
export interface ToastOptions {
  /** Description text */
  description?: string;
  /** Duration in ms (overrides default) */
  duration?: number;
  /** Custom icon (ReactNode or render function) */
  icon?: ReactNode | IconRenderFn;
  /** Style overrides for this toast's container */
  style?: ViewStyle;
  /** Style overrides for this toast's title */
  titleStyle?: TextStyle;
  /** Style overrides for this toast's description */
  descriptionStyle?: TextStyle;
  /** Whether this toast can be dismissed via swipe (overrides config) */
  dismissible?: boolean;
  /** Whether to show the close button on this toast (overrides config) */
  showCloseButton?: boolean;
}

/** Configuration options for customizing toast behavior and appearance. All properties are optional. */
export type ToastConfig = {
  [K in keyof ToastTheme]?: K extends "colors"
    ? Partial<Record<ToastType, Partial<ToastTypeColors>>>
    : K extends "icons"
      ? Partial<Record<ToastType, IconRenderFn>>
      : ToastTheme[K];
};

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  createdAt: number;
  isExiting?: boolean;
  /** Per-toast style/icon overrides */
  options?: ToastOptions;
}

export interface ToastState {
  /** Visible toasts (index 0 = front/newest) */
  visibleToasts: Toast[];
}

// --- Promise helper types ---
export type MessageInput =
  | string
  | {
      title: string;
      description?: string;
      /** Override duration (ms) after promise settles */
      duration?: number;
    };

export type ErrorMessageInput = MessageInput | ((error: Error) => MessageInput);

export interface PromiseMessages {
  loading: MessageInput;
  success: MessageInput;
  error: ErrorMessageInput;
}

export interface PromiseResult<T> {
  data?: T;
  error?: Error;
  success: boolean;
}
