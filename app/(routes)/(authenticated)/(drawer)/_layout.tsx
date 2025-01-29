import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
  getDrawerStatusFromState,
} from "@react-navigation/drawer";
import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthentication } from "@/contexts/AuthenticationContext";

export default function DrawerLayout() {
  const { logout, currentUser } = useAuthentication();

  return (
    <Drawer
      detachInactiveScreens
      screenOptions={{
        drawerPosition: "right",
        drawerActiveBackgroundColor: customColors.main,
        drawerActiveTintColor: tailwindColors.white,
        drawerType: "slide",
        header: ({ navigation }) => (
          <View className="flex-row justify-between items-center px-4 mt-2">
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={!navigation.canGoBack()}
              className={`${navigation.canGoBack() && getDrawerStatusFromState(navigation.getState()) === "closed" ? "opacity-100" : "opacity-0"} transition-all p-4`}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={tailwindColors.white}
              />
            </Pressable>
            <Image source={require("@/assets/images/logo-horizontal.png")} />
            <Pressable onPress={() => navigation.openDrawer()}>
              <MaterialCommunityIcons
                name="menu"
                color={customColors.main}
                size={32}
              />
            </Pressable>
          </View>
        ),
      }}
      drawerContent={(props) => (
        <View className="flex-1">
          <ImageBackground
            className="items-center py-8 rounded-full"
            source={require("@/assets/images/login-background.jpg")}
            blurRadius={8}
          >
            <Pressable onPress={() => props.navigation.navigate("profile")}>
              <View className="w-24 aspect-square rounded-full bg-disabled mb-4 items-center justify-center">
                <MaterialCommunityIcons
                  name="camera-plus-outline"
                  size={32}
                  color={tailwindColors.white}
                />
              </View>
            </Pressable>
            <Text className="text-white text-base font-semibold">
              {currentUser?.name}
            </Text>
          </ImageBackground>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          <Pressable
            className="bg-main p-3 flex-row space-x-1 m-2 rounded"
            onPress={logout}
          >
            <MaterialCommunityIcons
              name="logout-variant"
              size={24}
              color={tailwindColors.white}
            />
            <Text className="text-white font-bold text-base">Sair</Text>
          </Pressable>
        </View>
      )}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "Início" }} />
      <Drawer.Screen
        name="exercise/[id]"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen name="profile" options={{ title: "Meu perfil" }} />
    </Drawer>
  );
}
