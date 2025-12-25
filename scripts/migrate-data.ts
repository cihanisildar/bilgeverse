import { PrismaClient } from '@prisma/client';

const backupDb = new PrismaClient({
    datasources: { db: { url: process.env.BACKUP_DATABASE_URL || '' } },
});

const mainDb = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL || '' } },
});

async function migrateData() {
    console.log('🚀 FULL Migration başlıyor...\n');

    try {
        // === PHASE 1: Base tables (no foreign keys) ===
        console.log('=== PHASE 1: Base Tables ===\n');

        const eventTypes = await backupDb.eventType.findMany();
        for (const item of eventTypes) await mainDb.eventType.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${eventTypes.length} EventType`);

        const periods = await backupDb.period.findMany();
        for (const item of periods) await mainDb.period.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${periods.length} Period`);

        const users = await backupDb.user.findMany();
        for (const user of users) {
            const { students, asistans, tutorId, assistedTutorId, studentClassroomId, ...userData } = user as any;
            await mainDb.user.upsert({ where: { id: user.id }, update: userData, create: userData });
        }
        console.log(`✓ ${users.length} User`);

        const storeItems = await backupDb.storeItem.findMany();
        for (const item of storeItems) await mainDb.storeItem.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${storeItems.length} StoreItem`);

        const pointReasons = await backupDb.pointReason.findMany();
        for (const item of pointReasons) await mainDb.pointReason.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${pointReasons.length} PointReason`);

        const pointCards = await backupDb.pointEarningCard.findMany();
        for (const item of pointCards) await mainDb.pointEarningCard.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${pointCards.length} PointEarningCard`);

        const part2EventTypes = await backupDb.part2EventType.findMany();
        for (const item of part2EventTypes) await mainDb.part2EventType.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${part2EventTypes.length} Part2EventType`);

        const questionTypes = await backupDb.weeklyReportQuestion.findMany();
        for (const item of questionTypes) await mainDb.weeklyReportQuestion.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${questionTypes.length} WeeklyReportQuestion\n`);

        // === PHASE 2: Tables with user FKs ===
        console.log('=== PHASE 2: User Relations ===\n');

        const classrooms = await backupDb.classroom.findMany();
        for (const item of classrooms) await mainDb.classroom.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${classrooms.length} Classroom`);

        // Update user FKs
        for (const user of users) {
            const { tutorId, assistedTutorId, studentClassroomId } = user;
            if (tutorId || assistedTutorId || studentClassroomId) {
                await mainDb.user.update({
                    where: { id: user.id },
                    data: { tutorId, assistedTutorId, studentClassroomId },
                });
            }
        }
        console.log(`✓ User relations updated`);

        const boardMembers = await backupDb.boardMember.findMany();
        for (const item of boardMembers) await mainDb.boardMember.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${boardMembers.length} BoardMember`);

        const syllabi = await backupDb.syllabus.findMany();
        for (const item of syllabi) await mainDb.syllabus.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${syllabi.length} Syllabus`);

        const syllabusLessons = await backupDb.syllabusLesson.findMany();
        for (const item of syllabusLessons) await mainDb.syllabusLesson.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${syllabusLessons.length} SyllabusLesson`);

        const parentFeedbacks = await backupDb.parentFeedback.findMany();
        for (const item of parentFeedbacks) await mainDb.parentFeedback.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${parentFeedbacks.length} ParentFeedback`);

        const partPdfs = await backupDb.partPdf.findMany();
        for (const item of partPdfs) await mainDb.partPdf.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${partPdfs.length} PartPdf`);

        const attendanceSessions = await backupDb.attendanceSession.findMany();
        for (const item of attendanceSessions) await mainDb.attendanceSession.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${attendanceSessions.length} AttendanceSession`);

        const studentAttendances = await backupDb.studentAttendance.findMany();
        for (const item of studentAttendances) await mainDb.studentAttendance.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${studentAttendances.length} StudentAttendance`);

        const absenceNotifs = await backupDb.absenceNotification.findMany();
        for (const item of absenceNotifs) await mainDb.absenceNotification.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${absenceNotifs.length} AbsenceNotification`);

        const managerMeetings = await backupDb.managerMeeting.findMany();
        for (const item of managerMeetings) await mainDb.managerMeeting.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${managerMeetings.length} ManagerMeeting`);

        const meetingAttendances = await backupDb.meetingAttendance.findMany();
        for (const item of meetingAttendances) await mainDb.meetingAttendance.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${meetingAttendances.length} MeetingAttendance`);

        const meetingDecisions = await backupDb.meetingDecision.findMany();
        for (const item of meetingDecisions) await mainDb.meetingDecision.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${meetingDecisions.length} MeetingDecision`);

        const decisionResponsibles = await backupDb.decisionResponsibleUser.findMany();
        for (const item of decisionResponsibles) await mainDb.decisionResponsibleUser.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${decisionResponsibles.length} DecisionResponsibleUser\n`);

        // === PHASE 3: Events and period-related ===
        console.log('=== PHASE 3: Events & Period Data ===\n');

        const events = await backupDb.event.findMany();
        for (const item of events) await mainDb.event.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${events.length} Event`);

        const eventParticipants = await backupDb.eventParticipant.findMany();
        for (const item of eventParticipants) await mainDb.eventParticipant.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${eventParticipants.length} EventParticipant`);

        const part2Events = await backupDb.part2Event.findMany();
        for (const item of part2Events) await mainDb.part2Event.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${part2Events.length} Part2Event`);

        const part2Participants = await backupDb.part2EventParticipant.findMany();
        for (const item of part2Participants) await mainDb.part2EventParticipant.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${part2Participants.length} Part2EventParticipant`);

        const itemRequests = await backupDb.itemRequest.findMany();
        for (const item of itemRequests) await mainDb.itemRequest.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${itemRequests.length} ItemRequest`);

        const pointsTx = await backupDb.pointsTransaction.findMany();
        for (const item of pointsTx) await mainDb.pointsTransaction.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${pointsTx.length} PointsTransaction`);

        const expTx = await backupDb.experienceTransaction.findMany();
        for (const item of expTx) await mainDb.experienceTransaction.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${expTx.length} ExperienceTransaction`);

        const wishes = await backupDb.wish.findMany();
        for (const item of wishes) await mainDb.wish.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${wishes.length} Wish`);

        const studentNotes = await backupDb.studentNote.findMany();
        for (const item of studentNotes) await mainDb.studentNote.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${studentNotes.length} StudentNote`);

        const studentReports = await backupDb.studentReport.findMany();
        for (const item of studentReports) await mainDb.studentReport.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${studentReports.length} StudentReport`);

        const announcements = await backupDb.announcement.findMany();
        for (const item of announcements) await mainDb.announcement.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${announcements.length} Announcement`);

        const rollbacks = await backupDb.transactionRollback.findMany();
        for (const item of rollbacks) await mainDb.transactionRollback.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${rollbacks.length} TransactionRollback`);

        const weeklyReports = await backupDb.weeklyReport.findMany();
        for (const item of weeklyReports) await mainDb.weeklyReport.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${weeklyReports.length} WeeklyReport`);

        const weeklyFixed = await backupDb.weeklyReportFixedCriteria.findMany();
        for (const item of weeklyFixed) await mainDb.weeklyReportFixedCriteria.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${weeklyFixed.length} WeeklyReportFixedCriteria`);

        const weeklyVariable = await backupDb.weeklyReportVariableCriteria.findMany();
        for (const item of weeklyVariable) await mainDb.weeklyReportVariableCriteria.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${weeklyVariable.length} WeeklyReportVariableCriteria`);

        const weeklyResponses = await backupDb.weeklyReportQuestionResponse.findMany();
        for (const item of weeklyResponses) await mainDb.weeklyReportQuestionResponse.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${weeklyResponses.length} WeeklyReportQuestionResponse`);

        const notifications = await backupDb.notification.findMany();
        for (const item of notifications) await mainDb.notification.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${notifications.length} Notification`);

        const registrationReqs = await backupDb.registrationRequest.findMany();
        for (const item of registrationReqs) await mainDb.registrationRequest.upsert({ where: { id: item.id }, update: item, create: item });
        console.log(`✓ ${registrationReqs.length} RegistrationRequest\n`);

        console.log('\n🎉 ✨ MIGRATION BAŞARIYLA TAMAMLANDI! ✨ 🎉\n');
    } catch (error) {
        console.error('\n❌ Migration hatası:', error);
        throw error;
    } finally {
        await backupDb.$disconnect();
        await mainDb.$disconnect();
    }
}

migrateData();
