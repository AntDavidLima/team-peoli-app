import { useAuthentication } from "@/contexts/AuthenticationContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  FlatList,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLine,
  VictoryScatter,
  VictoryZoomContainer,
} from "victory-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import customColors from "@/tailwind.colors";
import DropDownPicker from "react-native-dropdown-picker";
import { Fragment, useState } from "react";

export interface ExerciseWithWorkouts {
  id: number;
  name: string;
  workouts: Workout[];
}

interface Workout {
  WorkoutExerciseSets: WorkoutExerciseSet[];
  workout: {
    startTime: string;
  };
}

export interface WorkoutExerciseSet {
  id: number;
  load: number;
  reps: number;
}

export default function Progress() {
  const { currentUser } = useAuthentication();

  const { data: exercises } = useQuery({
    queryKey: ["progress"],
    queryFn: fetchExercises,
  });

  const { width } = useWindowDimensions();

  if (exercises?.length === 0) {
    return (
      <View className="p-8 mt-8">
        <Text className="text-center text-disabled text-lg">
          Ainda não temos dados o suficiente para gerar um gráfico de
          progressão.
        </Text>
      </View>
    );
  }

  return (
    <Fragment>
      <Text className="text-white text-xl text-center font-bold mt-8">
        Progressão de cargas e repetições
      </Text>
      <View className="flex-row justify-evenly w-full mt-4">
        <View className="flex-row items-center gap-2">
          <View className="rounded-full w-4 aspect-square bg-[#C43343]" />
          <Text className="text-white">Carga</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="rounded-full w-4 aspect-square bg-[#0B69D4]" />
          <Text className="text-white">Repetições</Text>
        </View>
      </View>
      <FlatList
        data={exercises}
        className="mt-8 px-4"
        contentContainerStyle={{ gap: 4 }}
        renderItem={({ item: { name, id, workouts } }) => {
          const workoutMetadata = workouts.reduce(
            (accumulator, workout) => {
              const localMaxes = workout.WorkoutExerciseSets.reduce(
                (localAccumulator, set) => ({
                  maxLoad: Math.max(localAccumulator.maxLoad, set.load),
                  maxReps: Math.max(localAccumulator.maxReps, set.reps),
                }),
                { maxLoad: 0, maxReps: 0 }
              );

              return {
                maxLoad: Math.max(accumulator.maxLoad, localMaxes.maxLoad),
                maxReps: Math.max(accumulator.maxReps, localMaxes.maxReps),
                maxSets: Math.max(
                  accumulator.maxSets,
                  workout.WorkoutExerciseSets.length
                ),
              };
            },
            { maxLoad: 0, maxReps: 0, maxSets: 0 }
          );

          return (
            <ChartCard
              id={id}
              name={name}
              workouts={workouts}
              workoutMetadata={workoutMetadata}
            />
          );
        }}
      />
    </Fragment>
  );

  async function fetchExercises() {
    const { data: exercises } = await api.get<ExerciseWithWorkouts[]>(
      `/user/${currentUser?.id}/exercise`
    );

    return exercises;
  }
}

interface ChartCard {
  id: number;
  name: string;
  workouts: Workout[];
  workoutMetadata: {
    maxLoad: number;
    maxReps: number;
    maxSets: number;
  };
}

function ChartCard({ id, name, workoutMetadata, workouts }: ChartCard) {
  const { width } = useWindowDimensions();

  return (
    <View key={id} className="bg-card rounded py-4">
      <View className="flex-row items-center justify-between px-4">
        <Text className="text-white text-base font-semibold">{name}</Text>
      </View>
      <VictoryChart domain={{ y: [0, 1] }} width={width - 22} scale={{ x: "time" }} containerComponent={<VictoryZoomContainer zoomDimension="x" />}>
        <Gradient />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => (tick * workoutMetadata.maxLoad).toFixed(1)}
          style={{
            tickLabels: { fill: "white" },
            axis: { stroke: "#C43343", strokeWidth: 4 },
            grid: {
              stroke: customColors.disabled,
              strokeDasharray: 4,
            },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => (tick * workoutMetadata.maxReps).toFixed(1)}
          orientation="right"
          style={{
            tickLabels: { textAnchor: "start", fill: "white" },
            ticks: {
              padding: -4,
            },
            axis: { stroke: "#0B69D4", strokeWidth: 4 },
          }}
        />
        <VictoryAxis
          style={{
            tickLabels: {
              fill: "white",
              padding: 16,
              fontSize: 10,
              textAnchor: "middle",
            },
            axis: {
              strokeWidth: 0,
            },
          }}
        />
        <VictoryGroup color="#C43343">
          <VictoryScatter
            data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
              day: new Date(workout.startTime),
              load:
                WorkoutExerciseSets.reduce(
                  (total, set) => total + set.load,
                  0
                ) / WorkoutExerciseSets.length,
            }))}
            x="day"
            y={(segment: WorkoutExerciseSet) =>
              segment.load / workoutMetadata.maxLoad
            }
          />
          <VictoryLine
            data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
              day: new Date(workout.startTime),
              load:
                WorkoutExerciseSets.reduce(
                  (total, set) => total + set.load,
                  0
                ) / WorkoutExerciseSets.length,
            }))}
            x="day"
            y={(segment: WorkoutExerciseSet) =>
              segment.load / workoutMetadata.maxLoad
            }
          />
        </VictoryGroup>
        <VictoryGroup color="#0B69D4">
          <VictoryScatter
            data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
              day: new Date(workout.startTime),
              reps:
                WorkoutExerciseSets.reduce(
                  (total, set) => total + set.reps,
                  0
                ) / WorkoutExerciseSets.length,
            }))}
            x="day"
            y={(segment: WorkoutExerciseSet) =>
              segment.reps / workoutMetadata.maxReps
            }
          />
          <VictoryLine
            style={{
              data: { strokeDasharray: "15, 5" },
            }}
            data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
              day: new Date(workout.startTime),
              reps:
                WorkoutExerciseSets.reduce(
                  (total, set) => total + set.reps,
                  0
                ) / WorkoutExerciseSets.length,
            }))}
            x="day"
            y={(segment: WorkoutExerciseSet) =>
              segment.reps / workoutMetadata.maxReps
            }
          />
        </VictoryGroup>
      </VictoryChart>
    </View>
  );

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
