import tailwindColors from "tailwindcss/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Collapsible from "react-native-collapsible";
import { Fragment, useState } from "react";
import draftToHtml from "draftjs-to-html";
import RenderHTML from "react-native-render-html";
import { RawDraftContentState } from "draft-js";
import { Link } from "expo-router";

type Trainings =
  | {
      routines: undefined | Routine[];
      loading: true;
    }
  | {
      routines: Routine[];
      loading: false;
    };

export interface Routine {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date | null;
  trainings: Training[];
  orientations: RawDraftContentState | null;
}

interface Training {
  id: number;
  name: string;
  exercises: TrainingExercise[];
}

interface TrainingExercise {
  sets: number;
  reps: number;
  orientations: RawDraftContentState | null;
  restTime: number;
  exercise: Exercise;
}

interface Exercise {
  id: number;
  name: string;
  executionVideoUrl: null;
}

export function Trainings({ routines, loading }: Trainings) {
  const [orientationCollapsed, setOrientationCollapsed] =
    useState<boolean>(true);

  const { width } = useWindowDimensions();

  if (loading) {
    return <Text className="text-white">Loading...</Text>;
  }

  if (
    routines
      .map(({ trainings }) =>
        trainings.map(({ exercises }) => exercises.map((exercise) => exercise)),
      )
      .flat().length === 0
  ) {
    return (
      <View className="items-center mt-16">
        <Text className="text-disabled font-semibold text-lg">
          Sem treinos hoje por enqanto
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4">
      {routines.map(
        ({ name, id, startDate, endDate, orientations, trainings }) => (
          <Fragment key={id}>
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
            {orientations && (
              <Pressable
                className="bg-orange-400/25 border border-orange-400 p-1 mt-3"
                onPress={() =>
                  setOrientationCollapsed((collapsed) => !collapsed)
                }
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1">
                    <MaterialCommunityIcons
                      name="alert-outline"
                      color={tailwindColors.orange[200]}
                      size={16}
                    />
                    <Text className="text-orange-200">Orientações gerais</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    color={tailwindColors.orange[200]}
                    className="data-[collapsed=false]:mt-8"
                    size={16}
                  />
                </View>
                <Collapsible collapsed={orientationCollapsed}>
                  <RenderHTML
                    source={{ html: draftToHtml(orientations) }}
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
                  <View className="mt-1">
                    {exercises.map(
                      ({ reps, orientations, sets, exercise, restTime }) => (
                        <Link
                          href={{
                            pathname: "/(routes)/(authenticated)/exercise/[id]",
                            params: { id: exercise.id, trainingId: id },
                          }}
                          asChild
                          key={exercise.id}
                        >
                          <Pressable className="bg-card p-2 rounded flex-row justify-between">
                            <View className="flex-1">
                              <View className="flex-row gap-1 items-center">
                                <Text className="text-white font-semibold mb-1">
                                  {exercise.name}
                                </Text>
                                <View className="flex-row items-center gap-0.5 mt-0.5">
                                  <MaterialCommunityIcons
                                    name="timer-outline"
                                    color={tailwindColors.white}
                                    size={14}
                                  />
                                  <Text className="text-white text-xs">
                                    {restTime}s
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row gap-1">
                                <Text className="text-white font-semibold text-xs">
                                  {sets} Séries
                                </Text>
                                <Text className="text-white font-semibold text-xs">
                                  de
                                </Text>
                                <Text className="text-white font-semibold text-xs">
                                  {reps} Repetições
                                </Text>
                              </View>
                              {orientations && (
                                <View className="mt-3">
                                  <Text className="text-white text-xs font-bold">
                                    Instruções:
                                  </Text>
                                  <RenderHTML
                                    source={{ html: draftToHtml(orientations) }}
                                    contentWidth={width}
                                    baseStyle={{ color: tailwindColors.white }}
                                  />
                                </View>
                              )}
                            </View>
                            <View className="bg-gray-300 h-32 w-24 rounded-lg items-center justify-center">
                              <MaterialCommunityIcons name="play" size={32} />
                            </View>
                          </Pressable>
                        </Link>
                      ),
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Fragment>
        ),
      )}
    </View>
  );
}
