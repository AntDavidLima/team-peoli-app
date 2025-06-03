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
import customColors from "@/tailwind.colors";

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

  const dayStart : any = new Date(startDate);
  const dayEnd : any = endDate ? new Date(endDate) : null;
  const totalWeeks = dayEnd ? Math.round((dayEnd - dayStart) / (7 * 24 * 60 * 60 * 1000)) : 1;

  return (
    <View className="mb-8">
      <View className="bg-lightBackground rounded-2xl p-4">
        <View className="flex-row gap-1 mb-2">
          <MaterialCommunityIcons
            name="calendar-month-outline"
            color={customColors.secondary}
            size={18}
          />
          <Text className="text-white font-bold">{name}</Text>
          <View className="w-[1px] h-[100%] bg-white mx-1"/>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            color={customColors.secondary}
            size={18}
          />
          <Text className="text-disabled">{totalWeeks + " Semana" + (totalWeeks > 1 ? "s" : "")}</Text>
        </View>
        <View className="flex-row gap-1">
          <MaterialCommunityIcons
            name="calendar-month-outline"
            color={customColors.secondary}
            size={18}
          />
          <Text className="text-disabled">
            {dayStart.toLocaleDateString("pt-BR")}
          </Text>
          {dayEnd && (
            <Text className="text-disabled">
              - {dayEnd.toLocaleDateString("pt-BR")}
            </Text>
          )}
        </View>
      </View>
      {orientations?.blocks[0].text.trim() !== "" && (
        <Pressable
          className="bg-main rounded-2xl mt-4"
          onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
        >
          <View className="flex-row items-center p-4 justify-between">
            <View className="flex-row items-center gap-1">
              <MaterialCommunityIcons
                name="alert-outline"
                color={tailwindColors.white}
                size={16}
              />
              <Text className="text-white">Orientações gerais</Text>
            </View>
            <View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
              <MaterialCommunityIcons
                name="chevron-down"
                color={tailwindColors.white}
                size={16}
              />
            </View>
          </View>
          <Collapsible collapsed={orientationCollapsed}>
            <RenderHTML
              source={{ html: draftToHtml(orientations!) }}
              contentWidth={width}
              baseStyle={{ 
                color: tailwindColors.white, 
                backgroundColor: customColors.lightBackground,
                paddingHorizontal: 12,
              }}
            />
          </Collapsible>
        </Pressable>
      )}
      <View className="mt-4">
        {trainings.map(({ id, name, exercises }) => (
          <View key={id}>
            <Text className="text-white text-center font-bold text-4xl mb-4">{name}</Text>
            <View className="gap-4">
              {exercises.map(
                ({ reps, orientations, sets, exercise, restTime }) => (
                  <RoutineExercise
                    day={day}
                    exerciseName={exercise.name}
                    idExercise={exercise.id}
                    orientations={orientations}
                    reps={reps}
                    restTime={restTime}
                    sets={sets}
                    trainingId={id}
                    key={exercise.id}
                    thumbnailUrl={exercise.thumbnailUrl}
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
