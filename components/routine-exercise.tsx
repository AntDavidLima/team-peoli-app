import tailwindColors from "tailwindcss/colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { RawDraftContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { Link } from "expo-router";
import { getThumbnailAsync } from "expo-video-thumbnails";
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";

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

  return (
    <Link
      href={{
        pathname: "/(routes)/(authenticated)/exercise/[id]",
        params: { id: idExercise, trainingId, day },
      }}
      asChild
      key={idExercise}
    >
      <Pressable className="bg-card p-2 rounded flex-row justify-between">
        <View className="flex-1">
          <View>
            <Text className="text-white font-semibold mb-1">
              {exerciseName}
              <View className="flex-row items-center gap-0.5 pl-1">
                <MaterialCommunityIcons
                  name="timer-outline"
                  color={tailwindColors.white}
                  size={14}
                />
                <Text className="text-white text-xs">{restTime}s</Text>
              </View>
            </Text>
          </View>
          <View className="flex-row gap-1">
            <Text className="text-white font-semibold text-xs">
              {sets} Séries
            </Text>
            <Text className="text-white font-semibold text-xs">de</Text>
            <Text className="text-white font-semibold text-xs">
              {reps} Repetições
            </Text>
          </View>
          {orientations?.blocks[0].text.trim() !== "" && (
            <View className="mt-3">
              <Text className="text-white text-xs font-bold">Instruções:</Text>
              <RenderHTML
                source={{ html: draftToHtml(orientations!) }}
                contentWidth={width}
                baseStyle={{ color: tailwindColors.white }}
              />
            </View>
          )}
        </View>
        {thumbnailUrl && (
          <View className="h-32 rounded-lg aspect-[9/16]">
            <Image
              source={{
                uri: thumbnailUrl,
              }}
              className="h-full w-full rounded-lg"
            />
          </View>
        )}
      </Pressable>
    </Link>
  );
}
