import { MaterialCommunityIcons } from "@expo/vector-icons";
import EmailIcon from '@/assets/icons/email.svg';
import PasswordIcon from '@/assets/icons/password.svg';
import SeeIcon from "@/assets/icons/see.svg";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { AxiosError } from "axios";
import { APIError, api } from "@/lib/api";
import Toast from "react-native-toast-message";
import tailwindColors from "tailwindcss/colors";

const loginFormSchema = yup.object({
  email: yup.string().email("E-mail inválido").required("Campo obrigatório"),
  password: yup.string().required("Campo obrigatório"),
});

type LoginForm = yup.InferType<typeof loginFormSchema>;

export default function Login() {
  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm<LoginForm>({
    resolver: yupResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { login, isAuthenticated, isLoggingIn } = useAuthentication();

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  async function handlePasswordReset() {
    const email = getValues("email");

    if (!email) {
      Toast.show({
        type: 'info',
        text1: 'Por favor, digite seu e-mail no campo acima antes de solicitar uma nova senha.'
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      await api.post('/password-reset', { email });

      Toast.show({
        type: 'success',
        text1: 'E-mail enviado!',
        text2: 'Verifique sua caixa de entrada com a nova senha.'
      });

    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          Toast.show({
            type: 'error',
            text1: 'Usuário não encontrado',
            text2: 'Verifique o e-mail digitado e tente novamente.'
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erro ao redefinir a senha',
            text2: 'Ocorreu um problema. Tente novamente mais tarde.'
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Ocorreu um erro inesperado',
          text2: 'Por favor, tente novamente.'
        });
      }
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
      <KeyboardAvoidingView
        className="justify-center w-full pt-8 px-4 h-full"
        behavior="padding"
      >
        <View className="px-4 gap-y-3">
          <Image 
            style={{width: 150, height: 50}}
            className="mb-10 self-center"
            source={require("@/assets/images/logo.png")} />
          <View>
            <View className="flex-row items-center mb-2 gap-1.5">
              <EmailIcon width={18} height={18} />
              <Text className="text-white text-sm font-medium">E-mail</Text>
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
              <PasswordIcon width={18} height={18} />
              <Text className="text-white text-sm font-medium">Senha</Text>
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
                    secureTextEntry={!passwordVisible}
                    onChangeText={onChange}
                    {...field}
                  />
                )}
                name="password"
              />
              <TouchableOpacity
                className="absolute right-2 top-1/4 mr-2"
                onPress={() => setPasswordVisible((current) => !current)}
              >{
                passwordVisible ? <MaterialCommunityIcons
                  name={"eye-off-outline"}
                  size={18}
                  color="gray"
                /> :
                <SeeIcon width={18} height={18} />
                }
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-xs text-white">
                {errors.password?.message}
              </Text>
            )}
            <TouchableOpacity
              onPress={handlePasswordReset}
              disabled={isResettingPassword}
              className="items-end mt-2"
            >
              <View className="flex-row items-center">
                {isResettingPassword && (
                  <MaterialCommunityIcons
                    name="loading"
                    size={14}
                    color="#64A4EB"
                    className="animate-spin mr-1"
                  />
                )}
                <Text className="text-[#64A4EB] font-medium text-sm">
                  Esqueceu a senha?
                </Text>
              </View>
            </TouchableOpacity>
          </View>            
          <TouchableOpacity
            className="bg-main rounded h-12 items-center justify-center w-full px-10 mt-2"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <MaterialCommunityIcons
                name="loading"
                size={16}
                color={tailwindColors.white}
                className="animate-spin"
              />
            ) : (
              <Text className="text-white font-semibold text-sm animate-none">
                Acessar
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
  );

  async function onSubmit({ password, email }: LoginForm) {
    try {
      await login({ email, password });
    } catch (error) {
      if (error instanceof AxiosError) {
        const apiError = error.response?.data as APIError;

        console.log(error.message);

        if (apiError && typeof apiError.error === "string") {
          Toast.show({
            type: 'error',
            text1: apiError.message,
          })
        }
      }
    }
  }
}