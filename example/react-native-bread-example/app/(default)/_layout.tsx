import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function DefaultLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <BreadLoaf />
    </>
  );
}
