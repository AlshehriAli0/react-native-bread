import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function DefaultLayout() {
  return (
    <BreadLoaf>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Default Config" }} />
      </Stack>
    </BreadLoaf>
  );
}
