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

    
  const [orientationVideoCollapsed, setOrientationVideoCollapsed] =
    useState<boolean>(true);

  const [ selectedAspectRatio, setSelectedAspectRatio ] = useState(16 / 9);

  const { data: executions } = useQuery({
    queryKey: ["exercise", "last-execution", exercise.id, currentUser?.id, day],
    queryFn: fetchLastExecution,
  });

   const handleToggleAspectRatio = () => {
    setOrientationVideoCollapsed((collapsed) => !collapsed)
    setSelectedAspectRatio(currentRatio => {
      return currentRatio === 16 / 9 ? 9 / 16 : 16 / 9;
    });
  };

  return (
    <View className="px-3 mb-12">
      <View className="mt-4">
        <View>
          <View className="flex-row pl-1 mt-1 gap-1.5 items-center">
              <TimerIcon width={16} height={16} color={customColors.secondary} />
              <Text style={{fontFamily: 'Inter-Regular'}}  className="text-gray-400 text-sm">{restTime}s</Text>
            </View>
          <Text style={{fontFamily: 'Inter-ExtraBold'}}  className="text-white mt-3 text-xl font-extrabold">
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
                aspectRatio: selectedAspectRatio,
              }}
            />
            <Pressable onPress={handleToggleAspectRatio}
              style={{
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                shadowOpacity: 0.51,
                shadowRadius: 13.16,
                borderRadius: 15,
                elevation: 20,
              }}
            >
              <View className="flex-row items-center p-3 justify-between">
                <View className="flex-row gap-2 items-center">
                  <Text style={{fontFamily: 'Inter-Medium'}} className="text-white text-xs">
                    {selectedAspectRatio === 16 / 9 
                      ? 'Ajustar para Vertical' 
                      : 'Ajustar para Horizontal'}
                  </Text>
                </View>
                <View className={orientationVideoCollapsed ? "rotate-0" : "rotate-180"}>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    color={tailwindColors.white}
                    size={14}
                  />
                </View>
              </View>
            </Pressable>
          </View>
        )}
        {orientations?.blocks[0].text.trim() !== "" && (
          <Pressable
            className="bg-main rounded-xl mt-3"
            onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
          >
            <View>
              <View className="flex-row items-center p-3 justify-between">
                <View className="flex-row gap-2 items-center">
                  <InfoIcon width={18} height={18} color={customColors.secondary} />
                  <Text style={{fontFamily: 'Inter-Medium'}}  className="text-white text-xs">Instruções</Text>
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
                  baseStyle={{ 
                    color: tailwindColors.white, 
                    backgroundColor: customColors.lightBackground,
                    paddingHorizontal: 10,
                    fontSize: '13px'
                  }}
                />
                </Collapsible>
            </View>
          </Pressable>
        )}
        <View className="mt-4 rounded">
          <View className="flex-row mb-3 ml-3">
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[12%] text-center text-xs">SÉRIE</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[25%] text-center text-xs">A SUPERAR</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[20%] text-center text-xs">CARGA</Text>
            <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-[25%] text-center text-xs">REPS</Text>
          </View>
          {Array.from({ length: sets })
            .map((_, index) => setsInfo[index])
            .map((set, index) => {
              return (
                <View
                  key={`${workoutId}-${index}`}
                  className="flex-row items-center py-1.5 bg-lightBackground rounded-2xl mb-1.5"
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