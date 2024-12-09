import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import customColors from "@/tailwind.colors";
import { Days } from "./(trainings)/_layout";
import tailwindColors from "tailwindcss/colors";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { ExerciseWithWorkouts, WorkoutExerciseSet } from "./progress";
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLine,
  VictoryScatter,
} from "victory-native";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";
import { format } from "date-fns";
import _ from "lodash";
import { ptBR } from "date-fns/locale";
import { Routine } from "@/components/trainings";
import { Link } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { useState } from "react";

export default function Home() {
  const [progressionRangeOpen, setProgressionRangeOpen] = useState(false);
  const [progressionRange, setProgressionRange] = useState("last-month");

  const { currentUser } = useAuthentication();

  const { data: exercises } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchExercises,
  });

  const { data: routines } = useQuery({
    queryKey: ["trainings", format(new Date(), "EEEE", { locale: ptBR })],
    queryFn: fetchTrainings,
  });

  const { width } = useWindowDimensions();

  const exercisesMetadata = exercises?.reduce(
    (metadata, { workouts }) => {
      const workoutMetadata = workouts.reduce(
        (accumulator, workout) => {
          const localMetadata = workout.WorkoutExerciseSets.reduce(
            (localAccumulator, set) => ({
              maxLoad: Math.max(localAccumulator.maxLoad, set.load),
              maxReps: Math.max(localAccumulator.maxReps, set.reps),
              totalLoad: localAccumulator.totalLoad + set.load,
              totalReps: localAccumulator.totalReps + set.reps,
            }),
            { maxLoad: 0, maxReps: 0, totalLoad: 0, totalReps: 0 }
          );

          const averageLoad =
            localMetadata.totalLoad / workout.WorkoutExerciseSets.length;
          const averageReps =
            localMetadata.totalReps / workout.WorkoutExerciseSets.length;

          return {
            maxLoad: Math.max(accumulator.maxLoad, localMetadata.maxLoad),
            maxReps: Math.max(accumulator.maxReps, localMetadata.maxReps),
            workouts: [
              ...accumulator.workouts,
              {
                averageLoad,
                averageReps,
                startTime: workout.workout.startTime,
              },
            ],
          };
        },
        {
          maxLoad: 0,
          maxReps: 0,
          workouts: [] as {
            averageLoad: number;
            averageReps: number;
            startTime: string;
          }[],
        }
      );

      return {
        maxLoad: Math.max(metadata.maxLoad, workoutMetadata.maxLoad),
        maxReps: Math.max(metadata.maxReps, workoutMetadata.maxReps),
        workouts: [...metadata.workouts, ...workoutMetadata.workouts],
      };
    },
    {
      maxLoad: 0,
      maxReps: 0,
      workouts: [] as {
        averageLoad: number;
        averageReps: number;
        startTime: string;
      }[],
    }
  );

  return (
    <ScrollView>
      <View className="p-4 mt-6">
        {routines && routines[0]?.trainings[0] ? (
          <Link
            href={{
              pathname: "/(routes)/(authenticated)/exercise/[id]",
              params: {
                id: routines?.[0].trainings[0]?.exercises[0].exercise.id,
                trainingId: routines?.[0]?.trainings[0]?.id,
                day: format(new Date(), "EEEE").toUpperCase(),
              },
            }}
            asChild
          >
            <Pressable className="bg-card rounded p-2">
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-white font-bold text-xl">
                    Iniciar Treino
                  </Text>
                  <Text className="text-subtitle font-semibold mt-1">
                    {format(new Date(), "EEEE", { locale: ptBR })}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  color={customColors.main}
                  size={68}
                />
              </View>
              <View>
                {routines?.map((routine) =>
                  routine.trainings.map((training) => (
                    <Text className="text-subtitle">{training.name}</Text>
                  ))
                )}
              </View>
            </Pressable>
          </Link>
        ) : (
          <View className="bg-card rounded p-2">
            <View className="flex-row justify-between">
              <View>
                <Text className="text-white font-bold text-xl">
                  Iniciar Treino
                </Text>
                <Text className="text-subtitle font-semibold mt-1">
                  {format(new Date(), "EEEE", { locale: ptBR })}
                </Text>
                <Text className="text-subtitle text-xs mt-1 max-w-[80%]">
                  Por enquanto seu professor ainda não cadastrou um treino pro
                  dia de hoje, mas assim que ele cadastrar, você poderá tocar
                  aqui para ir direto para ele!
                </Text>
              </View>
              <MaterialCommunityIcons
                name="play-circle-outline"
                color={customColors.main}
                size={68}
              />
            </View>
            <View>
              {routines?.map((routine) =>
                routine.trainings.map((training) => (
                  <Text className="text-subtitle">{training.name}</Text>
                ))
              )}
            </View>
          </View>
        )}
        <View className="bg-card rounded p-3 mt-4">
          <View className="flex-row justify-between">
            {Object.values(Days).map((day, index) => (
              <View className="items-center gap-1" key={index}>
                <Text className="text-white font-semibold text-base">
                  {day}
                </Text>
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
        <View className="bg-card rounded mt-4 py-4 relative overflow-hidden">
          <View className="flex-row items-center">
            <Text className="text-white text-base font-semibold ml-4 w-1/2">
              Evolução geral
            </Text>
            <DropDownPicker
              items={[
                { label: "Último mês", value: "last-month" },
                { label: "Último semestre", value: "last-semester" },
                { label: "Todos", value: "all" },
              ]}
              open={progressionRangeOpen}
              setOpen={setProgressionRangeOpen}
              setValue={setProgressionRange}
              value={progressionRange}
              style={{
                width: 160,
                backgroundColor: customColors.background,
              }}
              containerStyle={{
                width: 160,
              }}
              listItemContainerStyle={{
                backgroundColor: customColors.background,
              }}
              theme="DARK"
            />
          </View>
          {exercises &&
            (exercises.length > 0 ? (
              <ScrollView horizontal>
                <VictoryChart
                  domain={{ y: [0, 1] }}
                  width={
                    progressionRange === "all"
                      ? width - 22
                      : (exercisesMetadata?.workouts.length || 0) * 56 <
                        width - 22
                      ? width - 22
                      : (exercisesMetadata?.workouts.length || 0) * 56
                  }
                >
                  <VictoryAxis
                    dependentAxis
                    tickFormat={() => ""}
                    style={{
                      axis: { stroke: "#C43343", strokeWidth: 4 },
                      grid: {
                        stroke: customColors.disabled,
                        strokeDasharray: 4,
                      },
                      axisLabel: {
                        fill: "#FFF",
                        padding: 18,
                      },
                    }}
                    label="Carga"
                  />
                  <VictoryAxis
                    dependentAxis
                    tickFormat={() => ""}
                    style={{
                      axis: { stroke: "#0B69D4", strokeWidth: 4 },
                      axisLabel: {
                        padding: 12,
                        fill: "#FFF",
                      },
                    }}
                    label="Repetições"
                    orientation="right"
                  />
                  <VictoryAxis
                    tickValues={exercisesMetadata!.workouts.map(
                      ({ startTime }) => format(new Date(startTime), "d/M/yy")
                    )}
                    style={{
                      tickLabels: {
                        fill: "white",
                        padding: 12,
                        fontSize: 10,
                        textAnchor: "middle",
                      },
                      axis: {
                        strokeWidth: 0,
                      },
                    }}
                    tickFormat={(value) =>
                      progressionRange === "all" ? "" : value
                    }
                  />
                  <Gradient />
                  <VictoryGroup
                    data={Object.values(
                      _.groupBy(exercisesMetadata!.workouts, ({ startTime }) =>
                        format(startTime, "d/M/y")
                      )
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0
                          );

                          return [
                            ...accumulator,
                            {
                              averageLoad: totalLoad / workouts.length,
                              averageReps: totalReps / workouts.length,
                              startTime: workouts[0].startTime,
                            },
                          ];
                        },
                        [] as {
                          averageLoad: number;
                          averageReps: number;
                          startTime: string;
                        }[]
                      )
                      .map(({ averageLoad, startTime }) => ({
                        day: format(new Date(startTime), "d/M/yy"),
                        load: averageLoad,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      segment.load / exercisesMetadata!.maxLoad
                    }
                    color="#C43343"
                  >
                    <VictoryScatter />
                    <VictoryLine />
                  </VictoryGroup>
                  <VictoryGroup
                    data={Object.values(
                      _.groupBy(exercisesMetadata!.workouts, ({ startTime }) =>
                        format(startTime, "d/M/y")
                      )
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0
                          );

                          return [
                            ...accumulator,
                            {
                              averageLoad: totalLoad / workouts.length,
                              averageReps: totalReps / workouts.length,
                              startTime: workouts[0].startTime,
                            },
                          ];
                        },
                        [] as {
                          averageLoad: number;
                          averageReps: number;
                          startTime: string;
                        }[]
                      )
                      .map(({ startTime, averageReps }) => ({
                        day: format(new Date(startTime), "d/M/yy"),
                        reps: averageReps,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      segment.reps / exercisesMetadata!.maxReps
                    }
                    color="#0B69D4"
                  >
                    <VictoryScatter />
                    <VictoryLine
                      style={{
                        data: { strokeDasharray: "15, 5" },
                      }}
                    />
                  </VictoryGroup>
                </VictoryChart>
              </ScrollView>
            ) : (
              <Text className="text-disabled text-xl p-4">
                Sem dados suficientes para gerar o gráfico de evolução.
              </Text>
            ))}
        </View>
      </View>
    </ScrollView>
  );

  async function fetchExercises() {
    const { data: exercises } = await api.get<ExerciseWithWorkouts[]>(
      `/user/${currentUser?.id}/exercise`
    );

    return exercises;
  }

  async function fetchTrainings() {
    const { data } = await api.get<Routine[]>("routine", {
      params: {
        day: format(new Date(), "EEEE").toUpperCase(),
        userId: currentUser?.id,
      },
    });

    return data;
  }

  function Gradient() {
    return (
      <Svg>
        <Defs>
          <LinearGradient
            id="red-to-blue"
            x1="0%"
            x2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#C43343" />
            <Stop offset="100%" stopColor="#0B69D4" />
          </LinearGradient>
        </Defs>
        <Rect
          x="48"
          y="83%"
          width={
            progressionRange === "all"
              ? width - 118
              : (exercisesMetadata?.workouts.length || 0) * 56 - 96 <
                width - 118
              ? width - 118
              : (exercisesMetadata?.workouts.length || 0) * 56 - 96
          }
          height="4px"
          fill="url(#red-to-blue)"
        />
      </Svg>
    );
  }
}
