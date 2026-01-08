import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { BreadLoaf } from "react-native-bread";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "(default)",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BreadLoaf>
        <Stack>
          <Stack.Screen name="(default)" options={{ headerShown: false }} />
          <Stack.Screen name="(custom)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </BreadLoaf>
    </GestureHandlerRootView>
  );
}
