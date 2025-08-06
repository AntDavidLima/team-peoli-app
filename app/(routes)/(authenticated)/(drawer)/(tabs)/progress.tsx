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
      <View className="p-6 mt-6 flex-1 justify-center items-center">
        <Text className="text-white text-base">Carregando estatísticas...</Text>
      </View>
    );
  }

  if (!isLoading && (!allExercises || allExercises.length === 0)) {
    return (
      <View className="p-6 mt-6">
        <Text className="text-center text-disabled text-base">
          Ainda não temos dados o suficiente para gerar um gráfico de
          progressão.
        </Text>
      </View>
    );
  }

  return (
    <Fragment>
      <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white text-xl text-center mt-6 font-extrabod">
        Estatísticas de Progressão
      </Text>
      <View style={{ zIndex: 1000, marginHorizontal: 16, marginTop: 12 }}>
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
          textStyle={{
            marginLeft: 12, 
            color: 'white',
            fontSize: 14
          }}
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
          placeholderStyle={{ color: customColors.disabled, fontSize: 14 }}
        />
      </View>
      <FlatList
        data={displayedExercises}
        keyExtractor={(item) => item.id.toString()}
        className="mt-6 px-4"
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => {
          if (item.workouts.length === 0) {
            return null;
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
            <View className="mt-6 items-center">
                <Text className="text-center text-disabled text-sm">
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

  const { weeklyVolumeData, minDomain, maxDomain } = useMemo(() => {
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

    const formattedData = Object.entries(weeklyData)
      .map(([dateStr, volume]) => ({
        day: new Date(dateStr),
        value: volume,
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime()).slice(-4);

      if(formattedData.length === 0) {
        return { weeklyVolumeData: [], minDomain: 0, maxDomain: 100 };
      }

      const values = formattedData.map(d => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);

      const padding = (max - min) * 1 || 10;

      return {
        weeklyVolumeData: formattedData,
        minDomain: Math.max(0, min - padding),
        maxDomain: max + padding,
      }

  }, [workouts]);

  if (weeklyVolumeData.length < 1) {
    return null;
  }

  return (
    <View key={id} className="bg-lightBackground rounded-2xl py-3">
      <View className="px-6 py-3">
        <Text style={{fontFamily: 'Inter-ExtraBold'}} className="self-center text-white text-lg font-extrabold">{name}</Text>
      </View>
      <VictoryChart
        width={width - 22}
        scale={{ x: "time" }}
        padding={{ top: 15, bottom: 40, left: 55, right: 20 }}
        domain={{ y: [minDomain, maxDomain] }}
        containerComponent={
            <VictoryZoomContainer 
                zoomDimension="x" 
                allowZoom={weeklyVolumeData.length > 5}
            />
        }
      >
        <VictoryLabel
          text="Carga Total (KG)"
          x={180}
          y={6}
          textAnchor="middle"
          style={{
            fill: customColors.main,
            fontFamily: 'Inter-ExtraBold',
            fontSize: 12
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
            tickLabels: { fill: "white", fontSize: 9 },
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
              fontSize: 9,
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
            data: { stroke: customColors.main, strokeWidth: 3 }
          }}
          interpolation="monotoneX"
        />
        
        <VictoryScatter
          data={weeklyVolumeData}
          x="day"
          y="value"
          size={5}
          style={{
            data: { fill: customColors.main, stroke: 'white', strokeWidth: 1 }
          }}
        />
      </VictoryChart>
    </View>
  );
}