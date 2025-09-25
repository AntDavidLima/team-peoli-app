import "../components/gesture-handler";
import { AuthenticationProvider } from "@/contexts/AuthenticationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import customColors from "@/tailwind.colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";

export {
  ErrorBoundary,
} from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [loaded, error] = useFonts({
    ...MaterialCommunityIcons.font,
    'Inter-Regular': Inter_400Regular,
    'Inter-Regular-Italic': Inter_400Regular_Italic,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
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
          <Slot />
          <Toast />
        </ThemeProvider>
      </AuthenticationProvider>
    </QueryClientProvider>
  );
}