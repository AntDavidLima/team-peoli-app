import "../components/gesture-handler";
import { AuthenticationProvider } from "@/contexts/AuthenticationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { RootSiblingParent } from "react-native-root-siblings";
import customColors from "@/tailwind.colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";

export {
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...MaterialCommunityIcons.font,
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log("Fontes carregadas com sucesso!");
      SplashScreen.hideAsync();
    } else if (!loaded && !error) {
      console.log("Carregando fontes...");
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
