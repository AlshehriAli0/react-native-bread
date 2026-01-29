import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { FullWindowOverlay } from "react-native-screens";
import { ToastContainer } from "./toast";
import { toastStore } from "./toast-store";
import type { ToastConfig } from "./types";

function ToastContent() {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <ToastContainer />
    </View>
  );
}


interface BreadLoafProps {
  /**
   * Configuration for customizing toast behavior and appearance.
   * All properties are optional and will be merged with defaults.
   *
   * @property position - Where toasts appear: `'top'` (default) or `'bottom'`
   * @property offset - Extra spacing from screen edge in pixels (default: `0`)
   * @property stacking - Show multiple toasts stacked (default: `true`). When `false`, only one toast shows at a time
   * @property defaultDuration - Default display time in ms (default: `4000`)
   * @property colors - Customize colors per toast type (`success`, `error`, `info`, `loading`)
   * @property toastStyle - Style overrides for the toast container (borderRadius, shadow, padding, etc.)
   * @property titleStyle - Style overrides for the title text
   * @property descriptionStyle - Style overrides for the description text
   */
  config?: ToastConfig;
}

/**
 * Toast component that enables toast notifications in your app.
 * Add `<BreadLoaf />` to your root layout to start showing toasts.
 *
 * @example
 * ```tsx
 * import { BreadLoaf } from 'react-native-bread';
 *
 * // Basic usage - add to your root layout
 * export default function RootLayout() {
 *   return (
 *     <>
 *       <Stack />
 *       <BreadLoaf />
 *     </>
 *   );
 * }
 *
 * // With configuration
 * <BreadLoaf
 *   config={{
 *     position: 'bottom',
 *     stacking: false,
 *     defaultDuration: 5000,
 *     colors: {
 *       success: { accent: '#22c55e', background: '#f0fdf4' },
 *       error: { accent: '#ef4444', background: '#fef2f2' },
 *     },
 *     toastStyle: { borderRadius: 12 },
 *   }}
 * />
 * ```
 */
export function BreadLoaf({ config }: BreadLoafProps) {
  useEffect(() => {
    toastStore.setConfig(config);
    return () => {
      toastStore.setConfig(undefined);
    };
  }, [config]);

  // iOS: use FullWindowOverlay to render above native modals
  if (Platform.OS === "ios") {
    return (
      <FullWindowOverlay>
        <ToastContent />
      </FullWindowOverlay>
    );
  }

  return <ToastContent />;
}

/**
 * Lightweight toast renderer for use inside modal screens.
 *
 * On Android, native modals render above the root React view, so toasts from
 * the main `<BreadLoaf />` won't be visible. Add `<ToastPortal />` inside your
 * modal layouts to show toasts above modal content.
 *
 * This component only renders toasts - it does not accept configuration.
 * All styling/behavior is inherited from your root `<BreadLoaf />` config.
 *
 * @example
 * ```tsx
 * // app/(modal)/_layout.tsx
 * import { Stack } from 'expo-router';
 * import { ToastPortal } from 'react-native-bread';
 * import { Platform } from 'react-native';
 *
 * export default function ModalLayout() {
 *   return (
 *     <>
 *       <Stack screenOptions={{ headerShown: false }} />
 *       {Platform.OS === 'android' && <ToastPortal />}
 *     </>
 *   );
 * }
 * ```
 */
export function ToastPortal() {
  return <ToastContent />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
