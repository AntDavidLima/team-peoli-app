import { MaterialCommunityIcons } from "@expo/vector-icons";
import draftToHtml from "draftjs-to-html";
import { Link } from "expo-router";
import { useState } from "react";
import {
	Image,
	Pressable,
	Text,
	View,
	useWindowDimensions,
} from "react-native";
import Collapsible from "react-native-collapsible";
import RenderHTML from "react-native-render-html";
import tailwindColors from "tailwindcss/colors";
import { Routine } from "./trainings";

export function RoutineItem({
	orientations,
	trainings,
	name,
	endDate,
	startDate,
	day,
}: Omit<Routine, "id"> & { day: string }) {
	const [orientationCollapsed, setOrientationCollapsed] =
		useState<boolean>(true);

	const { width } = useWindowDimensions();

	return (
		<View className="mb-8">
			<View className="flex-row items-center gap-4">
				<View className="flex-1 border h-0 border-white" />
				<Text className="text-white">{name}</Text>
				<View className="flex-1 border h-0 border-white" />
			</View>
			<View className="flex-row gap-1">
				<MaterialCommunityIcons
					name="calendar-month-outline"
					color={tailwindColors.white}
					size={18}
				/>
				<Text className="text-white">
					{new Date(startDate).toLocaleDateString("pt-BR")}
				</Text>
				{endDate && (
					<Text className="text-white">
						- {new Date(endDate).toLocaleDateString("pt-BR")}
					</Text>
				)}
			</View>
			{orientations?.blocks[0].text.trim() !== "" && (
				<Pressable
					className="bg-main/25 border border-main p-1 mt-3"
					onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-1">
							<MaterialCommunityIcons
								name="alert-outline"
								color={tailwindColors.sky[400]}
								size={16}
							/>
							<Text className="text-sky-400">Orientações gerais</Text>
						</View>
						<View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
							<MaterialCommunityIcons
								name="chevron-down"
								color={tailwindColors.sky[400]}
								size={16}
							/>
						</View>
					</View>
					<Collapsible collapsed={orientationCollapsed}>
						<RenderHTML
							source={{ html: draftToHtml(orientations!) }}
							contentWidth={width}
							baseStyle={{ color: tailwindColors.white }}
						/>
					</Collapsible>
				</Pressable>
			)}
			<View className="mt-4">
				{trainings.map(({ id, name, exercises }) => (
					<View key={id}>
						<Text className="text-white font-bold text-base">{name}</Text>
						<View className="mt-1 gap-4">
							{exercises.map(
								({ reps, orientations, sets, exercise, restTime }) => (
									<Link
										href={{
											pathname: "/(routes)/(authenticated)/exercise/[id]",
											params: { id: exercise.id, trainingId: id, day },
										}}
										asChild
										key={exercise.id}
									>
										<Pressable className="bg-card p-2 rounded flex-row justify-between">
											<View className="flex-1">
												<View className="flex-row gap-1 items-center">
													<Text className="text-white font-semibold mb-1">
														{exercise.name}
													</Text>
													<View className="flex-row items-center gap-0.5 mt-0.5">
														<MaterialCommunityIcons
															name="timer-outline"
															color={tailwindColors.white}
															size={14}
														/>
														<Text className="text-white text-xs">
															{restTime}s
														</Text>
													</View>
												</View>
												<View className="flex-row gap-1">
													<Text className="text-white font-semibold text-xs">
														{sets} Séries
													</Text>
													<Text className="text-white font-semibold text-xs">
														de
													</Text>
													<Text className="text-white font-semibold text-xs">
														{reps} Repetições
													</Text>
												</View>
												{orientations && (
													<View className="mt-3">
														<Text className="text-white text-xs font-bold">
															Instruções:
														</Text>
														<RenderHTML
															source={{ html: draftToHtml(orientations) }}
															contentWidth={width}
															baseStyle={{ color: tailwindColors.white }}
														/>
													</View>
												)}
											</View>
											<View className="h-32 rounded-lg aspect-[9/16]">
												<Image
													source={{
														uri: `https://img.youtube.com/vi/${exercise.executionVideoUrl?.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/)?.[7]}/0.jpg`,
													}}
													className="h-full w-full rounded-lg"
												/>
											</View>
										</Pressable>
									</Link>
								),
							)}
						</View>
					</View>
				))}
			</View>
		</View>
	);
}
