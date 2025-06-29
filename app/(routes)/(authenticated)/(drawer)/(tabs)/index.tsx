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
import tailwindColors from "@/tailwind.colors";


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

  const totalDaysOfMonth = () => {
    const currentYear = new Date().getFullYear()
    var currentMonth = new Date().getMonth()
    if(firstDayOfWeek() > 0) {
      currentMonth = currentMonth + 1
    }
    return new Date(currentYear, currentMonth, 0).getDate();
  }

  const firstDayOfWeek = () => {
    return new Date().getDate() - new Date().getDay()
  }

  const weeklyVolumeData = useMemo(() => {
    if (!exercises || exercises.length === 0) {
      return [];
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

    return Object.entries(weeklyData)
      .map(([dateStr, volume]) => ({
        day: new Date(dateStr),
        value: volume,
      }))
      .sort((a, b) => a.day.getTime() - b.day.getTime()).slice(-5);
  }, [exercises]);


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
                day: format(new Date(), "EEEE", { locale: ptBR }).toUpperCase(),
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
                  {
                    firstDayOfWeek() + index < 1 ? 
                    firstDayOfWeek() + index + totalDaysOfMonth() : 
                    firstDayOfWeek() + index > totalDaysOfMonth() ? 
                    firstDayOfWeek() + index - totalDaysOfMonth() :
                    firstDayOfWeek() + index
                  }
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
                padding={{ top: 15, bottom: 40, left: 55, right: 20 }}
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
                  size={5}
                  style={{
                    data: { fill: customColors.main, stroke: 'white', strokeWidth: 1 }
                  }}
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