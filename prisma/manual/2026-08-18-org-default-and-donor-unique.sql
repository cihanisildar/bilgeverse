-- =====================================================================
-- Bilgeverse — 2026-08-18
-- 1) organizationId varsayılanı: ROOT_ORG_ID → '__NO_ORG__' sentinel
-- 2) Donor.email: global tekil → (organizationId, email) bileşik tekil
--
-- HİÇBİR SATIR DEĞİŞMEZ. Sadece kolon varsayılanları ve tek bir index.
-- Mevcut satırların organizationId değerleri olduğu gibi kalır; varsayılan
-- yalnızca BUNDAN SONRA eklenecek ve organizationId verilmeyen satırlar için
-- geçerlidir (ki uygulama her yazmada değeri kendisi koyuyor).
--
-- Tamamı tek transaction: bir adım hata verirse hiçbiri uygulanmaz.
-- =====================================================================

BEGIN;

-- Güvenlik kilidi: bileşik tekil kısıt kurulmadan önce çakışma var mı?
DO $$
DECLARE dupes int;
BEGIN
  SELECT count(*) INTO dupes FROM (
    SELECT 1 FROM "Donor"
    WHERE email IS NOT NULL
    GROUP BY "organizationId", email
    HAVING count(*) > 1
  ) t;
  IF dupes > 0 THEN
    RAISE EXCEPTION 'Donor tablosunda % adet (organizationId, email) çakışması var — göç durduruldu', dupes;
  END IF;
END $$;

-- DropIndex
DROP INDEX "Donor_email_key";

-- AlterTable
ALTER TABLE "AbsenceNotification" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyAssignment" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyAttendance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyLesson" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyMaterial" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademySession" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyStudent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyStudentNote" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademySyllabus" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademySyllabusItem" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyTask" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AcademyTaskCompletion" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AthleteAttendance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AthleteEvaluation" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AthletePerformance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AthleteProfile" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AthleteTraining" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "AttendanceSession" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "BoardMember" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "CenterTask" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "CharacterGroup" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Classroom" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ClassroomLessonProgress" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ContentIdea" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ContentIngredient" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "DecisionResponsibleUser" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "DisciplineRecord" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "DisciplineRule" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Donation" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Donor" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Equipment" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "EventParticipant" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "EventType" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ExperienceTransaction" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ExpulsionRecord" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "FinanceTransaction" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "FootballFee" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "FootballPayment" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "GraduatedStudent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "InventoryItem" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ItemRequest" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ManagerMeeting" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "MatchParticipation" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "MeetingAttendance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "MeetingDecision" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "OrientationProcess" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ParentFeedback" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Part2Event" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Part2EventParticipant" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Part2EventType" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "PartPdf" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Period" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "PeriodStudent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "PointEarningCard" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "PointReason" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "PointsTransaction" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "RecurringTask" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "RegistrationRequest" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "ScholarshipStudent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SocialEvent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SocialPost" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SportAnnouncement" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SportBranch" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SportFeedback" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SportMatch" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SportTransaction" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "StoreItem" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "StudentAttendance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "StudentNote" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "StudentReport" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "StudentTag" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Syllabus" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "SyllabusLesson" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TagTemplate" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TransactionRollback" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TutorCandidate" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TutorPromotion" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TutorTrainingProgram" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "TutorTrainingRecord" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WeeklyReport" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WeeklyReportFixedCriteria" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WeeklyReportQuestion" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WeeklyReportQuestionResponse" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WeeklyReportVariableCriteria" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Wish" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "Workshop" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopActivity" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopAssignment" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopAttendance" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopCourse" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopJoinRequest" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- AlterTable
ALTER TABLE "WorkshopStudent" ALTER COLUMN "organizationId" SET DEFAULT '__NO_ORG__';

-- CreateIndex
CREATE UNIQUE INDEX "Donor_organizationId_email_key" ON "Donor"("organizationId", "email");


COMMIT;
