'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    getSportsOverview, getTournaments, upsertTournament, deleteTournament,
    getMatches, upsertMatch, deleteMatch, getMatchRoster, saveMatchRoster, getSportSeasonStats, getAttendanceOverview,
    getDisciplineRules, upsertDisciplineRule, deleteDisciplineRule, getDisciplineRecords, createDisciplineRecord, deleteDisciplineRecord,
    getEquipment, upsertEquipment, deleteEquipment,
    getFootballFees, generateMonthlyFees, recordFeePayment, getDuesReminders, sendDuesReminder,
    getSportTransactions, createSportTransaction, deleteSportTransaction, getSportFinanceSummary,
    getSportAnnouncements, createSportAnnouncement, deleteSportAnnouncement,
    getSportFeedback, createSportFeedback, respondSportFeedback, updateFeedbackStatus, deleteSportFeedback,
    getSportReport,
    getAthleteEvaluations, createEvaluation, deleteEvaluation
} from '@/app/actions/sports';
import { getAthletes, getAthleteStats } from '@/app/actions/athlete-actions';
import { SportsOverviewData, AttendanceOverviewRow } from '@/types/sports';
import toast from 'react-hot-toast';

export function useSportsOverview() {
    return useQuery({
        queryKey: ['sports-overview'],
        queryFn: async (): Promise<SportsOverviewData> => {
            const result = await getSportsOverview();
            if (result.error) throw new Error(result.error);
            if (!result.data) throw new Error('Data is undefined');
            return result.data as SportsOverviewData;
        }
    });
}

// --- Tournaments ---

export function useTournaments() {
    return useQuery({
        queryKey: ['tournaments'],
        queryFn: async () => {
            const result = await getTournaments();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof upsertTournament>[0]) => upsertTournament(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['tournaments'] });
                toast.success('Turnuva kaydedildi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDeleteTournament() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteTournament(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['tournaments'] });
                toast.success('Turnuva silindi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

// --- Matches ---

export function useMatches(params?: Parameters<typeof getMatches>[0]) {
    return useQuery({
        queryKey: ['matches', params],
        queryFn: async () => {
            const result = await getMatches(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof upsertMatch>[0]) => upsertMatch(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['matches'] });
                toast.success('Müsabaka kaydedildi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDeleteMatch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMatch(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['matches'] });
                toast.success('Müsabaka silindi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

// --- Rosters & Season Stats ---

export function useMatchRoster(matchId?: string) {
    return useQuery({
        queryKey: ['match-roster', matchId],
        queryFn: async () => {
            if (!matchId) return null;
            const result = await getMatchRoster(matchId);
            if (result.error) throw new Error(result.error);
            return result.data;
        },
        enabled: !!matchId
    });
}

export function useSaveMatchRoster() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ matchId, participations }: { matchId: string, participations: any[] }) => 
            saveMatchRoster(matchId, participations),
        onSuccess: (result, variables) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['match-roster', variables.matchId] });
                toast.success('Kadro kaydedildi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useSportSeasonStats(params?: Parameters<typeof getSportSeasonStats>[0]) {
    return useQuery({
        queryKey: ['sport-season-stats', params],
        queryFn: async () => {
            const result = await getSportSeasonStats(params);
            if (result.error) throw new Error(result.error);
            return result.data;
        }
    });
}

export function useAttendanceOverview(branchId?: string) {
    return useQuery({
        queryKey: ['attendance-overview', branchId],
        queryFn: async (): Promise<AttendanceOverviewRow[]> => {
            const result = await getAttendanceOverview(branchId);
            if (result.error) throw new Error(result.error);
            return (result.data as AttendanceOverviewRow[]) || [];
        }
    });
}

// --- Discipline ---

export function useDisciplineRules() {
    return useQuery({
        queryKey: ['discipline-rules'],
        queryFn: async () => {
            const result = await getDisciplineRules();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertDisciplineRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof upsertDisciplineRule>[0]) => upsertDisciplineRule(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['discipline-rules'] });
                toast.success('Yönetmelik maddesi kaydedildi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDeleteDisciplineRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDisciplineRule(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['discipline-rules'] });
                toast.success('Yönetmelik maddesi silindi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDisciplineRecords() {
    return useQuery({
        queryKey: ['discipline-records'],
        queryFn: async () => {
            const result = await getDisciplineRecords();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useCreateDisciplineRecord() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createDisciplineRecord>[0]) => createDisciplineRecord(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['discipline-records'] });
                toast.success('İhlal kaydı eklendi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDeleteDisciplineRecord() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDisciplineRecord(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['discipline-records'] });
                toast.success('İhlal kaydı silindi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

// --- Equipment ---

export function useEquipment(params?: Parameters<typeof getEquipment>[0]) {
    return useQuery({
        queryKey: ['equipment', params],
        queryFn: async () => {
            const result = await getEquipment(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useUpsertEquipment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof upsertEquipment>[0]) => upsertEquipment(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Ekipman kaydedildi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useDeleteEquipment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEquipment(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['equipment'] }); toast.success('Ekipman silindi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

// --- Football School Fees ---

export function useFootballFees(params?: Parameters<typeof getFootballFees>[0]) {
    return useQuery({
        queryKey: ['football-fees', params],
        queryFn: async () => {
            const result = await getFootballFees(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useDuesReminders() {
    return useQuery({
        queryKey: ['dues-reminders'],
        queryFn: async () => {
            const result = await getDuesReminders();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useGenerateMonthlyFees() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof generateMonthlyFees>[0]) => generateMonthlyFees(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['football-fees'] }); toast.success(`${result.data?.created ?? 0} aidat kaydı oluşturuldu`); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useRecordFeePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ feeId, payment }: { feeId: string; payment: Parameters<typeof recordFeePayment>[1] }) => recordFeePayment(feeId, payment),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['football-fees'] }); toast.success('Ödeme kaydedildi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useSendDuesReminder() {
    return useMutation({
        mutationFn: (feeId: string) => sendDuesReminder(feeId),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else toast.success('Hatırlatma gönderildi');
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

// --- Sport Finance ---

export function useSportTransactions(params?: Parameters<typeof getSportTransactions>[0]) {
    return useQuery({
        queryKey: ['sport-transactions', params],
        queryFn: async () => {
            const result = await getSportTransactions(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useSportFinanceSummary(params?: Parameters<typeof getSportFinanceSummary>[0]) {
    return useQuery({
        queryKey: ['sport-finance-summary', params],
        queryFn: async () => {
            const result = await getSportFinanceSummary(params);
            if (result.error) throw new Error(result.error);
            return result.data;
        }
    });
}

export function useCreateSportTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createSportTransaction>[0]) => createSportTransaction(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-transactions'] }); queryClient.invalidateQueries({ queryKey: ['sport-finance-summary'] }); toast.success('İşlem kaydedildi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useDeleteSportTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSportTransaction(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-transactions'] }); queryClient.invalidateQueries({ queryKey: ['sport-finance-summary'] }); toast.success('İşlem silindi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

// --- Announcements ---

export function useSportAnnouncements() {
    return useQuery({
        queryKey: ['sport-announcements'],
        queryFn: async () => {
            const result = await getSportAnnouncements();
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useCreateSportAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createSportAnnouncement>[0]) => createSportAnnouncement(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-announcements'] }); toast.success('Duyuru yayınlandı'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useDeleteSportAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSportAnnouncement(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-announcements'] }); toast.success('Duyuru silindi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

// --- Feedback ---

export function useSportFeedback(params?: Parameters<typeof getSportFeedback>[0]) {
    return useQuery({
        queryKey: ['sport-feedback', params],
        queryFn: async () => {
            const result = await getSportFeedback(params);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useCreateSportFeedback() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createSportFeedback>[0]) => createSportFeedback(data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-feedback'] }); toast.success('Geri bildirim gönderildi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useRespondSportFeedback() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof respondSportFeedback>[1] }) => respondSportFeedback(id, data),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-feedback'] }); toast.success('Yanıt kaydedildi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useUpdateFeedbackStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: Parameters<typeof updateFeedbackStatus>[1] }) => updateFeedbackStatus(id, status),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-feedback'] }); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

export function useDeleteSportFeedback() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteSportFeedback(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else { queryClient.invalidateQueries({ queryKey: ['sport-feedback'] }); toast.success('Geri bildirim silindi'); }
        },
        onError: (error: Error) => toast.error(error.message)
    });
}

// --- Reports ---

export function useSportReport(year: number, month?: number) {
    return useQuery({
        queryKey: ['sport-report', year, month],
        queryFn: async () => {
            const result = await getSportReport(year, month);
            if (result.error) throw new Error(result.error);
            return result.data;
        }
    });
}

// --- Performance & Evaluations ---

export function useAthletesList(branchId?: string) {
    return useQuery({
        queryKey: ['athletes', branchId],
        queryFn: async () => {
            const result = await getAthletes(branchId);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        }
    });
}

export function useAthleteStats(athleteId?: string) {
    return useQuery({
        queryKey: ['athlete-stats', athleteId],
        queryFn: async () => {
            if (!athleteId) return null;
            const result = await getAthleteStats(athleteId);
            if (result.error) throw new Error(result.error);
            return result.data as { performances: any[]; attendances: any[] } | null;
        },
        enabled: !!athleteId
    });
}

export function useAthleteEvaluations(athleteId?: string) {
    return useQuery({
        queryKey: ['athlete-evaluations', athleteId],
        queryFn: async () => {
            if (!athleteId) return [];
            const result = await getAthleteEvaluations(athleteId);
            if (result.error) throw new Error(result.error);
            return result.data || [];
        },
        enabled: !!athleteId
    });
}

export function useCreateEvaluation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Parameters<typeof createEvaluation>[0]) => createEvaluation(data),
        onSuccess: (result, variables) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['athlete-evaluations', variables.athleteId] });
                toast.success('Değerlendirme eklendi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}

export function useDeleteEvaluation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEvaluation(id),
        onSuccess: (result) => {
            if (result.error) toast.error(result.error);
            else {
                queryClient.invalidateQueries({ queryKey: ['athlete-evaluations'] });
                toast.success('Değerlendirme silindi');
            }
        },
        onError: (error: Error) => toast.error(error.message || 'Hata oluştu')
    });
}
