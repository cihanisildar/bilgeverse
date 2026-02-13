import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-client";
import { StudentDetails, PointTransaction } from "@/types/student";

interface StudentResponse {
    user: StudentDetails;
}

interface RankResponse {
    rank: number;
    totalStudents: number;
}

interface PointsResponse {
    transactions: PointTransaction[];
}

export function useStudentDetails(studentId: string) {
    return useQuery({
        queryKey: ["student-details", studentId],
        queryFn: async () => {
            const [studentData, rankData, pointsData] = await Promise.all([
                apiFetch<StudentResponse>(`/api/users/${studentId}`),
                apiFetch<RankResponse>(`/api/leaderboard?userId=${studentId}`),
                apiFetch<PointsResponse>(`/api/points?studentId=${studentId}`),
            ]);

            return {
                student: {
                    ...studentData.user,
                    rank: rankData.rank,
                    totalStudents: rankData.totalStudents,
                },
                pointHistory: pointsData.transactions || [],
            };
        },
        enabled: !!studentId,
    });
}
