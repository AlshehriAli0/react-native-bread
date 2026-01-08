import type { Toast, ToastConfig, ToastState, ToastTheme, ToastType, ToastTypeColors } from "./types";

export type Listener = (state: ToastState) => void;

const MAX_VISIBLE_TOASTS = 3;
const EXIT_DURATION = 350;

/** Default theme values */
const DEFAULT_THEME: ToastTheme = {
  position: "top",
  offset: 0,
  stacking: true,
  colors: {
    success: { accent: "#28B770", background: "#FFFFFF" },
    error: { accent: "#F05964", background: "#FFFFFF" },
    info: { accent: "#EDBE43", background: "#FFFFFF" },
    loading: { accent: "#232323", background: "#FFFFFF" },
  },
  toastStyle: {},
  titleStyle: {},
  descriptionStyle: {},
  defaultDuration: 4000,
};

/** Deep merge user config with defaults */
function mergeConfig(config: ToastConfig | undefined): ToastTheme {
  if (!config) return DEFAULT_THEME;

  const mergedColors = { ...DEFAULT_THEME.colors };
  if (config.colors) {
    for (const type of Object.keys(config.colors) as ToastType[]) {
      const userColors = config.colors[type];
      if (userColors) {
        mergedColors[type] = {
          ...DEFAULT_THEME.colors[type],
          ...userColors,
        } as ToastTypeColors;
      }
    }
  }

  return {
    position: config.position ?? DEFAULT_THEME.position,
    offset: config.offset ?? DEFAULT_THEME.offset,
    stacking: config.stacking ?? DEFAULT_THEME.stacking,
    colors: mergedColors,
    toastStyle: { ...DEFAULT_THEME.toastStyle, ...config.toastStyle },
    titleStyle: { ...DEFAULT_THEME.titleStyle, ...config.titleStyle },
    descriptionStyle: { ...DEFAULT_THEME.descriptionStyle, ...config.descriptionStyle },
    defaultDuration: config.defaultDuration ?? DEFAULT_THEME.defaultDuration,
  };
}

class ToastStore {
  private state: ToastState = {
    visibleToasts: [],
  };

  private theme: ToastTheme = DEFAULT_THEME;

  private listeners = new Set<Listener>();
  private toastIdCounter = 0;
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private setState(partial: Partial<ToastState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  getState = () => this.state;

  getTheme = () => this.theme;

  setConfig = (config: ToastConfig | undefined) => {
    this.theme = mergeConfig(config);
  };

  show = (title: string, description?: string, type: ToastType = "success", duration?: number): string => {
    const actualDuration = duration ?? this.theme.defaultDuration;
    const maxToasts = this.theme.stacking ? MAX_VISIBLE_TOASTS : 1;

    const id = `toast-${++this.toastIdCounter}`;
    const newToast: Toast = {
      id,
      title,
      description,
      type,
      duration: actualDuration,
      createdAt: Date.now(),
      isExiting: false,
    };

    let { visibleToasts } = this.state;

    // Get only non-exiting toasts for count
    const activeToasts = visibleToasts.filter(t => !t.isExiting);

    if (activeToasts.length >= maxToasts) {
      // Mark excess toasts as exiting (animate out) instead of removing immediately
      const toastsToExit = activeToasts.slice(maxToasts - 1);
      for (const toast of toastsToExit) {
        // Clear auto-dismiss timeout
        const timeout = this.timeouts.get(toast.id);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(toast.id);
        }
      }

      // Mark them as exiting
      const exitingIds = new Set(toastsToExit.map(t => t.id));
      visibleToasts = visibleToasts.map(t => (exitingIds.has(t.id) ? { ...t, isExiting: true } : t));

      // Schedule removal after exit animation
      for (const toast of toastsToExit) {
        setTimeout(() => {
          this.removeToast(toast.id);
        }, EXIT_DURATION);
      }
    }

    // Add new toast
    this.setState({
      visibleToasts: [newToast, ...visibleToasts],
    });

    // Schedule auto-dismiss with duration multiplier based on position
    this.scheduleTimeout(id, actualDuration, 0);

    // Reschedule timeouts for other toasts based on their new positions
    this.rescheduleAllTimeouts();

    return id;
  };

  private scheduleTimeout(id: string, baseDuration: number, index: number) {
    const existingTimeout = this.timeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Duration multiplier: index 0 = 1x, index 1 = 2x, index 2 = 3x
    const duration = baseDuration * (index + 1);

    const timeout = setTimeout(() => {
      this.hide(id);
    }, duration);

    this.timeouts.set(id, timeout);
  }

  private rescheduleAllTimeouts() {
    const { visibleToasts } = this.state;

    visibleToasts.forEach((toast, index) => {
      // Skip if already exiting or index 0 (just scheduled)
      if (toast.isExiting || index === 0) return;

      this.scheduleTimeout(toast.id, toast.duration, index);
    });
  }

  hide = (id: string) => {
    const { visibleToasts } = this.state;
    const toast = visibleToasts.find(t => t.id === id);
    if (!toast || toast.isExiting) return;

    // Clear the auto-dismiss timeout
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    // Mark as exiting (triggers exit animation in component)
    this.setState({
      visibleToasts: visibleToasts.map(t => (t.id === id ? { ...t, isExiting: true } : t)),
    });

    // After exit animation, actually remove the toast
    setTimeout(() => {
      this.removeToast(id);
    }, EXIT_DURATION);
  };

  private removeToast(id: string) {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }

    this.setState({
      visibleToasts: this.state.visibleToasts.filter(t => t.id !== id),
    });

    // Reschedule remaining toasts with updated positions
    this.rescheduleAllTimeouts();
  }

  updateToast = (id: string, data: Partial<Omit<Toast, "id" | "createdAt">>) => {
    const { visibleToasts } = this.state;
    const index = visibleToasts.findIndex(t => t.id === id);
    if (index === -1) return;

    this.setState({
      visibleToasts: visibleToasts.map(t => (t.id === id ? { ...t, ...data } : t)),
    });

    if (data.duration !== undefined) {
      this.scheduleTimeout(id, data.duration, index);
    }
  };

  hideAll = () => {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    this.setState({ visibleToasts: [] });
  };
}

export const toastStore = new ToastStore();

export type { Toast, ToastState, ToastType };
