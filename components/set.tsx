import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import * as yup from "yup";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import Toast from "react-native-root-toast";

interface Set {
  index: number;
  trainingStarted: boolean;
  workoutId: number | undefined;
  exerciseId: number | undefined;
  load: number | undefined;
  reps: number | undefined;
  id: number | undefined;
  trainingIds: number[];
  lastExecution: string;
  recomendedReps: string;
  restTime: number;
  onStartRest: (duration: number) => void;
}

const setFormSchema = yup.object({
  load: yup.number().required("Informe a carga"),
  reps: yup.number().required("Informe as repetições"),
  id: yup.number().optional(),
  done: yup.boolean().required(),
});

type SetForm = yup.InferType<typeof setFormSchema>;

export function Set({
  index,
  trainingStarted,
  workoutId,
  exerciseId,
  load,
  reps,
  id,
  trainingIds,
  lastExecution,
  recomendedReps,
  restTime,
  onStartRest,
}: Set) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    getValues,
    watch,
    setValue,
    reset,
  } = useForm<SetForm>({
    resolver: yupResolver(setFormSchema),
    defaultValues: {
      reps,
      load,
      id,
      done: Boolean(id),
    },
  });

  const queryClient = useQueryClient();

  const { mutate: onSubmit, isPending: submitting } = useMutation({
    mutationFn: updateWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", ...trainingIds] });
      onStartRest(restTime);
    },
    onError: () => {
      Toast.show('Não foi possível concluir a série, tente novamente.', {
        backgroundColor: "red",
        opacity: 0.9,
        position: Toast.positions.TOP,
      });
    },
  });

  useEffect(() => {
    if (id === undefined) {
      reset();
    } else {
      setValue("id", id);
      setValue("load", load!);
      setValue("reps", reps!);
      setValue("done", true);
    }
  }, [id, load, reps]);

  return (
    <Fragment>
      <Text style={{fontFamily: 'Inter-Bold'}} className="text-white w-[15%] text-center font-bold text-sm">
        {index}
      </Text>
      <Text style={{fontFamily: 'Inter-Medium'}} className="text-gray-400 w-1/4 text-center font-medium text-sm">{lastExecution}</Text>
      <Controller
        control={control}
        name="load"
        render={({ field: { onChange, value, ...field } }) => (
          <View className="px-1 items-center w-1/4">
            <TextInput
              style={{fontFamily: 'Inter-Regular'}} 
              className={`text-center w-16 border-2 border-gray-400 rounded-lg border-solid py-3 text-sm ${
                errors.reps ? "text-red-500" : "text-white"
              }`}
              keyboardType="numeric"
              placeholderTextColor={
                errors.load ? tailwindColors.rose[500] : customColors.disabled
              }
              placeholder="KG"
              onChangeText={(event) => {
                setValue("done", false);
                onChange(event);
              }}
              value={value?.toString() || ""}
              selectTextOnFocus={trainingStarted}
              editable={trainingStarted}
              {...field}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="reps"
        render={({ field: { onChange, value, ...field } }) => (
          <View className="px-1 items-center w-1/5">
            <TextInput
              style={{fontFamily: 'Inter-Regular'}} 
              className={`text-center w-16 border-2 border-gray-400 rounded-lg border-solid py-3 text-sm ${
                errors.reps ? "text-red-500" : "text-white"
              }`}
              placeholder={recomendedReps}
              placeholderTextColor={
                errors.reps ? tailwindColors.rose[500] : customColors.disabled
              }
              keyboardType="numeric"
              onChangeText={(event) => {
                setValue("done", false);
                onChange(event);
              }}
              value={value?.toString() || ""}
              selectTextOnFocus={trainingStarted}
              editable={trainingStarted}
              {...field}
            />
          </View>
        )}
      />
      <View className="w-[20%] items-center">
        <Pressable
          style={{marginRight: 5}}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            getValues("done") ? "bg-green-500" : "bg-subtitle"
          }`}
          disabled={!trainingStarted || watch("done")}
          onPress={handleSubmit((data) => onSubmit(data))}
        >
          <MaterialCommunityIcons
            name="check"
            size={30}
            color={watch("done") ? tailwindColors.white : customColors.disabled}
          />
        </Pressable>
      </View>
    </Fragment>
  );

  async function updateWorkout({ reps, load }: SetForm) {
    const { data } = await api.put(`/workout/${workoutId}`, {
      exerciseId,
      reps,
      load,
      setId: id,
    });

    return data;
  }
}