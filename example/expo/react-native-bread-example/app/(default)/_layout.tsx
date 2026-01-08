import { Stack } from "expo-router";
import { BreadLoaf } from "react-native-bread";

export default function DefaultLayout() {
  return (
    <BreadLoaf>
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "🍞 Toast Demo", headerBackButtonDisplayMode: "minimal" }} />
      </Stack>
    </BreadLoaf>
  );
}
