'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMeetingDecisions,
  createDecision,
  updateDecision,
  updateDecisionStatus,
  deleteDecision,
} from '@/app/actions/meetings/decisions';
import { DecisionStatus } from '@prisma/client';
import toast from 'react-hot-toast';

export function useMeetingDecisions(meetingId: string) {
  return useQuery({
    queryKey: ['meetings', meetingId, 'decisions'],
    queryFn: async () => {
      const result = await getMeetingDecisions(meetingId);
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!meetingId,
  });
}

export interface Decision {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: DecisionStatus;
  meetingId: string;
  createdAt: string;
  updatedAt: string;
  responsibleUsers: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  }[];
}

export interface CreateDecisionInput {
  title: string;
  description?: string | null;
  targetDate?: string | Date | null;
  responsibleUserIds: string[];
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: string; data: CreateDecisionInput }) =>
      createDecision(meetingId, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['meetings', variables.meetingId, 'decisions'] });
        toast.success('Karar başarıyla oluşturuldu');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Karar oluşturulurken bir hata oluştu');
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDecisionInput> & { status?: DecisionStatus } }) =>
      updateDecision(id, data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        // Invalidate all decision queries to find which meeting it belongs to
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        queryClient.invalidateQueries({ queryKey: ['decisions'] });
        toast.success('Karar başarıyla güncellendi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Karar güncellenirken bir hata oluştu');
    },
  });
}

export function useUpdateDecisionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DecisionStatus }) =>
      updateDecisionStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['meetings'] });

      // Snapshot the previous value for all decision queries
      const previousQueries: Array<[any, any]> = [];

      // Get all queries that might contain decisions
      queryClient.getQueryCache().getAll().forEach((query) => {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey.length >= 2 &&
          queryKey[0] === 'meetings'
        ) {
          const data = queryClient.getQueryData(queryKey);
          if (data) {
            previousQueries.push([queryKey, data]);
          }
        }
      });

      // Optimistically update all decision queries
      queryClient.getQueryCache().getAll().forEach((query) => {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey.length >= 2 &&
          queryKey[0] === 'meetings'
        ) {
          queryClient.setQueryData(queryKey, (old: unknown) => {
            if (!old) return old;

            // If it's an array of decisions (queryKey: ['meetings', meetingId, 'decisions'])
            if (Array.isArray(old) && queryKey.length === 3 && queryKey[2] === 'decisions') {
              return (old as Decision[]).map((decision) =>
                decision.id === id ? { ...decision, status } : decision
              );
            }

            // If it's a single meeting object with decisions (queryKey: ['meetings', meetingId])
            // We cast to any here because Meeting type is complex and we only care about decisions property
            const oldMeeting = old as any;
            if (oldMeeting.decisions && Array.isArray(oldMeeting.decisions)) {
              return {
                ...oldMeeting,
                decisions: oldMeeting.decisions.map((decision: Decision) =>
                  decision.id === id ? { ...decision, status } : decision
                ),
              };
            }

            return old;
          });
        }
      });

      return { previousQueries };
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        // Invalidate to ensure consistency with server
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      }
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Karar durumu güncellenirken bir hata oluştu');
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Ensure we pass a plain string to the server action
      const plainId = String(id);
      return deleteDecision(plainId);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        // Invalidate all decision queries - this will refetch all meetings and their decisions
        // Invalidating ['meetings'] will also invalidate ['meetings', meetingId, 'decisions']
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Karar başarıyla silindi');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Karar silinirken bir hata oluştu');
    },
  });
}

