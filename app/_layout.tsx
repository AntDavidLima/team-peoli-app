import "../components/gesture-handler";
import { AuthenticationProvider } from "@/contexts/AuthenticationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { RootSiblingParent } from "react-native-root-siblings";
import customColors from "@/tailwind.colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: customColors.background,
  },
};

function RootLayoutNav() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticationProvider>
        <ThemeProvider value={Theme}>
          <RootSiblingParent>
            <Slot />
          </RootSiblingParent>
        </ThemeProvider>
      </AuthenticationProvider>
    </QueryClientProvider>
  );
}
