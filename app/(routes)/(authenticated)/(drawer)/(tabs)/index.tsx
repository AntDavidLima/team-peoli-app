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
  VictoryZoomContainer,
} from "victory-native";
import { Defs, LinearGradient, Rect, Stop, Svg } from "react-native-svg";
import { format } from "date-fns";
import _ from "lodash";
import { ptBR } from "date-fns/locale";
import { Routine } from "@/components/trainings";
import { Link } from "expo-router";
import FireIcon from "@/assets/icons/fire.svg";

export default function Home() {
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
              maxLoad: Math.max(localAccumulator.maxLoad, parseFloat(set.load)),
              maxReps: Math.max(localAccumulator.maxReps, set.reps),
              totalLoad: localAccumulator.totalLoad + parseFloat(set.load),
              totalReps: localAccumulator.totalReps + set.reps,
            }),
            { maxLoad: 0, maxReps: 0, totalLoad: 0, totalReps: 0 },
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
        },
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
    },
  );
  return (
    <ScrollView>
      <View className="px-4">
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
            <Pressable className="bg-lightBackground rounded-2xl rounded p-2">
              <View className="flex-row px-4 py-4 justify-between">
                <View>
                  <View>
                    <Text className="text-white font-bold text-2xl">
                      Iniciar Treino
                    </Text>
                    <Text className="text-disabled font-semibold mt-1">
                      {format(new Date(), "EEEE", { locale: ptBR })}
                    </Text>
                    {/* {routines?.map((routine) => */}
                      {/* routine.trainings.map((training) => ( */}
                        <Text className="text-secondary font-bold text-2xl">{routines[0]?.trainings[0].name}</Text>
                      {/* )), */}
                    {/* )} */}
                  </View>
                </View>
                <View>
                  <FireIcon width={40} height={40} />
                </View>
              </View>
            </Pressable>
          </Link>
        ) : (
          <View className="bg-lightBackground rounded-2xl p-2">
            <View className="flex-row px-4 py-4 justify-between">
              <View>
                <Text style={{fontFamily: 'Inter_400Regular'}} className="text-white font-bold text-xl">
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
              <View className="bg-main rounded-full items-center justify-center h-20 w-20">
                <FireIcon width={40} height={40} />
              </View>
            </View>
            <View>
              {routines?.map((routine) =>
                routine.trainings.map((training) => (
                  <Text className="text-subtitle">{training.name}</Text>
                )),
              )}
            </View>
          </View>
        )}
        <View className="rounded p-3 mt-4">
          <View className="flex-row justify-between">
            {Object.values(Days).map((day, index) => (
              <View className={`${index == new Date().getDay() ? ('bg-main') : ('bg-lightBackground')} 
                items-center w-12 rounded-full`} key={index}>
                <Text className="text-gray-400 pt-1 font-semibold text-base">
                  {day}
                </Text>
                <Text className="px-2 pb-1 text-white">
                  {new Date().getDate() - new Date().getDay() + (new Date().getDay() === 0 ? -6 : 0) + index}
                </Text>
              </View>
            ))}
          </View>
          <View className="mt-3 flex-row justify-center">
            <Text className="text-white">0/1 dias completos</Text>
          </View>
        </View>
        <View className="bg-lightBackground rounded-xl mt-4 py-4 relative overflow-hidden">
          <View className="flex-row items-center">
            <Text className="text-white text-base text-2xl font-bold ml-4">
              Status de Progressão Geral
            </Text>
          </View>
          {exercises &&
            (exercises.length > 0 ? (
              <VictoryChart
                domain={{ y: [0, 1] }}
                width={width - 22}
                scale={{ x: "time" }}
                containerComponent={<VictoryZoomContainer zoomDimension="x" />}
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
                />
                <Gradient />
                <VictoryGroup color="#C43343">
                  <VictoryScatter
                    data={Object.values(
                      _.groupBy(
                        exercisesMetadata!.workouts,
                        ({ startTime }) => startTime,
                      ),
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0,
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0,
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
                        }[],
                      )
                      .map(({ averageLoad, startTime }) => ({
                        day: new Date(startTime),
                        load: averageLoad,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      parseFloat(segment.load) / exercisesMetadata!.maxLoad
                    }
                  />
                  <VictoryLine
                    data={Object.values(
                      _.groupBy(
                        exercisesMetadata!.workouts,
                        ({ startTime }) => startTime,
                      ),
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0,
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0,
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
                        }[],
                      )
                      .map(({ averageLoad, startTime }) => ({
                        day: new Date(startTime),
                        load: averageLoad,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      parseFloat(segment.load) / exercisesMetadata!.maxLoad
                    }
                  />
                </VictoryGroup>
                <VictoryGroup color="#0B69D4">
                  <VictoryScatter
                    data={Object.values(
                      _.groupBy(
                        exercisesMetadata!.workouts,
                        ({ startTime }) => startTime,
                      ),
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0,
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0,
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
                        }[],
                      )
                      .map(({ startTime, averageReps }) => ({
                        day: new Date(startTime),
                        reps: averageReps,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      segment.reps / exercisesMetadata!.maxReps
                    }
                  />
                  <VictoryLine
                    style={{
                      data: { strokeDasharray: "15, 5" },
                    }}
                    data={Object.values(
                      _.groupBy(
                        exercisesMetadata!.workouts,
                        ({ startTime }) => startTime,
                      ),
                    )
                      .reduce(
                        (accumulator, workouts) => {
                          const totalLoad = workouts.reduce(
                            (total, { averageLoad }) => total + averageLoad,
                            0,
                          );
                          const totalReps = workouts.reduce(
                            (total, { averageReps }) => total + averageReps,
                            0,
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
                        }[],
                      )
                      .map(({ startTime, averageReps }) => ({
                        day: new Date(startTime),
                        reps: averageReps,
                      }))}
                    x="day"
                    y={(segment: WorkoutExerciseSet) =>
                      segment.reps / exercisesMetadata!.maxReps
                    }
                  />
                </VictoryGroup>
              </VictoryChart>
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
      `/user/${currentUser?.id}/exercise`,
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
          width={width - 118}
          height="4px"
          fill="url(#red-to-blue)"
        />
      </Svg>
    );
  }
}
