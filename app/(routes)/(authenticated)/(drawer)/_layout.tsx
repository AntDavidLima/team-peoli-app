import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";
import { Drawer } from "expo-router/drawer";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  getDrawerStatusFromState,
} from "@react-navigation/drawer";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DrawerLayout() {
  const { logout, currentUser } = useAuthentication();
  const [professorPhone, setProfessorPhone] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfessorPhone() {
      try {
        const { data } = await api.get("/user/prof");
        if (data) {
          setProfessorPhone(data.phone);
        }
      } catch (error) {
        setProfessorPhone(null);
      }
    }
    fetchProfessorPhone();
  }, []);

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
            <Image 
              className="mb-16 w-44 h-14 mt-4"
              source={require("@/assets/images/logo.png")} />
            <Pressable onPress={() => navigation.openDrawer()}
              className="-mt-12">
              <MaterialCommunityIcons
                name="menu"
                color="white"
                size={32}
              />
            </Pressable>
          </View>
        ),
      }}
      drawerContent={(props) => (
        <View className="flex-1 bg-lightBackground">
          <View className="items-center mt-8 py-8 rounded">
            <Pressable onPress={() => props.navigation.navigate("profile")}>
              <View className="w-32 bg-white aspect-square rounded-full bg-disabled items-center justify-center">
                <MaterialCommunityIcons
                  name="camera-plus-outline"
                  size={36}
                  color={tailwindColors.black}
                />
              </View>
            </Pressable>
            <Text className="text-white font-bold text-2xl mt-4">
              {currentUser?.name}
            </Text>
          </View>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem
              label={professorPhone ? "Falar com o professor" : ""}
              onPress={() => {Linking.openURL(professorPhone ? `https://wa.me/55${professorPhone}` : "")}}
            />
          </DrawerContentScrollView>
          <Pressable
            className="bg-red-400 p-3 flex-row space-x-1 m-2 rounded-xl m-3"
            onPress={logout}
          >
            <MaterialCommunityIcons
             className="mx-2"
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
