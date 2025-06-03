import { MaterialCommunityIcons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { 
		Image, 
  		KeyboardAvoidingView,
		Text, 
		TextInput, 
		TouchableOpacity, 
		View } from "react-native";
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
      	<KeyboardAvoidingView
        behavior="padding">
			<View className="items-center w-full px-8 justify-center h-full">
				<Image
					className="mb-16 w-60 h-20 self-center"
					source={require("@/assets/images/logo.png")} />
				<View className="space-y-2 mb-3">
					<Text className="text-white text-3xl text-center font-bold">Bem-vindo(a) ao time!</Text>
					<Text className="text-[#64A4EB] text-base text-center">
						Antes de começar, altere sua{"\n"}
						senha provisória.
					</Text>
				</View>
				<View className="space-y-4 w-full">
					<View>
						<View className="flex-row items-center my-3 gap-1">
							<MaterialCommunityIcons
								name="form-textbox-password"
								size={20}
								color="#64A4EB"
							/>
							<Text className="text-white font-medium">Nova senha</Text>
						</View>
						<View className="relative">
							<Controller
								control={control}
								render={({ field: { onChange, ...field } }) => (
									<TextInput
										placeholder="••••••••••••"
										placeholderTextColor="white" 
										className="bg-gray-600 rounded w-full px-4 py-3 text-base text-white py-1.5 border-solid border-[1px] border-gray-400"
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
									className="mx-3"
									color="white"
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
						<View className="flex-row items-center my-3 gap-1 ">
							<MaterialCommunityIcons
								name="form-textbox-password"
								size={20}
								color="#64A4EB"
							/>
							<Text className="text-white font-medium">
								Confirmar nova senha
							</Text>
						</View>
						<View className="relative">
							<Controller
								control={control}
								render={({ field: { onChange, ...field } }) => (
									<TextInput
										placeholder="••••••••••••"
										placeholderTextColor="white"
										className="bg-gray-600 rounded w-full px-4 py-3 text-base text-white py-1.5 border-solid border-[1px] border-gray-400"
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
									color="white"
									className="mx-3"
								/>
							</TouchableOpacity>
							{errors.passwordConfirmation && (
								<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
									{errors.passwordConfirmation?.message}
								</Text>
							)}
						</View>
					</View>
					<TouchableOpacity
						className="bg-main rounded h-14 items-center justify-center w-full px-10 mt-12"
						onPress={handleSubmit(onSubmit)}
					>
						<Text className="text-white font-semibold text-base">Definir Senha</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
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
