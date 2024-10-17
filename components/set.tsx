import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { Pressable, Text, TextInput, View } from "react-native";
import * as yup from "yup";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface Set {
	index: number;
	trainingStarted: boolean;
	workoutId: number | undefined;
	exerciseId: number | undefined;
	load: number | undefined;
	reps: number | undefined;
	id: number | undefined;
	trainingIds: number[];
	lastExecution: string;
}

const setFormSchema = yup.object({
	load: yup.number().required("Informe a carga"),
	reps: yup.number().required("Informe as repetições"),
	id: yup.number().optional(),
	done: yup.boolean().required(),
});

type SetForm = yup.InferType<typeof setFormSchema>;

export function Set({
	index,
	trainingStarted,
	workoutId,
	exerciseId,
	load,
	reps,
	id,
	trainingIds,
	lastExecution,
}: Set) {
	const {
		control,
		formState: { errors },
		handleSubmit,
		getValues,
		watch,
		setValue,
		reset,
	} = useForm<SetForm>({
		resolver: yupResolver(setFormSchema),
		defaultValues: {
			reps,
			load,
			id,
			done: Boolean(id),
		},
	});

	const queryClient = useQueryClient();

	const { mutate: onSubmit } = useMutation({
		mutationFn: updateWorkout,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workout", ...trainingIds] });
		},
	});

	useEffect(() => {
		if (id === undefined) {
			reset();
		} else {
			setValue("id", id);
			setValue("load", load!);
			setValue("reps", reps!);
			setValue("done", true);
		}
	}, [id, load, reps]);

	return (
		<>
			<Text className="text-white w-1/5 text-center font-extrabold">
				{index}
			</Text>
			<Text className="text-white w-1/4 text-center">{lastExecution}</Text>
			<Controller
				control={control}
				name="load"
				render={({ field: { onChange, value, ...field } }) => (
					<View className="w-1/5 px-1 items-center">
						<TextInput
							className={`text-center ${errors.reps ? "text-red-500" : "text-white"}`}
							keyboardType="numeric"
							placeholderTextColor={
								errors.load ? tailwindColors.rose[500] : customColors.disabled
							}
							placeholder="KG"
							onChangeText={(event) => {
								setValue("done", false);
								onChange(event);
							}}
							value={value?.toString()}
							selectTextOnFocus={trainingStarted}
							editable={trainingStarted}
							{...field}
						/>
					</View>
				)}
			/>
			<Controller
				control={control}
				name="reps"
				render={({ field: { onChange, value, ...field } }) => (
					<View className="w-[15%] px-1 items-center">
						<TextInput
							className={`text-center ${errors.reps ? "text-red-500" : "text-white"}`}
							placeholder="10 - 12"
							placeholderTextColor={
								errors.reps ? tailwindColors.rose[500] : customColors.disabled
							}
							keyboardType="numeric"
							onChangeText={(event) => {
								setValue("done", false);
								onChange(event);
							}}
							value={value?.toString()}
							selectTextOnFocus={trainingStarted}
							editable={trainingStarted}
							{...field}
						/>
					</View>
				)}
			/>
			<View className="w-1/5 items-center">
				<Pressable
					className={`w-5 h-5 rounded-lg items-center justify-center ${getValues("done") ? "bg-green-500" : "bg-subtitle"}`}
					disabled={!trainingStarted || watch("done")}
					onPress={handleSubmit((data) => onSubmit(data))}
				>
					<MaterialCommunityIcons
						name="check"
						size={16}
						color={watch("done") ? tailwindColors.white : customColors.disabled}
					/>
				</Pressable>
			</View>
		</>
	);

	async function updateWorkout({ reps, load }: SetForm) {
		const { data } = await api.put(`/workout/${workoutId}`, {
			exerciseId,
			reps,
			load,
			setId: id,
		});

		return data;
	}
}
