import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Diagnostic Report Data ---');

    const eventsCount = await prisma.event.count();
    const part2EventsCount = await prisma.part2Event.count();
    const sessionsCount = await prisma.attendanceSession.count();
    const tutorsCount = await prisma.user.count({ where: { role: 'TUTOR' } });

    console.log(`Total Events: ${eventsCount}`);
    console.log(`Total Part 2 Events (Workshops): ${part2EventsCount}`);
    console.log(`Total Attendance Sessions: ${sessionsCount}`);
    console.log(`Total Tutors: ${tutorsCount}`);

    const now = new Date();
    // Monday of this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`\nRange: ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);

    const eventsThisWeek = await prisma.event.count({
        where: { startDateTime: { gte: weekStart, lte: weekEnd } }
    });
    const part2EventsThisWeek = await prisma.part2Event.count({
        where: { eventDate: { gte: weekStart, lte: weekEnd } }
    });
    const sessionsThisWeek = await prisma.attendanceSession.count({
        where: { sessionDate: { gte: weekStart, lte: weekEnd } }
    });

    console.log(`Events this week: ${eventsThisWeek}`);
    console.log(`Part 2 Events this week: ${part2EventsThisWeek}`);
    console.log(`Attendance Sessions this week: ${sessionsThisWeek}`);

    console.log('\n--- Session Details ---');
    const recentSessions = await prisma.attendanceSession.findMany({
        take: 5,
        orderBy: { sessionDate: 'desc' },
        select: { title: true, sessionDate: true, createdById: true }
    });
    recentSessions.forEach(s => {
        console.log(`Session: "${s.title}" on ${s.sessionDate.toISOString()} by ${s.createdById}`);
    });

    console.log('\n--- Event Details ---');
    const allEvents = await prisma.event.findMany({
        select: { title: true, startDateTime: true, createdById: true, createdForTutorId: true }
    });
    allEvents.forEach(e => {
        console.log(`Event: "${e.title}" on ${e.startDateTime.toISOString()} (CreatedBy: ${e.createdById}, ForTutor: ${e.createdForTutorId})`);
    });

    await prisma.$disconnect();
}

main().catch(console.error);
