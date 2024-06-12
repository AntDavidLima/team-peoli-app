import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return <MaterialCommunityIcons size={28} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: customColors.darker,
          borderRadius: 8,
        },
        tabBarItemStyle: {
          margin: 8,
          borderRadius: 16,
        },
        tabBarActiveBackgroundColor: customColors.main,
        tabBarActiveTintColor: tailwindColors.white,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trainings"
        options={{
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="dumbbell" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
