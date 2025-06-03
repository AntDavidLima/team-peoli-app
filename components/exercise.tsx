import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { WebDisplay } from "./web-display";
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
          <View className="flex-row pl-1 mt-1 gap-0.5">
              <MaterialCommunityIcons
                name="timer-outline"
                color={customColors.secondary}
                size={14}
              />
              <Text className="text-white text-xs">{restTime}s</Text>
            </View>
          <Text className="text-white font-bold text-4xl">
            {exercise.name}
          </Text>
        </View>
        {exercise.executionVideoUrl && (
          <View className="mt-2 bg-card rounded-2xl">
            <Video
              source={{ uri: exercise.executionVideoUrl }}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
              }}
            />
          </View>
        )}
        {orientations?.blocks[0].text.trim() !== "" && (
          <Pressable
            className="bg-main rounded-2xl mt-4"
            onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
          >
            <View className="p-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">Instruções</Text>
                <View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    color={customColors.secondary}
                    size={20}
                  />
                </View>
              </View>
              <Collapsible collapsed={orientationCollapsed}>
                  <WebDisplay
                    html={draftToHtml(orientations!)}
                    textColor={tailwindColors.white}
                  />
                </Collapsible>
            </View>
          </Pressable>
        )}
        <View className="mt-8 rounded">
          <View className="flex-row mb-4">
            <Text className="text-white w-[15%] text-center">SÉRIE</Text>
            <Text className="text-white w-1/4 text-center">A SUPERAR</Text>
            <Text className="text-white w-1/5 text-center">CARGA</Text>
            <Text className="text-white w-[25%] text-center">REPS</Text>
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
