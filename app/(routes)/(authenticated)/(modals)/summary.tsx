import {
    Pressable,
    ScrollView,
    Text,
    View,
    useWindowDimensions,
    Image,
    ActivityIndicator
} from "react-native";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import tailwindColors from "tailwindcss/colors";

import {
    VictoryArea,
    VictoryAxis,
    VictoryChart,
    VictoryLine,
    VictoryScatter,
    VictoryLabel,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import customColors from "@/tailwind.colors";
import { useEffect, useMemo, useState } from "react";

import CameraIcon from "@/assets/icons/camera.svg";
import TimingIcon from "@/assets/icons/timing.svg";
import TrendIcon from "@/assets/icons/trend.svg";
import TrendUpIcon from "@/assets/icons/trendUp.svg";
import TrendDownIcon from "@/assets/icons/trendDown.svg";
import StarIcon from "@/assets/icons/star.svg";
import TrophyIcon from "@/assets/icons/trophy.svg";
import ArrowUpIcon from "@/assets/icons/arrowUp.svg";
import ArrowDownIcon from "@/assets/icons/arrowDown.svg";
import ConstantIcon from "@/assets/icons/constant.svg";
import TrendUpPRIcon from "@/assets/icons/trendUpPR.svg";

interface VolumeHistoryPoint { 
    date: string;
    volume: number; 

}

interface ExercisePerformance {
    exerciseId: number;
    name: string;
    currentVolume: number;
    previousVolume: number | null; 
}

interface WorkoutSummary {
    totalDurationSeconds: number;
    totalVolume: number;
    previousTotalVolume: number | null;
    totalWorkoutsForUser: number;
    allTimeBestVolume: number | null;
    totalPrsForUser: number;
    exercisePerformances: ExercisePerformance[];
    volumeHistory: VolumeHistoryPoint[];
    workoutsOfSameTypeCount: number;
    trainingName: string;
}
type DisplayCondition = 'FIRST_TRAINING' | 'PR_BATIDO' | 'AUMENTO' | 'CONSTANCIA' | 'REDUCAO';

const formatDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "0h 00min";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, '0')}min`;
};

const formatVolume = (volume: number | null | undefined) => {
    if (volume === null || volume === undefined) return '0';
    return new Intl.NumberFormat('pt-BR').format(Math.round(volume));
};

const EvolutionChart = ({ history, title }: { history: VolumeHistoryPoint[], title: string }) => {
    const { width } = useWindowDimensions();
    const chartWidth = width - 32;

    const { chartData, minDomain, maxDomain, totalEvolutionPercentage, tickValues } = useMemo(() => {
        const TICK_COUNT = 5;
        if (!history || history.length < 2) {
            return { chartData: [], minDomain: -50, maxDomain: 50, totalEvolutionPercentage: 0, tickValues: [] };
        }

        const firstValue = history[0].volume;
        const lastValue = history[history.length - 1].volume;
        const evolution = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

        const percentageData = history.map(point => ({
            x: new Date(point.date),
            y: firstValue !== 0 ? ((point.volume - firstValue) / firstValue) * 100 : 0,
            absoluteValue: point.volume,
        }));

        const yValues = percentageData.map(d => d.y);
        const maxAbsY = Math.max(...yValues.map(v => Math.abs(v)));
        const padding = maxAbsY * 0.4 || 20;
        const calculatedMinDomain = -maxAbsY - padding;
        const calculatedMaxDomain = maxAbsY + padding;

        const domainRange = calculatedMaxDomain - calculatedMinDomain;
        const step = domainRange / (TICK_COUNT - 1);
        const calculatedTickValues = Array.from({ length: TICK_COUNT }, (_, i) => calculatedMinDomain + (i * step));

        return { chartData: percentageData, minDomain: calculatedMinDomain, maxDomain: calculatedMaxDomain, totalEvolutionPercentage: evolution, tickValues: calculatedTickValues };
    }, [history]);

    let evolutionLabelText = `Desempenho: ${totalEvolutionPercentage >= 0 ? '+' : ''}${totalEvolutionPercentage.toFixed(0)}%`;
    let evolutionColor = customColors.main;
    if (Math.abs(totalEvolutionPercentage) <= 5) {
        evolutionColor = customColors.main;
    } else if (totalEvolutionPercentage > 5) {
        evolutionColor = '#4ade80';
    } else {
        evolutionColor = '#f87171';
    }

    return (
        <View className="bg-lightBackground rounded-lg items-center pt-2 pb-2">
            <Text className="text-white font-bold text-lg self-start ml-4 mb-2 pl-2">{title}</Text>
            <VictoryChart
                width={chartWidth}
                height={220}
                padding={{ top: 50, bottom: 40, left: 20, right: 20 }}
                domain={{ y: [minDomain, maxDomain] }}>
                <VictoryLabel
                    text="Carga Total (KG)"
                    x={30}
                    y={5}
                    style={{ fill: customColors.main, fontFamily: 'Inter-ExtraBold', fontSize: 12 }}
                    backgroundPadding={8}
                    backgroundStyle={{
                        fill: customColors.main,
                        opacity: 0.2,
                        // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
                        rx: 8,
                        ry: 8
                    }} />

                <VictoryLabel
                    text={evolutionLabelText}
                    x={150}
                    y={5}
                    style={{ fill: evolutionColor, fontFamily: 'Inter-Bold', fontSize: 12 }}
                    backgroundPadding={8}
                    backgroundStyle={{
                        fill: evolutionColor,
                        opacity: 0.2,
                        // @ts-ignore - Provavelmente biblitoeca não possui tipagem para rx e ry
                        rx: 8,
                        ry: 8
                    }} />

                <Defs>
                    <LinearGradient id="evolutionChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <Stop offset="0%" stopColor={customColors.main} stopOpacity={0.3} />
                        <Stop offset="100%" stopColor={customColors.main} stopOpacity={0.1} />
                    </LinearGradient>
                </Defs>

                <VictoryAxis
                    dependentAxis
                    tickValues={tickValues}
                    style={{
                        axis: { stroke: 'transparent' },
                        tickLabels: { fill: 'transparent' },
                        grid: { stroke: customColors.disabled, strokeWidth: 0.5 }
                    }}
                />

                <VictoryAxis
                    tickFormat={(x) => new Date(x).toLocaleDateString('pt-BR', { month: 'short', day: '2-digit' })}
                    fixLabelOverlap
                    axisValue={minDomain}
                    style={{
                        axis: { stroke: customColors.disabled, strokeWidth: 0.5 },
                        tickLabels: { fill: customColors.disabled, fontSize: 12, padding: 5 }
                    }}
                />

                <VictoryArea
                    data={chartData}
                    x="x"
                    y="y"
                    y0={() => minDomain}
                    style={{ data: { fill: "url(#evolutionChartGradient)" } }}
                    interpolation="monotoneX"
                />

                <VictoryLine
                    data={chartData}
                    x="x"
                    y="y"
                    style={{ data: { stroke: customColors.main, strokeWidth: 2 } }}
                    interpolation="monotoneX"
                />

                <VictoryScatter
                    data={chartData}
                    x="x"
                    y="y"
                    labels={({ datum }) => `${formatVolume(datum.absoluteValue)} kg`}
                    labelComponent={
                        <VictoryLabel
                            dy={(props) => (props.datum.y < 0 ? -22 : -10)}
                            textAnchor="middle"
                            style={{ fill: "white", fontSize: 11, fontFamily: "Inter-Bold" }}
                        />
                    }
                />

                <VictoryScatter
                    data={chartData}
                    x="x"
                    y="y"
                    size={5}
                    style={{ data: { fill: customColors.main, stroke: 'white', strokeWidth: 2 } }}
                    labels={({ datum }) => {
                        const sign = datum.y >= 0 ? "+" : "";
                        if (Math.round(datum.y) === 0) return `0%`;
                        return `${sign}${datum.y.toFixed(0)}%`;
                    }}
                    labelComponent={
                        <VictoryLabel
                            dy={(props) => (props.datum.y < 0 ? 10 : 22)}
                            textAnchor="middle"
                            style={{ fill: "white", fontSize: 11, fontFamily: "Inter-SemiBold" }}
                        />
                    }
                />
            </VictoryChart>
        </View>
    );
};

const getConditionStyles = (condition: DisplayCondition) => {
    switch (condition) {
        case 'PR_BATIDO': return { 
            borderColor: 'border-[#FFE100]',
            iconContainerBgColor: 'bg-[#FFE10033]',
            TrendIconComponent: <TrendUpPRIcon width={20} height={20} />,
            variationTextColor: 'text-[#FFE100]'
        };
        case 'AUMENTO': return {
            borderColor: 'border-[#4ADE80]',
            iconContainerBgColor: 'bg-[#4ADE8033]',
            TrendIconComponent: <TrendUpIcon width={20} height={20} />,
            variationTextColor: 'text-[#4ADE80]'
        }; 
        case 'CONSTANCIA': return {
            borderColor: 'border-blue-400',
            iconContainerBgColor: 'bg-[#2764E433]',
            TrendIconComponent: <TrendIcon width={20} height={20} />,
            variationTextColor: 'text-blue-400'
        };
        case 'REDUCAO': return {
            borderColor: 'border-danger',
            iconContainerBgColor: 'bg-[#EB515133]',
            TrendIconComponent: <TrendDownIcon width={20} height={20} />,
            variationTextColor: 'text-[#EB5151]'
        };
        case 'FIRST_TRAINING': default: return {
            borderColor: 'border-main',
            iconContainerBgColor: 'bg-[#4ADE8033]',
            TrendIconComponent: <TrendUpIcon width={20} height={20} />,
            variationTextColor: 'text-[#4ADE80]'
        };
    }
};

export default function Summary() {
    const { currentUser } = useAuthentication();
    const router = useRouter();
    const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
    const [displayCondition, setDisplayCondition] = useState<DisplayCondition | null>(null);

    const { data: summary, isLoading, isError } = useQuery<WorkoutSummary>({
        queryKey: ['workoutSummary', workoutId],
        queryFn: async () => {
            if (!workoutId) throw new Error("ID do treino não fornecido.");
            const { data } = await api.get(`/summary/workout/${workoutId}`);
            return data;
        },
        enabled: !!workoutId,
        retry: false,
    });

    useEffect(() => {
        if (summary) {
            const { totalVolume, previousTotalVolume, workoutsOfSameTypeCount, allTimeBestVolume } = summary;

            if (workoutsOfSameTypeCount === 1) {
                setDisplayCondition('FIRST_TRAINING');
                return;
            }
            if (allTimeBestVolume !== null && totalVolume > allTimeBestVolume) {
                setDisplayCondition('PR_BATIDO');
                return;
            }
            const hasPreviousVolume = previousTotalVolume !== null && previousTotalVolume > 0;
            if (hasPreviousVolume) {
                const percentageChange = ((totalVolume - previousTotalVolume) / previousTotalVolume) * 100;
                if (percentageChange > 5) {
                    setDisplayCondition('AUMENTO');
                }
                else if (percentageChange < -5) {
                    setDisplayCondition('REDUCAO');
                }
                else {
                    setDisplayCondition('CONSTANCIA');
                }
            } else {
                setDisplayCondition('CONSTANCIA');
            }
        }
    }, [summary]);

    if (isLoading || !summary || !displayCondition) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white mt-4">Calculando seu desempenho...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 justify-center items-center bg-background p-4">
                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-lg text-center">Ocorreu um erro</Text>
                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-secondary/70 text-center mt-2 mb-6">Não foi possível carregar o resumo do seu treino.</Text>
                <Pressable onPress={() => router.back()} className="bg-main py-3 px-8 rounded-lg">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white">Voltar</Text>
                </Pressable>
            </View>
        );
    }

    const { totalVolume, previousTotalVolume, totalDurationSeconds, totalWorkoutsForUser, totalPrsForUser, volumeHistory, exercisePerformances, trainingName } = summary;
    const conditionStyles = getConditionStyles(displayCondition);

    let percentageChange = 0;
    if (previousTotalVolume !== null && previousTotalVolume > 0) {
        percentageChange = ((totalVolume - previousTotalVolume) / previousTotalVolume) * 100;
    }

    const getHeaderText = () => {
        const name = currentUser?.name?.split(' ')[0] || '';
        switch (displayCondition) {
            case 'FIRST_TRAINING': return `Primeiro treino concluído, ${name}!`;
            case 'PR_BATIDO': return `PR Batido, ${name}!`;
            case 'CONSTANCIA': return "Carga mantida, mas a constância também!";
            case 'REDUCAO': return "Sem PR hoje? Um treino não diz tudo!";
            default: return "Você evoluiu hoje!";
        }
    };

    const getSubHeaderText = () => {
        switch (displayCondition) {
            case 'FIRST_TRAINING': return "Primeiro de muitos! Agora é só evoluir!";
            case 'PR_BATIDO': return "Sua melhor marca neste treino até agora!";
            case 'CONSTANCIA': return "A constância constrói o que o entusiasmo apenas promete!";
            case 'REDUCAO': return "O progresso vem da soma, não de um único resultado.";
            default: return "Progressão em relação ao último treino!";
        }
    };

    return (
        <View className="bg-background flex-1">
            <Pressable onPress={() => router.back()} className="absolute top-4 left-4 z-10 p-2">
                <MaterialCommunityIcons name="arrow-left" size={28} color={tailwindColors.white} />
            </Pressable>
            <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingTop: 60, paddingHorizontal: 16 }}>
                <View className="items-center h-36 relative mb-10">
                    <View className={`border-4 ${conditionStyles.borderColor} rounded-full`}>
                        <View className="w-32 h-32 rounded-full bg-white items-center justify-center overflow-hidden border-4 border-background">
                            {currentUser?.profilePhotoUrl ? <Image className="w-full h-full" source={{ uri: currentUser.profilePhotoUrl }} resizeMode="cover" /> : <CameraIcon width={40} height={40} fill="#888" />}
                        </View>
                    </View>
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-center mt-4 text-xl font-bold">{getHeaderText()}</Text>
                    <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/50 text-center mt-1 text-sm">{getSubHeaderText()}</Text>
                </View>
                
                <View className="mt-12 items-center justify-between mb-4 gap-4">
                    <View className="flex-row h-16 w-full gap-4">
                        <View className="flex-row items-center bg-lightBackground h-full w-[48%] rounded-lg p-3 gap-2">
                            <View className="justify-center items-center h-10 w-10 bg-[#9362C740] rounded-lg"><TimingIcon width={20} height={20} /></View>
                            <View>
                                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base">{formatDuration(totalDurationSeconds)}</Text>
                                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/40 text-xs">Tempo Total</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center bg-lightBackground h-full w-[48%] rounded-lg p-3 gap-2">
                            <View className={`justify-center items-center h-10 w-10 rounded-lg ${conditionStyles.iconContainerBgColor}`}>
                                {conditionStyles.TrendIconComponent}
                            </View>
                            <View>
                                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base">{formatVolume(totalVolume)} kg</Text>
                                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/40 text-xs">Volume Total</Text>
                            </View>
                        </View>
                    </View>
                    {previousTotalVolume !== null && (
                        <View className="items-center mt-1">
                            <View className="flex-row gap-1">
                                <Text style={{ fontFamily: 'Inter-Regular' }} className={`text-sm ${conditionStyles.variationTextColor}`}>Anterior: {formatVolume(previousTotalVolume)} kg → Atual: {formatVolume(totalVolume)} kg</Text>
                                <Text style={{ fontFamily: 'Inter-ExtraBold' }} className={`text-sm ${conditionStyles.variationTextColor}`}>({formatVolume(totalVolume - previousTotalVolume) + 'kg'})</Text>
                            </View>
                            {Math.abs(percentageChange) <= 5 && (
                                <Text style={{ fontFamily: 'Inter-Regular ' }} className={`text-sm ${conditionStyles.variationTextColor}`}>Variação: ~{Math.abs(Math.round(percentageChange))}% (oscilação normal)</Text>
                            )}
                        </View>
                    )}
                    <View className="flex-row h-16 w-full gap-4 mt-1">
                        <View className="flex-row items-center bg-lightBackground h-full w-[48%] rounded-lg p-3 gap-2">
                            <View className="justify-center items-center h-10 w-10 bg-[#64A4EB33] rounded-lg"><StarIcon width={20} height={20} /></View>
                            <View>
                                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base">#{totalWorkoutsForUser}</Text>
                                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/40 text-xs">Treinos Feitos</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center bg-lightBackground h-full w-[48%] rounded-lg p-3 gap-2">
                            <View className="justify-center items-center h-10 w-10 bg-[#FFE10033] rounded-lg"><TrophyIcon width={20} height={20} /></View>
                            <View>
                                <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base">#{totalPrsForUser}</Text>
                                <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/40 text-xs">PRs Batidos</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="mt-4">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white/85 text-xs font-bold mb-2">Evolução nas últimas 4 semanas</Text>
                    {volumeHistory && volumeHistory.length > 1 ? (
                        <EvolutionChart history={volumeHistory} title={trainingName} />
                    ) : (
                        <View className="bg-lightBackground rounded-lg p-8 items-center justify-center">
                            <Text className="text-secondary/70 text-center">Sem histórico suficiente para exibir a evolução deste treino.</Text>
                        </View>
                    )}
                </View>

                <View className="mt-6">
                    <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white/85 text-sm font-bold mb-2">Desempenho por exercício</Text>
                    <View className="w-full gap-2">
                        {exercisePerformances.map((item) => {
                            const hasPrevious = item.previousVolume !== null && item.previousVolume > 0;

                            let IconComponent: JSX.Element | null = null;
                            let statusText = '';
                            let statusSubText = '';
                            let statusColor = 'text-secondary/80';

                            if (hasPrevious) {
                                const difference = item.currentVolume - item.previousVolume!;
                                const percentageChange = (difference / item.previousVolume!) * 100;

                                if (percentageChange > 5) {
                                    IconComponent = <ArrowUpIcon width={42} height={42} />;
                                    statusText = `+${formatVolume(difference)} kg`;
                                    statusColor = 'text-[#4ADE80]';
                                } else if (percentageChange < -5) {
                                    IconComponent = <ArrowDownIcon width={42} height={42} />;
                                    statusText = `${formatVolume(difference)} kg`;
                                    statusColor = 'text-[#EB5151]';
                                } else {
                                    IconComponent = <ConstantIcon width={42} height={42} />;
                                    statusText = 'Constante';
                                    statusSubText = `(oscilação ~${Math.abs(Math.round(percentageChange))}%)`;
                                    statusColor = 'text-white';
                                }
                            }

                            return (
                                <View key={item.exerciseId} className="bg-lightBackground rounded-lg p-4 flex-row justify-between items-center">
                                    <View className="ml-2">
                                        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-base">{item.name}</Text>
                                        <Text style={{ fontFamily: 'Inter-Regular' }} className="text-white/85 text-xs">
                                            Anterior: {hasPrevious ? `${formatVolume(item.previousVolume)} kg` : 'N/A'}
                                        </Text>
                                        <Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-xs">
                                            Atual: {formatVolume(item.currentVolume)} kg
                                        </Text>
                                    </View>

                                    {hasPrevious && (
                                        <View className="items-center w-28">
                                            <View className={`h-10 w-10 items-center justify-center`}>
                                                {IconComponent}
                                            </View>
                                            <Text style={{ fontFamily: 'Inter-ExtraBold' }} className={`text-sm mt-1 ${statusColor}`}>
                                                {statusText}
                                            </Text>
                                            <Text style={{ fontFamily: 'Inter-Regular' }} className={`text-xs ${statusColor}`}>
                                                {statusSubText}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}