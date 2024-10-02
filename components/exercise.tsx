import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { WebDisplay } from "./web-display";
import draftToHtml from "draftjs-to-html";
import tailwindColors from "tailwindcss/colors";
import { Exercise } from "@/app/(routes)/(authenticated)/(drawer)/exercise/[id]";
import { RawDraftContentState } from "draft-js";
import { Set } from "./set";
import YoutubePlayer from "react-native-youtube-iframe";

interface ExerciseExecution {
	exercise: Exercise;
	restTime: number;
	orientations: RawDraftContentState | null;
	reps: number;
	sets: number;
	trainingStarted: boolean;
	workoutId: number | undefined;
	setsInfo: SetsInfo[];
	trainingIds: number[];
}

interface SetsInfo {
	id: number;
	load: number;
	reps: number;
}

export function ExerciseExecution({
	restTime,
	orientations,
	exercise,
	sets,
	trainingStarted,
	workoutId,
	setsInfo,
	trainingIds,
}: ExerciseExecution) {
	return (
		<View className="px-4 mb-14">
			{exercise.executionVideoUrl && (
				<View className="mt-6">
					<YoutubePlayer
						height={225}
						videoId={getYoutubeVideoId(exercise.executionVideoUrl)}
					/>
				</View>
			)}
			<View className="mt-2">
				<View className="flex-row gap-1 items-center">
					<Text className="text-white font-bold text-lg">{exercise.name}</Text>
					<View className="flex-row items-center gap-0.5 mt-0.5">
						<MaterialCommunityIcons
							name="timer-outline"
							color={tailwindColors.white}
							size={14}
						/>
						<Text className="text-white text-xs">{restTime}s</Text>
					</View>
				</View>
				{orientations?.blocks[0].text.trim() !== "" && (
					<View className="mt-2 text-sky-400 bg-main/20 border border-main p-1">
						<Text className="text-white font-semibold">Instruções:</Text>
						<WebDisplay
							html={draftToHtml(orientations!)}
							textColor={tailwindColors.white}
						/>
					</View>
				)}
				<View className="mt-8 rounded -mx-4">
					<View className="flex-row mb-4">
						<Text className="text-white w-1/5 text-center">SÉRIE</Text>
						<Text className="text-white w-1/4 text-center">ANTERIOR</Text>
						<Text className="text-white w-1/5 text-center">CARGA</Text>
						<Text className="text-white w-[15%] text-center">REPS</Text>
						<View className="w-1/5 items-center">
							<MaterialCommunityIcons
								name="progress-check"
								color={tailwindColors.white}
								size={18}
							/>
						</View>
					</View>
					{Array.from({ length: sets })
						.map((_, index) => setsInfo[index])
						.map((set, index) => {
							return (
								<View
									key={index}
									className={`flex-row items-center py-2 ${index % 2 === 0 ? "bg-darker" : "bg-transparent"}`}
								>
									<Set
										index={index + 1}
										trainingStarted={trainingStarted}
										workoutId={workoutId}
										exerciseId={exercise.id}
										reps={set?.reps}
										load={set?.load}
										id={set?.id}
										trainingIds={trainingIds}
									/>
								</View>
							);
						})}
				</View>
			</View>
		</View>
	);

	function getYoutubeVideoId(url: string) {
		const youtubeVideoIdRegex =
			/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

		return url.match(youtubeVideoIdRegex)?.[7];
	}
}
