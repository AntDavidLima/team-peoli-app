import { Stack } from "expo-router";

export default function RoutesLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="(authenticated)"
        options={{
          headerShown: false,
          contentStyle: { padding: 8 },
        }}
      />
    </Stack>
  );
}
