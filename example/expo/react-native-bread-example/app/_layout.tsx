import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BreadLoaf } from "react-native-bread";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BreadLoaf>
        <Stack>
          <Stack.Screen name="index" options={{ title: "Toast Demo" }} />
        </Stack>
        <StatusBar style="auto" />
      </BreadLoaf>
    </GestureHandlerRootView>
  );
}
