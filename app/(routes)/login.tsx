import { MaterialCommunityIcons } from "@expo/vector-icons";
import EmailIcon from '@/assets/icons/email.svg';
import PasswordIcon from '@/assets/icons/password.svg';
import SeeIcon from "@/assets/icons/see.svg";
import { Link, Redirect } from "expo-router";
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
import { APIError } from "@/lib/api";
import Toast from "react-native-root-toast";
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
  } = useForm<LoginForm>({
    resolver: yupResolver(loginFormSchema),
  });

  const [passwordVisible, setPasswordVisible] = useState(false);

  const { login, isAuthenticated, isLoggingIn } = useAuthentication();

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
      <KeyboardAvoidingView
        className="justify-center w-full pt-8 px-5 h-full"
        behavior="padding"
      >
        <View className="px-4 gap-y-4">
          <Image 
            className="mb-16 w-60 h-20 self-center"
            source={require("@/assets/images/logo.png")} />
          <View>
            <View className="flex-row items-center mb-3 gap-2">
              <EmailIcon width={20} height={20} />
              <Text className="text-[white] text-base font-medium">E-mail</Text>
            </View>
            <Controller
              control={control}
              render={({ field: { onChange, ...field } }) => (
                <TextInput
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#AAAAAA" 
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
            <View className="flex-row items-center mb-3 gap-2">
              <PasswordIcon width={20} height={20} />
              <Text className="text-white text-base font-medium">Senha</Text>
            </View>
            <View className="relative">
              <Controller
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <TextInput
                    placeholder="••••••••••••"
                    placeholderTextColor="#AAAAAA" 
                    className="bg-gray-600 rounded w-full px-4 py-3 text-base text-white py-1.5 border-solid border-[1px] border-gray-400"
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
                passwordVisible ? <SeeIcon width={20} height={20} /> :
                <MaterialCommunityIcons
                  name={"eye-off-outline"}
                  size={20}
                  color="gray"
                />
                }
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
                {errors.password?.message}
              </Text>
            )}
            <Link href="/" asChild>
              <Text className="text-[#64A4EB] mt-3 font-medium text-right">
                Esqueceu a senha?
              </Text>
            </Link>
          </View>            
          <TouchableOpacity
            className="bg-main rounded h-14 items-center justify-center w-full px-12"
            onPress={handleSubmit(onSubmit)}
          >
            {isLoggingIn ? (
              <MaterialCommunityIcons
                name="loading"
                size={16}
                color={tailwindColors.white}
                className="animate-spin"
              />
            ) : (
              <Text className="text-white font-semibold text-base animate-none">
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
