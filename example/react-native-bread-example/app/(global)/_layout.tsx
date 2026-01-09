import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function GlobalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
