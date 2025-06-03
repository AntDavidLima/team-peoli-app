import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import customColors from "@/tailwind.colors";
import { withLayoutContext } from "expo-router";
import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { useWindowDimensions } from "react-native";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return <MaterialCommunityIcons size={25} {...props} />;
}

const { Navigator } = createMaterialTopTabNavigator();

const Tabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabLayout() {
  const { width } = useWindowDimensions();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: customColors.main,
        tabBarStyle: {
          backgroundColor: customColors.background,
          margin: 0,
          marginTop: 20,
          marginBottom: 20,
          elevation: 0,
        },
        tabBarIndicatorStyle: {
          position: "absolute",
          height: 50,
          width: width / 10 + 10,
          top: -1,
          left: width / 10 + 2,
          borderRadius: 64,
          backgroundColor: 'white',
        },
        tabBarIconStyle: {
          marginTop: -4,
        },
				tabBarContentContainerStyle: {
					display: "flex",
					justifyContent: "space-around"
				},
        swipeEnabled: false,
        tabBarShowLabel: false,
        tabBarShowIcon: true,
        tabBarAndroidRipple: {
          radius: 0,
        },
      }}
      tabBarPosition="bottom"
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(trainings)"
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="dumbbell" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="chart-timeline-variant" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
