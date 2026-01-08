import type { Toast, ToastState, ToastType } from "./types";

export type Listener = (state: ToastState) => void;

const MAX_VISIBLE_TOASTS = 3;
const EXIT_DURATION = 350;

class ToastStore {
  private state: ToastState = {
    visibleToasts: [],
  };

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

  show = (title: string, description?: string, type: ToastType = "success", duration = 4000): string => {
    const id = `toast-${++this.toastIdCounter}`;
    const newToast: Toast = {
      id,
      title,
      description,
      type,
      duration,
      createdAt: Date.now(),
      isExiting: false,
    };

    let { visibleToasts } = this.state;

    // If we already have max toasts, remove the oldest immediately (no emit yet)
    if (visibleToasts.length >= MAX_VISIBLE_TOASTS) {
      const oldestToast = visibleToasts[visibleToasts.length - 1];
      if (oldestToast) {
        const timeout = this.timeouts.get(oldestToast.id);
        if (timeout) {
          clearTimeout(timeout);
          this.timeouts.delete(oldestToast.id);
        }
        visibleToasts = visibleToasts.filter(t => t.id !== oldestToast.id);
      }
    }

    // Add new toast and emit once
    this.setState({
      visibleToasts: [newToast, ...visibleToasts.slice(0, MAX_VISIBLE_TOASTS - 1)],
    });

    // Schedule auto-dismiss with duration multiplier based on position
    this.scheduleTimeout(id, duration, 0);

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

  updateToast = (id: string, data: Partial<Omit<Toast, "id" | "createdAt">> & { duration?: number }) => {
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
