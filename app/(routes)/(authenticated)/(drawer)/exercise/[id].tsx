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
import { TextInput, Modal } from "react-native";
import {
	VictoryChart,
	VictoryLabel,
	VictoryPie,
} from "victory-native";
import PowerIcon from "@/assets/icons/power.svg";
import FinishIcon from "@/assets/icons/finish.svg";
import TimerIcon from "@/assets/icons/timer2.svg";
import NoteIcon from "@/assets/icons/note.svg";
import DeleteIcon from "@/assets/icons/delete.svg";
import InfoIcon from "@/assets/icons/info2.svg";
import Toast from "react-native-root-toast";

interface Training {
	exercises: TrainingExercise[];
}

export interface TrainingExercise {
	sets: number;
	reps: string;
	restTime: number;
	orientations: RawDraftContentState | null;
	userNote: string | null;
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

	const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
    const [currentNote, setCurrentNote] = useState('');

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
		structuralSharing: true, 
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
	
	const startClock = useCallback(() => {
		if (clock) clearInterval(clock);
			
			syncWorkoutTimer();

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
	}, [clock, syncWorkoutTimer]);

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

		if (workout) {
			startClock();
		}
	})

	useEffect(() => {
		if (workout) {
			startClock();
		} else {
			if(clock) clearInterval(clock);
			setClock(null);
		}
		return () => {
			if(clock) clearInterval(clock);
		}
	}, [workout]);

	const flatListRef = useRef<FlatList<TrainingExercise>>(null);

	const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);

	useEffect(() => {
        if (training) {
            const initialIndex = training.exercises.findIndex(
                (exercise) => exercise.exercise.id === Number(id)
            );
            if (initialIndex > -1) {
                setCurrentExerciseIndex(initialIndex);
                const timeoutId = setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index: initialIndex,
                        animated: Platform.OS !== "web",
                    });
                }, 100);
                
                return () => clearTimeout(timeoutId);
            }
        }
    }, [training, id]);

	useEffect(() => {
        const note = training?.exercises[currentExerciseIndex]?.userNote || '';
        setCurrentNote(note);
    }, [currentExerciseIndex, training]);

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

	const { mutate: saveNote, isPending: isSavingNote } = useMutation({
        mutationFn: async ({ userNote }: { userNote: string }) => {
            const exerciseId = currentExerciseId;
            if (!exerciseId) throw new Error("ID do exercício não encontrado");
            return api.put(`/training/${trainingId}/exercise/${exerciseId}/userNote`, { userNote });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exercises", id, day] });
            setIsNoteModalVisible(false);
        },
        onError: () => {
			Toast.show("Não foi possível salvar a nota. Tente novamente.", {
				backgroundColor: "red",
				position: Toast.positions.TOP,
				duration: Toast.durations.LONG,
			});
        }
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
				<View style={{ width: `${(100 / training.exercises.length) * (currentExerciseIndex + 1)}%` }} className={`h-1 bg-main`}></View>
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
				<View className="px-3">
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
								<Text style={{fontFamily: 'Inter-Regular'}} className="text-white">+</Text><Text style={{fontFamily: 'Inter-Regular-Italic', fontSize: 16}} className="text-white font-bold">10s</Text>
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
							<View className="flex-row justify-between items-center w-full px-6">								
								<Pressable className="flex-col items-center" onPress={() => {setIsNoteModalVisible(true);}}>
									{currentNote ? (
										<InfoIcon className="absolute ml-8" width={14} height={14} />
									) : null}
									<NoteIcon width={24} height={24} />
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
									<FinishIcon width={24} height={24} />
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
								<Text style={{fontFamily: 'Inter-Bold'}} className="text-white font-bold text-center">{isWorkoutIncomplete ? "Voltar" : "Cancelar"}</Text>
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
			<Modal
				visible={isNoteModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setIsNoteModalVisible(false)}
			>
				<Pressable className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setIsNoteModalVisible(false)} />
			</Modal>
			<Modal
				visible={isNoteModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setIsNoteModalVisible(false)}
			>
				<View className="flex-1 justify-end">
                    <Pressable className="flex-1" onPress={() => setIsNoteModalVisible(false)} />
					<View className="border-2 border-lightBackground bg-background rounded-t-3xl">
                        <View className="flex-row pt-4 self-center items-center mb-4">
                            <NoteIcon width={20} height={20} color={customColors.secondary} />
                            <Text style={{fontFamily: 'Inter-Regular'}} className="text-white font-semibold text-lg ml-2">Notas do Exercício</Text>
                        </View>
						<View className="h-[2px] bg-lightBackground"/>
						<View className="px-4 py-4">
							<TextInput
								style={{
									height: 120,
									textAlignVertical: 'top',
									fontFamily: 'Inter-Regular'
								}}
								className="bg-lightBackground rounded-xl p-4 text-white text-base"
								placeholder="Digite suas anotações aqui..."
								placeholderTextColor={customColors.disabled}
								multiline
								value={currentNote}
								onChangeText={setCurrentNote}
							/>
						</View>
                        {currentNote.length > 0 && (
                            <Pressable 
                                className="flex-row items-center px-4 pb-4"
                                onPress={() => saveNote({ userNote: '' })}
                            >
								<DeleteIcon width={20} height={20}/>
                                <Text style={{fontFamily: 'Inter-Regular'}}  className="text-danger ml-1">Apagar Nota</Text>
                            </Pressable>
                        )}
						<View className="h-[2px] bg-lightBackground"/>
                        <View className="flex-row w-full justify-between px-4 pb-4 mt-6">
                            <Pressable
                                className="py-3 w-[48%]"
                                onPress={() => setIsNoteModalVisible(false)}
                            >
                                <Text style={{fontFamily: 'Inter-Regular'}}  className="text-white text-center">Cancelar</Text>
                            </Pressable>

                            <Pressable
                                className="bg-main rounded-lg py-3 w-[48%] items-center justify-center"
                                disabled={isSavingNote}
                                onPress={() => saveNote({ userNote: currentNote })}
                            >
                                {isSavingNote ? (
                                    <Text style={{fontFamily: 'Inter-Regular'}}  className="text-white font-bold text-center">Salvando Nota...</Text>
                                ) : (
                                    <Text style={{fontFamily: 'Inter-Regular'}}  className="text-white font-bold text-center">Salvar Nota</Text>
                                )}
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