import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-client";
import { ClassroomsResponse } from "@/types/classroom";

export function useClassrooms() {
    return useQuery({
        queryKey: ["classrooms"],
        queryFn: () => apiFetch<ClassroomsResponse>("/api/classrooms"),
    });
}
