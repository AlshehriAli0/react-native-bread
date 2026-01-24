import type { ReactNode } from "react";
import { toastStore } from "./toast-store";
import type {
  CustomContentRenderFn,
  ErrorMessageInput,
  MessageInput,
  PromiseMessages,
  PromiseResult,
  ToastOptions,
  ToastType,
} from "./types";

type DescriptionOrOptions = string | ToastOptions;

const _toast = (title: string, description?: string, type?: ToastType, duration?: number) => {
  toastStore.show(title, description, type, duration);
};

const parseDescriptionOrOptions = (
  arg?: DescriptionOrOptions
): { description?: string; duration?: number; options?: ToastOptions } => {
  if (!arg) return {};
  if (typeof arg === "string") return { description: arg };
  return {
    description: arg.description,
    duration: arg.duration,
    options: arg,
  };
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

interface CustomToastOptions extends Omit<ToastOptions, "customContent" | "icon" | "titleStyle" | "descriptionStyle"> {
  type?: ToastType;
}

type BaseToastFn = ((title: string, description?: string, type?: ToastType, duration?: number) => void) & {
  /**
   * Show a fully custom toast where you control all the content.
   * The content you provide fills the entire toast container and receives entry/exit animations.
   * @param content - ReactNode or render function that receives { id, dismiss, type, isExiting }
   * @param options - Optional configuration for duration, dismissible, style, etc.
   * @returns The toast ID
   * @example
   * ```ts
   * // Simple custom content
   * toast.custom(<MyCustomToast />);
   *
   * // With render function for dismiss access
   * toast.custom(({ dismiss }) => (
   *   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
   *     <Text>Custom toast!</Text>
   *     <Button title="Close" onPress={dismiss} />
   *   </View>
   * ));
   *
   * // With options
   * toast.custom(<MyToast />, { duration: 5000, dismissible: false });
   * ```
   */
  custom: (content: ReactNode | CustomContentRenderFn, options?: CustomToastOptions) => string;
  /**
   * Show a success toast with a green checkmark icon.
   * @param title - The toast title
   * @param descriptionOrOptions - Description string OR options object with description, duration, icon, style, etc.
   * @param duration - Duration in ms (default: 4000). Ignored if options object is passed.
   * @example
   * ```ts
   * // Simple usage
   * toast.success("Saved!", "Your changes have been saved");
   *
   * // With options
   * toast.success("Saved!", {
   *   description: "Your changes have been saved",
   *   duration: 5000,
   *   icon: <CustomIcon />,
   *   style: { borderRadius: 8 },
   * });
   * ```
   */
  success: (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => void;
  /**
   * Show an error toast with a red X icon.
   * @param title - The toast title
   * @param descriptionOrOptions - Description string OR options object
   * @param duration - Duration in ms (default: 4000). Ignored if options object is passed.
   * @example
   * ```ts
   * toast.error("Failed", "Something went wrong");
   * toast.error("Failed", { description: "Something went wrong", icon: <CustomErrorIcon /> });
   * ```
   */
  error: (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => void;
  /**
   * Show an info toast with a blue info icon.
   * @param title - The toast title
   * @param descriptionOrOptions - Description string OR options object
   * @param duration - Duration in ms (default: 4000). Ignored if options object is passed.
   * @example
   * ```ts
   * toast.info("Tip", "Swipe up to dismiss");
   * toast.info("Tip", { description: "Swipe up to dismiss", style: { backgroundColor: '#f0f9ff' } });
   * ```
   */
  info: (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => void;
  /**
   * Show a loading toast that automatically transitions to success or error
   * based on the promise result. Great for async operations like API calls.
   * @param promise - The promise to track
   * @param messages - Configuration for loading, success, and error states
   * @returns Promise result with `{ data, success: true }` or `{ error, success: false }`
   * @example
   * ```ts
   * toast.promise(fetchUser(id), {
   *   loading: { title: "Loading...", description: "Fetching user data" },
   *   success: { title: "Done!", description: "User loaded" },
   *   error: (err) => ({ title: "Error", description: err.message }),
   * });
   * ```
   */
  promise: <T>(promise: Promise<T>, messages: PromiseMessages) => Promise<PromiseResult<T>>;
  /**
   * Dismiss a specific toast by its ID.
   * @param id - The toast ID to dismiss
   * @example
   * ```ts
   * toast.dismiss("toast-123");
   * ```
   */
  dismiss: (id: string) => void;
  /**
   * Dismiss all visible toasts immediately.
   * @example
   * ```ts
   * toast.dismissAll();
   * ```
   */
  dismissAll: () => void;
};

const toastFn = _toast as unknown as BaseToastFn;

toastFn.custom = (content: ReactNode | CustomContentRenderFn, options?: CustomToastOptions) => {
  const type = options?.type ?? "info";
  return toastStore.show("", undefined, type, options?.duration, {
    ...options,
    customContent: content,
  });
};

toastFn.success = (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => {
  const { description, duration: optDuration, options } = parseDescriptionOrOptions(descriptionOrOptions);
  toastStore.show(title, description, "success", duration ?? optDuration, options);
};

toastFn.error = (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => {
  const { description, duration: optDuration, options } = parseDescriptionOrOptions(descriptionOrOptions);
  toastStore.show(title, description, "error", duration ?? optDuration, options);
};

toastFn.info = (title: string, descriptionOrOptions?: DescriptionOrOptions, duration?: number) => {
  const { description, duration: optDuration, options } = parseDescriptionOrOptions(descriptionOrOptions);
  toastStore.show(title, description, "info", duration ?? optDuration, options);
};

toastFn.promise = promiseToast;

toastFn.dismiss = (id: string) => {
  toastStore.hide(id);
};

toastFn.dismissAll = () => {
  toastStore.hideAll();
};

/**
 * Toast API for showing notifications.
 *
 * @example
 * ```ts
 * import { toast } from 'react-native-bread';
 *
 * // Basic toasts
 * toast.success("Saved!", "Your changes have been saved");
 * toast.error("Error", "Something went wrong");
 * toast.info("Tip", "Swipe up to dismiss");
 *
 * // Promise toast (loading → success/error)
 * toast.promise(apiCall(), {
 *   loading: { title: "Loading..." },
 *   success: { title: "Done!" },
 *   error: (err) => ({ title: "Failed", description: err.message }),
 * });
 *
 * // Dismiss toasts
 * toast.dismiss(id);
 * toast.dismissAll();
 * ```
 */
export const toast = toastFn;
