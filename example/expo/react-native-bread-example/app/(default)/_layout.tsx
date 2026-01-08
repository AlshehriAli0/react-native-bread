import { Stack } from "expo-router";

export default function DefaultLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "🍞 Toast Demo", headerBackButtonDisplayMode: "minimal" }} />
    </Stack>
  );
}
