-- =====================================================================
-- Bilgeverse — Çok kurumlu (multi-tenant) yapıya geçiş
-- Üretim: prisma migrate diff (canlı DB <-> yeni schema.prisma)
--
-- GÜVENLİK NOTLARI
--   * Tamamı TEK TRANSACTION içinde: hata olursa hiçbir şey uygulanmaz.
--   * Yıkıcı komut YOK — DROP TABLE / DROP COLUMN / DELETE / TRUNCATE yok.
--   * 8 adet DROP INDEX yalnızca eskiyen global unique kısıtları kaldırır;
--     satırlara dokunmaz. Yerlerine kurum-bazlı bileşik kısıtlar gelir.
--   * ADD COLUMN ... NOT NULL DEFAULT, Postgres 11+ üzerinde tabloyu yeniden
--     yazmaz ve mevcut TÜM satırları tek işlemde ana kuruma bağlar.
--   * Kurum kayıtları da aynı transaction'da eklenir; böylece "şema hazır ama
--     kurum yok" boşluğu hiç oluşmaz ve uygulama kesintisiz kalır.
--
-- ÇALIŞTIRMADAN ÖNCE: yedek alınmış olmalı.
-- =====================================================================

BEGIN;

-- DropIndex
DROP INDEX "EventType_name_key";

-- DropIndex
DROP INDEX "Part2EventType_name_key";

-- DropIndex
DROP INDEX "Period_name_key";

-- DropIndex
DROP INDEX "PointReason_name_key";

-- DropIndex
DROP INDEX "SportBranch_name_key";

-- DropIndex
DROP INDEX "TagTemplate_name_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "AbsenceNotification" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyAssignment" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyAttendance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyLesson" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyMaterial" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademySession" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyStudent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyStudentNote" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademySyllabus" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademySyllabusItem" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyTask" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AcademyTaskCompletion" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AthleteAttendance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AthleteEvaluation" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AthletePerformance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AthleteTraining" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "BoardMember" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "CenterTask" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "CharacterGroup" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Classroom" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ClassroomLessonProgress" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ContentIdea" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ContentIngredient" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "DecisionResponsibleUser" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "DisciplineRecord" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "DisciplineRule" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Donor" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "EventParticipant" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ExperienceTransaction" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ExpulsionRecord" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "FinanceTransaction" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "FootballFee" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "FootballPayment" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "GraduatedStudent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ItemRequest" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ManagerMeeting" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "MatchParticipation" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "MeetingAttendance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "MeetingDecision" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "OrientationProcess" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ParentFeedback" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Part2Event" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Part2EventParticipant" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Part2EventType" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "PartPdf" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "PeriodStudent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "PointEarningCard" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "PointReason" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "PointsTransaction" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "RecurringTask" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "ScholarshipStudent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SocialEvent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SportAnnouncement" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SportBranch" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SportFeedback" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SportMatch" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SportTransaction" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "StoreItem" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "StudentAttendance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "StudentNote" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "StudentReport" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "StudentTag" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Syllabus" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "SyllabusLesson" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TagTemplate" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TransactionRollback" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TutorCandidate" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TutorPromotion" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TutorTrainingProgram" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "TutorTrainingRecord" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WeeklyReport" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WeeklyReportFixedCriteria" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WeeklyReportQuestion" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WeeklyReportQuestionResponse" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WeeklyReportVariableCriteria" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Wish" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "Workshop" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopActivity" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopAssignment" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopAttendance" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopCourse" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopJoinRequest" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- AlterTable
ALTER TABLE "WorkshopStudent" ADD COLUMN     "organizationId" TEXT NOT NULL DEFAULT 'org_bilgeder_000000000000001';

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "packageIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "extraParts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "excludedParts" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "licenseExpiresAt" TIMESTAMP(3),
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "AbsenceNotification_organizationId_idx" ON "AbsenceNotification"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyAssignment_organizationId_idx" ON "AcademyAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyAttendance_organizationId_idx" ON "AcademyAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyLesson_organizationId_idx" ON "AcademyLesson"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyMaterial_organizationId_idx" ON "AcademyMaterial"("organizationId");

-- CreateIndex
CREATE INDEX "AcademySession_organizationId_idx" ON "AcademySession"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyStudent_organizationId_idx" ON "AcademyStudent"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyStudentNote_organizationId_idx" ON "AcademyStudentNote"("organizationId");

-- CreateIndex
CREATE INDEX "AcademySyllabus_organizationId_idx" ON "AcademySyllabus"("organizationId");

-- CreateIndex
CREATE INDEX "AcademySyllabusItem_organizationId_idx" ON "AcademySyllabusItem"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyTask_organizationId_idx" ON "AcademyTask"("organizationId");

-- CreateIndex
CREATE INDEX "AcademyTaskCompletion_organizationId_idx" ON "AcademyTaskCompletion"("organizationId");

-- CreateIndex
CREATE INDEX "Announcement_organizationId_idx" ON "Announcement"("organizationId");

-- CreateIndex
CREATE INDEX "AthleteAttendance_organizationId_idx" ON "AthleteAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "AthleteEvaluation_organizationId_idx" ON "AthleteEvaluation"("organizationId");

-- CreateIndex
CREATE INDEX "AthletePerformance_organizationId_idx" ON "AthletePerformance"("organizationId");

-- CreateIndex
CREATE INDEX "AthleteProfile_organizationId_idx" ON "AthleteProfile"("organizationId");

-- CreateIndex
CREATE INDEX "AthleteTraining_organizationId_idx" ON "AthleteTraining"("organizationId");

-- CreateIndex
CREATE INDEX "AttendanceSession_organizationId_idx" ON "AttendanceSession"("organizationId");

-- CreateIndex
CREATE INDEX "BoardMember_organizationId_idx" ON "BoardMember"("organizationId");

-- CreateIndex
CREATE INDEX "CenterTask_organizationId_idx" ON "CenterTask"("organizationId");

-- CreateIndex
CREATE INDEX "CharacterGroup_organizationId_idx" ON "CharacterGroup"("organizationId");

-- CreateIndex
CREATE INDEX "Classroom_organizationId_idx" ON "Classroom"("organizationId");

-- CreateIndex
CREATE INDEX "ClassroomLessonProgress_organizationId_idx" ON "ClassroomLessonProgress"("organizationId");

-- CreateIndex
CREATE INDEX "ContentIdea_organizationId_idx" ON "ContentIdea"("organizationId");

-- CreateIndex
CREATE INDEX "ContentIngredient_organizationId_idx" ON "ContentIngredient"("organizationId");

-- CreateIndex
CREATE INDEX "DecisionResponsibleUser_organizationId_idx" ON "DecisionResponsibleUser"("organizationId");

-- CreateIndex
CREATE INDEX "DisciplineRecord_organizationId_idx" ON "DisciplineRecord"("organizationId");

-- CreateIndex
CREATE INDEX "DisciplineRule_organizationId_idx" ON "DisciplineRule"("organizationId");

-- CreateIndex
CREATE INDEX "Donation_organizationId_idx" ON "Donation"("organizationId");

-- CreateIndex
CREATE INDEX "Donor_organizationId_idx" ON "Donor"("organizationId");

-- CreateIndex
CREATE INDEX "Equipment_organizationId_idx" ON "Equipment"("organizationId");

-- CreateIndex
CREATE INDEX "Event_organizationId_idx" ON "Event"("organizationId");

-- CreateIndex
CREATE INDEX "EventParticipant_organizationId_idx" ON "EventParticipant"("organizationId");

-- CreateIndex
CREATE INDEX "EventType_organizationId_idx" ON "EventType"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_organizationId_name_key" ON "EventType"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ExperienceTransaction_organizationId_idx" ON "ExperienceTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "ExpulsionRecord_organizationId_idx" ON "ExpulsionRecord"("organizationId");

-- CreateIndex
CREATE INDEX "FinanceTransaction_organizationId_idx" ON "FinanceTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "FootballFee_organizationId_idx" ON "FootballFee"("organizationId");

-- CreateIndex
CREATE INDEX "FootballPayment_organizationId_idx" ON "FootballPayment"("organizationId");

-- CreateIndex
CREATE INDEX "GraduatedStudent_organizationId_idx" ON "GraduatedStudent"("organizationId");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_idx" ON "InventoryItem"("organizationId");

-- CreateIndex
CREATE INDEX "ItemRequest_organizationId_idx" ON "ItemRequest"("organizationId");

-- CreateIndex
CREATE INDEX "ManagerMeeting_organizationId_idx" ON "ManagerMeeting"("organizationId");

-- CreateIndex
CREATE INDEX "MatchParticipation_organizationId_idx" ON "MatchParticipation"("organizationId");

-- CreateIndex
CREATE INDEX "MeetingAttendance_organizationId_idx" ON "MeetingAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "MeetingDecision_organizationId_idx" ON "MeetingDecision"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "OrientationProcess_organizationId_idx" ON "OrientationProcess"("organizationId");

-- CreateIndex
CREATE INDEX "ParentFeedback_organizationId_idx" ON "ParentFeedback"("organizationId");

-- CreateIndex
CREATE INDEX "Part2Event_organizationId_idx" ON "Part2Event"("organizationId");

-- CreateIndex
CREATE INDEX "Part2EventParticipant_organizationId_idx" ON "Part2EventParticipant"("organizationId");

-- CreateIndex
CREATE INDEX "Part2EventType_organizationId_idx" ON "Part2EventType"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Part2EventType_organizationId_name_key" ON "Part2EventType"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PartPdf_organizationId_idx" ON "PartPdf"("organizationId");

-- CreateIndex
CREATE INDEX "Period_organizationId_idx" ON "Period"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Period_organizationId_name_key" ON "Period"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PeriodStudent_organizationId_idx" ON "PeriodStudent"("organizationId");

-- CreateIndex
CREATE INDEX "PointEarningCard_organizationId_idx" ON "PointEarningCard"("organizationId");

-- CreateIndex
CREATE INDEX "PointReason_organizationId_idx" ON "PointReason"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PointReason_organizationId_name_key" ON "PointReason"("organizationId", "name");

-- CreateIndex
CREATE INDEX "PointsTransaction_organizationId_idx" ON "PointsTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "RecurringTask_organizationId_idx" ON "RecurringTask"("organizationId");

-- CreateIndex
CREATE INDEX "RegistrationRequest_organizationId_idx" ON "RegistrationRequest"("organizationId");

-- CreateIndex
CREATE INDEX "ScholarshipStudent_organizationId_idx" ON "ScholarshipStudent"("organizationId");

-- CreateIndex
CREATE INDEX "SocialEvent_organizationId_idx" ON "SocialEvent"("organizationId");

-- CreateIndex
CREATE INDEX "SocialPost_organizationId_idx" ON "SocialPost"("organizationId");

-- CreateIndex
CREATE INDEX "SportAnnouncement_organizationId_idx" ON "SportAnnouncement"("organizationId");

-- CreateIndex
CREATE INDEX "SportBranch_organizationId_idx" ON "SportBranch"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SportBranch_organizationId_name_key" ON "SportBranch"("organizationId", "name");

-- CreateIndex
CREATE INDEX "SportFeedback_organizationId_idx" ON "SportFeedback"("organizationId");

-- CreateIndex
CREATE INDEX "SportMatch_organizationId_idx" ON "SportMatch"("organizationId");

-- CreateIndex
CREATE INDEX "SportTransaction_organizationId_idx" ON "SportTransaction"("organizationId");

-- CreateIndex
CREATE INDEX "StoreItem_organizationId_idx" ON "StoreItem"("organizationId");

-- CreateIndex
CREATE INDEX "StudentAttendance_organizationId_idx" ON "StudentAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "StudentNote_organizationId_idx" ON "StudentNote"("organizationId");

-- CreateIndex
CREATE INDEX "StudentReport_organizationId_idx" ON "StudentReport"("organizationId");

-- CreateIndex
CREATE INDEX "StudentTag_organizationId_idx" ON "StudentTag"("organizationId");

-- CreateIndex
CREATE INDEX "Syllabus_organizationId_idx" ON "Syllabus"("organizationId");

-- CreateIndex
CREATE INDEX "SyllabusLesson_organizationId_idx" ON "SyllabusLesson"("organizationId");

-- CreateIndex
CREATE INDEX "TagTemplate_organizationId_idx" ON "TagTemplate"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TagTemplate_organizationId_name_key" ON "TagTemplate"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Tournament_organizationId_idx" ON "Tournament"("organizationId");

-- CreateIndex
CREATE INDEX "TransactionRollback_organizationId_idx" ON "TransactionRollback"("organizationId");

-- CreateIndex
CREATE INDEX "TutorCandidate_organizationId_idx" ON "TutorCandidate"("organizationId");

-- CreateIndex
CREATE INDEX "TutorPromotion_organizationId_idx" ON "TutorPromotion"("organizationId");

-- CreateIndex
CREATE INDEX "TutorTrainingProgram_organizationId_idx" ON "TutorTrainingProgram"("organizationId");

-- CreateIndex
CREATE INDEX "TutorTrainingRecord_organizationId_idx" ON "TutorTrainingRecord"("organizationId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_username_key" ON "User"("organizationId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "User_organizationId_email_key" ON "User"("organizationId", "email");

-- CreateIndex
CREATE INDEX "WeeklyReport_organizationId_idx" ON "WeeklyReport"("organizationId");

-- CreateIndex
CREATE INDEX "WeeklyReportFixedCriteria_organizationId_idx" ON "WeeklyReportFixedCriteria"("organizationId");

-- CreateIndex
CREATE INDEX "WeeklyReportQuestion_organizationId_idx" ON "WeeklyReportQuestion"("organizationId");

-- CreateIndex
CREATE INDEX "WeeklyReportQuestionResponse_organizationId_idx" ON "WeeklyReportQuestionResponse"("organizationId");

-- CreateIndex
CREATE INDEX "WeeklyReportVariableCriteria_organizationId_idx" ON "WeeklyReportVariableCriteria"("organizationId");

-- CreateIndex
CREATE INDEX "Wish_organizationId_idx" ON "Wish"("organizationId");

-- CreateIndex
CREATE INDEX "Workshop_organizationId_idx" ON "Workshop"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopActivity_organizationId_idx" ON "WorkshopActivity"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopAssignment_organizationId_idx" ON "WorkshopAssignment"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopAttendance_organizationId_idx" ON "WorkshopAttendance"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopCourse_organizationId_idx" ON "WorkshopCourse"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopJoinRequest_organizationId_idx" ON "WorkshopJoinRequest"("organizationId");

-- CreateIndex
CREATE INDEX "WorkshopStudent_organizationId_idx" ON "WorkshopStudent"("organizationId");


-- =====================================================================
-- Kurumlar (şema ile aynı transaction'da)
--   BILGEDER : mevcut tüm veri buraya bağlanır, 4 paket de açık
--   SYSTEM   : yalnız süper adminleri barındırır, paketi yok
-- =====================================================================

INSERT INTO "Organization"
  ("id", "code", "name", "isActive", "packageIds", "extraParts", "excludedParts", "createdAt", "updatedAt")
VALUES
  ('org_bilgeder_000000000000001', 'BILGEDER', 'Bilgeder',
   true, ARRAY[1,2,3,4], ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], NOW(), NOW()),
  ('org_system_00000000000000001', 'SYSTEM', 'Sistem Yönetimi',
   true, ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], ARRAY[]::INTEGER[], NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

COMMIT;
