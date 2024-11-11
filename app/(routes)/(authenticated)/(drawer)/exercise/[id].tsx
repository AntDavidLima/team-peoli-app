import { api } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RawDraftContentState } from "draft-js";
import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";
import { useEffect, useRef, useState } from "react";
import PagerView from "react-native-pager-view";
import { differenceInSeconds } from "date-fns";
import { ExerciseExecution } from "@/components/exercise";
import { useAuthentication } from "@/contexts/AuthenticationContext";

interface Training {
	exercises: TrainingExercise[];
}

export interface TrainingExercise {
	sets: number;
	reps: number;
	restTime: number;
	orientations: RawDraftContentState | null;
	exercise: Exercise;
}

export interface Exercise {
	id: number;
	name: string;
	executionVideoUrl: null | string;
}

interface Workout {
	id: number;
	startTime: Date;
	exercises: WorkoutExercise[];
}

interface WorkoutExercise {
	WorkoutExerciseSets: WorkoutExerciseSet[];
	exerciseId: number;
}

interface WorkoutExerciseSet {
	id: number;
	load: number;
	reps: number;
}

export default function Exercise() {
	const [timeAfterStart, setTimeAfterStart] = useState({
		seconds: 0,
		minutes: 0,
		hours: 0,
	});
	const [clock, setClock] = useState<NodeJS.Timeout | null>(null);
	const { currentUser } = useAuthentication();

	const { id, trainingId, day } = useLocalSearchParams();

	const queryClient = useQueryClient();

	const { data: training, isLoading: loadingTraining } = useQuery({
		queryFn: fetchExercises,
		queryKey: ["exercises", id, day],
	});

	const { data: todayTrainings } = useQuery({
		queryFn: fetchTodayTrainings,
		queryKey: ["todayTrainings", day, currentUser?.id],
	});

	const { data: workout } = useQuery({
		queryFn: fetchWorkoutInProgress,
		queryKey: ["workout", ...(todayTrainings?.map(({ id }) => id) || [])],
	});

	useEffect(() => {
		if (workout) {
			const timeAfterStartInSeconds = differenceInSeconds(
				new Date(),
				new Date(workout.startTime),
			);

			const hours = Math.floor(timeAfterStartInSeconds / 3600);
			const minutes = Math.floor((timeAfterStartInSeconds % 3600) / 60);
			const seconds = timeAfterStartInSeconds % 60;

			setTimeAfterStart({
				seconds,
				minutes,
				hours,
			});

			if (!clock) {
				setClock(
					setInterval(() => {
						setTimeAfterStart((time) => {
							const newTime = {
								...time,
								seconds: time.seconds + 1,
							};

							if (newTime.seconds === 60) {
								newTime.seconds = 0;
								newTime.minutes += 1;
							}

							if (newTime.minutes === 60) {
								newTime.minutes = 0;
								newTime.hours += 1;
							}

							return newTime;
						});
					}, 1000),
				);
			}
		} else {
			setClock(null);
		}
	}, [workout]);

	const pagerViewRef = useRef<PagerView>(null);

	const initialExerciseIndex = training?.exercises.findIndex(
		(exercise) => exercise.exercise.id === Number(id),
	);

	const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
		initialExerciseIndex || 0,
	);

	useEffect(() => {
		pagerViewRef.current?.setPage(initialExerciseIndex || 0);
	}, [initialExerciseIndex]);

	const currentExerciseId =
		training?.exercises[currentExerciseIndex]?.exercise.id;

	const { mutate: startWorkout } = useMutation({
		mutationFn: createWorkout,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["workout", ...(todayTrainings?.map(({ id }) => id) || [])],
			});
		},
	});

	const { mutate: finishWorkout } = useMutation({
		mutationFn: stopWorkout,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["workout", ...(todayTrainings?.map(({ id }) => id) || [])],
			});
			queryClient.invalidateQueries({
				queryKey: ["progress"],
			});
			queryClient.invalidateQueries({
				queryKey: ["exercise", "last-execution"],
			});
			clearInterval(clock!);
			setClock(null);
		},
	});

	if (loadingTraining || !training) {
		return <Text className="text-white">Loading...</Text>;
	}

	return (
		<>
			<PagerView
				className="flex-1"
				initialPage={initialExerciseIndex}
				onPageScroll={({ nativeEvent: { position } }) => {
					setCurrentExerciseIndex(position);
				}}
				ref={pagerViewRef}
			>
				{training.exercises.map(
					({ exercise, reps, sets, restTime, orientations }) => (
						<ScrollView key={exercise.id}>
							<ExerciseExecution
								reps={reps}
								sets={sets}
								setsInfo={
									workout?.exercises
										.filter(
											({ exerciseId }) => exerciseId === currentExerciseId,
										)
										.map(({ WorkoutExerciseSets }) => WorkoutExerciseSets)
										.flat() || []
								}
								exercise={exercise}
								orientations={orientations}
								restTime={restTime}
								trainingStarted={clock !== null}
								workoutId={workout?.id}
								trainingIds={todayTrainings?.map(({ id }) => id) || []}
								day={day as string}
							/>
						</ScrollView>
					),
				)}
			</PagerView>
			<Pressable
				className={`absolute left-4 bottom-[88px] p-1.5 rounded-3xl ${clock ? "bg-main" : "bg-green-500"}`}
				onPress={() => (clock ? finishWorkout() : startWorkout())}
			>
				{clock ? (
					<View className="flex-row items-center space-x-1">
						<MaterialCommunityIcons
							name="stop-circle-outline"
							size={24}
							color={tailwindColors.white}
						/>
						<View className="flex-row items-baseline">
							{timeAfterStart.hours > 0 && (
								<Text className="text-white font-bold">
									{timeAfterStart.hours}:
								</Text>
							)}
							<Text className="text-white font-bold">
								{timeAfterStart.hours > 0 && timeAfterStart.minutes < 10 && "0"}
								{timeAfterStart.minutes}:
							</Text>
							<Text className="text-white font-bold">
								{timeAfterStart.seconds < 10 && "0"}
								{timeAfterStart.seconds}
							</Text>
						</View>
					</View>
				) : (
					<View className="flex-row items-center justify-center space-x-1">
						<MaterialCommunityIcons
							name="play-circle"
							size={24}
							color={tailwindColors.white}
						/>
						<Text className="text-white font-bold">INICIAR</Text>
					</View>
				)}
			</Pressable>
			<View className="flex-row justify-around py-2 bg-darker">
				<Pressable
					className="bg-card p-4 rounded-full"
					disabled={currentExerciseIndex === 0}
					onPress={() => {
						pagerViewRef.current?.setPage(currentExerciseIndex - 1);
					}}
				>
					<MaterialCommunityIcons
						name="chevron-left"
						color={
							currentExerciseIndex === 0
								? customColors.disabled
								: tailwindColors.white
						}
						size={24}
					/>
				</Pressable>
				<Pressable
					className="bg-card p-4 rounded-full"
					disabled={currentExerciseIndex === training.exercises.length - 1}
					onPress={() => {
						pagerViewRef.current?.setPage(currentExerciseIndex + 1);
					}}
				>
					<MaterialCommunityIcons
						name="chevron-right"
						color={
							currentExerciseIndex === training.exercises.length - 1
								? customColors.disabled
								: tailwindColors.white
						}
						size={24}
					/>
				</Pressable>
			</View>
		</>
	);

	async function fetchTodayTrainings() {
		try {
			const { data } = await api.get<{ id: number }[]>("training", {
				params: {
					day,
					userId: currentUser?.id,
				},
			});

			return data;
		} catch (error) {
			console.error(error);
		}
	}

	async function fetchExercises() {
		const { data: training } = await api.get<Training>(
			`/training/${trainingId}`,
		);

		return training;
	}

	async function createWorkout() {
		try {
			const { data: workout } = await api.post("/workout", {
				trainingIds: todayTrainings?.map(({ id }) => id),
			});

			return workout;
		} catch (error) {
			console.error(error);
		}
	}

	async function stopWorkout() {
		const { data: updatedWorkout } = await api.put(
			`/workout/stop/${workout?.id}`,
		);

		return updatedWorkout;
	}

	async function fetchWorkoutInProgress() {
		const { data: workout } = await api.get<Workout>(`/workout/in-progress`, {
			params: {
				trainingIds: todayTrainings?.map(({ id }) => id),
			},
			paramsSerializer: {
				indexes: null,
			},
		});

		return workout;
	}
}
