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
import MenuIcon from "@/assets/icons/menu.svg";
import CameraIcon from "@/assets/icons/camera.svg";
import HomeIcon from "@/assets/icons/home.svg";
import UserIcon from "@/assets/icons/user.svg";
import WhatsappIcon from "@/assets/icons/whatsapp.svg";
import LogoutIcon from "@/assets/icons/logout.svg";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function DrawerLayout() {
  const { logout, currentUser } = useAuthentication();
  const [professorPhone, setProfessorPhone] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfessorPhone() {
      try {
        const { data } = await api.get(`/user/${currentUser?.id}/professor`);
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
        drawerItemStyle: {
          marginHorizontal: 0, 
          borderRadius: 0,
          height: 50,
          paddingLeft: 20,
          justifyContent: 'center',
        },
        header: ({ navigation }) => (
          <View className="flex-row justify-between items-center px-4 mt-2">
            <Pressable
              onPress={() => navigation.goBack()}
              disabled={!navigation.canGoBack()}
              className={`${navigation.canGoBack() && getDrawerStatusFromState(navigation.getState()) === "closed" ? "opacity-100" : "opacity-0"} transition-all -top-6 p-4`}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                style={{marginTop: 30}}
                color={tailwindColors.white}
              />
            </Pressable>
            <Image 
              style={{marginBottom: 20, width: 130, height: 40, marginTop: 0}}
              source={require("@/assets/images/logo.png")} />
            <Pressable 
              style={{marginTop: -20, marginRight: 10}}
              onPress={() => navigation.openDrawer()}>
              <MenuIcon width={32} height={32}/>
            </Pressable>
          </View>
        ),
      }}
      drawerContent={(props) => (
        <View className="flex-1 bg-lightBackground">
          <View className="items-center mt-4 py-8 rounded">
            <Pressable onPress={() => props.navigation.navigate("profile")}>
              <View className="w-36 bg-white aspect-square rounded-full bg-disabled items-center justify-center">
                {
                  currentUser?.profilePhotoUrl ? (
                    <Image
                      className="w-full h-full rounded-full"
                      source={{uri: currentUser.profilePhotoUrl}}
                    />
                  ) : (
                    <CameraIcon width={36} height={36} />
                  )
                }
              </View>
            </Pressable>
            <Text className="text-white font-bold text-2xl mt-4">
              {currentUser?.name}
            </Text>
          </View>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
            <DrawerItem
              style = {{
                marginHorizontal: 0, 
                borderRadius: 0,
                height: 50,
                paddingLeft: 20,
                justifyContent: 'center',
              }}
              icon={() => <WhatsappIcon width={24} height={24}/>}
              label={professorPhone ? "Falar com o Treinador" : ""}
              onPress={() => {Linking.openURL(professorPhone ? `https://wa.me/55${professorPhone}` : "")}}
            />
          </DrawerContentScrollView>
          <Pressable
            className="bg-red-400 p-3 flex-row space-x-1 rounded-xl m-4 gap-2"
            onPress={logout}
          >
            <LogoutIcon width={24} height={24}/>
            <Text className="text-white font-bold text-base">Sair</Text>
          </Pressable>
        </View>
      )}
    >
      <Drawer.Screen 
        name="(tabs)" 
        options={
          { 
            title: "Início",
            drawerIcon: () => <HomeIcon width={24} height={24} color="white" />
          }
        } />
      <Drawer.Screen
        name="exercise/[id]"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen name="profile" options={
        { 
          title: "Meu perfil",
          drawerIcon: () => <UserIcon width={24} height={24} color={customColors.background} /> 
          }
        } />
    </Drawer>  
    
  );
}
