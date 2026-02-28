import type { ReactNode } from "react";
import type { TextStyle, ViewStyle } from "react-native";
import type { SharedValue } from "react-native-reanimated";

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

/** Props passed to custom content render functions */
export interface CustomContentProps {
  /** Toast ID */
  id: string;
  /** Dismiss this toast */
  dismiss: () => void;
  /** Toast type */
  type: ToastType;
  /** Whether the toast is currently exiting */
  isExiting: boolean;
}

/** Custom content render function for fully custom toasts */
export type CustomContentRenderFn = (props: CustomContentProps) => ReactNode;

/** Custom icon render function */
export type IconRenderFn = (props: IconProps) => ReactNode;

export interface ToastTheme {
  /** Position of toasts on screen */
  position: ToastPosition;
  /** Extra offset from safe area edge (in addition to safe area insets) */
  offset: number;
  /**
   * Enable right-to-left layout at the code level (reverses icon/text order and text alignment).
   * Only needed when you handle RTL in JavaScript — native RTL (e.g. via `I18nManager.forceRTL`)
   * already flips the entire layout automatically, so this option is unnecessary in that case.
   */
  rtl: boolean;
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
  /** When true, duplicate toasts reset the timer and play a feedback animation. Matches by title+type+description, or by `id` if provided. (default: false) */
  deduplication: boolean;
}

/** Per-toast options for customizing individual toasts */
export interface ToastOptions {
  /** Stable key for deduplication. When set, toasts with the same `id` deduplicate and update the existing toast's content. Without an `id`, matching falls back to title+type+description against the front toast. */
  id?: string;
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
  /**
   * Custom content that fully replaces the default toast layout.
   * When provided, icon, title, description, and close button are not rendered.
   * Receives props: { id, dismiss, type, isExiting }
   */
  customContent?: ReactNode | CustomContentRenderFn;
  /** Enable deduplication for this toast (overrides global config). Plays a pulse animation for non-error toasts or a shake for errors. Use with `id` for stable matching across different content. */
  deduplication?: boolean;
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
  deduplicatedAt?: number;
  /** Per-toast style/icon overrides */
  options?: ToastOptions;
}

export interface ToastState {
  /** Visible toasts (index 0 = front/newest) */
  visibleToasts: Toast[];
}

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

export interface TopToastRef {
  slot: {
    progress: SharedValue<number>;
    translationY: SharedValue<number>;
    stackIndex: SharedValue<number>;
  };
  dismiss: () => void;
}

export interface ToastItemProps {
  toast: Toast;
  index: number;
  theme: ToastTheme;
  position: ToastPosition;
  isTopToast: boolean;
  registerTopToast: (values: TopToastRef | null) => void;
}
