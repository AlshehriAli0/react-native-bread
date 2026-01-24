import { useEffect, useMemo, useRef, useState } from "react";
import { makeMutable } from "react-native-reanimated";
import { type Toast, type ToastState, toastStore } from "./toast-store";
import type { ToastTheme, TopToastRef } from "./types";

export const useToastState = () => {
  const [visibleToasts, setVisibleToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<ToastTheme>(() => toastStore.getTheme());

  const topToastRef = useRef(makeMutable<TopToastRef | null>(null));
  const isBottomRef = useRef(makeMutable(theme.position === "bottom"));
  const isDismissibleRef = useRef(makeMutable(true));

  const isBottom = theme.position === "bottom";
  const topToast = visibleToasts.find(t => !t.isExiting);
  const isTopDismissible = topToast?.options?.dismissible ?? theme.dismissible;

  useEffect(() => {
    const initialToasts = toastStore.getState().visibleToasts;
    const initialTheme = toastStore.getTheme();

    setVisibleToasts(initialToasts);

    const initialTopToast = initialToasts.find(t => !t.isExiting);
    isBottomRef.current.value = initialTheme.position === "bottom";
    isDismissibleRef.current.value = initialTopToast?.options?.dismissible ?? initialTheme.dismissible;

    let pendingToasts: Toast[] | null = null;
    let rafId: number | null = null;

    const unsubscribe = toastStore.subscribe((state: ToastState) => {
      pendingToasts = state.visibleToasts;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          const currentToasts = pendingToasts ?? toastStore.getState().visibleToasts;
          const currentTheme = toastStore.getTheme();

          if (pendingToasts) {
            setVisibleToasts(pendingToasts);
            pendingToasts = null;
          }
          rafId = null;
          setTheme((prev: ToastTheme) => (prev === currentTheme ? prev : currentTheme));

          const topToast = currentToasts.find(t => !t.isExiting);
          isBottomRef.current.value = currentTheme.position === "bottom";
          isDismissibleRef.current.value = topToast?.options?.dismissible ?? currentTheme.dismissible;
        });
      }
    });

    return unsubscribe;
  }, []);

  const toastsWithIndex = useMemo(() => {
    const indices = new Map<string, number>();
    let visualIndex = 0;
    for (const t of visibleToasts) {
      indices.set(t.id, t.isExiting ? -1 : visualIndex);
      if (!t.isExiting) visualIndex++;
    }
    return [...visibleToasts].reverse().map(t => ({
      toast: t,
      index: indices.get(t.id) ?? 0,
    }));
  }, [visibleToasts]);

  return {
    visibleToasts,
    theme,
    toastsWithIndex,
    isBottom,
    isTopDismissible,
    topToastRef,
    isBottomRef,
    isDismissibleRef,
  };
};
