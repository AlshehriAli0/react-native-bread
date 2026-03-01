import { Stack } from "expo-router";
import { ToastPortal } from "react-native-bread";

export default function ModalLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <ToastPortal />
    </>
  );
}
