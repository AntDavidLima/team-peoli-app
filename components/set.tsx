import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import {
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as yup from "yup";
import tailwindColors from "tailwindcss/colors";
import customColors from "@/tailwind.colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { Modal } from "react-native";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryPie,
} from "victory-native";

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

  const [isResting, setIsResting] = useState(false);
  const [timeInRest, setTimeInRest] = useState(0);
  const [clock, setClock] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isResting) {
      if (!clock) {
        setClock(
          setInterval(() => {
            setTimeInRest((time) => time + 1);
          }, 1000)
        );
      }
    }

    return () => {
      if (clock) {
        clearInterval(clock);
        setTimeInRest(0);
      }
    };
  }, [isResting]);

  useEffect(() => {
    if (restTime - timeInRest <= 0) {
      setIsResting(false);
    }
  }, [timeInRest]);

  const queryClient = useQueryClient();

  const { mutate: onSubmit, isPending: submitting } = useMutation({
    mutationFn: updateWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout", ...trainingIds] });
    },
    onMutate: () => {
      setIsResting(true);
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

  const { width } = useWindowDimensions();

  return (
    <Fragment>
      <Text className="text-white w-[15%] text-center font-extrabold">
        {index}
      </Text>
      <Text className="text-white w-1/4 text-center">{lastExecution}</Text>
      <Controller
        control={control}
        name="load"
        render={({ field: { onChange, value, ...field } }) => (
          <View className="w-[20%] px-1 items-center">
            <TextInput
              className={`text-center p-4 ${
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
              value={value?.toString()}
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
          <View className="w-[25%] px-1 items-center">
            <TextInput
              className={`text-center p-4 ${
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
              value={value?.toString()}
              selectTextOnFocus={trainingStarted}
              editable={trainingStarted}
              {...field}
            />
          </View>
        )}
      />
      <View className="w-[15%] items-center">
        <Pressable
          className={`w-10 h-10 rounded-lg items-center justify-center ${
            getValues("done") ? "bg-green-500" : "bg-subtitle"
          }`}
          disabled={!trainingStarted || watch("done")}
          onPress={handleSubmit((data) => onSubmit(data))}
        >
          <MaterialCommunityIcons
            name="check"
            size={16}
            color={watch("done") ? tailwindColors.white : customColors.disabled}
          />
        </Pressable>
      </View>
      <Modal visible={isResting} transparent animationType="slide">
        <View className="w-full h-full bg-background/10">
          <View className="relative bg-card w-3/4 m-auto h-96 rounded flex items-center">
            <Text className="mt-4 text-white text-xl font-semibold">
              Descanso
            </Text>
            <VictoryChart width={width - 100} height={width - 100}>
              <VictoryPie
                style={{
                  labels: { display: "none" },
                  data: {
                    fill: ({ datum }) => datum.color,
                  },
                }}
                innerRadius={72}
                data={[
                  { x: "elapsed", y: timeInRest, color: customColors.main },
                  {
                    x: "left",
                    y: restTime - timeInRest,
                    color: customColors.darker,
                  },
                ]}
              />
              <VictoryLabel
                text={restTime + "s"}
                textAnchor="middle"
                x={width * 0.375}
                y={width * 0.500}
                style={{ fontSize: 16, fill: tailwindColors.white }}
              />
              <MaterialCommunityIcons
                name="timer-sand"
                size={20}
                color={tailwindColors.white}
                style={{
                  position: "absolute",
                  left: (width * 0.375) - 10,
                  top: width * 0.25 - 10,
                }}
              />
              <VictoryLabel
                text={restTime - timeInRest}
                textAnchor="middle"
                x={width * 0.375}
                y={width * 0.375}
                style={{ fontSize: 64, fill: tailwindColors.white }}
              />
              <VictoryAxis
                tickFormat={() => ""}
                style={{ axis: { display: "none" } }}
              />
            </VictoryChart>
            <Pressable
              className={`absolute top-2 right-2 ${
                submitting && "animate-spin"
              }`}
              disabled={submitting}
              onPress={() => setIsResting(false)}
            >
              {submitting ? (
                <MaterialCommunityIcons
                  name="loading"
                  size={24}
                  color={tailwindColors.gray[400]}
                />
              ) : (
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={tailwindColors.white}
                />
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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
