import { useAuthentication } from "@/contexts/AuthenticationContext";
import { Redirect, Stack } from "expo-router";

export default function AuthenticatedLayout() {
  const { isAuthenticated } = useAuthentication();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
