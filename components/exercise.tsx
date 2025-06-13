import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import RenderHTML from "react-native-render-html";
import draftToHtml from "draftjs-to-html";
import tailwindColors from "tailwindcss/colors";
import { Exercise } from "@/app/(routes)/(authenticated)/(drawer)/exercise/[id]";
import { RawDraftContentState } from "draft-js";
import { Set } from "./set";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { ResizeMode, Video } from "expo-av";
import customColors from "@/tailwind.colors";
import { useState } from "react";
import Collapsible from "react-native-collapsible";
import TimerIcon from "@/assets/icons/timer.svg";
import InfoIcon from "@/assets/icons/info.svg";

interface ExerciseExecution {
  exercise: Exercise;
  restTime: number;
  orientations: RawDraftContentState | null;
  reps: string;
  sets: number;
  trainingStarted: boolean;
  workoutId: number | undefined;
  setsInfo: SetsInfo[];
  trainingIds: number[];
  day: string;
}

interface SetsInfo {
  id: number;
  load: number;
  reps: number;
}

export function ExerciseExecution({
  restTime,
  orientations,
  exercise,
  sets,
  trainingStarted,
  workoutId,
  setsInfo,
  trainingIds,
  day,
  reps,
}: ExerciseExecution) {
  const { currentUser } = useAuthentication();
  const [orientationCollapsed, setOrientationCollapsed] =
    useState<boolean>(true);

  const { data: executions } = useQuery({
    queryKey: ["exercise", "last-execution", exercise.id, currentUser?.id, day],
    queryFn: fetchLastExecution,
  });

  return (
    <View className="px-4 mb-14">
      <View className="mt-6">
        <View>
          <View className="flex-row pl-1 mt-1 gap-2">
              <TimerIcon width={18} height={18} color={customColors.secondary} />
              <Text style={{fontFamily: 'Inter-Regular'}}  className="text-gray-400 text-s">{restTime}s</Text>
            </View>
          <Text style={{fontFamily: 'Inter-ExtraBold'}}  className="text-white mt-4 text-3xl font-extrabold">
            {exercise.name}
          </Text>
        </View>
        {exercise.executionVideoUrl && (
          <View className="mt-2 bg-card rounded-2xl">
            <Video
              source={{ uri: exercise.executionVideoUrl }} resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            />
          </View>
        )}
        {orientations?.blocks[0].text.trim() !== "" && (
          <Pressable
            className="bg-main rounded-xl mt-4"
            onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
          >
            <View>
              <View className="flex-row items-center p-4 justify-between">
                <View className="flex-row gap-3">
                  <InfoIcon width={20} height={20} color={customColors.secondary} />
                  <Text style={{fontFamily: 'Inter-Medium'}}  className=" text-white font-medium">Instruções</Text>
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
                  baseStyle={{ 
                    color: tailwindColors.white, 
                    backgroundColor: customColors.lightBackground,
                    paddingHorizontal: 12,
                  }}
                />
                </Collapsible>
            </View>
          </Pressable>
        )}
        <View className="mt-6 rounded">
          <View className="flex-row mb-4 ml-4">
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[12%] text-center font-medium">SÉRIE</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[25%] text-center font-medium">A SUPERAR</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[20%] text-center font-medium">CARGA</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[25%] text-center font-medium">REPS</Text>
          </View>
          {Array.from({ length: sets })
            .map((_, index) => setsInfo[index])
            .map((set, index) => {
              return (
                <View
                  key={index}
                  className="flex-row items-center py-2 bg-lightBackground rounded-2xl mb-2"
                >
                  <Set
                    index={index + 1}
                    recomendedReps={reps}
                    trainingStarted={trainingStarted}
                    workoutId={workoutId}
                    exerciseId={exercise.id}
                    reps={set?.reps}
                    load={set?.load}
                    id={set?.id}
                    trainingIds={trainingIds}
                    lastExecution={
                      executions?.WorkoutExerciseSets &&
                      executions.WorkoutExerciseSets[index]
                        ? `${executions.WorkoutExerciseSets[index].load} x ${executions.WorkoutExerciseSets[index].reps}`
                        : "— —"
                    }
                    restTime={restTime}
                  />
                </View>
              );
            })}
        </View>
      </View>
    </View>
  );

  async function fetchLastExecution() {
    const { data } = await api.get(`exercise/${exercise.id}/last-execution`, {
      params: {
        day,
      },
    });

    return data;
  }
}
