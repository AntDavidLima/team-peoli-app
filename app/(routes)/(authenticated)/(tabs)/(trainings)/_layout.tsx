import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import customColors from "@/tailwind.colors";
import tailwindColors from "tailwindcss/colors";

const { Navigator } = createMaterialTopTabNavigator();

const Tabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

enum Days {
  "(sunday)" = "D",
  "(monday)" = "S",
  "(tuesday)" = "T",
  "(wednesday)" = "Q",
  "(thursday)" = "Q",
  "(friday)" = "S",
  "(saturday)" = "S",
}

export default function Trainings() {
  return (
    <Tabs
      className="mt-6"
      sceneContainerStyle={{ marginTop: 16 }}
      initialRouteName="(monday)"
      screenOptions={{
        tabBarIndicatorStyle: {
          backgroundColor: tailwindColors.white,
          position: "absolute",
          height: 32,
          width: 44,
          top: 4,
          left: 5,
          borderRadius: 32,
        },
        tabBarIndicatorContainerStyle: {
          backgroundColor: customColors.main,
          borderRadius: 24,
        },
        tabBarActiveTintColor: customColors.main,
        tabBarInactiveTintColor: tailwindColors.white,
        tabBarLabelStyle: {
          fontWeight: "bold",
          fontSize: 16,
        },
        tabBarItemStyle: {
          marginTop: -5,
        },
        tabBarStyle: {
          borderRadius: 24,
          height: 40,
          marginLeft: 16,
          marginRight: 16,
        },
      }}
    >
      {Object.entries(Days).map(([key, value]) => (
        <Tabs.Screen key={key} name={key} options={{ tabBarLabel: value }} />
      ))}
    </Tabs>
  );
}
