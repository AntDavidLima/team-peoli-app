import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";
import { useWindowDimensions } from "react-native";

const { Navigator } = createMaterialTopTabNavigator();

const Tabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export enum Days {
  sunday = "D",
  monday = "S",
  tuesday = "T",
  wednesday = "Q",
  thursday = "Q",
  friday = "S",
  saturday = "S",
}

export default function Trainings() {
  const { width } = useWindowDimensions();
  const today = new Date().getDay();

  return (
      <Tabs
        sceneContainerStyle={{ marginTop: 16 }}
				style={{ marginTop: 0 }}
        initialRouteName={`(${Object.keys(Days)[today]})`}
        screenOptions={{
          tabBarIndicatorStyle: {
            backgroundColor: customColors.main,
            position: "absolute",
            height: 46,
            width: 46,
            left: 4,
            top: 2,
            borderRadius: 32,
          },
          tabBarIndicatorContainerStyle: {
            backgroundColor: customColors.background,
            borderRadius: 24,
          },
          tabBarActiveTintColor: tailwindColors.white,
          tabBarInactiveTintColor: tailwindColors.white,
          tabBarLabelStyle: {
            fontWeight: "bold",
            fontSize: 16,
            height: 46,
            width: 46,
            top: -20,
            borderRadius: 32,
            paddingTop: 12,
            borderColor: customColors.main,
            borderWidth: 2,
          },
          tabBarContentContainerStyle: {
            display: "flex",
            justifyContent: "space-around",
          },
          tabBarItemStyle: {
            marginTop: 8
          },
          tabBarStyle: {
            borderRadius: 24,
            height: 50,
            marginLeft: 16,
            marginRight: 16,
            elevation: 0,
          },
        }}
      >
        {Object.entries(Days).map(([key, value]) => (
          <Tabs.Screen
            key={key}
            name={`(${key})`}
            options={{ tabBarLabel: value }}
          />
        ))}
      </Tabs>
  );
}
