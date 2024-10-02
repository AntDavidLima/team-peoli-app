import { MaterialCommunityIcons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as yup from "yup";
import customColors from "@/tailwind.colors";
import { APIError, api } from "@/lib/api";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { AxiosError } from "axios";
import Toast from "react-native-root-toast";
import { router } from "expo-router";

const passwordFormSchema = yup.object({
	newPassword: yup
		.string()
		.required("Por favor, informe a nova senha.")
		.min(8, "Mínimo de 8 caracteres"),
	passwordConfirmation: yup
		.string()
		.oneOf([yup.ref("newPassword")], "As senhas não coincidem")
		.required("Por favor, confirme a nova senha."),
});

type PasswordForm = yup.InferType<typeof passwordFormSchema>;

export default function ChangePassword() {
	const { currentUser, updateMe } = useAuthentication();

	const [passwordVisible, setPasswordVisible] = useState({
		new: false,
		confirm: false,
	});

	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<PasswordForm>({
		resolver: yupResolver(passwordFormSchema),
	});

	return (
		<View className="items-center py-16 px-6 justify-evenly h-full">
			<Image source={require("@/assets/images/logo-horizontal.png")} />
			<View className="space-y-2">
				<Text className="text-white text-3xl text-center">Bem vindo!</Text>
				<Text className="text-white text-base text-center">
					Antes de começar, vamos mudar sua senha provisória.
				</Text>
			</View>
			<View className="space-y-4 w-full">
				<View>
					<Text className="text-white font-medium mb-1">Nova senha</Text>
					<View className="relative">
						<Controller
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<TextInput
									placeholder="••••••••••••"
									placeholderTextColor={customColors.disabled}
									className="bg-darker rounded w-full px-2 text-base py-1.5 text-white"
									inputMode="text"
									autoCapitalize="none"
									secureTextEntry={!passwordVisible.new}
									onChangeText={onChange}
									{...field}
								/>
							)}
							name="newPassword"
						/>
						<TouchableOpacity
							className="absolute right-2 top-1/4"
							onPress={() =>
								setPasswordVisible((prev) => ({
									...prev,
									new: !prev.new,
								}))
							}
						>
							<MaterialCommunityIcons
								name={passwordVisible.new ? "eye-off-outline" : "eye-outline"}
								size={20}
								color="gray"
							/>
						</TouchableOpacity>
						{errors.newPassword && (
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
								{errors.newPassword?.message}
							</Text>
						)}
					</View>
				</View>
				<View>
					<Text className="text-white font-medium mb-1">
						Confirme a nova senha
					</Text>
					<View className="relative">
						<Controller
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<TextInput
									placeholder="••••••••••••"
									placeholderTextColor={customColors.disabled}
									className="bg-darker rounded w-full px-2 text-base py-1.5 text-white"
									inputMode="text"
									autoCapitalize="none"
									secureTextEntry={!passwordVisible.confirm}
									onChangeText={onChange}
									{...field}
								/>
							)}
							name="passwordConfirmation"
						/>
						<TouchableOpacity
							className="absolute right-2 top-1/4"
							onPress={() =>
								setPasswordVisible((prev) => ({
									...prev,
									confirm: !prev.confirm,
								}))
							}
						>
							<MaterialCommunityIcons
								name={
									passwordVisible.confirm ? "eye-off-outline" : "eye-outline"
								}
								size={20}
								color="gray"
							/>
						</TouchableOpacity>
						{errors.passwordConfirmation && (
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
								{errors.passwordConfirmation?.message}
							</Text>
						)}
					</View>
				</View>
			</View>
			<TouchableOpacity
				className="bg-main rounded h-10 items-center justify-center w-full mt-32"
				onPress={handleSubmit(onSubmit)}
			>
				<Text className="text-white font-semibold text-base">Confirmar</Text>
			</TouchableOpacity>
		</View>
	);

	async function onSubmit({ newPassword }: PasswordForm) {
		try {
			await api.patch(`/user/${currentUser?.id}`, {
				newPassword,
				email: currentUser?.email,
				name: currentUser?.name,
				phone: currentUser?.phone,
			});

			await updateMe({ authToken: currentUser!.authToken });

			router.replace("/(authenticated)");
		} catch (error) {
			if (error instanceof AxiosError) {
				const apiError = error.response?.data as APIError;

				console.log(error.message);

				if (typeof apiError.error === "string") {
					Toast.show(apiError.message, {
						backgroundColor: "red",
						opacity: 0.9,
						position: Toast.positions.TOP,
					});
				}
			}
		}
	}
}
