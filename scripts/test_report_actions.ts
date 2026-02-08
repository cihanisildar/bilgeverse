import { getWeeklyParticipationReport, getEventsOverviewReport } from '../app/actions/reports';
import prisma from '../lib/prisma';

async function testActions() {
    console.log('--- Testing Report Actions ---');

    // Bypass auth for test if needed or mock session if possible
    // Since these use getServerSession, they might fail without a real request context
    // But I can check the database directly with the same logic to isolate.

    console.log('\nChecking getWeeklyParticipationReport Logic...');
    const now = new Date();
    // Use the same logic as the action
    const { startOfWeek, endOfWeek } = require('date-fns');
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    console.log(`Current Week: ${weekStart.toISOString()} - ${weekEnd.toISOString()}`);

    const tutors = await prisma.user.findMany({
        where: { role: 'TUTOR' },
        select: { id: true, firstName: true, lastName: true }
    });

    console.log(`Found ${tutors.length} tutors.`);

    for (const tutor of tutors.slice(0, 3)) {
        const sessionCount = await prisma.attendanceSession.count({
            where: {
                createdById: tutor.id,
                sessionDate: { gte: weekStart, lte: weekEnd }
            }
        });
        console.log(`Tutor ${tutor.firstName} has ${sessionCount} sessions this week.`);
    }

    console.log('\nChecking Events Overview Logic (Historical)...');
    const totalSessions = await prisma.attendanceSession.count();
    console.log(`Total Attendance Sessions in DB: ${totalSessions}`);

    const eventsOverview = await getEventsOverviewReport();
    if (eventsOverview.data) {
        console.log(`Events Overview Summary Total Events: ${eventsOverview.data.summary.totalEvents}`);
        console.log(`Events Overview Summary Total tutors in report: ${eventsOverview.data.tutors.length}`);
    } else {
        console.log(`Events Overview Error: ${eventsOverview.error}`);
    }

    await prisma.$disconnect();
}

testActions().catch(console.error);
