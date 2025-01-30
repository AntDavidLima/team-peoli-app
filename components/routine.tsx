import { MaterialCommunityIcons } from "@expo/vector-icons";
import draftToHtml from "draftjs-to-html";
import { useState } from "react";
import {
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Collapsible from "react-native-collapsible";
import RenderHTML from "react-native-render-html";
import tailwindColors from "tailwindcss/colors";
import { Routine } from "./trainings";
import { RoutineExercise } from "./routine-exercise";

export function RoutineItem({
  orientations,
  trainings,
  name,
  endDate,
  startDate,
  day,
}: Omit<Routine, "id"> & { day: string }) {
  const [orientationCollapsed, setOrientationCollapsed] =
    useState<boolean>(true);

  const { width } = useWindowDimensions();

  return (
    <View className="mb-8">
      <View className="flex-row items-center gap-4">
        <View className="flex-1 border h-0 border-white" />
        <Text className="text-white">{name}</Text>
        <View className="flex-1 border h-0 border-white" />
      </View>
      <View className="flex-row gap-1">
        <MaterialCommunityIcons
          name="calendar-month-outline"
          color={tailwindColors.white}
          size={18}
        />
        <Text className="text-white">
          {new Date(startDate).toLocaleDateString("pt-BR")}
        </Text>
        {endDate && (
          <Text className="text-white">
            - {new Date(endDate).toLocaleDateString("pt-BR")}
          </Text>
        )}
      </View>
      {orientations?.blocks[0].text.trim() !== "" && (
        <Pressable
          className="bg-main/25 border border-main p-1 mt-3"
          onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="alert-outline"
                color={tailwindColors.sky[400]}
                size={16}
              />
              <Text className="text-sky-400">Orientações gerais</Text>
            </View>
            <View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
              <MaterialCommunityIcons
                name="chevron-down"
                color={tailwindColors.sky[400]}
                size={16}
              />
            </View>
          </View>
          <Collapsible collapsed={orientationCollapsed}>
            <RenderHTML
              source={{ html: draftToHtml(orientations!) }}
              contentWidth={width}
              baseStyle={{ color: tailwindColors.white }}
            />
          </Collapsible>
        </Pressable>
      )}
      <View className="mt-4">
        {trainings.map(({ id, name, exercises }) => (
          <View key={id}>
            <Text className="text-white font-bold text-base">{name}</Text>
            <View className="mt-1 gap-4">
              {exercises.map(
                ({ reps, orientations, sets, exercise, restTime }) => (
                  <RoutineExercise
                    day={day}
                    executionVideoUrl={exercise.executionVideoUrl}
                    exerciseName={exercise.name}
                    idExercise={exercise.id}
                    orientations={orientations}
                    reps={reps}
                    restTime={restTime}
                    sets={sets}
                    trainingId={id}
                    key={exercise.id}
                  />
                )
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
