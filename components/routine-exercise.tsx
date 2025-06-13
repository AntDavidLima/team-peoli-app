import tailwindColors from "tailwindcss/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RawDraftContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { Link } from "expo-router";
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Collapsible from "react-native-collapsible";
import { useState } from "react";
import RenderHTML from "react-native-render-html";
import customColors from "@/tailwind.colors";
import RestTimeIcon from "@/assets/icons/restTime.svg";
import Training2Icon from "@/assets/icons/training2.svg";

interface RoutineExercise {
  idExercise: number;
  trainingId: number;
  day: string;
  exerciseName: string;
  restTime: number;
  sets: number;
  reps: number;
  orientations: RawDraftContentState | null;
  thumbnailUrl: string | null;
}

export function RoutineExercise({
  day,
  exerciseName,
  idExercise,
  orientations,
  reps,
  restTime,
  sets,
  trainingId,
  thumbnailUrl,
}: RoutineExercise) {
  const { width } = useWindowDimensions();
  const [orientationCollapsed, setOrientationCollapsed] =
    useState<boolean>(true);

  return (
    <Link
      href={{
        pathname: "/(routes)/(authenticated)/exercise/[id]",
        params: { id: idExercise, trainingId, day },
      }}
      asChild
      key={idExercise}
    >
      <Pressable className="bg-lightBackground p-4 rounded-2xl justify-between">
        <View className="flex-row items-center">
          <View className="w-[70%] mr-4">
            <View>
              <Text style={{fontFamily: 'Inter-Bold'}} className="text-white font-bold mb-2 text-xl">
                {exerciseName}
              </Text>
              <View className="flex-row bg-gray-700 items-center gap-2 p-3 rounded-lg">
                <RestTimeIcon height={20} width={20}/>
                <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400">Descanso: {restTime}s</Text>
              </View>
            </View>
            <View className="mt-2 flex-row bg-gray-700 items-center gap-1 p-3 rounded-lg">
               <Training2Icon height={20} width={20}/>
              <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400">
                {sets} Séries
              </Text>
              <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400">de</Text>
              <Text style={{fontFamily: 'Inter-Regular'}} className="text-gray-400">
                {reps} Repetições
              </Text>
            </View>
          </View>
          <View className="w-[26%]">
            {thumbnailUrl && (
              <View className="rounded-lg aspect-[9/16]">
                <Image
                  source={{
                    uri: thumbnailUrl,
                  }}
                  className="h-full w-full rounded-lg"
                />
              </View>
            )}
          </View>
        </View>
        {orientations?.blocks[0].text.trim() !== "" && (
          <Pressable
            className="mt-4"
            onPress={() => setOrientationCollapsed((collapsed) => !collapsed)}
          >
            <View className="mt-3">
              <View className="flex-row gap-1 py-3 border-b-2 border-gray-700">
                <Text style={{fontFamily: 'Inter-Regular'}} className="text-secondary text-lg">Ver instruções</Text>
                <View className={orientationCollapsed ? "rotate-0" : "rotate-180"}>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    color={customColors.secondary}
                    size={20}
                  />
                </View>
              </View>
              <Collapsible collapsed={orientationCollapsed}>
                  <RenderHTML
                    source={{ html: draftToHtml(orientations!) }}
                    contentWidth={width}
                    baseStyle={{ color: tailwindColors.white }}
                  />
              </Collapsible>
            </View>
          </Pressable>
        )}
      </Pressable>
    </Link>
  );
}
