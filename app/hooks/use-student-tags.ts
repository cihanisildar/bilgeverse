import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/app/lib/api-client";
import { TagTemplate, StudentTag } from "@/types/tag";

interface TagsResponse {
    tags: StudentTag[];
}

interface TemplatesResponse {
    templates: TagTemplate[];
}

export function useStudentTags(studentId: string) {
    return useQuery({
        queryKey: ["student-tags", studentId],
        queryFn: () => apiFetch<TagsResponse>(`/api/student-tags?studentId=${studentId}`),
        enabled: !!studentId,
    });
}

export function useTagTemplates() {
    return useQuery({
        queryKey: ["tag-templates"],
        queryFn: () => apiFetch<TemplatesResponse>("/api/tag-templates"),
    });
}

export function useAddStudentTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { studentId: string; templateId: string }) =>
            apiFetch<{ tag: StudentTag }>("/api/student-tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["student-tags", variables.studentId] });
            queryClient.invalidateQueries({ queryKey: ["sociometric"] }); // Also invalidate sociometric as tags affect it
        },
    });
}

export function useRemoveStudentTag() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tagId, studentId }: { tagId: string; studentId: string }) =>
            apiFetch(`/api/student-tags/${tagId}`, {
                method: "DELETE",
            }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["student-tags", variables.studentId] });
            queryClient.invalidateQueries({ queryKey: ["sociometric"] });
        },
    });
}
