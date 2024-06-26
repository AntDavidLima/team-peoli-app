import { api } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { RawDraftContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { useLocalSearchParams } from "expo-router";
import {
  Pressable,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHTML from "react-native-render-html";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";

interface Training {
  exercises: TrainingExercise[];
}

export interface TrainingExercise {
  sets: number;
  reps: number;
  restTime: number;
  orientations: RawDraftContentState | null;
  exercise: Exercise;
}

export interface Exercise {
  id: number;
  name: string;
  executionVideoUrl: null | string;
}

export default function Exercise() {
  const { id, trainingId } = useLocalSearchParams();

  const { data: training, isLoading: loadingExercise } = useQuery({
    queryFn: fetchExercises,
    queryKey: ["exercises", id, trainingId],
  });

  const { width } = useWindowDimensions();

  if (loadingExercise || !training) {
    return <Text className="text-white">Loading...</Text>;
  }

  const { exercise, orientations, sets, reps, restTime } =
    training.exercises[0];

  return (
    <View className="px-4">
      <View className="bg-gray-300 h-48 rounded-lg items-center justify-center mt-6">
        <MaterialCommunityIcons name="play" size={32} />
      </View>
      <View className="mt-2">
        <View className="flex-row gap-1 items-center">
          <Text className="text-white font-bold text-lg">{exercise.name}</Text>
          <View className="flex-row items-center gap-0.5 mt-0.5">
            <MaterialCommunityIcons
              name="timer-outline"
              color={tailwindColors.white}
              size={14}
            />
            <Text className="text-white text-xs">{restTime}s</Text>
          </View>
        </View>
        {orientations && (
          <View className="mt-2 text-orange-200 bg-orange-400/20 border border-orange-400 p-1">
            <Text className="text-white font-semibold">Instruções:</Text>
            <RenderHTML
              source={{ html: draftToHtml(orientations) }}
              contentWidth={width}
              baseStyle={{ color: tailwindColors.white }}
            />
          </View>
        )}
        <View className="flex-row mt-4 space-x-4 justify-between bg-card p-4 rounded">
          <View className="gap-5">
            {Array.from({ length: sets + 1 }).map((_, index) => (
              <Text className="text-white" key={index}>
                {index === 0 ? "" : `${index}ª Série`}
              </Text>
            ))}
          </View>
          <View className="gap-4">
            {Array.from({ length: sets + 1 }).map((_, index) => {
              if (index === 0) {
                return (
                  <Text className="text-white" key={index}>
                    Carga
                  </Text>
                );
              }

              return (
                <TextInput className="border-b border-white h-6 w-12 text-white" />
              );
            })}
          </View>
          <View className="gap-4">
            {Array.from({ length: sets + 1 }).map((_, index) => {
              if (index === 0) {
                return (
                  <Text className="text-white" key={index}>
                    Repetições
                  </Text>
                );
              }

              return (
                <TextInput
                  className="border-b border-white h-6 text-white w-12"
                  placeholder={reps.toString()}
                  placeholderTextColor={customColors.disabled}
                />
              );
            })}
          </View>
          <View className="gap-4">
            {Array.from({ length: sets + 1 }).map((_, index) => {
              if (index === 1) {
                return (
                  <Pressable>
                    <MaterialCommunityIcons
                      name="play"
                      color={tailwindColors.green[500]}
                      size={26}
                    />
                  </Pressable>
                );
              }

              return <Text className="text-white" key={index} />;
            })}
          </View>
        </View>
      </View>
    </View>
  );

  async function fetchExercises() {
    const { data: training } = await api.get<Training>(
      `/training/${trainingId}`,
      {
        params: {
          exerciseId: id,
        },
      },
    );

    return training;
  }
}
