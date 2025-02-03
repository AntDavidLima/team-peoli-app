import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  ImageBackground,
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
    <ImageBackground
      source={require("@/assets/images/login-background.jpg")}
      className="absolute left-0 right-0 h-screen"
      blurRadius={6}
    >
      <KeyboardAvoidingView
        className="items-center pt-8 px-5 h-full justify-around"
        behavior="padding"
      >
        <Image source={require("@/assets/images/logo.png")} />
        <View className="w-full gap-y-8">
          <View>
            <View className="flex-row items-center mb-1 gap-1">
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="white"
              />
              <Text className="text-white text-base font-medium">E-mail</Text>
            </View>
            <Controller
              control={control}
              render={({ field: { onChange, ...field } }) => (
                <TextInput
                  placeholder="seuemail@exemplo.com"
                  className="bg-white rounded w-full px-2 text-base py-1.5"
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
            <View className="flex-row items-center mb-1 gap-1">
              <MaterialCommunityIcons
                name="form-textbox-password"
                size={20}
                color="white"
              />
              <Text className="text-white text-base font-medium">Senha</Text>
            </View>
            <View className="relative">
              <Controller
                control={control}
                render={({ field: { onChange, ...field } }) => (
                  <TextInput
                    placeholder="••••••••••••"
                    className="bg-white rounded w-full px-2 text-base py-1.5"
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
                className="absolute right-2 top-1/4"
                onPress={() => setPasswordVisible((current) => !current)}
              >
                <MaterialCommunityIcons
                  name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="bg-red-700/50 brightness-100 mt-1 px-1 rounded text-sm text-white">
                {errors.password?.message}
              </Text>
            )}
            <Link href="/" asChild>
              <Text className="text-white mt-1 font-medium">
                Esqueceu sua senha?{" "}
                <Text className="underline text-main">Clique aqui</Text>
              </Text>
            </Link>
          </View>
        </View>
        <TouchableOpacity
          className="bg-main rounded h-10 items-center justify-center w-full"
          onPress={handleSubmit(onSubmit)}
        >
          {isLoggingIn ? (
            <MaterialCommunityIcons name="loading" size={16} color={tailwindColors.white} className="animate-spin" />
          ) : (
            <Text className="text-white font-semibold text-base animate-none">Acessar</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ImageBackground>
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
