import { useAuthentication } from "@/contexts/AuthenticationContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import {
	VictoryAxis,
	VictoryChart,
	VictoryGroup,
	VictoryLine,
	VictoryScatter,
} from "victory-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

interface Exercise {
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

interface WorkoutExerciseSet {
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
		<ScrollView className="mt-8 space-y-4 px-4">
			<Text className="text-white text-xl text-center font-bold">
				Progressão de cargas e repetições
			</Text>
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
			{exercises?.map(({ name, id, workouts }) => {
				const workoutMetadata = workouts.reduce(
					(accumulator, workout) => {
						const localMaxes = workout.WorkoutExerciseSets.reduce(
							(localAccumulator, set) => ({
								maxLoad: Math.max(localAccumulator.maxLoad, set.load),
								maxReps: Math.max(localAccumulator.maxReps, set.reps),
							}),
							{ maxLoad: 0, maxReps: 0 },
						);

						return {
							maxLoad: Math.max(accumulator.maxLoad, localMaxes.maxLoad),
							maxReps: Math.max(accumulator.maxReps, localMaxes.maxReps),
							maxSets: Math.max(
								accumulator.maxSets,
								workout.WorkoutExerciseSets.length,
							),
						};
					},
					{ maxLoad: 0, maxReps: 0, maxSets: 0 },
				);

				return (
					<View key={id} className="bg-card rounded pt-4">
						<Text className="text-white text-base text-center font-semibold">
							{name}
						</Text>
						<VictoryChart domain={{ y: [0, 1] }} width={width - 22}>
							<Gradient />
							<VictoryAxis
								dependentAxis
								tickFormat={(tick) =>
									(tick * workoutMetadata.maxLoad).toFixed(1)
								}
								style={{
									tickLabels: { fill: "white" },
									axis: { stroke: "#0B69D4", strokeWidth: 4 },
								}}
							/>
							<VictoryAxis
								dependentAxis
								tickFormat={(tick) =>
									(tick * workoutMetadata.maxReps).toFixed(1)
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
								tickValues={workouts.map(({ workout }) =>
									format(new Date(workout.startTime), "d"),
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
								data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
									day: format(new Date(workout.startTime), "d"),
									load:
										WorkoutExerciseSets.reduce(
											(total, set) => total + set.load,
											0,
										) / WorkoutExerciseSets.length,
								}))}
								x="day"
								y={(segment: WorkoutExerciseSet) =>
									segment.load / workoutMetadata.maxLoad
								}
								color="#0B69D4"
							>
								<VictoryScatter />
								<VictoryLine />
							</VictoryGroup>
							<VictoryGroup
								data={workouts.map(({ workout, WorkoutExerciseSets }) => ({
									day: format(new Date(workout.startTime), "d"),
									reps:
										WorkoutExerciseSets.reduce(
											(total, set) => total + set.reps,
											0,
										) / WorkoutExerciseSets.length,
								}))}
								x="day"
								y={(segment: WorkoutExerciseSet) =>
									segment.reps / workoutMetadata.maxReps
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
					</View>
				);
			})}
		</ScrollView>
	);

	async function fetchExercises() {
		const { data: exercises } = await api.get<Exercise[]>(
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
