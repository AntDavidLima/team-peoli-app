import { useAuthentication } from "@/contexts/AuthenticationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Stack } from "expo-router";
import { Image, Pressable } from "react-native";

import customColors from "@/tailwind.colors";

export default function AuthenticatedLayout() {
  const { isAuthenticated, logout } = useAuthentication();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: customColors.background },
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerTitle: () => (
          <Image source={require("@/assets/images/logo-horizontal.png")} />
        ),
        headerRight: () => (
          <Pressable>
            <MaterialCommunityIcons
              name="menu"
              size={40}
              color={customColors.main}
            />
          </Pressable>
        ),
      }}
    />
  );
}
