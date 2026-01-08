import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { ToastContainer } from "./toast";
import { toastStore } from "./toast-store";
import type { ToastConfig } from "./types";

interface BreadLoafProps {
  children: ReactNode;
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
 * Toast provider component that enables toast notifications in your app.
 * Wrap your root component with `<BreadLoaf>` to start showing toasts.
 *
 * @example
 * ```tsx
 * import { BreadLoaf } from 'react-native-bread';
 *
 * // Basic usage
 * <BreadLoaf>
 *   <App />
 * </BreadLoaf>
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
 * >
 *   <App />
 * </BreadLoaf>
 * ```
 */
export function BreadLoaf({ children, config }: BreadLoafProps) {
  useEffect(() => {
    toastStore.setConfig(config);
    return () => {
      // Reset to defaults when this provider unmounts
      toastStore.setConfig(undefined);
    };
  }, [config]);
  return (
    <View style={styles.root}>
      {children}
      <View style={styles.portalContainer} pointerEvents="box-none">
        <ToastContainer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  portalContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
