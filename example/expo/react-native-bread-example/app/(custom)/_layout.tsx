import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function CustomLayout() {
  return (
    <BreadLoaf
      config={{
        position: "bottom",
        stacking: false,
        offset: 10,
        defaultDuration: 3000,
        colors: {
          success: { accent: "#059669", background: "#ecfdf5" },
          error: { accent: "#dc2626", background: "#fef2f2" },
          info: { accent: "#2563eb", background: "#eff6ff" },
          loading: { accent: "#6b7280", background: "#f3f4f6" },
        },
        toastStyle: {
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        },
        titleStyle: {
          fontSize: 15,
          fontWeight: "600",
        },
        descriptionStyle: {
          color: "#4b5563",
        },
      }}
    >
      <Stack>
        <Stack.Screen name="index" options={{ title: "Custom Config" }} />
      </Stack>
    </BreadLoaf>
  );
}
