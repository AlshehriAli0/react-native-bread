import type { TextStyle, ViewStyle } from "react-native";

export type ToastType = "success" | "error" | "info" | "loading";

export type ToastPosition = "top" | "bottom";

export interface ToastTypeColors {
  /** Accent color used for title text and icons */
  accent: string;
  /** Background color of the toast */
  background: string;
}

export interface ToastTheme {
  /** Position of toasts on screen */
  position: ToastPosition;
  /** Extra offset from safe area edge (in addition to safe area insets) */
  offset: number;
  /** Whether to show multiple toasts stacked (default: true). When false, only one toast shows at a time. */
  stacking: boolean;
  /** Colors for each toast type */
  colors: Record<ToastType, ToastTypeColors>;
  /** Style overrides for the toast container */
  toastStyle: ViewStyle;
  /** Style overrides for the title text */
  titleStyle: TextStyle;
  /** Style overrides for the description text */
  descriptionStyle: TextStyle;
  /** Default duration in ms for toasts (default: 4000) */
  defaultDuration: number;
}

/** Configuration options for customizing toast behavior and appearance. All properties are optional. */
export type ToastConfig = {
  [K in keyof ToastTheme]?: K extends "colors" ? Partial<Record<ToastType, Partial<ToastTypeColors>>> : ToastTheme[K];
};

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  createdAt: number;
  isExiting?: boolean;
}

export interface ToastState {
  /** Up to 3 visible toasts (index 0 = front/newest, index 2 = back/oldest) */
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
