import { Stack } from "expo-router";
import { Platform } from "react-native";
import { ToastPortal } from "react-native-bread";

export default function ModalLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      {Platform.OS === "android" && <ToastPortal />}
    </>
  );
}
