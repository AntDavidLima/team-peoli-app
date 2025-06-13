import { useAuthentication } from "@/contexts/AuthenticationContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  FlatList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryZoomContainer,
  VictoryLabel
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import customColors from "@/tailwind.colors";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";
import { Fragment, useEffect, useMemo, useState } from "react";

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
  load: string;
  reps: number;
}

interface Training {
  id: number;
  name: string;
  exercises: {
    exercise: {
      id: number;
    };
  }[];
}

interface Routine {
    id: number;
    name: string;
    trainings: Training[];
}

const ALL_TRAININGS_VALUE = "Todos";

export default function Progress() {
  const { currentUser } = useAuthentication();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | number | null>(ALL_TRAININGS_VALUE);
  const [items, setItems] = useState<ItemType<string | number>[]>([
    { label: "Todos os treinos", value: ALL_TRAININGS_VALUE },
  ]);

  const { data: allExercises, isLoading: isLoadingExercises } = useQuery({
    queryKey: ["progressExercises", currentUser?.id],
    queryFn: fetchAllExercisesWithWorkouts,
    enabled: !!currentUser?.id,
  });

  const { data: routines, isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["routinesForDropdown", currentUser?.id],
    queryFn: fetchRoutines,
    enabled: !!currentUser?.id,
  });

  const allTrainings = useMemo(() => {
    if (!routines) return [];
    return routines.flatMap(routine => routine.trainings);
  }, [routines]);

  useEffect(() => {
    if (allTrainings.length > 0) {
      const trainingItems = allTrainings.map((training) => ({
        label: training.name,
        value: training.id,
      }));
      setItems([{ label: "Todos os treinos", value: ALL_TRAININGS_VALUE }, ...trainingItems]);
    } else {
      setItems([{ label: "Todos os treinos", value: ALL_TRAININGS_VALUE }]);
    }
  }, [allTrainings]);

  const displayedExercises = useMemo(() => {
    if (!allExercises) return [];
    
    if (value === ALL_TRAININGS_VALUE) {
      return allExercises;
    }

    if (!allTrainings) return [];
    
    const selectedTraining = allTrainings.find(t => t.id === value);
    if (!selectedTraining) return [];

    const exerciseIdsInTraining = new Set(selectedTraining.exercises.map(e => e.exercise.id));
    
    return allExercises.filter(exercise => exerciseIdsInTraining.has(exercise.id));
  }, [allExercises, allTrainings, value]);

  const isLoading = isLoadingExercises || isLoadingRoutines;

  if (isLoading) {
    return (
      <View className="p-8 mt-8 flex-1 justify-center items-center">
        <Text className="text-white text-lg">Carregando estatísticas...</Text>
      </View>
    );
  }

  if (!isLoading && (!allExercises || allExercises.length === 0)) {
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
      <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white text-2xl text-center mt-8 font-extrabod">
        Estatísticas de Progressão
      </Text>
      <View style={{ zIndex: 1000, marginHorizontal: 16, marginTop: 16 }}>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={(val) => {
            const selectedValue = typeof val === 'function' ? val(value) : val;
            setValue(selectedValue);
          }}
          setItems={setItems}
          placeholder="Selecione um treino"
          listMode="SCROLLVIEW"
          theme="DARK"
          style={{ backgroundColor: customColors.lightBackground, borderRadius: 15, borderColor: customColors.lightBackground }}
          textStyle={{ color: 'white' }}
          dropDownContainerStyle={{ 
            elevation: 5, 
            backgroundColor: customColors.lightBackground, 
            borderColor: customColors.lightBackground,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
          placeholderStyle={{ color: customColors.disabled }}
        />
      </View>
      <FlatList
        data={displayedExercises}
        keyExtractor={(item) => item.id.toString()}
        className="mt-8 px-4"
        contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
        renderItem={({ item }) => {
          if (item.workouts.length === 0) {
          }

          return (
            <ChartCard
              key={item.id}
              id={item.id}
              name={item.name}
              workouts={item.workouts}
            />
          );
        }}
        ListEmptyComponent={
            <View className="mt-8 items-center">
                <Text className="text-center text-disabled text-base">
                    Nenhum exercício com dados encontrado para este treino.
                </Text>
            </View>
        }
      />
    </Fragment>
  );

  async function fetchAllExercisesWithWorkouts() {
    if (!currentUser?.id) return [];
    const { data } = await api.get<ExerciseWithWorkouts[]>(
      `/user/${currentUser?.id}/exercise`,
    );
    return data;
  }

  async function fetchRoutines() {
    if (!currentUser?.id) return [];
    const { data } = await api.get<Routine[]>(
      `/routine?userId=${currentUser?.id}`,
    );
    return data;
  }
}

interface ChartCardProps {
  id: number;
  name: string;
  workouts: Workout[];
}

function ChartCard({ id, name, workouts }: ChartCardProps) {
  const { width } = useWindowDimensions();

  const weeklyVolumeData = useMemo(() => {
    const weeklyData = workouts.reduce((acc, { workout, WorkoutExerciseSets }) => {
      const date = new Date(workout.startTime);
      const dayOfWeek = date.getDay();
      const weekStartDate = new Date(date);
      weekStartDate.setDate(date.getDate() - dayOfWeek);
      weekStartDate.setHours(0, 0, 0, 0);
      const weekKey = weekStartDate.toISOString();

      const workoutVolume = WorkoutExerciseSets.reduce(
        (total, set) => total + parseFloat(set.load) * set.reps,
        0
      );

      acc[weekKey] = (acc[weekKey] || 0) + workoutVolume;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(weeklyData)
      .map(([dateStr, volume]) => ({
        day: new Date(dateStr),
        value: volume,
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime()).slice(-5);
  }, [workouts]);

  if (weeklyVolumeData.length < 1) {
    return null;
  }

  return (
    <View key={id} className="bg-lightBackground rounded-2xl py-4">
      <View className="px-8 py-4">
        <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white text-xl font-extrabold">{name}</Text>
      </View>
      <VictoryChart
        width={width - 22}
        scale={{ x: "time" }}
        padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
        containerComponent={
            <VictoryZoomContainer 
                zoomDimension="x" 
                allowZoom={weeklyVolumeData.length > 5}
            />
        }
      >
        <VictoryLabel
          text="Carga Total (KG)"
          x={200}
          y={5}
          textAnchor="middle"
          style={{
            fill: customColors.main,
            fontFamily: 'Inter-ExtraBold'
          }}
        />
        <Defs>
          <LinearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={customColors.main} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={customColors.main} stopOpacity={0.2} />
          </LinearGradient>
        </Defs>

        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => `${Math.round(tick).toLocaleString('pt-BR')}`}
          style={{
            tickLabels: { fill: "white", fontSize: 10 },
            axis: { stroke: "transparent" },
            grid: {
              stroke: customColors.disabled,
              strokeDasharray: "0",
              strokeWidth: 0.5
            },
          }}
        />

        <VictoryAxis
          tickFormat={(x) => new Date(x).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' })}
          fixLabelOverlap
          style={{
            tickLabels: {
              fill: customColors.disabled,
              padding: 5,
              fontSize: 10,
            },
            axis: {
              strokeWidth: 0,
            },
          }}
        />
        
        <VictoryArea
          data={weeklyVolumeData}
          x="day"
          y="value"
          style={{
            data: { fill: "url(#chartGradient)" }
          }}
          interpolation="monotoneX"
        />

        <VictoryLine
          data={weeklyVolumeData}
          x="day"
          y="value"
          style={{
            data: { stroke: customColors.main, strokeWidth: 4 }
          }}
          interpolation="monotoneX"
        />
        
        <VictoryScatter
          data={weeklyVolumeData}
          x="day"
          y="value"
          size={6}
          style={{
            data: { fill: customColors.main, stroke: 'white', strokeWidth: 1 }
          }}
        />
      </VictoryChart>
    </View>
  );
}