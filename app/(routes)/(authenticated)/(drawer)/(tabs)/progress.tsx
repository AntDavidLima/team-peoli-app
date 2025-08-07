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
      <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white text-xl text-center font-extrabod">
        Estatísticas de Progressão
      </Text>
      <View style={{ zIndex: 1000, marginHorizontal: 16, marginTop: 4 }}>
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
        className="mt-3 px-4"
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
            <ChartCard
              key={item.id}
              id={item.id}
              name={item.name}
              workouts={item.workouts}
            />
        )}
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

  const { weeklyVolumeData, minDomain, maxDomain, totalEvolutionPercentage } = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return { weeklyVolumeData: [], minDomain: -50, maxDomain: 50, totalEvolutionPercentage: 0 };
    }

    const weeklyData = workouts.reduce((acc, { workout, WorkoutExerciseSets }) => {
      const date = new Date(workout.startTime);
      const dayOfWeek = date.getDay();
      const weekStartDate = new Date(date);
      weekStartDate.setDate(date.getDate() - dayOfWeek);
      weekStartDate.setHours(0, 0, 0, 0);
      const weekKey = weekStartDate.toISOString();

      const workoutVolume = WorkoutExerciseSets.reduce(
        (total, set) => total + parseFloat(set.load) * set.reps, 0
      );

      acc[weekKey] = (acc[weekKey] || 0) + workoutVolume;
      return acc;
    }, {} as Record<string, number>);

    const sortedData = Object.entries(weeklyData)
      .map(([dateStr, volume]) => ({
        day: new Date(dateStr),
        value: volume,
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime()).slice(-4);
      
    if (sortedData.length < 2) {
      return { weeklyVolumeData: [], minDomain: -50, maxDomain: 50, totalEvolutionPercentage: 0 };
    }

    const firstValue = sortedData[0].value;
    const lastValue = sortedData[sortedData.length - 1].value;

    const evolution = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    const percentageData = sortedData.map((point) => {
      const percentageChange = firstValue !== 0 ? ((point.value - firstValue) / firstValue) * 100 : 0;
      return {
        day: point.day,
        y: percentageChange,
        absoluteValue: point.value
      };
    });

    const yValues = percentageData.map((d) => d.y);
    const maxAbsY = Math.max(...yValues.map(v => Math.abs(v)));
    const padding = maxAbsY * 0.4 || 20;
    const calculatedMinDomain = -maxAbsY - padding;
    const calculatedMaxDomain = maxAbsY + padding;

    const finalChartData = percentageData.map(point => ({
      ...point,
      y0: calculatedMinDomain
    }));

    return {
      weeklyVolumeData: finalChartData,
      minDomain: calculatedMinDomain,
      maxDomain: calculatedMaxDomain,
      totalEvolutionPercentage: evolution,
    };
  }, [workouts]);

  if (weeklyVolumeData.length < 2) {
    return null;
  }
  
  let evolutionLabelText;
  if (Math.abs(totalEvolutionPercentage) <= 5) {
    evolutionLabelText = "Desempenho: Constante";
  } else {
    const sign = totalEvolutionPercentage > 0 ? "+" : "";
    evolutionLabelText = `Desempenho: ${sign}${totalEvolutionPercentage.toFixed(1)}%`;
  }
  
  const evolutionColor = 
  Math.abs(totalEvolutionPercentage) <= 5 
    ? customColors.main
    : totalEvolutionPercentage > 5 
      ? '#4ade80'
      : '#f87171';


  return (
    <View key={id} className="bg-lightBackground rounded-2xl py-3">
      <View className="px-3 py-1">
        <Text style={{fontFamily: 'Inter-ExtraBold'}} className="ml-3 text-white text-base font-extrabold">{name}</Text>
      </View>
      <VictoryChart
        width={width - 22}
        scale={{ x: "time" }}
        padding={{ top: 30, bottom: 40, left: 20, right: 20 }}
        domain={{ y: [minDomain, maxDomain] }}
        domainPadding={{ x: 20 }}
        containerComponent={
            <VictoryZoomContainer 
                zoomDimension="x" 
                allowZoom
            />
        }
      >
        <VictoryLabel
          text="Carga Total (KG)"
          x={75}
          y={10}
          textAnchor="middle"
          style={{
            fill: customColors.main,
            fontFamily: 'Inter-ExtraBold',
            fontSize: 10
          }}
          backgroundPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
          backgroundStyle={{
            fill: customColors.main,
            opacity: 0.2,
            // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
            rx: 8,
            ry: 8
          }}
        />

        <VictoryLabel
            textAnchor="start"
            x={145}
            y={10}
            text={evolutionLabelText}
            style={{
              fill: evolutionColor,
              fontSize: 10,
              fontFamily: 'Inter-Bold',
            }}
            backgroundPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
            backgroundStyle={{
              fill: evolutionColor,
              opacity: 0.2,
            // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
              rx: 8,
              ry: 8
            }}
        />

        <Defs>
          <LinearGradient id={`chartGradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={customColors.main} stopOpacity={0.3} />
            <Stop offset="100%" stopColor={customColors.main} stopOpacity={0.2} />
          </LinearGradient>
        </Defs>

        <VictoryAxis
          dependentAxis
          tickFormat={(tick) => `${Math.round(tick)}%`}
          style={{
            tickLabels: { fill: "transparent", },
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
          axisValue={minDomain}
          style={{
            tickLabels: {
              fill: customColors.disabled,
              padding: 5,
              fontSize: 9,
              angle: -15,
            },
          }}
        />
        
        <VictoryArea
          data={weeklyVolumeData}
          x="day"
          y="y"
          y0="y0"
          style={{
            data: { fill: `url(#chartGradient-${id})` }
          }}
          interpolation="monotoneX"
        />

        <VictoryLine
          data={weeklyVolumeData}
          x="day"
          y="y"
          style={{
            data: { stroke: customColors.main, strokeWidth: 3 }
          }}
          interpolation="monotoneX"
        />

        <VictoryScatter
          data={weeklyVolumeData}
          x="day"
          y="y"
          labels={({ datum }) => `${Math.round(datum.absoluteValue)}kg`}
          labelComponent={
            <VictoryLabel 
                dy={-10}
                textAnchor="middle" 
                style={{
                    fill: 'white',
                    fontSize: 10,
                    fontFamily: 'Inter-Bold',
                }}
            />
          }
        />
        
        <VictoryScatter
          data={weeklyVolumeData}
          x="day"
          y="y"
          size={5}
          style={{
            data: { fill: customColors.main, stroke: 'white', strokeWidth: 1 },
          }}
          labels={({ datum }) => {
            const sign = datum.y >= 0 ? "+" : "";
            if (Math.round(datum.y) === 0) {
              return `0%`;
            }
            return `${sign}${datum.y.toFixed(0)}%`;
          }}
          labelComponent={
            <VictoryLabel
              dy={20}
              textAnchor="middle"
              style={{
                fill: "white",
                fontSize: 10,
                fontFamily: 'Inter-SemiBold',
              }}
            />
          }
        />
      </VictoryChart>
    </View>
  );
}