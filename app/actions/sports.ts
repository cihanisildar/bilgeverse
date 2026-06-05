'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';
import {
    UserRole,
    FinanceType,
    FinanceCurrency,
    EquipmentStatus,
    MatchResult,
    TournamentStatus,
    FeeStatus,
    FeedbackStatus,
    NotificationType,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { hasRole } from '@/app/lib/auth-utils';
import { createNotification } from '@/app/actions/notifications';
import { DEFAULT_DISCIPLINE_RULES } from '@/app/lib/sports';

const MANAGE_ROLES = [UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN];

function unauthorized() {
    return { error: 'Yetkisiz erişim', data: null };
}

/** Serialize Prisma Decimal fields to plain numbers for client components. */
function num(v: unknown): number {
    if (v === null || v === undefined) return 0;
    return typeof v === 'number' ? v : Number(v.toString());
}

// =====================================================================
// #9 Antrenör değerlendirmeleri (performans notu / gözlem / gelişim)
// =====================================================================

export async function getAthleteEvaluations(athleteId: string) {
    try {
        const evaluations = await prisma.athleteEvaluation.findMany({
            where: { athleteId },
            include: {
                coach: { select: { id: true, firstName: true, lastName: true, username: true } },
            },
            orderBy: { date: 'desc' },
        });
        return { error: null, data: evaluations };
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        return { error: 'Değerlendirmeler yüklenirken bir hata oluştu', data: null };
    }
}

export async function createEvaluation(data: {
    athleteId: string;
    category: string;
    note: string;
    date?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const evaluation = await prisma.athleteEvaluation.create({
            data: {
                athleteId: data.athleteId,
                category: data.category,
                note: data.note,
                date: data.date ?? new Date(),
                coachId: session!.user.id,
            },
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: evaluation };
    } catch (error) {
        console.error('Error creating evaluation:', error);
        return { error: 'Değerlendirme kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteEvaluation(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.athleteEvaluation.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting evaluation:', error);
        return { error: 'Değerlendirme silinirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #7 #8 Disiplin yönetmeliği + ihlal kayıtları
// =====================================================================

export async function getDisciplineRules() {
    try {
        let rules = await prisma.disciplineRule.findMany({
            orderBy: { order: 'asc' },
        });
        // Seed default ruleset on first use so the regulation is always accessible.
        if (rules.length === 0) {
            await prisma.disciplineRule.createMany({
                data: DEFAULT_DISCIPLINE_RULES.map((r, i) => ({
                    code: r.code,
                    offense: r.offense,
                    penalty: r.penalty,
                    order: i,
                })),
            });
            rules = await prisma.disciplineRule.findMany({ orderBy: { order: 'asc' } });
        }
        return { error: null, data: rules };
    } catch (error) {
        console.error('Error fetching discipline rules:', error);
        return { error: 'Disiplin yönetmeliği yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertDisciplineRule(data: {
    id?: string;
    code?: string;
    offense: string;
    penalty: string;
    order?: number;
    isActive?: boolean;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const rule = data.id
            ? await prisma.disciplineRule.update({
                where: { id: data.id },
                data: { code: data.code, offense: data.offense, penalty: data.penalty, order: data.order, isActive: data.isActive },
            })
            : await prisma.disciplineRule.create({
                data: { code: data.code, offense: data.offense, penalty: data.penalty, order: data.order ?? 0 },
            });

        revalidatePath('/dashboard/part9');
        return { error: null, data: rule };
    } catch (error) {
        console.error('Error upserting discipline rule:', error);
        return { error: 'Yönetmelik maddesi kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteDisciplineRule(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.disciplineRule.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting discipline rule:', error);
        return { error: 'Yönetmelik maddesi silinirken bir hata oluştu', data: null };
    }
}

export async function getDisciplineRecords(athleteId?: string) {
    try {
        const records = await prisma.disciplineRecord.findMany({
            where: athleteId ? { athleteId } : undefined,
            include: {
                athlete: { include: { user: { select: { firstName: true, lastName: true, username: true } } } },
                rule: true,
            },
            orderBy: { date: 'desc' },
        });
        return { error: null, data: records };
    } catch (error) {
        console.error('Error fetching discipline records:', error);
        return { error: 'Disiplin kayıtları yüklenirken bir hata oluştu', data: null };
    }
}

export async function createDisciplineRecord(data: {
    athleteId: string;
    ruleId?: string | null;
    offense: string;
    penalty: string;
    date?: Date;
    note?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const record = await prisma.disciplineRecord.create({
            data: {
                athleteId: data.athleteId,
                ruleId: data.ruleId || null,
                offense: data.offense,
                penalty: data.penalty,
                date: data.date ?? new Date(),
                note: data.note,
                createdById: session!.user.id,
            },
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: record };
    } catch (error) {
        console.error('Error creating discipline record:', error);
        return { error: 'Disiplin kaydı oluşturulurken bir hata oluştu', data: null };
    }
}

export async function deleteDisciplineRecord(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.disciplineRecord.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting discipline record:', error);
        return { error: 'Disiplin kaydı silinirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #10 - #13 Turnuvalar, maçlar, kadro, sezon istatistikleri
// =====================================================================

export async function getTournaments() {
    try {
        const tournaments = await prisma.tournament.findMany({
            include: {
                branch: { select: { id: true, name: true } },
                _count: { select: { matches: true } },
            },
            orderBy: { startDate: 'desc' },
        });
        return { error: null, data: tournaments };
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        return { error: 'Turnuvalar yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertTournament(data: {
    id?: string;
    name: string;
    branchId?: string | null;
    location?: string;
    startDate: Date;
    endDate?: Date | null;
    status?: TournamentStatus;
    description?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const payload = {
            name: data.name,
            branchId: data.branchId || null,
            location: data.location,
            startDate: data.startDate,
            endDate: data.endDate || null,
            status: data.status,
            description: data.description,
        };

        const tournament = data.id
            ? await prisma.tournament.update({ where: { id: data.id }, data: payload })
            : await prisma.tournament.create({ data: { ...payload, createdById: session!.user.id } });

        revalidatePath('/dashboard/part9');
        return { error: null, data: tournament };
    } catch (error) {
        console.error('Error upserting tournament:', error);
        return { error: 'Turnuva kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteTournament(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.tournament.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting tournament:', error);
        return { error: 'Turnuva silinirken bir hata oluştu', data: null };
    }
}

export async function getMatches(params?: { branchId?: string; tournamentId?: string }) {
    try {
        const matches = await prisma.sportMatch.findMany({
            where: {
                branchId: params?.branchId,
                tournamentId: params?.tournamentId,
            },
            include: {
                branch: { select: { id: true, name: true } },
                tournament: { select: { id: true, name: true } },
                _count: { select: { participations: true } },
            },
            orderBy: { date: 'desc' },
        });
        return { error: null, data: matches };
    } catch (error) {
        console.error('Error fetching matches:', error);
        return { error: 'Müsabakalar yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertMatch(data: {
    id?: string;
    branchId: string;
    tournamentId?: string | null;
    date: Date;
    location?: string;
    opponent: string;
    ourScore?: number | null;
    theirScore?: number | null;
    result?: MatchResult;
    achievement?: string;
    notes?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        // Auto-derive result from scores when both are present and result not forced.
        let result = data.result;
        if ((result === undefined || result === 'PENDING') && data.ourScore != null && data.theirScore != null) {
            result = data.ourScore > data.theirScore ? 'WIN' : data.ourScore < data.theirScore ? 'LOSS' : 'DRAW';
        }

        const payload = {
            branchId: data.branchId,
            tournamentId: data.tournamentId || null,
            date: data.date,
            location: data.location,
            opponent: data.opponent,
            ourScore: data.ourScore ?? null,
            theirScore: data.theirScore ?? null,
            result: result ?? 'PENDING',
            achievement: data.achievement,
            notes: data.notes,
        };

        const match = data.id
            ? await prisma.sportMatch.update({ where: { id: data.id }, data: payload })
            : await prisma.sportMatch.create({ data: { ...payload, createdById: session!.user.id } });

        revalidatePath('/dashboard/part9');
        return { error: null, data: match };
    } catch (error) {
        console.error('Error upserting match:', error);
        return { error: 'Müsabaka kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteMatch(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.sportMatch.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting match:', error);
        return { error: 'Müsabaka silinirken bir hata oluştu', data: null };
    }
}

export async function getMatchRoster(matchId: string) {
    try {
        const match = await prisma.sportMatch.findUnique({
            where: { id: matchId },
            include: {
                branch: {
                    include: {
                        athletes: {
                            include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
                        },
                    },
                },
                participations: true,
            },
        });
        return { error: null, data: match };
    } catch (error) {
        console.error('Error fetching match roster:', error);
        return { error: 'Maç kadrosu yüklenirken bir hata oluştu', data: null };
    }
}

export async function saveMatchRoster(
    matchId: string,
    participations: { athleteId: string; isStarter: boolean; goals: number; assists: number; notes?: string }[]
) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        await prisma.$transaction([
            prisma.matchParticipation.deleteMany({ where: { matchId } }),
            prisma.matchParticipation.createMany({
                data: participations.map((p) => ({
                    matchId,
                    athleteId: p.athleteId,
                    isStarter: p.isStarter,
                    goals: p.goals,
                    assists: p.assists,
                    notes: p.notes,
                })),
            }),
        ]);

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error saving match roster:', error);
        return { error: 'Kadro kaydedilirken bir hata oluştu', data: null };
    }
}

/** #13 Sezon istatistikleri: takım G/M/B + sporcu gol/asist/maç (on-the-fly). */
export async function getSportSeasonStats(params?: { branchId?: string; season?: number }) {
    try {
        let dateFilter: { gte: Date; lte: Date } | undefined;
        if (params?.season) {
            // Season = year (Ağustos-Temmuz). Basitlik: takvim yılı.
            dateFilter = {
                gte: new Date(params.season, 0, 1),
                lte: new Date(params.season, 11, 31, 23, 59, 59),
            };
        }

        const matches = await prisma.sportMatch.findMany({
            where: { branchId: params?.branchId, date: dateFilter },
            include: {
                participations: {
                    include: { athlete: { include: { user: { select: { firstName: true, lastName: true, username: true } } } } },
                },
            },
        });

        let wins = 0, losses = 0, draws = 0, pending = 0;
        let goalsFor = 0, goalsAgainst = 0;
        const athleteMap = new Map<string, { athleteId: string; name: string; appearances: number; goals: number; assists: number }>();

        for (const m of matches) {
            if (m.result === 'WIN') wins++;
            else if (m.result === 'LOSS') losses++;
            else if (m.result === 'DRAW') draws++;
            else pending++;
            if (m.ourScore != null) goalsFor += m.ourScore;
            if (m.theirScore != null) goalsAgainst += m.theirScore;

            for (const p of m.participations) {
                const name = `${p.athlete.user.firstName ?? ''} ${p.athlete.user.lastName ?? ''}`.trim() || p.athlete.user.username;
                const existing = athleteMap.get(p.athleteId) ?? { athleteId: p.athleteId, name, appearances: 0, goals: 0, assists: 0 };
                existing.appearances += 1;
                existing.goals += p.goals;
                existing.assists += p.assists;
                athleteMap.set(p.athleteId, existing);
            }
        }

        const athleteStats = Array.from(athleteMap.values()).sort(
            (a, b) => b.goals - a.goals || b.assists - a.assists
        );

        return {
            error: null,
            data: {
                team: { played: matches.length, wins, losses, draws, pending, goalsFor, goalsAgainst },
                athletes: athleteStats,
            },
        };
    } catch (error) {
        console.error('Error computing season stats:', error);
        return { error: 'Sezon istatistikleri hesaplanırken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #14 - #16 Ekipman envanteri
// =====================================================================

export async function getEquipment(params?: { status?: EquipmentStatus; branchId?: string }) {
    try {
        const items = await prisma.equipment.findMany({
            where: { status: params?.status, branchId: params?.branchId },
            include: {
                assignedAthlete: { include: { user: { select: { firstName: true, lastName: true, username: true } } } },
                branch: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { error: null, data: items };
    } catch (error) {
        console.error('Error fetching equipment:', error);
        return { error: 'Ekipman envanteri yüklenirken bir hata oluştu', data: null };
    }
}

export async function upsertEquipment(data: {
    id?: string;
    name: string;
    category?: string;
    quantity?: number;
    status?: EquipmentStatus;
    assignedAthleteId?: string | null;
    assignedUnit?: string | null;
    branchId?: string | null;
    notes?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const payload = {
            name: data.name,
            category: data.category,
            quantity: data.quantity ?? 1,
            status: data.status ?? 'IN_USE' as EquipmentStatus,
            assignedAthleteId: data.assignedAthleteId || null,
            assignedUnit: data.assignedUnit || null,
            branchId: data.branchId || null,
            notes: data.notes,
        };

        const item = data.id
            ? await prisma.equipment.update({ where: { id: data.id }, data: payload })
            : await prisma.equipment.create({ data: payload });

        revalidatePath('/dashboard/part9');
        return { error: null, data: item };
    } catch (error) {
        console.error('Error upserting equipment:', error);
        return { error: 'Ekipman kaydedilirken bir hata oluştu', data: null };
    }
}

export async function deleteEquipment(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.equipment.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting equipment:', error);
        return { error: 'Ekipman silinirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #17 - #19 Futbol Okulu aidatları
// =====================================================================

export async function getFootballFees(params?: { status?: FeeStatus; periodMonth?: Date }) {
    try {
        // Mark overdue fees lazily on read.
        await prisma.footballFee.updateMany({
            where: { status: 'PENDING', dueDate: { lt: new Date() } },
            data: { status: 'OVERDUE' },
        });

        const fees = await prisma.footballFee.findMany({
            where: {
                status: params?.status,
                periodMonth: params?.periodMonth,
            },
            include: {
                athlete: { include: { user: { select: { firstName: true, lastName: true, username: true } } } },
                payments: true,
            },
            orderBy: [{ periodMonth: 'desc' }],
        });

        const data = fees.map((f) => ({
            ...f,
            amount: num(f.amount),
            payments: f.payments.map((p) => ({ ...p, amount: num(p.amount) })),
            paidTotal: f.payments.reduce((s, p) => s + num(p.amount), 0),
        }));
        return { error: null, data };
    } catch (error) {
        console.error('Error fetching football fees:', error);
        return { error: 'Aidatlar yüklenirken bir hata oluştu', data: null };
    }
}

/** Belirli ay için tüm futbol okulu sporcularına aidat oluştur. */
export async function generateMonthlyFees(data: { periodMonth: Date; amount: number; dueDate?: Date }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const periodStart = new Date(data.periodMonth.getFullYear(), data.periodMonth.getMonth(), 1);
        const dueDate = data.dueDate ?? new Date(data.periodMonth.getFullYear(), data.periodMonth.getMonth(), 15);

        const athletes = await prisma.athleteProfile.findMany({
            where: { footballSchool: true },
            select: { id: true },
        });

        if (athletes.length === 0) {
            return { error: 'Futbol okuluna kayıtlı sporcu bulunamadı', data: null };
        }

        let created = 0;
        for (const a of athletes) {
            const existing = await prisma.footballFee.findUnique({
                where: { athleteId_periodMonth: { athleteId: a.id, periodMonth: periodStart } },
            });
            if (!existing) {
                await prisma.footballFee.create({
                    data: { athleteId: a.id, periodMonth: periodStart, amount: data.amount, dueDate, status: 'PENDING' },
                });
                created++;
            }
        }

        revalidatePath('/dashboard/part9');
        return { error: null, data: { created, total: athletes.length } };
    } catch (error) {
        console.error('Error generating monthly fees:', error);
        return { error: 'Aidatlar oluşturulurken bir hata oluştu', data: null };
    }
}

/** #18 Ödeme kaydet + #23 SportTransaction INCOME otomatik. */
export async function recordFeePayment(feeId: string, payment: { amount: number; date?: Date; description?: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const fee = await prisma.footballFee.findUnique({
            where: { id: feeId },
            include: { payments: true, athlete: { include: { user: { select: { firstName: true, lastName: true } } } } },
        });
        if (!fee) return { error: 'Aidat kaydı bulunamadı', data: null };

        const result = await prisma.$transaction(async (tx) => {
            const created = await tx.footballPayment.create({
                data: {
                    feeId,
                    amount: payment.amount,
                    date: payment.date ?? new Date(),
                    description: payment.description,
                    createdById: session!.user.id,
                },
            });

            // Linked sports-club finance income entry (#23).
            await tx.sportTransaction.create({
                data: {
                    type: 'INCOME',
                    amount: payment.amount,
                    currency: 'TL',
                    category: 'AIDAT',
                    description: payment.description || `Futbol okulu aidatı - ${fee.athlete.user.firstName ?? ''} ${fee.athlete.user.lastName ?? ''}`.trim(),
                    transactionDate: payment.date ?? new Date(),
                    footballPaymentId: created.id,
                    createdById: session!.user.id,
                },
            });

            // Update fee status if fully paid.
            const paidTotal = fee.payments.reduce((s, p) => s + num(p.amount), 0) + payment.amount;
            if (paidTotal >= num(fee.amount)) {
                await tx.footballFee.update({ where: { id: feeId }, data: { status: 'PAID' } });
            }

            return created;
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { id: result.id, amount: num(result.amount) } };
    } catch (error) {
        console.error('Error recording fee payment:', error);
        return { error: 'Ödeme kaydedilirken bir hata oluştu', data: null };
    }
}

/** #19 Borçlu sporcular + veli iletişim bilgisi. */
export async function getDuesReminders() {
    try {
        await prisma.footballFee.updateMany({
            where: { status: 'PENDING', dueDate: { lt: new Date() } },
            data: { status: 'OVERDUE' },
        });

        const fees = await prisma.footballFee.findMany({
            where: { status: { in: ['PENDING', 'OVERDUE'] } },
            include: {
                athlete: { include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } } },
            },
            orderBy: { dueDate: 'asc' },
        });

        const data = fees.map((f) => ({
            ...f,
            amount: num(f.amount),
        }));
        return { error: null, data };
    } catch (error) {
        console.error('Error fetching dues reminders:', error);
        return { error: 'Borç hatırlatmaları yüklenirken bir hata oluştu', data: null };
    }
}

/** #19 Borçlu sporcuya (kullanıcı hesabına) aidat hatırlatma bildirimi gönder. */
export async function sendDuesReminder(feeId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const fee = await prisma.footballFee.findUnique({
            where: { id: feeId },
            include: { athlete: { include: { user: { select: { id: true } } } } },
        });
        if (!fee) return { error: 'Aidat kaydı bulunamadı', data: null };

        const period = new Date(fee.periodMonth).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        await createNotification({
            userId: fee.athlete.user.id,
            type: NotificationType.DUES_REMINDER,
            title: 'Futbol Okulu Aidat Hatırlatması',
            message: `${period} dönemine ait ${num(fee.amount).toLocaleString('tr-TR')} ₺ tutarındaki aidat ödemeniz beklenmektedir. Lütfen en kısa sürede ödeme yapınız.`,
        });

        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error sending dues reminder:', error);
        return { error: 'Hatırlatma gönderilirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #23 Spor kulübü maliyesi (part9 içinde ayrı defter)
// =====================================================================

export async function getSportTransactions(params?: { type?: FinanceType; startDate?: Date; endDate?: Date }) {
    try {
        const txs = await prisma.sportTransaction.findMany({
            where: {
                type: params?.type,
                transactionDate: { gte: params?.startDate, lte: params?.endDate },
            },
            include: { createdBy: { select: { firstName: true, lastName: true, username: true } } },
            orderBy: { transactionDate: 'desc' },
        });
        const data = txs.map((t) => ({ ...t, amount: num(t.amount) }));
        return { error: null, data };
    } catch (error) {
        console.error('Error fetching sport transactions:', error);
        return { error: 'Maliye kayıtları yüklenirken bir hata oluştu', data: null };
    }
}

export async function createSportTransaction(data: {
    type: FinanceType;
    amount: number;
    currency?: FinanceCurrency;
    category: string;
    description?: string;
    transactionDate?: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const tx = await prisma.sportTransaction.create({
            data: {
                type: data.type,
                amount: data.amount,
                currency: data.currency ?? 'TL',
                category: data.category,
                description: data.description,
                transactionDate: data.transactionDate ?? new Date(),
                createdById: session!.user.id,
            },
        });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { ...tx, amount: num(tx.amount) } };
    } catch (error) {
        console.error('Error creating sport transaction:', error);
        return { error: 'Maliye kaydı oluşturulurken bir hata oluştu', data: null };
    }
}

export async function deleteSportTransaction(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.sportTransaction.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting sport transaction:', error);
        return { error: 'Maliye kaydı silinirken bir hata oluştu', data: null };
    }
}

export async function getSportFinanceSummary(params?: { startDate?: Date; endDate?: Date }) {
    try {
        const txs = await prisma.sportTransaction.findMany({
            where: { transactionDate: { gte: params?.startDate, lte: params?.endDate } },
            select: { type: true, amount: true, currency: true, category: true },
        });

        let income = 0, expense = 0, duesIncome = 0;
        for (const t of txs) {
            const a = num(t.amount);
            if (t.currency !== 'TL') continue; // özet TL bazında
            if (t.type === 'INCOME') {
                income += a;
                if (t.category === 'AIDAT') duesIncome += a;
            } else {
                expense += a;
            }
        }

        return {
            error: null,
            data: { income, expense, balance: income - expense, duesIncome, count: txs.length },
        };
    } catch (error) {
        console.error('Error computing finance summary:', error);
        return { error: 'Maliye özeti hesaplanırken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #20 Duyurular
// =====================================================================

export async function getSportAnnouncements() {
    try {
        const announcements = await prisma.sportAnnouncement.findMany({
            include: {
                branch: { select: { id: true, name: true } },
                createdBy: { select: { firstName: true, lastName: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { error: null, data: announcements };
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return { error: 'Duyurular yüklenirken bir hata oluştu', data: null };
    }
}

export async function createSportAnnouncement(data: {
    title: string;
    content: string;
    type?: string;
    branchId?: string | null;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const announcement = await prisma.sportAnnouncement.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type ?? 'ANNOUNCEMENT',
                branchId: data.branchId || null,
                createdById: session!.user.id,
            },
        });
        revalidatePath('/dashboard/part9');
        return { error: null, data: announcement };
    } catch (error) {
        console.error('Error creating announcement:', error);
        return { error: 'Duyuru oluşturulurken bir hata oluştu', data: null };
    }
}

export async function deleteSportAnnouncement(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.sportAnnouncement.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return { error: 'Duyuru silinirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #21 Geri bildirim / talep takibi (ÖNEMLİ)
// =====================================================================

export async function getSportFeedback(params?: { status?: FeedbackStatus; mine?: boolean }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return unauthorized();

        // Yönetici değilse sadece kendi gönderdiklerini görür.
        const isManager = hasRole(session, MANAGE_ROLES);
        const feedback = await prisma.sportFeedback.findMany({
            where: {
                status: params?.status,
                ...(isManager && !params?.mine ? {} : { createdById: session.user.id }),
            },
            include: {
                athlete: { include: { user: { select: { firstName: true, lastName: true, username: true } } } },
                createdBy: { select: { firstName: true, lastName: true, username: true } },
                respondedBy: { select: { firstName: true, lastName: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { error: null, data: feedback };
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return { error: 'Geri bildirimler yüklenirken bir hata oluştu', data: null };
    }
}

export async function createSportFeedback(data: {
    subject: string;
    message: string;
    category?: string;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return unauthorized();

        // Gönderen sporcu ise athleteProfile bağla.
        const athlete = await prisma.athleteProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        const feedback = await prisma.sportFeedback.create({
            data: {
                subject: data.subject,
                message: data.message,
                category: data.category ?? 'REQUEST',
                createdById: session.user.id,
                athleteId: athlete?.id ?? null,
            },
        });
        revalidatePath('/dashboard/part9');
        return { error: null, data: feedback };
    } catch (error) {
        console.error('Error creating feedback:', error);
        return { error: 'Geri bildirim gönderilirken bir hata oluştu', data: null };
    }
}

export async function respondSportFeedback(id: string, data: { response: string; status?: FeedbackStatus }) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();

        const feedback = await prisma.sportFeedback.update({
            where: { id },
            data: {
                response: data.response,
                status: data.status ?? 'RESOLVED',
                respondedById: session!.user.id,
            },
            include: { createdBy: { select: { id: true } } },
        });

        // Gönderene bildirim.
        if (feedback.createdById) {
            await createNotification({
                userId: feedback.createdById,
                type: NotificationType.GENERAL,
                title: 'Geri Bildiriminize Yanıt Verildi',
                message: `"${feedback.subject}" konulu geri bildiriminize bir yanıt verildi.`,
            });
        }

        revalidatePath('/dashboard/part9');
        return { error: null, data: feedback };
    } catch (error) {
        console.error('Error responding to feedback:', error);
        return { error: 'Yanıt kaydedilirken bir hata oluştu', data: null };
    }
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        const feedback = await prisma.sportFeedback.update({ where: { id }, data: { status } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: feedback };
    } catch (error) {
        console.error('Error updating feedback status:', error);
        return { error: 'Durum güncellenirken bir hata oluştu', data: null };
    }
}

export async function deleteSportFeedback(id: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!hasRole(session, MANAGE_ROLES)) return unauthorized();
        await prisma.sportFeedback.delete({ where: { id } });
        revalidatePath('/dashboard/part9');
        return { error: null, data: { success: true } };
    } catch (error) {
        console.error('Error deleting feedback:', error);
        return { error: 'Geri bildirim silinirken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #6 Katılım / devamsızlık oranı
// =====================================================================

export async function getAttendanceOverview(branchId?: string) {
    try {
        const athletes = await prisma.athleteProfile.findMany({
            where: branchId ? { branches: { some: { id: branchId } } } : undefined,
            include: {
                user: { select: { firstName: true, lastName: true, username: true } },
                branches: { select: { id: true, name: true } },
                attendances: { select: { status: true } },
            },
        });

        const data = athletes.map((a) => {
            const total = a.attendances.length;
            const present = a.attendances.filter((x) => x.status === 'YAPILDI').length;
            const absent = a.attendances.filter((x) => x.status === 'YOKTU').length;
            const excused = a.attendances.filter((x) => x.status === 'YAPILMADI').length;
            return {
                athleteId: a.id,
                name: `${a.user.firstName ?? ''} ${a.user.lastName ?? ''}`.trim() || a.user.username,
                branches: a.branches,
                total,
                present,
                absent,
                excused,
                attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
                absenceRate: total > 0 ? Math.round((absent / total) * 100) : 0,
            };
        });

        return { error: null, data };
    } catch (error) {
        console.error('Error computing attendance overview:', error);
        return { error: 'Katılım özeti hesaplanırken bir hata oluştu', data: null };
    }
}

// =====================================================================
// #22 Otomatik dönemlik/aylık faaliyet raporu
// =====================================================================

export async function getSportReport(year: number, month?: number) {
    try {
        const start = month != null ? new Date(year, month, 1) : new Date(year, 0, 1);
        const end = month != null ? new Date(year, month + 1, 0, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);

        const [athletes, attendances, matches, fees, transactions] = await Promise.all([
            prisma.athleteProfile.findMany({
                include: { branches: { select: { id: true, name: true } } },
            }),
            prisma.athleteAttendance.findMany({
                where: { training: { date: { gte: start, lte: end } } },
                select: { status: true },
            }),
            prisma.sportMatch.findMany({
                where: { date: { gte: start, lte: end } },
                select: { result: true, ourScore: true, theirScore: true, opponent: true, date: true, achievement: true },
            }),
            prisma.footballFee.findMany({
                where: { periodMonth: { gte: start, lte: end } },
                include: { payments: { select: { amount: true } } },
            }),
            prisma.sportTransaction.findMany({
                where: { transactionDate: { gte: start, lte: end } },
                select: { type: true, amount: true, currency: true, category: true },
            }),
        ]);

        // Sporcu sayısı (durum + branş)
        const byStatus = { ACTIVE: 0, PASSIVE: 0, SUSPENDED: 0 } as Record<string, number>;
        const byBranch = new Map<string, number>();
        for (const a of athletes) {
            byStatus[a.membershipStatus] = (byStatus[a.membershipStatus] ?? 0) + 1;
            for (const b of a.branches) byBranch.set(b.name, (byBranch.get(b.name) ?? 0) + 1);
        }

        // Katılım
        const totalAtt = attendances.length;
        const presentAtt = attendances.filter((x) => x.status === 'YAPILDI').length;
        const avgAttendance = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        // Müsabaka
        const wins = matches.filter((m) => m.result === 'WIN').length;
        const losses = matches.filter((m) => m.result === 'LOSS').length;
        const draws = matches.filter((m) => m.result === 'DRAW').length;

        // Aidat tahsilatı
        let billed = 0, collected = 0, pendingCount = 0, overdueCount = 0;
        for (const f of fees) {
            billed += num(f.amount);
            collected += f.payments.reduce((s, p) => s + num(p.amount), 0);
            if (f.status === 'PENDING') pendingCount++;
            if (f.status === 'OVERDUE') overdueCount++;
        }

        // Maliye
        let income = 0, expense = 0;
        for (const t of transactions) {
            if (t.currency !== 'TL') continue;
            if (t.type === 'INCOME') income += num(t.amount);
            else expense += num(t.amount);
        }

        return {
            error: null,
            data: {
                period: { year, month, start, end },
                athletes: {
                    total: athletes.length,
                    byStatus,
                    byBranch: Array.from(byBranch.entries()).map(([name, count]) => ({ name, count })),
                },
                attendance: { totalRecords: totalAtt, present: presentAtt, avgAttendance },
                matches: {
                    total: matches.length, wins, losses, draws,
                    list: matches.map((m) => ({
                        opponent: m.opponent,
                        date: m.date,
                        score: m.ourScore != null && m.theirScore != null ? `${m.ourScore}-${m.theirScore}` : '-',
                        result: m.result,
                        achievement: m.achievement,
                    })),
                },
                dues: { billed, collected, pending: billed - collected, pendingCount, overdueCount },
                finance: { income, expense, balance: income - expense },
            },
        };
    } catch (error) {
        console.error('Error generating sport report:', error);
        return { error: 'Rapor oluşturulurken bir hata oluştu', data: null };
    }
}

// =====================================================================
// Genel Bakış için özet
// =====================================================================

export async function getSportsOverview() {
    try {
        const now = new Date();
        const soon = new Date();
        soon.setDate(soon.getDate() + 30);

        await prisma.footballFee.updateMany({
            where: { status: 'PENDING', dueDate: { lt: now } },
            data: { status: 'OVERDUE' },
        });

        const [totalAthletes, activeAthletes, branchCount, upcomingTrainings, upcomingMatches, expiringLicenses, expiringHealth, duesOutstanding, recentFeedback, recentAnnouncements] = await Promise.all([
            prisma.athleteProfile.count(),
            prisma.athleteProfile.count({ where: { membershipStatus: 'ACTIVE' } }),
            prisma.sportBranch.count({ where: { isActive: true } }),
            prisma.athleteTraining.count({ where: { date: { gte: now }, type: 'TRAINING' } }),
            prisma.sportMatch.count({ where: { date: { gte: now } } }),
            prisma.athleteProfile.count({ where: { licenseExpiry: { gte: now, lte: soon } } }),
            prisma.athleteProfile.count({ where: { healthReportExpiry: { gte: now, lte: soon } } }),
            prisma.footballFee.count({ where: { status: { in: ['PENDING', 'OVERDUE'] } } }),
            prisma.sportFeedback.count({ where: { status: 'NEW' } }),
            prisma.sportAnnouncement.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { branch: { select: { name: true } } } }),
        ]);

        return {
            error: null,
            data: {
                totalAthletes,
                activeAthletes,
                passiveAthletes: totalAthletes - activeAthletes,
                branchCount,
                upcomingTrainings,
                upcomingMatches,
                expiringLicenses,
                expiringHealth,
                duesOutstanding,
                newFeedback: recentFeedback,
                recentAnnouncements,
            },
        };
    } catch (error) {
        console.error('Error fetching sports overview:', error);
        return { error: 'Genel bakış yüklenirken bir hata oluştu', data: null };
    }
}
