import { Routine, Trainings } from "@/components/trainings";
import { useAuthentication } from "@/contexts/AuthenticationContext";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface Training {
  segment: string;
}

export default function Training({ segment }: Training) {
  const { currentUser } = useAuthentication();

  const { data: routines, isLoading: loadingRoutines } = useQuery({
    queryKey: ["trainings", segment.replace(/[()]g/, "")],
    queryFn: fetchTrainings,
  });

  return (
    <Trainings
      loading={loadingRoutines}
      routines={routines!}
      day={segment.replace(/[()]/g, "").toUpperCase()}
    />
  );

  async function fetchTrainings() {
    const { data } = await api.get<Routine[]>("routine", {
      params: {
        day: segment.replace(/[()]/g, "").toUpperCase(),
        userId: currentUser?.id,
      },
    });

    return data;
  }
}
