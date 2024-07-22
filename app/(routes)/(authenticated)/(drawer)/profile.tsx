import tailwindColors from "tailwindcss/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ImageBackground,
  Pressable,
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

const profileFormSchema = yup.object({
  name: yup.string().min(3, "").required("Campo obrigatório"),
  email: yup.string().email("E-mail inválido").required("Campo obrigatório"),
  currentPassword: yup.string().min(8, "Mínimo de 8 caracteres"),
  newPassword: yup.string().min(8, "Mínimo de 8 caracteres"),
  passwordConfirmation: yup.string().min(8, "Mínimo de 8 caracteres"),
  phone: yup
    .string()
    .matches(/^\d{11}$/, { message: "Telefone inválido" })
    .length(11, { message: "O telefone deve possuir 11 dígitos" })
    .required("Campo obrigatório"),
});

type ProfileForm = yup.InferType<typeof profileFormSchema>;

export default function Profile() {
  const { currentUser } = useAuthentication();

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
  });

  useEffect(() => {
    return () => {
      setChangingPassword(false);
    };
  }, []);

  return (
    <View>
      <ImageBackground
        className="bg-main items-center h-40 relative -mt-20"
        source={require("@/assets/images/login-background.jpg")}
        blurRadius={16}
      >
        <View className="absolute -bottom-20">
          <View className="w-24 aspect-square rounded-full bg-disabled items-center justify-center">
            <MaterialCommunityIcons
              name="camera-plus-outline"
              size={32}
              color={tailwindColors.white}
            />
          </View>
          <Text className="text-white text-base font-semibold mt-2">
            {currentUser?.name}
          </Text>
        </View>
      </ImageBackground>
      <View className="pt-24 px-4 space-y-6">
        <View>
          <View className="flex-row items-center mb-1 gap-1">
            <MaterialCommunityIcons
              name="email-outline"
              size={16}
              color="white"
            />
            <Text className="text-white font-medium">E-mail</Text>
          </View>
          <Controller
            control={control}
            render={({ field: { onChange, ...field } }) => (
              <TextInput
                placeholder="seuemail@exemplo.com"
                defaultValue="claraelenita130@gmail.com"
                className="text-base border-b border-b-main text-white"
                placeholderTextColor={customColors.subtitle}
                inputMode="email"
                autoCapitalize="none"
                onChangeText={onChange}
                {...field}
              />
            )}
            name="email"
          />
        </View>
        <View>
          <View className="flex-row items-center mb-1 gap-1">
            <MaterialCommunityIcons
              name="phone-outline"
              size={16}
              color="white"
            />
            <Text className="text-white font-medium">Telefone</Text>
          </View>
          <Controller
            control={control}
            render={({ field: { onChange, ...field } }) => (
              <TextInput
                placeholder="(99) 9 9999-9999"
                defaultValue="(11) 9 4241-7655"
                className="text-base border-b border-b-main text-white"
                placeholderTextColor={customColors.subtitle}
                inputMode="tel"
                onChangeText={onChange}
                {...field}
              />
            )}
            name="phone"
          />
        </View>
        <View className="bg-card p-2 rounded">
          <Pressable
            onPress={() => setChangingPassword(true)}
            className="w-full items-center justify-center flex-row space-x-1"
            disabled={changingPassword}
          >
            <MaterialCommunityIcons
              name="form-textbox-password"
              size={16}
              color="white"
            />
            <Text className="text-white font-medium">Alterar senha</Text>
          </Pressable>
          {changingPassword && (
            <View className="space-y-4">
              <View>
                <Text className="text-white font-medium mb-1">Senha atual</Text>
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
              </View>
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
                      name={
                        passwordVisible.new ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color="gray"
                    />
                  </TouchableOpacity>
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
                        passwordVisible.confirm
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={20}
                      color="gray"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
