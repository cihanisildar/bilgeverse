import { useQuery } from "@tanstack/react-query";
import { getSociometricData } from "@/app/actions/sociometric";

export function useSociometricData(classroomId: string) {
    return useQuery({
        queryKey: ["sociometric", classroomId],
        queryFn: () => getSociometricData(classroomId),
        enabled: !!classroomId,
    });
}
