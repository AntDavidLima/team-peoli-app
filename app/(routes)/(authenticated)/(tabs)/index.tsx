import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import customColors from "@/tailwind.colors";
import { Days } from "./(trainings)/_layout";
import tailwindColors from "tailwindcss/colors";

export default function Home() {
  return (
    <View className="p-4 mt-6">
      <View className="bg-card rounded p-2">
        <View className="flex-row justify-between">
          <View>
            <Text className="text-white font-bold text-xl">Iniciar Treino</Text>
            <Text className="text-subtitle font-semibold mt-1">
              Quarta-feira
            </Text>
          </View>
          <MaterialCommunityIcons
            name="play-circle-outline"
            color={customColors.main}
            size={68}
          />
        </View>
        <Text className="text-subtitle">Treino A - Inferiores completos</Text>
      </View>
      <View className="bg-card rounded p-3 mt-4">
        <View className="flex-row justify-between">
          {Object.values(Days).map((day, index) => (
            <View className="items-center gap-1" key={index}>
              <Text className="text-white font-semibold text-base">{day}</Text>
              <Text className="bg-disabled rounded-full px-2 py-1.5 text-background">
                {23 + index}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-3 justify-end flex-row items-center space-x-1">
          <MaterialCommunityIcons
            name="flag-outline"
            size={16}
            color={tailwindColors.white}
          />
          <Text className="text-white">0/1 dias completos</Text>
        </View>
      </View>
    </View>
  );
}
