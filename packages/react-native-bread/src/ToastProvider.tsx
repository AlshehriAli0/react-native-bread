import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { ToastContainer } from "./Toast";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
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
