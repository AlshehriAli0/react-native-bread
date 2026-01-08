import { toastStore } from "./toast-store";
import type { ErrorMessageInput, MessageInput, PromiseMessages, PromiseResult, ToastType } from "./types";

const _toast = (title: string, description?: string, type?: ToastType, duration?: number) => {
  toastStore.show(title, description, type, duration);
};

const parseMessage = (input: MessageInput): { title: string; description?: string; duration?: number } =>
  typeof input === "string" ? { title: input } : input;

const parseErrorMessage = (
  input: ErrorMessageInput,
  error: Error
): { title: string; description?: string; duration?: number } => {
  if (typeof input === "function") {
    return parseMessage(input(error));
  }
  return parseMessage(input);
};

const promiseToast = async <T>(promise: Promise<T>, messages: PromiseMessages): Promise<PromiseResult<T>> => {
  const loadingCfg = parseMessage(messages.loading);

  // Very long duration so it stays visible until we resolve/reject
  const toastId = toastStore.show(
    loadingCfg.title,
    loadingCfg.description,
    "loading",
    loadingCfg.duration ?? 60 * 60 * 1000
  );

  try {
    const result = await promise;

    const successCfg = parseMessage(messages.success);
    toastStore.updateToast(toastId, {
      title: successCfg.title,
      description: successCfg.description,
      type: "success",
      duration: successCfg.duration ?? 4000,
    });

    return { data: result, success: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const errorCfg = parseErrorMessage(messages.error, error);
    toastStore.updateToast(toastId, {
      title: errorCfg.title,
      description: errorCfg.description,
      type: "error",
      duration: errorCfg.duration ?? 4000,
    });

    return { error, success: false };
  }
};

type BaseToastFn = ((title: string, description?: string, type?: ToastType, duration?: number) => void) & {
  /**
   * Show a success toast
   * @param title - The toast title
   * @param description - Optional description text
   * @param duration - Duration in ms (default: 4000)
   */
  success: (title: string, description?: string, duration?: number) => void;
  /**
   * Show an error toast
   * @param title - The toast title
   * @param description - Optional description text
   * @param duration - Duration in ms (default: 4000)
   */
  error: (title: string, description?: string, duration?: number) => void;
  /**
   * Show an info toast
   * @param title - The toast title
   * @param description - Optional description text
   * @param duration - Duration in ms (default: 4000)
   */
  info: (title: string, description?: string, duration?: number) => void;
  /**
   * Show a loading toast that transitions to success/error based on promise result
   * @param promise - The promise to track
   * @param messages - Messages for loading, success, and error states
   * @returns Promise result with data or error
   */
  promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<PromiseResult<T>>;
  /**
   * Dismiss a specific toast
   * @param id - The toast ID to dismiss
   */
  dismiss: (id: string) => void;
  /**
   * Dismiss all visible toasts
   */
  dismissAll: () => void;
};

// Build the toast API
const toastFn = _toast as unknown as BaseToastFn;

toastFn.success = (title: string, description?: string, duration?: number) => {
  _toast(title, description, "success", duration);
};

toastFn.error = (title: string, description?: string, duration?: number) => {
  _toast(title, description, "error", duration);
};

toastFn.info = (title: string, description?: string, duration?: number) => {
  _toast(title, description, "info", duration);
};

toastFn.promise = promiseToast;

toastFn.dismiss = (id: string) => {
  toastStore.hide(id);
};

toastFn.dismissAll = () => {
  toastStore.hideAll();
};

export const toast = toastFn;
