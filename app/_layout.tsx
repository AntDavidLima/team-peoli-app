import "../components/gesture-handler";
import { AuthenticationProvider } from "@/contexts/AuthenticationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts, Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from "@expo-google-fonts/inter";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { RootSiblingParent } from "react-native-root-siblings";
import customColors from "@/tailwind.colors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./global.css";
import { Platform } from 'react-native'

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
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('Service Worker registrado com sucesso! Escopo:', registration.scope);
          })
          .catch(error => {
            console.error('Falha no registro do Service Worker:', error);
          });
      });
    }
  }, []);

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