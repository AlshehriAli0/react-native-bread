import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "react-native-bread";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Toast Demo" }} />
        </Stack>
        <StatusBar style="auto" />
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
