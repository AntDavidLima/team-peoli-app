import tailwindColors from "tailwindcss/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import customColors from "@/tailwind.colors";
import { useEffect, useState } from "react";
import { phone } from "@/lib/masks";
import { APIError, api } from "@/lib/api";
import { AxiosError } from "axios";
import Toast from "react-native-root-toast";

const profileFormSchema = yup
	.object({
		name: yup.string().min(3, "").required("Campo obrigatório"),
		email: yup.string().email("E-mail inválido").required("Campo obrigatório"),
		currentPassword: yup.string(),
		newPassword: yup.string().min(8, "Mínimo de 8 caracteres"),
		passwordConfirmation: yup.string().min(8, "Mínimo de 8 caracteres"),
		phone: yup
			.string()
			.matches(/^\d{11}$/, { message: "Telefone inválido" })
			.length(11, { message: "O telefone deve possuir 11 dígitos" })
			.required("Campo obrigatório"),
	})
	.test({
		name: "passwordRequired",
		test(value, ctx) {
			const { newPassword, currentPassword } = value;

			if (newPassword && !currentPassword) {
				return ctx.createError({
					message: "Informe sua senha atual para poder alterá-la",
					path: "currentPassword",
				});
			}

			return true;
		},
	})
	.test({
		name: "passwordMatch",
		test(value, ctx) {
			const { newPassword, passwordConfirmation } = value;

			if (newPassword !== passwordConfirmation) {
				return ctx.createError({
					message: "As senhas não coincidem",
					path: "passwordConfirmation",
				});
			}

			return true;
		},
	});

type ProfileForm = yup.InferType<typeof profileFormSchema>;

export default function Profile() {
	const { currentUser, updateMe } = useAuthentication();

	const [changingPassword, setChangingPassword] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState({
		current: false,
		new: false,
		confirm: false,
	});

	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<ProfileForm>({
		resolver: yupResolver(profileFormSchema),
		defaultValues: {
			email: currentUser?.email,
			phone: currentUser?.phone,
			name: currentUser?.name,
		},
	});

	useEffect(() => {
		return () => {
			setChangingPassword(false);
		};
	}, []);

	return (
		<View className="bg-background relative px-4 flex-1">
			<View className="items-center h-40 relative -mt-20">
				<View className="absolute -bottom-20">
					<View className="w-36 bg-white aspect-square rounded-full bg-disabled items-center justify-center">
						<MaterialCommunityIcons
							name="camera-plus-outline"
							size={48}
							color={tailwindColors.black}
						/>
					</View>
						<MaterialCommunityIcons
							className="absolute top-24 right-1"
							name="pencil-circle"
							size={42}
							color="#2764E4"
						/>
					<Text className="text-white text-center text-base font-bold mt-2 text-3xl">
						{currentUser?.name}
					</Text>
				</View>
			</View>
			<ScrollView className="mt-24 h-[calc(100vh - 96px)]">
				<KeyboardAvoidingView className="px-4 gap-y-6">
					<View>
						<View className="flex-row items-center mb-3 gap-1">
							<MaterialCommunityIcons
								name="email"
								size={20}
								color="#64A4EB"
							/>
							<Text className="text-[white] text-base font-medium">E-mail</Text>
						</View>
						<Controller
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<TextInput
									placeholder="seuemail@exemplo.com"
                  					placeholderTextColor="#AAAAAA" 
									defaultValue="claraelenita130@gmail.com"
									className="bg-gray-600 rounded w-full px-4 py-3 text-base text-white py-1.5 border-solid border-[1px] border-gray-400"
									inputMode="email"
									autoCapitalize="none"
									onChangeText={onChange}
									{...field}
								/>
							)}
							name="email"
						/>
						{errors.email && (
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
								{errors.email?.message}
							</Text>
						)}
					</View>
					<View>
						<View className="flex-row items-center mb-3 gap-1">
							<MaterialCommunityIcons
								name="phone-outline"
								size={20}
								color="#64A4EB"
							/>
							<Text className="text-[white] text-base font-medium">E-mail</Text>
						</View>
						<Controller
							control={control}
							render={({ field: { onChange, value, ...field } }) => (
								<TextInput
									placeholder="(99) 9 9999-9999"
                  					placeholderTextColor="#AAAAAA" 
									defaultValue="(11) 9 4241-7655"
									className="bg-gray-600 rounded w-full px-4 py-3 text-base text-white py-1.5 border-solid border-[1px] border-gray-400"
									inputMode="tel"
									value={phone.mask(value)}
									onChangeText={(value) => {
										value = phone.unmask(value);
										onChange(value);
									}}
									{...field}
								/>
							)}
							name="phone"
						/>
						{errors.phone && (
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
								{errors.phone?.message}
							</Text>
						)}
					</View>
					<View className="bg-secondary bg-opacity-50 rounded mt-10">
						<Pressable
							onPress={() => setChangingPassword(true)}
							className="h-14 px-12 w-full items-center justify-center flex-row space-x-1"
							disabled={changingPassword}
						>
							<MaterialCommunityIcons
								name="form-textbox-password"
								size={16}
								color="white"
							/>
							<Text className="text-white font-medium">{" "}Alterar senha</Text>
						</Pressable>
						{changingPassword && (
							<View className="gap-y-4">
								<View>
									<Text className="text-white font-medium mb-1">
										Senha atual
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
													secureTextEntry={!passwordVisible.current}
													onChangeText={onChange}
													{...field}
												/>
											)}
											name="currentPassword"
										/>
										<TouchableOpacity
											className="absolute right-2 top-1/4"
											onPress={() =>
												setPasswordVisible((prev) => ({
													...prev,
													current: !prev.current,
												}))
											}
										>
											<MaterialCommunityIcons
												name={
													passwordVisible.current
														? "eye-off-outline"
														: "eye-outline"
												}
												size={20}
												color="gray"
											/>
										</TouchableOpacity>
									</View>
									{errors.currentPassword && (
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
											{errors.currentPassword?.message}
										</Text>
									)}
								</View>
								<View>
									<Text className="text-white font-medium mb-1">
										Nova senha
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
												name={
													passwordVisible.new
														? "eye-off-outline"
														: "eye-outline"
												}
												size={20}
												color="gray"
											/>
										</TouchableOpacity>
									</View>
									{errors.newPassword && (
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
											{errors.newPassword?.message}
										</Text>
									)}
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
													passwordVisible.confirm
														? "eye-off-outline"
														: "eye-outline"
												}
												size={20}
												color="gray"
											/>
										</TouchableOpacity>
									</View>
									{errors.passwordConfirmation && (
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
											{errors.passwordConfirmation?.message}
										</Text>
									)}
								</View>
							</View>
						)}
					</View>
					<TouchableOpacity
						className="bg-main rounded h-14 items-center justify-center w-full px-12"
						onPress={handleSubmit(onSubmit)}
					>
						<View className="flex-row">
							<MaterialCommunityIcons
								name="form-textbox-password"
								size={16}
								color="white"
							/>
							<Text className="text-white font-semibold text-base">{" "}Salvar</Text>
						</View>
					</TouchableOpacity>
				</KeyboardAvoidingView>
			</ScrollView>
		</View>
	);

	async function onSubmit({
		newPassword,
		currentPassword,
		phone,
		email,
		name,
	}: ProfileForm) {
		try {
			await api.patch(`/user/${currentUser?.id}`, {
				newPassword,
				email,
				name,
				phone,
				currentPassword,
			});

			await updateMe({ authToken: currentUser!.authToken });

			Toast.show("Perfil atualizado com sucesso!", {
				backgroundColor: "green",
				opacity: 0.9,
				position: Toast.positions.TOP,
			});

			setChangingPassword(false);
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
