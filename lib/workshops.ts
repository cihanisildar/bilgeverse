import prisma from './prisma';
import { Prisma } from '@prisma/client';

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

export async function getWorkshops(): Promise<WorkshopWithDetails[]> {
    const workshops = await prisma.workshop.findMany({
        include: workshopInclude as any,
        orderBy: { createdAt: 'desc' }
    });

    return workshops as unknown as WorkshopWithDetails[];
}
