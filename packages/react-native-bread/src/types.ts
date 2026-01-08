export type ToastType = "success" | "error" | "info" | "loading";

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
