import prisma from './prisma';
import { Prisma, WorkshopJoinRequestStatus } from '@prisma/client';



export async function getWorkshopJoinRequest(workshopId: string, studentId: string) {
    return await prisma.workshopJoinRequest.findUnique({
        where: {
            workshopId_studentId: {
                workshopId,
                studentId,
            },
        },
    });
}

export async function getPendingJoinRequests(workshopId: string) {
    return await prisma.workshopJoinRequest.findMany({
        where: {
            workshopId,
            status: WorkshopJoinRequestStatus.PENDING,
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                    username: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export const workshopInclude = {
    assignments: {
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true, username: true }
            }
        }
    },
    activities: {
        include: {
            tutor: { select: { firstName: true, lastName: true } },
            _count: { select: { attendances: { where: { status: true } } } }
        },
        orderBy: { date: 'desc' } as const
    },
    students: {
        include: {
            student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, tutorId: true, username: true } }
        }
    },
    courses: {
        orderBy: { date: 'asc' } as const
    },
    _count: {
        select: { students: true, activities: true }
    }
} as const;

export type WorkshopWithDetails = Prisma.WorkshopGetPayload<{
    include: {
        assignments: {
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true, username: true }
                }
            }
        },
        activities: {
            include: {
                tutor: { select: { firstName: true, lastName: true } },
                _count: { select: { attendances: { where: { status: true } } } }
            }
        },
        students: {
            include: {
                student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, tutorId: true, username: true } }
            }
        },
        _count: {
            select: { students: true, activities: true }
        }
    }
}> & {
    courses: {
        id: string;
        title: string;
        description: string | null;
        date: Date;
        isCompleted: boolean;
    }[];
};

export async function getWorkshopById(id: string): Promise<WorkshopWithDetails | null> {
    const workshop = await prisma.workshop.findUnique({
        where: { id },
        include: workshopInclude as any
    });

    return workshop as unknown as WorkshopWithDetails | null;
}

export async function getWorkshops(userId?: string, role?: string): Promise<WorkshopWithDetails[]> {
    const workshops = await prisma.workshop.findMany({
        include: workshopInclude as any,
        orderBy: { createdAt: 'desc' }
    });

    // For students, sort enrolled workshops first
    if (role === 'STUDENT' && userId) {
        const enrolled: WorkshopWithDetails[] = [];
        const notEnrolled: WorkshopWithDetails[] = [];

        workshops.forEach((workshop: any) => {
            const isEnrolled = workshop.students.some((s: any) => s.studentId === userId);
            if (isEnrolled) {
                enrolled.push(workshop);
            } else {
                notEnrolled.push(workshop);
            }
        });

        return [...enrolled, ...notEnrolled] as unknown as WorkshopWithDetails[];
    }

    return workshops as unknown as WorkshopWithDetails[];
}
