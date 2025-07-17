import { api } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { differenceInSeconds } from "date-fns";
import { ExerciseExecution } from "@/components/exercise";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { Image } from "expo-image";
import { useAppFocus } from "@/hooks/useAppFocus";
import { Modal } from "react-native";
import {
	VictoryChart,
	VictoryLabel,
	VictoryPie,
} from "victory-native";
import PowerIcon from "@/assets/icons/power.svg";
import FinishIcon from "@/assets/icons/finish.svg";
import TimerIcon from "@/assets/icons/timer2.svg";
import NoteIcon from "@/assets/icons/note.svg";

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
	const [isResting, setIsResting] = useState(false);
	const [restEndTime, setRestEndTime] = useState<Date | null>(null);
	const [remainingRestSeconds, setRemainingRestSeconds] = useState(0);
	const [totalRestDuration, setTotalRestDuration] = useState(0);

	const [isConfirmFinishModalVisible, setIsConfirmFinishModalVisible] = useState(false);
	const [isWorkoutIncomplete, setIsWorkoutIncomplete] = useState(false);

	const handleStartRest = (duration: number) => {
		if (duration <= 0) return;

		const endTime = new Date(Date.now() + duration * 1000);
		setRestEndTime(endTime);
		setTotalRestDuration(duration);
		setRemainingRestSeconds(duration);
		setIsResting(true);
	};

	const addRestTime = (seconds: number) => {
		if (!restEndTime) return;

		const newEndTime = new Date(restEndTime.getTime() + seconds * 1000);
		setRestEndTime(newEndTime);
		setTotalRestDuration((currentDuration) => currentDuration + seconds);
		setRemainingRestSeconds((currentSeconds) => currentSeconds + seconds);
	};

	const handleFinishWorkoutAttempt = () => {
		if (!training || !workout || !workout.exercises) {
            return;
		}

		const totalExpectedSets = training.exercises.reduce(
			(acc, exercise) => acc + exercise.sets,
			0
		);

		const totalCompletedSets = workout.exercises.reduce(
			(acc, exercise) => acc + exercise.WorkoutExerciseSets.length,
			0
		);

		setIsWorkoutIncomplete(totalCompletedSets < totalExpectedSets);

		setIsConfirmFinishModalVisible(true);
	};

	const handleStopRest = () => {
		setIsResting(false);
		setRestEndTime(null);
		setRemainingRestSeconds(0);
	};

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

	const syncWorkoutTimer = useCallback(() => {
		if (!workout) return;

		const timeAfterStartInSeconds = differenceInSeconds(
			new Date(),
			new Date(workout.startTime)
		);

		const hours = Math.floor(timeAfterStartInSeconds / 3600);
		const minutes = Math.floor((timeAfterStartInSeconds % 3600) / 60);
		const seconds = timeAfterStartInSeconds % 60;

		setTimeAfterStart({ hours, minutes, seconds });
	}, [workout]);
	

	useEffect(() => {
		if (!isResting || !restEndTime) {
			return;
		}

		const interval = setInterval(() => {
			const remaining = differenceInSeconds(restEndTime, new Date());

			if (remaining <= 0) {
				handleStopRest();
			} else {
				setRemainingRestSeconds(remaining);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [isResting, restEndTime]);

	useAppFocus(() => {
		if (isResting && restEndTime) {
			const remaining = differenceInSeconds(restEndTime, new Date());
			if (remaining > 0) {
				setRemainingRestSeconds(remaining);
			} else {
				handleStopRest();
			}
		}

		if (clock) {
			syncWorkoutTimer();
		}
	})

	useEffect(() => {
		if (workout) {
			syncWorkoutTimer();

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
			if(clock) clearInterval(clock);
			setClock(null);
		}
		return () => {
			if(clock) clearInterval(clock);
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
			setTimeAfterStart({ hours: 0, minutes: 0, seconds: 0 });
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
			<View className="h-1 w-full bg-lightBackground">
				<View className={`h-1 w-[${(100 / training.exercises.length) * (currentExerciseIndex + 1)}%] bg-main`}></View>
			</View>
			<View className={`flex-row justify-between mx-2 rounded-full pt-1 pb-1 mt-4 mb-4 ${
				clock ? 'bg-main' : 'bg-lightBackground'
			}`}>
				<Pressable
					className={`pl-2 pb-1 ${currentExerciseIndex === 0 ? "opacity-0" : "opacity-75"}`}
					disabled={currentExerciseIndex === 0}
					onPress={() => {
						flatListRef.current?.scrollToIndex({
							index: currentExerciseIndex - 1,
						});
					}}
				>
					<MaterialCommunityIcons
						name="chevron-left"
						color="white"
						size={24}
					/>
				</Pressable>
				<View className="justify-center items-center">
					<View className="flex-row items-center space-x-2">
					<TimerIcon width={16} height={16}/>
					{(
						<View className="flex-row items-center space-x-1">
							<View className="flex-row items-baseline">
								<Text style={{fontFamily: 'Inter-Regular'}} className="text-white">
									{String(timeAfterStart.hours).padStart(2, '0')}:
								</Text>
								<Text style={{fontFamily: 'Inter-Regular'}} className="text-white">
									{String(timeAfterStart.minutes).padStart(2, '0')}:
								</Text>
								<Text style={{fontFamily: 'Inter-Regular'}} className="text-white">
									{String(timeAfterStart.seconds).padStart(2, '0')}
								</Text>
							</View>
						</View>
					)}
					</View>
				</View>
				<Pressable
					className={`pr-2 ${currentExerciseIndex === training.exercises.length - 1 ? "opacity-0" : "opacity-75"}`}
					disabled={currentExerciseIndex === training.exercises.length - 1}
					onPress={() => {
						flatListRef.current?.scrollToIndex({
							index: currentExerciseIndex + 1,
						});
					}}
				>
					<MaterialCommunityIcons
						name="chevron-right"
						color="white"
						size={24}
					/>
				</Pressable>
			</View>
			<ScrollView>
				<View className="px-3 mt-5">
					<Text style={{fontFamily: 'Inter-Medium'}} className="text-secondary">
						Exercício {currentExerciseIndex + 1} de {training.exercises.length}
					</Text>
				</View>
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
								onStartRest={handleStartRest}
							/>
						</View>
					)}
				/>
			</ScrollView>
			<View className="h-24 mb-2 mt-2 flex-row justify-around py-2 items-center px-4">
				{isResting ? (
					<View className="flex-row justify-between items-center w-full px-8">
						<Pressable onPress={() => addRestTime(10)}>
							<View className="flex-row items-center">
								<Text style={{fontFamily: 'Inter-Regular'}} className="text-white">+</Text><Text style={{fontFamily: 'Inter-Regular-Italic'}} className="text-white font-bold">10s</Text>
							</View>
							</Pressable>

						<View className="relative justify-center items-center">
							<VictoryChart
								width={95}
								height={95}
								padding={0}
							>
								<VictoryPie
									standalone={false}
									width={95} height={95}
									style={{
										labels: { display: "none" },
										data: {
											fill: ({ datum }) => datum.color,
										},
									}}
									innerRadius={42}
									data={[
										{ x: "elapsed", y: totalRestDuration - remainingRestSeconds, color: customColors.lightBackground },
										{
											x: "left",
											y: remainingRestSeconds,
											color: customColors.main,
										},
									]}
								/>
								<VictoryLabel
									text={`${String(Math.floor(remainingRestSeconds / 60)).padStart(2, '0')}:${String(remainingRestSeconds % 60).padStart(2, '0')}`}
									textAnchor="middle"
									verticalAnchor="middle"
									x={47.5} y={44}
									style={{ 
										fontFamily: 'Inter-Regular',
										fontSize: 22,
										fontWeight: 'bold',
										fill: tailwindColors.white
									}}
								/>
								<VictoryLabel
									text={"DESCANSO"}
									textAnchor="middle"
									verticalAnchor="middle"
									x={47.5} y={62}
									style={{ fontFamily: 'Inter-Regular', fontSize: 10, fill: customColors.disabled }}
								/>
							</VictoryChart>
						</View>

						<Pressable onPress={handleStopRest}>
							<Text style={{ fontFamily: 'Inter-Regular-Italic' }} className="text-white font-bold">PULAR</Text>
						</Pressable>
					</View>

				) : clock ? (
					(() => {
						const upcomingRestTime = training.exercises[currentExerciseIndex]?.restTime || 0;
						const minutes = String(Math.floor(upcomingRestTime / 60)).padStart(2, '0');
						const seconds = String(upcomingRestTime % 60).padStart(2, '0');

						return (
							<View className="flex-row justify-between items-center w-full px-8">								
								<Pressable className="flex-col items-center">
									<NoteIcon width={28} height={28} />
									<Text style={{fontFamily: 'Inter-Regular-Italic', fontSize: 12}} className="text-white mt-2">NOTAS</Text>
								</Pressable>
								<View className="relative justify-center items-center">
									<VictoryChart width={95} height={95} padding={0}>
										<VictoryPie
											standalone={false}
											width={95} height={95}
											style={{ labels: { display: "none" }, data: { fill: ({ datum }) => datum.color, }, }}
											innerRadius={42}
											data={[
												{ x: "full", y: 1, color: customColors.lightBackground },
											]}
										/>
										<VictoryLabel
											text={`${minutes}:${seconds}`}
											textAnchor="middle" verticalAnchor="middle" x={47.5} y={44}
											style={{ fontFamily: 'Inter-Regular', fontSize: 22, fontWeight: 'bold', fill: tailwindColors.white }}
										/>
										<VictoryLabel
											text={"DESCANSO"}
											textAnchor="middle" verticalAnchor="middle" x={47.5} y={62}
											style={{ fontFamily: 'Inter-Regular', fontSize: 10, fill: customColors.disabled }}
										/>
									</VictoryChart>
								</View>
								<Pressable className="flex-col items-center" onPress={handleFinishWorkoutAttempt}>
									<FinishIcon width={28} height={28} />
									<Text style={{fontFamily: 'Inter-Regular-Italic', fontSize: 12}} className="text-white mt-2">ENCERRAR</Text>
								</Pressable>
							</View>
						);
					})()

				) : (
					<Pressable
						className="h-14 w-36 rounded-full bg-main justify-center items-center flex-row space-x-2"
						onPress={() => startWorkout()}
					>
						<PowerIcon width={24} height={24} />
						<Text style={{fontFamily: 'Inter-Regular'}} className="text-white text-md">
							INICIAR
						</Text>
					</Pressable>
				)}
			</View>
			<Modal
				visible={isConfirmFinishModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setIsConfirmFinishModalVisible(false)}
			>
				<View
					className="flex-1 justify-center items-center px-4"
					style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
				>
					<View className={`${isWorkoutIncomplete ? 'bg-danger' : 'bg-lightBackground'} w-full rounded-2xl p-6 items-center`}>
						<Text style={{fontFamily: 'Inter-Bold'}} className="text-white font-bold text-xl text-center">
							{isWorkoutIncomplete
                                ? "Tem certeza?"
                                : "Encerrar o Treino?"
                            }
                        </Text>

						<Text style={{fontFamily: 'Inter-Regular'}} className="text-white text-center mt-3 mb-6">
							{isWorkoutIncomplete
                                ? "Existem séries não registradas. Se encerrar agora, elas não serão contabilizadas."
                                : "Tem certeza que deseja encerrar a sessão?"
                            }
						</Text>

						<View className="flex-row w-full justify-between">
							<Pressable
								className={`${isWorkoutIncomplete ? "bg-lightBackground" :  "bg-secondary/35"} rounded-md py-3 w-[48%]`}
								onPress={() => setIsConfirmFinishModalVisible(false)}
							>
								<Text style={{fontFamily: 'Inter-Bold'}} className="text-white font-bold text-center">{isWorkoutIncomplete ? "Corrigir" : "Cancelar"}</Text>
							</Pressable>

							<Pressable
								className={`${isWorkoutIncomplete ? "bg-white" : "bg-danger"} rounded-md py-3 w-[48%]`}
								onPress={() => {
									setIsConfirmFinishModalVisible(false);
									finishWorkout();
								}}
							>
								<Text style={{fontFamily: 'Inter-Bold'}} className={`${isWorkoutIncomplete ? "text-danger" : "text-white"} font-bold text-center`}>Encerrar</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
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