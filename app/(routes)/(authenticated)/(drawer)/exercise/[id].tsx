import { api } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PowerIcon from "@/assets/icons/power.svg";
import FinishIcon from "@/assets/icons/finish.svg";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RawDraftContentState } from "draft-js";
import { useLocalSearchParams } from "expo-router";
import {
	Pressable,
	ScrollView,
	Text,
	View,
	FlatList,
	Dimensions,
	Platform,
	ViewToken,
} from "react-native";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";
import { Fragment, useEffect, useRef, useState } from "react";
import { differenceInSeconds } from "date-fns";
import { ExerciseExecution } from "@/components/exercise";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { Image } from "expo-image";

interface Training {
	exercises: TrainingExercise[];
}

export interface TrainingExercise {
	sets: number;
	reps: string;
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
				new Date(workout.startTime)
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
					}, 1000)
				);
			}
		} else {
			setClock(null);
		}
	}, [workout]);

	const flatListRef = useRef<FlatList<TrainingExercise>>(null);

	const initialExerciseIndex = training?.exercises.findIndex(
		(exercise) => exercise.exercise.id === Number(id)
	);

	const [currentExerciseIndex, setCurrentExerciseIndex] = useState(
		initialExerciseIndex || 0
	);

	useEffect(() => {
		if (
			initialExerciseIndex !== undefined &&
			initialExerciseIndex > -1 &&
			training
		) {
			const timeoutId = setTimeout(() => {
				flatListRef.current?.scrollToIndex({
					index: initialExerciseIndex,
					animated: Platform.OS !== "web",
				});
			}, 100);
			return () => clearTimeout(timeoutId);
		}
	}, [initialExerciseIndex, training]);

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
			if (clock) clearInterval(clock);
			setClock(null);
		},
	});

	const onViewableItemsChanged = useRef(
		({ viewableItems }: { viewableItems: ViewToken[] }) => {
			if (viewableItems.length > 0) {
				const newIndex = viewableItems[0].index;
				if (typeof newIndex === "number") {
					setCurrentExerciseIndex(newIndex);
				}
			}
		}
	).current;

	const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

	if (loadingTraining || !training) {
		return (
			<Image
				source={require("@/assets/animations/loading.gif")}
				style={{ flex: 1 }}
				contentFit="contain"
			/>
		);
	}

	return (
			<Fragment>
				<ScrollView>
				<FlatList
					ref={flatListRef}
					data={training.exercises}
					keyExtractor={(item) => item.exercise.id.toString()}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					bounces={false}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={viewabilityConfig}
					getItemLayout={(data, index) => ({
						length: SCREEN_WIDTH,
						offset: SCREEN_WIDTH * index,
						index,
					})}
					renderItem={({ item: { exercise, reps, sets, restTime, orientations } }) => (
						<View style={{ width: SCREEN_WIDTH }}>
							<ExerciseExecution
								reps={reps}
								sets={sets}
								setsInfo={
									workout?.exercises
										.filter(
											({ exerciseId }) => exerciseId === currentExerciseId
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
						</View>
					)}
				/>
				</ScrollView>
				<View className="justify-center items-center">
					{clock ? (
						<View className="flex-row items-center space-x-1">
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
						<View></View>
					)}
				</View>
				<View className="h-20 mb-2 mt-2 flex-row justify-around py-2 items-center">
					<Pressable
						className="border-gray-300 border-2 rounded-full p-4"
						disabled={currentExerciseIndex === 0}
						onPress={() => {
							flatListRef.current?.scrollToIndex({
								index: currentExerciseIndex - 1,
							});
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
					<View className="justify-center rounded-full">
						<Pressable

							style={{
								// borderRadius: 30,
								// shadowColor: clock ? "#F44336" : "#1FB990",
								// shadowOffset: { width: 0, height: 5 },
								// shadowOpacity: 0.34,
								// shadowRadius: 6.27,
								// elevation: 10,
							}}
							onPress={() => (clock ? finishWorkout() : startWorkout())}
						>
							{clock ? (
								<FinishIcon width={80} height={80} />
							) : (
								<PowerIcon width={80} height={80} />
							)}
						</Pressable>
					</View>
					<Pressable
						className="border-gray-300 border-2 rounded-full p-4"
						disabled={currentExerciseIndex === training.exercises.length - 1}
						onPress={() => {
							flatListRef.current?.scrollToIndex({
								index: currentExerciseIndex + 1,
							});
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
			</Fragment>
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
			`/training/${trainingId}`
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
			`/workout/stop/${workout?.id}`
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