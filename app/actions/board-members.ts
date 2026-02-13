import { requireActionAuth, hasRole } from '@/app/lib/auth-utils';
import prisma from '@/lib/prisma';
import { createBoardMemberSchema, updateBoardMemberSchema } from '@/lib/validations/board-members';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface BoardMemberStats {
    attendedMeetings: number;
    totalMeetings: number;
    attendanceRate: number;
}

export interface BoardMemberWithUser {
    id: string;
    userId: string;
    title: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
    };
    stats?: BoardMemberStats;
}

export interface UserSummary {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: UserRole;
    displayName: string;
}

export async function getBoardMembers() {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        // Get total number of relevant meetings (Completed, Ongoing, or Planned but past/current)
        const now = new Date();
        const totalMeetings = await prisma.managerMeeting.count({
            where: {
                OR: [
                    { status: 'COMPLETED' },
                    { status: 'ONGOING' },
                    {
                        status: 'PLANNED',
                        meetingDate: {
                            lte: now
                        }
                    }
                ]
            },
        });

        const boardMembers = await prisma.boardMember.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        _count: {
                            select: {
                                meetingAttendances: {
                                    where: {
                                        // Count if attended is true OR null (not explicitly marked as false)
                                        attended: { not: false },
                                        meeting: {
                                            OR: [
                                                { status: 'COMPLETED' },
                                                { status: 'ONGOING' },
                                                {
                                                    status: 'PLANNED',
                                                    meetingDate: {
                                                        lte: now
                                                    }
                                                }
                                            ]
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            error: null,
            data: boardMembers.map((member) => {
                const user = member.user;
                const attendedCount = user._count?.meetingAttendances || 0;
                return {
                    id: member.id,
                    userId: member.userId,
                    title: member.title,
                    isActive: member.isActive,
                    createdAt: member.createdAt.toISOString(),
                    updatedAt: member.updatedAt.toISOString(),
                    user: {
                        id: member.user.id,
                        username: member.user.username,
                        firstName: member.user.firstName,
                        lastName: member.user.lastName,
                        email: member.user.email,
                        phone: member.user.phone,
                    },
                    stats: {
                        attendedMeetings: attendedCount,
                        totalMeetings: totalMeetings,
                        attendanceRate: totalMeetings > 0
                            ? (attendedCount / totalMeetings) * 100
                            : 0,
                    },
                } satisfies BoardMemberWithUser;
            }),
        };
    } catch (error) {
        console.error('Error fetching board members:', error);
        return { error: 'Yönetim kurulu üyeleri yüklenirken bir hata oluştu', data: null };
    }
}

export async function getBoardMemberById(id: string) {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        const boardMember = await prisma.boardMember.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!boardMember) {
            return { error: 'Yönetim kurulu üyesi bulunamadı', data: null };
        }

        return {
            error: null,
            data: {
                id: boardMember.id,
                userId: boardMember.userId,
                title: boardMember.title,
                isActive: boardMember.isActive,
                createdAt: boardMember.createdAt.toISOString(),
                updatedAt: boardMember.updatedAt.toISOString(),
                user: {
                    id: boardMember.user.id,
                    username: boardMember.user.username,
                    firstName: boardMember.user.firstName,
                    lastName: boardMember.user.lastName,
                    email: boardMember.user.email,
                    phone: boardMember.user.phone,
                },
            } satisfies BoardMemberWithUser,
        };
    } catch (error) {
        console.error('Error fetching board member:', error);
        return { error: 'Yönetim kurulu üyesi yüklenirken bir hata oluştu', data: null };
    }
}

export async function createBoardMember(data: unknown) {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        const validated = createBoardMemberSchema.parse(data);
        let targetUserId = validated.userId;

        // If no userId provided, create a new user
        if (!targetUserId) {
            // Check if username or email already exists
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: validated.username?.toLowerCase() },
                        { email: validated.email },
                    ],
                },
            });

            if (existingUser) {
                return { error: 'Bu kullanıcı adı veya e-posta zaten kullanımda', data: null };
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(validated.password!, 10);

            // Create user
            const newUser = await prisma.user.create({
                data: {
                    username: validated.username!.toLowerCase(),
                    email: validated.email!,
                    password: hashedPassword,
                    firstName: validated.firstName,
                    lastName: validated.lastName,
                    role: UserRole.BOARD_MEMBER,
                    roles: [UserRole.BOARD_MEMBER],
                },
            });
            targetUserId = newUser.id;
        }

        // Check if user is already a board member
        const existing = await prisma.boardMember.findUnique({
            where: { userId: targetUserId },
        });

        if (existing) {
            return { error: 'Bu kullanıcı zaten yönetim kurulu üyesi', data: null };
        }

        const boardMember = await prisma.boardMember.create({
            data: {
                userId: targetUserId!,
                title: validated.title,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        return {
            error: null,
            data: {
                id: boardMember.id,
                userId: boardMember.userId,
                title: boardMember.title,
                isActive: boardMember.isActive,
                createdAt: boardMember.createdAt.toISOString(),
                updatedAt: boardMember.updatedAt.toISOString(),
                user: {
                    id: boardMember.user.id,
                    username: boardMember.user.username,
                    firstName: boardMember.user.firstName,
                    lastName: boardMember.user.lastName,
                    email: boardMember.user.email,
                    phone: boardMember.user.phone,
                },
            } satisfies BoardMemberWithUser,
        };
    } catch (error) {
        if ((error as any).name === 'ZodError') {
            return { error: (error as any).errors[0].message, data: null };
        }
        console.error('Error creating board member:', error);
        return { error: 'Yönetim kurulu üyesi oluşturulurken bir hata oluştu', data: null };
    }
}

export async function updateBoardMember(id: string, data: unknown) {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        const validated = updateBoardMemberSchema.parse(data);

        const updateData: Record<string, any> = {};
        if (validated.title !== undefined) updateData.title = validated.title;
        if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

        const boardMember = await prisma.boardMember.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        return {
            error: null,
            data: {
                id: boardMember.id,
                userId: boardMember.userId,
                title: boardMember.title,
                isActive: boardMember.isActive,
                createdAt: boardMember.createdAt.toISOString(),
                updatedAt: boardMember.updatedAt.toISOString(),
                user: {
                    id: boardMember.user.id,
                    username: boardMember.user.username,
                    firstName: boardMember.user.firstName,
                    lastName: boardMember.user.lastName,
                    email: boardMember.user.email,
                    phone: boardMember.user.phone,
                },
            } satisfies BoardMemberWithUser,
        };
    } catch (error) {
        if ((error as any).name === 'ZodError') {
            return { error: (error as any).errors[0].message, data: null };
        }
        console.error('Error updating board member:', error);
        return { error: 'Yönetim kurulu üyesi güncellenirken bir hata oluştu', data: null };
    }
}

export async function deleteBoardMember(id: string) {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        if (!id || typeof id !== 'string') {
            return { error: 'Geçersiz üye ID', data: null };
        }

        const boardMember = await prisma.boardMember.findUnique({
            where: { id },
        });

        if (!boardMember) {
            return { error: 'Yönetim kurulu üyesi bulunamadı', data: null };
        }

        await prisma.boardMember.delete({
            where: { id },
        });

        return { error: null, data: { success: true } };
    } catch (error: any) {
        console.error('Error deleting board member:', error);

        if (error?.code === 'P2025') {
            return { error: 'Yönetim kurulu üyesi bulunamadı', data: null };
        }

        const errorMessage = error?.message || 'Yönetim kurulu üyesi silinirken bir hata oluştu';
        return { error: errorMessage, data: null };
    }
}

export async function toggleBoardMemberStatus(id: string) {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        const boardMember = await prisma.boardMember.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!boardMember) {
            return { error: 'Yönetim kurulu üyesi bulunamadı', data: null };
        }

        const updated = await prisma.boardMember.update({
            where: { id },
            data: {
                isActive: !boardMember.isActive,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        return {
            error: null,
            data: {
                id: updated.id,
                userId: updated.userId,
                title: updated.title,
                isActive: updated.isActive,
                createdAt: updated.createdAt.toISOString(),
                updatedAt: updated.updatedAt.toISOString(),
                user: {
                    id: updated.user.id,
                    username: updated.user.username,
                    firstName: updated.user.firstName,
                    lastName: updated.user.lastName,
                    email: updated.user.email,
                    phone: updated.user.phone,
                },
            } satisfies BoardMemberWithUser,
        };
    } catch (error) {
        console.error('Error toggling board member status:', error);
        return { error: 'Üye durumu değiştirilirken bir hata oluştu', data: null };
    }
}

// Helper function to get all users (for selection in UI)
export async function getAllUsers() {
    try {
        const { error } = await requireActionAuth([UserRole.ADMIN]);
        if (error) return { error, data: null };

        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            },
            orderBy: {
                username: 'asc',
            },
        });

        return {
            error: null,
            data: users.map((user) => ({
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            })) satisfies UserSummary[],
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { error: 'Kullanıcılar yüklenirken bir hata oluştu', data: null };
    }
}
