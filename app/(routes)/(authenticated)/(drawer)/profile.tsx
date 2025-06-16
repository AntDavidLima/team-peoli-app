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
import { useEffect, useState, useRef } from "react";
import { phone } from "@/lib/masks";
import { APIError, api } from "@/lib/api";
import { AxiosError } from "axios";
import Toast from "react-native-root-toast";
import EditIcon from "@/assets/icons/edit.svg";
import * as ImagePicker from "expo-image-picker";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview } from '@/lib/canvasPreview';

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

function centerAspectCrop(
	mediaWidth: number,
	mediaHeight: number,
	aspect: number,
	percentage = 80
) {
	return centerCrop(
		makeAspectCrop(
			{
				unit: '%',
				width: percentage,
			},
			aspect,
			mediaWidth,
			mediaHeight
		),
		mediaWidth,
		mediaHeight
	);
}

export default function Profile() {
	const { currentUser, updateMe } = useAuthentication();

	const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
	const [changingPassword, setChangingPassword] = useState(false);
	const [passwordVisible, setPasswordVisible] = useState({ current: false, new: false, confirm: false });

	const [crop, setCrop] = useState<Crop>();
	const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
	const [showCropModal, setShowCropModal] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);
	const previewCanvasRef = useRef<HTMLCanvasElement>(null);

	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
	} = useForm<ProfileForm>({
		resolver: yupResolver(profileFormSchema),
	});
	useEffect(() => {
		if (currentUser) {
			reset({
				email: currentUser.email,
				phone: currentUser.phone ?? "",
				name: currentUser.name,
				profilePhotoUrl: currentUser.profilePhotoUrl ?? undefined,
			});
		}
	}, [currentUser, reset]);

	const pickImage = async () => {
		try {
			if (Platform.OS === 'web') {
				const input = document.createElement('input');
				input.type = 'file';
				input.accept = 'image/*';
				input.onchange = async (e) => {
					const file = (e.target as HTMLInputElement).files?.[0];
					if (file) {
						const reader = new FileReader();
						reader.onload = () => {
							setSelectedImage({
								uri: reader.result as string,
								fileName: file.name,
								mimeType: file.type,
								width: 0,
								height: 0,
								type: 'image',
								base64: null,
								exif: null,
								duration: null,
								fileSize: file.size,
							});
							setShowCropModal(true);
						};
						reader.readAsDataURL(file);
					}
				};
				input.click();
			} else {
				const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (permissionResult.granted === false) {
					Toast.show("É necessário permitir o acesso à galeria para escolher uma foto.", {
						backgroundColor: "orange",
						position: Toast.positions.TOP,
						duration: Toast.durations.LONG,
					});
					return;
				}
				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					aspect: [1, 1],
					quality: 0.8,
				});
				if (!result.canceled && result.assets && result.assets.length > 0) {
					setSelectedImage(result.assets[0]);
				}
			}
		} catch (error) {
			console.error("Erro ao escolher imagem:", error);
			Toast.show("Ocorreu um erro ao escolher a imagem", {
				backgroundColor: "red",
				position: Toast.positions.TOP
			});
		}
	};

	const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
		const { width, height } = e.currentTarget;
		setCrop(centerAspectCrop(width, height, 1));
	};

	useEffect(() => {
		if (completedCrop?.width && completedCrop?.height && imgRef.current && previewCanvasRef.current) {
			canvasPreview(
				imgRef.current,
				previewCanvasRef.current,
				completedCrop,
				1,
				0
			);
		}
	}, [completedCrop]);

	const handleCropConfirm = () => {
		if (!previewCanvasRef.current || !selectedImage) return;

		previewCanvasRef.current.toBlob((blob) => {
			if (blob) {
				const croppedUrl = URL.createObjectURL(blob);
				setSelectedImage({
					uri: croppedUrl,
					fileName: `cropped_${Date.now()}.jpg`,
					mimeType: 'image/jpeg',
					width: completedCrop?.width || 0,
					height: completedCrop?.height || 0,
					type: 'image',
					base64: null,
					exif: null,
					duration: null,
					fileSize: blob.size,
				});
			}
			setShowCropModal(false);
		}, 'image/jpeg', 0.9);
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

			if (newPassword) formData.append("newPassword", newPassword);
			if (currentPassword) formData.append("currentPassword", currentPassword);

			if (selectedImage) {
				await appendProfilePhotoToFormData(formData, selectedImage);
			}

			await api.patch(`/user/${currentUser?.id}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				}
			});

			await updateMe({ authToken: currentUser!.authToken, forceImageRefresh: !!selectedImage });

			Toast.show("Perfil atualizado com sucesso!", {
				backgroundColor: "green",
				opacity: 0.9,
				position: Toast.positions.TOP,
				duration: Toast.durations.LONG,
			});
			setChangingPassword(false);

		} catch (error) {
			if (error instanceof AxiosError) {
				const apiError = error.response?.data as APIError;
				if (typeof apiError.error === "string") {
					Toast.show(apiError.message, {
						backgroundColor: "red",
						opacity: 0.9,
						position: Toast.positions.TOP,
						duration: Toast.durations.LONG,
					});
				}
			} else {
				Toast.show("Erro ao atualizar perfil", {
					backgroundColor: "red",
					position: Toast.positions.TOP
				});
			}
		}
	}

	return (
		<View className="bg-background relative px-4 flex-1">
			{showCropModal && Platform.OS === 'web' && selectedImage && (
				<View style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0,0,0,0.7)',
					zIndex: 50,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}>
					<View className="bg-background p-4">
						<Text className="text-lg text-white mb-2 text-center">
							Selecione uma área
						</Text>

						<ReactCrop
							crop={crop}
							onChange={(c) => setCrop(c)}
							onComplete={(c) => setCompletedCrop(c)}
							aspect={1}
							circularCrop
						>
							<img
								ref={imgRef}
								src={selectedImage.uri}
								onLoad={onImageLoad}
								style={{ maxHeight: '60vh' }}
							/>
						</ReactCrop>

						<canvas
							ref={previewCanvasRef}
							style={{ display: 'none' }}
						/>

						<View className="flex-row justify-between mt-4">
							<TouchableOpacity
								className="px-4 py-2 bg-white rounded-lg"
								onPress={() => setShowCropModal(false)}
							>
								<Text style={{ fontFamily: 'Inter-Regular' }}>Cancelar</Text>
							</TouchableOpacity>

							<TouchableOpacity
								className="px-4 py-2 bg-main rounded-lg"
								onPress={handleCropConfirm}
							>
								<Text style={{ color: 'white', fontFamily: 'Inter-Regular' }}>Confirmar</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			)}

			<View className="items-center h-36 relative -mt-10">
				<Pressable onPress={pickImage} className="absolute -bottom-16 items-center">
					<View className="w-32 h-32 rounded-full bg-white items-center justify-center overflow-hidden border-2 border-main">
						{selectedImage ? (
							<Image
								className="w-full h-full"
								source={{ uri: selectedImage.uri }}
								resizeMode="cover"
							/>
						) : currentUser?.profilePhotoUrl ? (
							<Image
								className="w-full h-full"
								source={{ uri: currentUser.profilePhotoUrl }}
								resizeMode="cover"
							/>
						) : (
							<CameraIcon width={40} height={40} fill="#888" />
						)}
					</View>
					<View className="absolute top-[55%] left-[65%] rounded-full p-1">
						<EditIcon width={24} height={24} />
					</View>
					<Text style={{ fontFamily: 'Inter-Bold' }} className="text-white text-center mt-2 text-xl font-bold">
						{currentUser?.name}
					</Text>
				</Pressable>
			</View>

			<ScrollView className="mt-28" contentContainerStyle={{ paddingBottom: 30 }}>
				<KeyboardAvoidingView
					className="px-4 gap-y-4"
					behavior={Platform.OS === "ios" ? "padding" : "height"}
				>
					<View>
						<View className="flex-row items-center mb-2 gap-1.5">
							<EmailIcon width={18} height={18} />
							<Text style={{ fontFamily: 'Inter-Medium' }} className="text-white font-medium text-sm">E-mail</Text>
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
							<Text style={{ fontFamily: 'Inter-Medium' }} className="text-white font-medium text-sm">Telefone</Text>
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

					<View className={changingPassword ? "bg-opacity-0" : "bg-secondary/40 rounded mt-8"}>
						<Pressable
							onPress={() => setChangingPassword(true)}
							className="h-12 px-10 w-full items-center justify-center flex-row space-x-1"
							disabled={changingPassword}
						>
							<PasswordIcon2 width={18} height={18} />
							<Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-white font-semibold text-sm">{"   "}Alterar senha</Text>
						</Pressable>

						{changingPassword && (
							<View className="gap-y-3 mt-4">
								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text style={{ fontFamily: 'Inter-Medium' }} className="text-white font-medium text-sm">
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
											className="absolute right-3 top-3"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, current: !prev.current }))}
										>
											{passwordVisible.current ?
												<MaterialCommunityIcons name={"eye-off-outline"} size={20} color="#aaa" /> :
												<SeeIcon width={20} height={20} fill="#aaa" />
											}
										</TouchableOpacity>
									</View>
									{errors.currentPassword &&
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
											{errors.currentPassword?.message}
										</Text>
									}
								</View>

								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text style={{ fontFamily: 'Inter-Medium' }} className="text-white font-medium text-sm">Nova senha</Text>
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
											className="absolute right-3 top-3"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, new: !prev.new }))}
										>
											{passwordVisible.new ?
												<MaterialCommunityIcons name={"eye-off-outline"} size={20} color="#aaa" /> :
												<SeeIcon width={20} height={20} fill="#aaa" />
											}
										</TouchableOpacity>
									</View>
									{errors.newPassword &&
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
											{errors.newPassword?.message}
										</Text>
									}
								</View>

								<View>
									<View className="flex-row items-center mb-2 gap-1.5">
										<PasswordIcon width={18} height={18} fill="#64A4EB" />
										<Text style={{ fontFamily: 'Inter-Medium' }} className="text-white font-medium text-sm">Confirme a nova senha</Text>
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
											className="absolute right-3 top-3"
											onPress={() => setPasswordVisible((prev) => ({ ...prev, confirm: !prev.confirm }))}
										>
											{passwordVisible.confirm ?
												<MaterialCommunityIcons name={"eye-off-outline"} size={20} color="#aaa" /> :
												<SeeIcon width={20} height={20} fill="#aaa" />
											}
										</TouchableOpacity>
									</View>
									{errors.passwordConfirmation &&
										<Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
											{errors.passwordConfirmation?.message}
										</Text>
									}
								</View>
							</View>
						)}
					</View>

					<TouchableOpacity
						className="bg-main rounded h-12 items-center justify-center w-full"
						onPress={handleSubmit(onSubmit)}
					>
						<View className="flex-row items-center">
							<SaveIcon width={18} height={18} />
							<Text style={{ fontFamily: 'Inter-SemiBold' }} className="text-white text-sm font-semibold ml-2">
								Salvar Alterações
							</Text>
						</View>
					</TouchableOpacity>
				</KeyboardAvoidingView>
			</ScrollView>
		</View>
	);
}