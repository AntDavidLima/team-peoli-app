import { MaterialCommunityIcons } from "@expo/vector-icons";
import PasswordIcon from "@/assets/icons/password.svg";
import PasswordIcon2 from "@/assets/icons/password2.svg";
import EmailIcon from "@/assets/icons/email.svg";
import PhoneIcon from "@/assets/icons/phone.svg";
import SaveIcon from "@/assets/icons/save.svg";
import SeeIcon from "@/assets/icons/see.svg";
import CameraIcon from "@/assets/icons/camera.svg";
import {
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Image,
    Platform,
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
import EditIcon from "@/assets/icons/edit.svg";
import * as ImagePicker from "expo-image-picker";

interface ReactNativeFile {
  uri: string;
  name: string;
  type: string;
}

const profileFormSchema = yup
	.object({
		name: yup.string().min(3, "").required("Campo obrigatório"),
		email: yup.string().email("E-mail inválido").required("Campo obrigatório"),
		currentPassword: yup.string(),
		newPassword: yup.string().min(8, "Mínimo de 8 caracteres"),
		passwordConfirmation: yup.string().min(8, "Mínimo de 8 caracteres"),
		phone: yup
			.string()
			.matches(/^\d{11}$/, "Telefone inválido")
			.length(11, "O telefone deve possuir 11 dígitos")
			.required("Campo obrigatório"),
		profilePhotoUrl: yup.string().nullable(),
	})
	.test({
		name: "passwordRequired",
		test(value, ctx) {
			const { newPassword, currentPassword } = value;
			if (newPassword && !currentPassword) {
				return ctx.createError({ message: "Informe sua senha atual para poder alterá-la", path: "currentPassword" });
			}
			return true;
		},
	})
	.test({
		name: "passwordMatch",
		test(value, ctx) {
			const { newPassword, passwordConfirmation } = value;
			if (newPassword !== passwordConfirmation) {
				return ctx.createError({ message: "As senhas não coincidem", path: "passwordConfirmation" });
			}
			return true;
		},
	});

type ProfileForm = yup.InferType<typeof profileFormSchema>;

const createReactNativeFile = (asset: ImagePicker.ImagePickerAsset): ReactNativeFile => {
  const fileName = asset.fileName || `profile_${Date.now()}`;
  const mimeType = asset.mimeType || 'image/jpeg';
  return { uri: asset.uri, name: fileName, type: mimeType };
};

export default function Profile() {
	const { currentUser, updateMe } = useAuthentication();

	const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [changingPassword, setChangingPassword] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState({ current: false, new: false, confirm: false });

	const {
		control,
		formState: { errors },
		handleSubmit,
	} = useForm<ProfileForm>({
		resolver: yupResolver(profileFormSchema),
		defaultValues: {
			email: currentUser?.email,
			phone: currentUser?.phone ? phone.mask(currentUser.phone) : "",
			name: currentUser?.name,
			profilePhotoUrl: currentUser?.profilePhotoUrl ?? undefined,
		},
	});

	const pickImage = async () => {
		try{
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			if (permissionResult.granted === false) {
				Toast.show("É necessário permitir o acesso à galeria para escolher uma foto.", { backgroundColor: "orange", position: Toast.positions.TOP });
				return;
			}
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1.0,
			});
			if (!result.canceled && result.assets && result.assets.length > 0) {
				setSelectedImage(result.assets[0]);
			}
		} catch (error) {
			console.error("Erro ao escolher imagem:", error);
		}
	};

	useEffect(() => {
		return () => setChangingPassword(false);
	}, []);

	const appendProfilePhotoToFormData = async (formData: FormData, imageAsset: ImagePicker.ImagePickerAsset) => {
		if (Platform.OS === 'web') {
			const response = await fetch(imageAsset.uri);
			const blob = await response.blob();
			const fileName = imageAsset.fileName || `profile_${Date.now()}`;
			formData.append('profilePhoto', blob, fileName);
		} else {
			const file = createReactNativeFile(imageAsset);
			formData.append("profilePhoto", file as unknown as Blob);
		}
	};

	async function onSubmit({ newPassword, currentPassword, phone, email, name }: ProfileForm) {
		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("email", email);
			formData.append("phone", phone);

			if(newPassword) formData.append("newPassword", newPassword);
			if(currentPassword) formData.append("currentPassword", currentPassword);
			
			if (selectedImage) {
				await appendProfilePhotoToFormData(formData, selectedImage);
			}

			await api.patch(`/user/${currentUser?.id}`, formData,  {
				headers: {
					'Content-Type': 'multipart/form-data',
				}
			});
            
			await updateMe({ authToken: currentUser!.authToken, forceImageRefresh: !!selectedImage });
			
			Toast.show("Perfil atualizado com sucesso!", { backgroundColor: "green", opacity: 0.9, position: Toast.positions.TOP });
			setChangingPassword(false);

		} catch (error) {
			if (error instanceof AxiosError) {
				const apiError = error.response?.data as APIError;
				if (typeof apiError.error === "string") {
					Toast.show(apiError.message, { backgroundColor: "red", opacity: 0.9, position: Toast.positions.TOP });
				}
			}
		}
	}

	return (
		<View className="bg-background relative px-4 flex-1">
			<View className="items-center h-36 relative -mt-10">
				<Pressable onPress={pickImage} className="absolute -bottom-16 items-center">
					<View className="w-32 h-32 rounded-full bg-white items-center justify-center overflow-hidden">
						{selectedImage ? (
							<Image className="w-full h-full" source={selectedImage} />
						) : currentUser?.profilePhotoUrl ? (
							<Image className="w-full h-full" source={{uri: currentUser.profilePhotoUrl}} />
						) : (
							<CameraIcon width={40} height={40} />
						)}
					</View>
					<View className="absolute top-[55%] left-[65%]">
						<EditIcon width={30} height={30} />
					</View>
					<Text style={{fontFamily: 'Inter-Bold'}} className="text-white text-center mt-2 text-xl font-bold">
						{currentUser?.name}
					</Text>
				</Pressable>
			</View>
			<ScrollView className="mt-28 h-[calc(100vh - 96px)]">
				<KeyboardAvoidingView className="px-4 gap-y-4">
					<View>
						<View className="flex-row items-center mb-2 gap-1.5">
							<EmailIcon width={18} height={18} />
							<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">E-mail</Text>
						</View>
						<Controller
							control={control}
							render={({ field: { onChange, ...field } }) => (
								<TextInput
									placeholder="seuemail@exemplo.com"
                  					placeholderTextColor="#AAAAAA" 
									className="bg-gray-600 rounded w-full px-3 py-2.5 text-sm text-white border-solid border-[1px] border-gray-400"
									inputMode="email"
									autoCapitalize="none"
									onChangeText={onChange}
									{...field}
								/>
							)}
							name="email"
						/>
						{errors.email && (
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
								{errors.email?.message}
							</Text>
						)}
					</View>
					<View>
						<View className="flex-row items-center mb-2 gap-1.5">
							<PhoneIcon width={18} height={18} />
							<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">Telefone</Text>
						</View>
						<Controller
							control={control}
							render={({ field: { onChange, value, ...field } }) => (
								<TextInput
									placeholder="(99) 9 9999-9999"
                  					placeholderTextColor="#AAAAAA" 
									className="bg-gray-600 rounded w-full px-3 py-2.5 text-sm text-white border-solid border-[1px] border-gray-400"
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
							<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
								{errors.phone?.message}
							</Text>
						)}
					</View>
					<View className={changingPassword ? `bg-opacity-0` :  `bg-secondary/40` + " rounded mt-8"}>
						<Pressable
							onPress={() => setChangingPassword(true)}
							className="h-12 px-10 w-full items-center justify-center flex-row space-x-1"
							disabled={changingPassword}
						>
							<PasswordIcon2 width={18} height={18}/>
							<Text style={{fontFamily: 'Inter-SemiBold'}} className="text-white font-semibold text-sm">{"   "}Alterar senha</Text>
						</Pressable>
						{changingPassword && (
							<View className="gap-y-3">
								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text  style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">
											Senha atual
										</Text>
									</View>
									<View className="relative">
										<Controller
											control={control}
											render={({ field: { onChange, ...field } }) => (
												<TextInput
													placeholder="••••••••••••"
													placeholderTextColor={customColors.disabled}
													className="bg-gray-600 rounded w-full px-3 py-2.5 text-sm text-white border-solid border-[1px] border-gray-400"
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
											className="absolute right-2 top-1/4 mr-2"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, current: !prev.current }))}
										>
											{passwordVisible.current ? <MaterialCommunityIcons name={"eye-off-outline"} size={18} color="gray" /> : <SeeIcon width={18} height={18} />}
										</TouchableOpacity>
									</View>
									{errors.currentPassword && <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">{errors.currentPassword?.message}</Text>}
								</View>
								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">Nova senha</Text>
									</View>
									<View className="relative">
										<Controller
											control={control}
											render={({ field: { onChange, ...field } }) => (
												<TextInput
													placeholder="••••••••••••"
													placeholderTextColor={customColors.disabled}
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
											className="absolute right-2 top-1/4 mr-2"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, new: !prev.new }))}
										>
											{passwordVisible.new ? <MaterialCommunityIcons name={"eye-off-outline"} size={18} color="gray" /> : <SeeIcon width={18} height={18} />}
										</TouchableOpacity>
									</View>
									{errors.newPassword && <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">{errors.newPassword?.message}</Text>}
								</View>
								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text style={{fontFamily: 'Inter-Medium'}} className="text-white font-medium text-sm">Confirme a nova senha</Text>
									</View>
									<View className="relative">
										<Controller
											control={control}
											render={({ field: { onChange, ...field } }) => (
												<TextInput
													placeholder="••••••••••••"
													placeholderTextColor={customColors.disabled}
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
											className="absolute right-2 top-1/4 mr-2"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
										>
											{passwordVisible.confirm ? <MaterialCommunityIcons name={"eye-off-outline"} size={18} color="gray" /> : <SeeIcon width={18} height={18} />}
										</TouchableOpacity>
									</View>
									{errors.passwordConfirmation && <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">{errors.passwordConfirmation?.message}</Text>}
								</View>
							</View>
						)}
					</View>
					<TouchableOpacity
						className="bg-main rounded h-12 items-center justify-center w-full px-10"
						onPress={handleSubmit(onSubmit)}
					>
						<View className="flex-row items-center">
							<SaveIcon width={18} height={18}/>
							<Text style={{fontFamily: 'Inter-SemiBold'}} className="text-white text-sm font-semibold">{"   "}Salvar</Text>
						</View>
					</TouchableOpacity>
				</KeyboardAvoidingView>
			</ScrollView>
		</View>
	);
}