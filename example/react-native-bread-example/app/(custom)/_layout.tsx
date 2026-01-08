import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function CustomLayout() {
  return (
    <BreadLoaf>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </BreadLoaf>
  );
}
