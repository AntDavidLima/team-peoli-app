import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { ExerciseWithWorkouts } from "./progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "expo-router";
import { useMemo } from "react";

import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryZoomContainer,
  VictoryLabel,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import customColors from "@/tailwind.colors";
import { Days } from "./(trainings)/_layout";
import { Routine } from "@/components/trainings";
import FireIcon from "@/assets/icons/fire.svg";
import MoonIcon from "@/assets/icons/moon.svg";

export default function Home() {
  const { currentUser } = useAuthentication();
  const { width } = useWindowDimensions();

  const { data: exercises } = useQuery({
    queryKey: ["progress", currentUser?.id],
    queryFn: fetchExercises,
    enabled: !!currentUser?.id
  });

  const { data: routines } = useQuery({
    queryKey: ["trainings", format(new Date(), "EEEE", { locale: ptBR })],
    queryFn: fetchTrainings,
  });


  const { totalDaysOfMonth, firstDayOfWeek } = useMemo(() => {
    const firstDayOfWeek = new Date().getDate() - new Date().getDay()
    const currentYear = new Date().getFullYear()
    var currentMonth = new Date().getMonth()
    if(firstDayOfWeek > 0) {
      currentMonth = currentMonth + 1
    }
    const totalDaysOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    return {totalDaysOfMonth, firstDayOfWeek}
  }, [])

  const dayOfTheWeek = (index: number) => {
    if(firstDayOfWeek + index < 1){
      return firstDayOfWeek + index + totalDaysOfMonth
    }
    if(firstDayOfWeek + index > totalDaysOfMonth){
      return firstDayOfWeek + index - totalDaysOfMonth
    }
    return firstDayOfWeek + index
  }

  const { weeklyVolumeData, minDomain, maxDomain, totalEvolutionPercentage } =
    useMemo(() => {
      if (!exercises || exercises.length === 0) {
        return {
          weeklyVolumeData: [],
          minDomain: 0,
          maxDomain: 100,
          totalEvolutionPercentage: 0,
        };
      }

      const weeklyData = exercises.reduce((acc, exercise) => {
        exercise.workouts.forEach(({ workout, WorkoutExerciseSets }) => {
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
        });
        return acc;
      }, {} as Record<string, number>);

      const sortedData = Object.entries(weeklyData)
        .map(([dateStr, volume]) => ({
          day: new Date(dateStr),
          value: volume,
        }))
        .sort((a, b) => a.day.getTime() - b.day.getTime()).slice(-6);

      if (sortedData.length < 1) {
        return {
          weeklyVolumeData: [],
          minDomain: 0,
          maxDomain: 100,
          totalEvolutionPercentage: 0,
        };
      }

      const firstValue = sortedData[0].value;
      const lastValue = sortedData[sortedData.length - 1].value;

      let evolution = 0;
      if (sortedData.length > 1 && firstValue !== 0) {
        evolution = ((lastValue - firstValue) / firstValue) * 100;
      }

      const formattedData = sortedData.map((point) => {
        const percentageChange =
          firstValue !== 0
            ? ((point.value - firstValue) / firstValue) * 100
            : 0;
        return { ...point, percentageChange };
      });

      const values = formattedData.map((d) => d.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * 0.2 || 10;

      return {
        weeklyVolumeData: formattedData,
        minDomain: Math.max(0, min - padding),
        maxDomain: max + padding,
        totalEvolutionPercentage: evolution,
      };
    }, [exercises]);

  let evolutionLabelText;
  if (weeklyVolumeData.length > 1) {
    if (Math.abs(totalEvolutionPercentage) <= 5) {
      evolutionLabelText = "Desempenho: Constante";
    } else {
      const sign = totalEvolutionPercentage > 0 ? "+" : "";
      evolutionLabelText = `Desempenho: ${sign}${totalEvolutionPercentage.toFixed(1)}%`;
    }
  } else {
    evolutionLabelText = "Desempenho: N/A";
  }

  const evolutionColor = 
    weeklyVolumeData.length > 1
      ? Math.abs(totalEvolutionPercentage) <= 5
        ? customColors.main
        : totalEvolutionPercentage > 5
          ? '#4ade80'
          : '#f87171'
      : customColors.disabled;

  return (
    <ScrollView>
      <View className="px-4 py-2">
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
            <Pressable className="bg-lightBackground rounded-2xl p-2">
              <View className="flex-row px-3 py-3 justify-between items-center">
                <View>
                  <View>
                    <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white text-xl font-extrabold">
                      Iniciar Treino
                    </Text>
                    <Text style={{fontFamily: 'Inter-Regular'}} className="text-disabled text-sm">
                      {format(new Date(), "EEEE", { locale: ptBR })}
                    </Text>
                    <Text style={{fontFamily: 'Inter-Bold'}} className="text-secondary text-lg mt-1 font-bold">{routines[0]?.trainings[0].name}</Text>
                  </View>
                </View>
                <View className="bg-main rounded-full items-center justify-center h-14 w-14">
                  <FireIcon width={32} height={32} />
                </View>
              </View>
            </Pressable>
          </Link>
        ) : (
          <View className="bg-lightBackground rounded-2xl p-2">
            <View className="flex-row px-3 py-3 justify-between items-center">
              <View>
                <Text style={{fontFamily: 'Inter-ExtraBold'}} className="text-white font-extrabold text-lg">
                  Day Off
                </Text>
                <Text style={{fontFamily: 'Inter-Regular'}} className="text-subtitle mt-1 text-sm">
                  Sem treinos programados.
                </Text>
                <Text 
                  style={{width: 200}}
                className="text-subtitle text-xs mt-1">
                  Utilize o dia para recuperação ou análise do seu progresso!
                </Text>
              </View>
              <View className="bg-main rounded-full items-center justify-center h-14 w-14">
                <MoonIcon width={32} height={32}/>
              </View>
            </View>
          </View>
        )}
        <View className="rounded-full p-2 mt-2">
          <View className="flex-row justify-between items-center">
            {Object.values(Days).map((day, index) => (
              <View
                style={{width: 40, height: 40, justifyContent: 'center'}}
                className={`${index == new Date().getDay() ? ('bg-main') : ('bg-lightBackground')} 
                items-center rounded-full`} key={index}>
                <Text style={{fontFamily: 'Inter-Regular'}}  className="text-gray-400 text-sm">
                  {day}
                </Text>
                <Text style={{fontFamily: 'Inter-SemiBold'}} className="px-2 text-white font-semibold text-sm">
                  {dayOfTheWeek(index)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View className="bg-lightBackground mt-2 rounded-xl py-1 relative overflow-hidden">
          <View>
            <Text style={{fontFamily: 'Inter-ExtraBold'}}  className="text-white text-lg ml-2 px-3 py-3 self-center font-extrabold">
              Status de Progressão Geral
            </Text>
          </View>

          {weeklyVolumeData.length > 1 ? (
            <VictoryChart
              width={width - 22}
              scale={{ x: "time" }}
              padding={{ top: 30, bottom: 40, left: 55, right: 20 }}
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
                x={105}
                y={10}
                textAnchor="middle"
                style={{
                  fill: customColors.main,
                  fontFamily: 'Inter-ExtraBold',
                  fontSize: 12,
                }}
                backgroundPadding={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
                backgroundStyle={{
                  fill: customColors.main,
                  opacity: 0.2,
                  // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
                  rx: 8,
                  ry: 8,
                }}
              />
              
              <VictoryLabel
                textAnchor="start"
                x={185}
                y={10}
                text={evolutionLabelText}
                style={{
                  fill: evolutionColor,
                  fontSize: 12,
                  fontFamily: 'Inter-Bold',
                }}
                backgroundPadding={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
                backgroundStyle={{
                  fill: evolutionColor,
                  opacity: 0.2,
                  // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
                  rx: 8,
                  ry: 8,
                }}
              />

              <Defs>
                <LinearGradient id="homeChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
                    angle: -15,
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
                  data: { fill: "url(#homeChartGradient)" }
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
                labels={({ datum }) => `${Math.round(datum.value)}kg`}
                labelComponent={
                  <VictoryLabel
                    dy={-10}
                    textAnchor="middle"
                    style={{
                      fill: "white",
                      fontSize: 12,
                      fontFamily: "Inter-Bold",
                    }}
                  />
                }
              />

              <VictoryScatter
                data={weeklyVolumeData}
                x="day"
                y="value"
                size={5}
                style={{
                    data: { fill: customColors.main, stroke: 'white', strokeWidth: 1 },
                    labels: {
                      fill: 'white',
                      fontSize: 12,
                      fontFamily: 'Inter-SemiBold',
                      padding: 1,
                    }
                  }}
                labels={({ datum }) => {
                  if (datum.percentageChange === null) {
                    return '';
                  }
                  const sign = datum.percentageChange >= 0 ? "+" : "";
                  return `${sign}${datum.percentageChange.toFixed(0)}%`;
                }}
                labelComponent={
                  <VictoryLabel dy={20} textAnchor="middle" />
                }
              />
            </VictoryChart>
          ) : (
            <Text className="text-disabled text-center text-sm p-3">
              Sem dados suficientes para gerar o gráfico de evolução.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  async function fetchExercises() {
    if(!currentUser?.id) return [];
    const { data: exercises } = await api.get<ExerciseWithWorkouts[]>(
      `/user/${currentUser?.id}/exercise`,
    );

    return exercises;
  }

  async function fetchTrainings() {
    if(!currentUser?.id) return [];
    const { data } = await api.get<Routine[]>("routine", {
      params: {
        day: format(new Date(), "EEEE").toUpperCase(),
        userId: currentUser?.id,
      },
    });

    return data;
  }
}