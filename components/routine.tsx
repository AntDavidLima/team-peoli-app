import { MaterialCommunityIcons } from "@expo/vector-icons";
import InfoIcon from "@/assets/icons/info.svg";
import ExerciseIcon from "@/assets/icons/exercise.svg";
import DateIcon from "@/assets/icons/date.svg";
import TimeIcon from "@/assets/icons/time.svg";
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

  const dayStart : Date = new Date(startDate);
  const dayEnd : Date | null = endDate ? new Date(endDate) : null;
  const totalWeeks = dayEnd ? Math.round((dayEnd.getTime() - dayStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) : 1;

  return (
    <View className="mb-6">
      <View className="bg-lightBackground rounded-2xl p-4">
        <View className="flex-row gap-1.5 mb-1.5 items-center">
          <ExerciseIcon width={16} height={16}/>
          <Text style={{fontFamily: 'Inter-Bold'}} className="text-white font-bold text-sm">{name}</Text>
          <View className="w-[1px] h-[100%] bg-white mx-1"/>
          <TimeIcon width={16} height={16}/>
          <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400 text-sm">{totalWeeks + " Semana" + (totalWeeks > 1 ? "s" : "")}</Text>
        </View>
        <View className="flex-row gap-1.5 items-center">
          <DateIcon width={16} height={16}/>
          <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400 text-sm">
            {dayStart.toLocaleDateString("pt-BR")}
          </Text>
          {dayEnd && (
            <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400 text-sm">
              - {dayEnd.toLocaleDateString("pt-BR")}
            </Text>
          )}
        </View>
      </View>
      {orientations?.blocks[0].text.trim() !== "" && (
        <Pressable
          className="bg-main rounded-xl mt-3"
          onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
        >
          <View className="flex-row items-center p-3 justify-between">
            <View className="flex-row items-center gap-1.5">
              <InfoIcon width={14} height={14}/>
              <Text style={{fontFamily: 'Inter-Medium'}} className="text-white text-xs">Orientações gerais</Text>
            </View>
            <View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
              <MaterialCommunityIcons
                name="chevron-down"
                color={tailwindColors.white}
                size={14}
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
                paddingHorizontal: 10,
                fontSize: '13px'
              }}
            />
          </Collapsible>
        </Pressable>
      )}
      <View className="mt-3">
        {trainings.map(({ id, name, exercises }) => (
          <View key={id}>
            <Text style={{fontFamily: 'Inter-Bold'}} className="text-white text-center font-bold text-xl mb-3">{name}</Text>
            <View className="gap-3">
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