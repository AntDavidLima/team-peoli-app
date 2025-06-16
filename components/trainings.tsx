import { ScrollView, Text, View } from "react-native";
import { RawDraftContentState } from "draft-js";
import { RoutineItem } from "./routine";
import { Image } from "expo-image";
import { useWindowDimensions } from 'react-native';

type Trainings =
  | {
      routines: undefined | Routine[];
      loading: true;
      day: string;
    }
  | {
      routines: Routine[];
      loading: false;
      day: string;
    };

export interface Routine {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date | null;
  trainings: Training[];
  orientations: RawDraftContentState | null;
}

interface Training {
  id: number;
  name: string;
  exercises: TrainingExercise[];
}

export interface TrainingExercise {
  sets: number;
  reps: number;
  orientations: RawDraftContentState | null;
  restTime: number;
  exercise: Exercise;
}

interface Exercise {
  id: number;
  name: string;
  executionVideoUrl: string | null;
  thumbnailUrl: string | null;
}

export function Trainings({ routines, loading, day }: Trainings) {
  const { height } = useWindowDimensions();
  if (loading) {
    return (
      <Image
        source={require("@/assets/animations/loading.gif")}
        style={{ flex: 1 }}
        contentFit="contain"
      />
    );
  }
  
  if (
    routines
      .map(({ trainings }) =>
        trainings.map(({ exercises }) => exercises.map((exercise) => exercise))
      )
      .flat().length === 0
  ) {
    return (
      <View className="items-center mt-16">
        <Text className="text-disabled font-semibold text-lg">
          Sem treinos hoje por enquanto
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{height: height-250}} className="px-4">
      {routines.map(
        ({ name, id, startDate, endDate, orientations, trainings }) => (
          <RoutineItem
            key={id}
            startDate={startDate}
            endDate={endDate}
            name={name}
            trainings={trainings}
            orientations={orientations}
            day={day}
          />
        )
      )}
    </ScrollView>
  );
}
