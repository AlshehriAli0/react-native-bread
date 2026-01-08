import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ToastContainer } from "./toast";

interface BreadLoafProps {
  children: ReactNode;
}

/**
 * Toast provider component that enables toast notifications in your app.
 * Wrap your root component with `<BreadLoaf>` to start showing toasts.
 *
 * @example
 * ```tsx
 * import { BreadLoaf } from 'react-native-bread';
 *
 * export default function App() {
 *   return (
 *     <BreadLoaf>
 *       <YourApp />
 *     </BreadLoaf>
 *   );
 * }
 * ```
 */
export function BreadLoaf({ children }: BreadLoafProps) {
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
