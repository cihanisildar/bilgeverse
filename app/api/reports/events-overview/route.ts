import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.BOARD_MEMBER)) {
            return NextResponse.json(
                { error: 'Unauthorized: Only admin and board members can access this endpoint' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const tutorId = searchParams.get('tutorId') || undefined;
        const eventTypeId = searchParams.get('eventTypeId') || undefined;

        // Get events from both Event and Part2Event models
        const [regularEvents, part2Events] = await Promise.all([
            prisma.event.findMany({
                where: {
                    createdForTutorId: tutorId,
                    eventTypeId,
                },
                include: {
                    eventType: true,
                    createdForTutor: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    participants: true,
                },
                orderBy: {
                    startDateTime: 'desc',
                },
            }),
            prisma.part2Event.findMany({
                where: {
                    eventTypeId,
                },
                include: {
                    eventType: true,
                    participants: true,
                },
                orderBy: {
                    eventDate: 'desc',
                },
            }),
        ]);

        const eventsReport = {
            regularEvents: regularEvents.map((event) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                startDateTime: event.startDateTime,
                endDateTime: event.endDateTime,
                location: event.location,
                capacity: event.capacity,
                status: event.status,
                eventType: event.eventType.name,
                tutor: event.createdForTutor,
                participantCount: event.participants.length,
                participants: event.participants,
            })),
            part2Events: part2Events.map((event) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                eventDate: event.eventDate,
                location: event.location,
                capacity: event.capacity,
                status: event.status,
                eventType: event.eventType.name,
                participantCount: event.participants.length,
                participants: event.participants,
            })),
        };

        return NextResponse.json(eventsReport, { status: 200 });
    } catch (error: any) {
        console.error('Events overview report error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
