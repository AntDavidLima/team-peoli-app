import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View, useWindowDimensions } from "react-native";
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

export default function Home() {
	const { currentUser } = useAuthentication();

	const { data: exercises } = useQuery({
		queryKey: ["progress"],
		queryFn: fetchExercises,
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
		<View className="p-4 mt-6">
			<View className="bg-card rounded p-2">
				<View className="flex-row justify-between">
					<View>
						<Text className="text-white font-bold text-xl">Iniciar Treino</Text>
						<Text className="text-subtitle font-semibold mt-1">
							Quarta-feira
						</Text>
					</View>
					<MaterialCommunityIcons
						name="play-circle-outline"
						color={customColors.main}
						size={68}
					/>
				</View>
				<Text className="text-subtitle">Treino A - Inferiores completos</Text>
			</View>
			<View className="bg-card rounded p-3 mt-4">
				<View className="flex-row justify-between">
					{Object.values(Days).map((day, index) => (
						<View className="items-center gap-1" key={index}>
							<Text className="text-white font-semibold text-base">{day}</Text>
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
			<View className="bg-card rounded mt-4 py-4">
				<Text className="text-white text-base font-semibold ml-4">
					Evolução geral
				</Text>
				{exercises &&
					(exercises.length > 0 ? (
						<>
							<VictoryChart domain={{ y: [0, 1] }} width={width - 22}>
								<Gradient />
								<VictoryAxis
									dependentAxis
									tickFormat={(tick) =>
										(tick * exercisesMetadata!.maxLoad).toFixed(1)
									}
									style={{
										tickLabels: { fill: "white" },
										axis: { stroke: "#0B69D4", strokeWidth: 4 },
									}}
								/>
								<VictoryAxis
									dependentAxis
									tickFormat={(tick) =>
										(tick * exercisesMetadata!.maxReps).toFixed(1)
									}
									offsetX={width - 72}
									style={{
										tickLabels: { textAnchor: "start", fill: "white" },
										ticks: {
											padding: -20,
										},
										axis: { stroke: "#C43343", strokeWidth: 4 },
									}}
								/>
								<VictoryAxis
									tickValues={exercisesMetadata!.workouts.map(({ startTime }) =>
										format(new Date(startTime), "d"),
									)}
									style={{
										tickLabels: { fill: "white" },
										axis: {
											strokeWidth: 0,
											stroke: "url(#blue-to-red)",
										},
									}}
								/>
								<VictoryGroup
									data={Object.values(
										_.groupBy(exercisesMetadata!.workouts, ({ startTime }) =>
											format(startTime, "d/M/y"),
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
											day: format(new Date(startTime), "d"),
											load: averageLoad,
										}))}
									x="day"
									y={(segment: WorkoutExerciseSet) =>
										segment.load / exercisesMetadata!.maxLoad
									}
									color="#0B69D4"
								>
									<VictoryScatter />
									<VictoryLine />
								</VictoryGroup>
								<VictoryGroup
									data={Object.values(
										_.groupBy(exercisesMetadata!.workouts, ({ startTime }) =>
											format(startTime, "d/M/y"),
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
											day: format(new Date(startTime), "d"),
											reps: averageReps,
										}))}
									x="day"
									y={(segment: WorkoutExerciseSet) =>
										segment.reps / exercisesMetadata!.maxReps
									}
									color="#C43343"
								>
									<VictoryScatter />
									<VictoryLine
										style={{
											data: { strokeDasharray: "15, 5" },
										}}
									/>
								</VictoryGroup>
							</VictoryChart>
							<View className="flex-row justify-evenly w-full">
								<View className="flex-row items-center gap-2">
									<View className="rounded-full w-4 aspect-square bg-[#0B69D4]" />
									<Text className="text-white">Carga</Text>
								</View>
								<View className="flex-row items-center gap-2">
									<View className="rounded-full w-4 aspect-square bg-[#C43343]" />
									<Text className="text-white">Repetições</Text>
								</View>
							</View>
						</>
					) : (
						<Text className="text-disabled text-xl p-4">
							Sem dados suficientes para gerar o gráfico de evolução.
						</Text>
					))}
			</View>
		</View>
	);

	async function fetchExercises() {
		const { data: exercises } = await api.get<ExerciseWithWorkouts[]>(
			`/user/${currentUser?.id}/exercise`,
		);

		return exercises;
	}
}

function Gradient() {
	return (
		<Svg>
			<Defs>
				<LinearGradient
					id="blue-to-red"
					x1="0%"
					x2="100%"
					gradientUnits="userSpaceOnUse"
				>
					<Stop offset="0%" stopColor="#0B69D4" />
					<Stop offset="100%" stopColor="#C43343" />
				</LinearGradient>
			</Defs>
			<Rect
				x="12.3%"
				y="83%"
				width="75.4%"
				height="4px"
				fill="url(#blue-to-red)"
			/>
		</Svg>
	);
}
