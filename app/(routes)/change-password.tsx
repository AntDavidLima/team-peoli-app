import { MaterialCommunityIcons } from "@expo/vector-icons";
import PasswordIcon from '@/assets/icons/password.svg';
import SeeIcon from "@/assets/icons/see.svg";
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
import Toast from "react-native-toast-message";
import { Redirect, router } from "expo-router";

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
	const { currentUser, updateMe, isAuthenticated } = useAuthentication();

	if (!isAuthenticated) {
		return <Redirect href="/login" />;
	}

	if (currentUser?.lastPasswordChange) {
		return <Redirect href="/(authenticated)" />;
	}

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
			<View className="w-full px-8 justify-center h-full">
				<Image
            		style={{width: 150, height: 50, marginTop: 40}}
					className="mb-12 self-center"
					source={require("@/assets/images/logo.png")} />
				<View className="space-y-1 mb-3">
					<Text style={{fontFamily: 'Inter-Bold'}} className="text-white text-xl text-center font-bold">Bem-vindo(a) ao time!</Text>
					<Text style={{fontFamily: 'Inter-Regular', alignSelf: 'center'}} className="mt-1 text-secondary text-sm text-center">
						Antes de começar, altere sua senha provisória.
					</Text>
				</View>
				<View className="space-y-3 w-full">
					<View>
						<View className="flex-row items-center my-2 gap-1.5">
							<PasswordIcon width={18} height={18} fill="#64A4EB" />
							<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">Criar Nova senha</Text>
						</View>
						<View className="relative">
							<Controller
								control={control}
								render={({ field: { onChange, ...field } }) => (
									<TextInput
										placeholder="••••••••••••"
										placeholderTextColor="#AAAAAA" 
										className="bg-gray-600 rounded w-full px-3 py-2.5 text-sm text-white border-solid border-[1px] border-gray-400"
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
								className="absolute right-3 top-1/4"
								onPress={() =>
									setPasswordVisible((prev) => ({
										...prev,
										new: !prev.new,
									}))
								}
							>
								{passwordVisible.new ? <MaterialCommunityIcons
								name={"eye-off-outline"}
								size={18}
								color="gray"
								/> :
								<SeeIcon width={18} height={18} fill="#64A4EB" /> 
								}
							</TouchableOpacity>
							{errors.newPassword && (
								<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
									{errors.newPassword?.message}
								</Text>
							)}
						</View>
					</View>
					<View>
						<View className="flex-row items-center mt-3 my-2 gap-1.5 ">
							<PasswordIcon width={18} height={18} fill="#64A4EB" />
							<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">
								Confirmar nova senha
							</Text>
						</View>
						<View className="relative">
							<Controller
								control={control}
								render={({ field: { onChange, ...field } }) => (
									<TextInput
										placeholder="••••••••••••"
										placeholderTextColor="#AAAAAA"
										className="bg-gray-600 rounded w-full px-3 py-2.5 text-sm text-white border-solid border-[1px] border-gray-400"
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
								className="absolute right-3 top-1/4"
								onPress={() =>
									setPasswordVisible((prev) => ({
										...prev,
										confirm: !prev.confirm,
									}))
								}
							>
								{passwordVisible.confirm ? <MaterialCommunityIcons
								name={"eye-off-outline"}
								size={18}
								color="gray"
								/> :
								<SeeIcon width={18} height={18} fill="#64A4EB" />
								}
							</TouchableOpacity>
							{errors.passwordConfirmation && (
								<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
									{errors.passwordConfirmation?.message}
								</Text>
							)}
						</View>
					</View>
					<TouchableOpacity
						style={{marginTop: 40}}
						className="bg-main rounded h-12 items-center justify-center w-full px-10"
						onPress={handleSubmit(onSubmit)}
					>
						<Text className="text-white font-semibold text-sm">Definir Senha</Text>
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
					Toast.show({
						type: 'error',
						text1: apiError.message
					});
				}
			}
		}
	}
}