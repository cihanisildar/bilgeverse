import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateLessonProgress() {
    console.log('🔄 Migrating lesson progress to per-classroom tracking...\n');

    try {
        // Step 1: Add new columns to Syllabus
        await prisma.$executeRaw`ALTER TABLE "Syllabus" ADD COLUMN IF NOT EXISTS "isGlobal" BOOLEAN NOT NULL DEFAULT false`;
        console.log('✓ Added isGlobal column to Syllabus');

        // Step 2: Create ClassroomLessonProgress table
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS "ClassroomLessonProgress" (
                "id" TEXT NOT NULL,
                "classroomId" TEXT NOT NULL,
                "syllabusId" TEXT NOT NULL,
                "lessonId" TEXT NOT NULL,
                "isTaught" BOOLEAN NOT NULL DEFAULT false,
                "taughtDate" TIMESTAMP(3),
                "notes" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "ClassroomLessonProgress_pkey" PRIMARY KEY ("id")
            )
        `;
        console.log('✓ Created ClassroomLessonProgress table');

        // Step 3: Add constraints
        await prisma.$executeRaw`
            CREATE UNIQUE INDEX IF NOT EXISTS "ClassroomLessonProgress_classroomId_lessonId_key" 
            ON "ClassroomLessonProgress"("classroomId", "lessonId")
        `;
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "ClassroomLessonProgress_classroomId_idx" 
            ON "ClassroomLessonProgress"("classroomId")
        `;
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "ClassroomLessonProgress_syllabusId_idx" 
            ON "ClassroomLessonProgress"("syllabusId")
        `;
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS "ClassroomLessonProgress_lessonId_idx" 
            ON "ClassroomLessonProgress"("lessonId")
        `;
        console.log('✓ Added indexes');

        // Step 4: Add foreign keys (wrap in try-catch as they might already exist)
        try {
            await prisma.$executeRaw`
                ALTER TABLE "ClassroomLessonProgress" 
                ADD CONSTRAINT "ClassroomLessonProgress_classroomId_fkey" 
                FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE
            `;
        } catch (e: any) {
            if (!e.message.includes('already exists')) throw e;
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE "ClassroomLessonProgress" 
                ADD CONSTRAINT "ClassroomLessonProgress_syllabusId_fkey" 
                FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE
            `;
        } catch (e: any) {
            if (!e.message.includes('already exists')) throw e;
        }

        try {
            await prisma.$executeRaw`
                ALTER TABLE "ClassroomLessonProgress" 
                ADD CONSTRAINT "ClassroomLessonProgress_lessonId_fkey" 
                FOREIGN KEY ("lessonId") REFERENCES "SyllabusLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
            `;
        } catch (e: any) {
            if (!e.message.includes('already exists')) throw e;
        }
        console.log('✓ Added foreign key constraints');

        // Step 5: Migrate existing lesson progress data
        console.log('\n📦 Migrating existing lesson progress data...');

        const lessons = await prisma.$queryRaw<Array<{
            id: string;
            syllabusId: string;
            isTaught: boolean;
            taughtDate: Date | null;
            notes: string | null;
        }>>`
            SELECT id, "syllabusId", "isTaught", "taughtDate", notes 
            FROM "SyllabusLesson"
            WHERE "isTaught" = true OR "taughtDate" IS NOT NULL OR notes IS NOT NULL
        `;

        console.log(`Found ${lessons.length} lessons with progress data`);

        if (lessons.length > 0) {
            // Get all syllabi with their creators (tutors)
            const syllabi = await prisma.syllabus.findMany({
                include: {
                    createdBy: {
                        include: {
                            classroom: true
                        }
                    }
                }
            });

            let migratedCount = 0;
            for (const lesson of lessons) {
                const syllabus = syllabi.find(s => s.id === lesson.syllabusId);
                if (syllabus?.createdBy?.classroom) {
                    await prisma.$executeRaw`
                        INSERT INTO "ClassroomLessonProgress" 
                        (id, "classroomId", "syllabusId", "lessonId", "isTaught", "taughtDate", notes, "createdAt", "updatedAt")
                        VALUES (
                            gen_random_uuid()::text,
                            ${syllabus.createdBy.classroom.id},
                            ${lesson.syllabusId},
                            ${lesson.id},
                            ${lesson.isTaught},
                            ${lesson.taughtDate},
                            ${lesson.notes},
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )
                        ON CONFLICT ("classroomId", "lessonId") DO NOTHING
                    `;
                    migratedCount++;
                }
            }
            console.log(`✓ Migrated ${migratedCount} lesson progress records`);
        }

        // Step 6: Drop old columns from SyllabusLesson
        await prisma.$executeRaw`ALTER TABLE "SyllabusLesson" DROP COLUMN IF EXISTS "isTaught"`;
        await prisma.$executeRaw`ALTER TABLE "SyllabusLesson" DROP COLUMN IF EXISTS "taughtDate"`;
        await prisma.$executeRaw`ALTER TABLE "SyllabusLesson" DROP COLUMN IF EXISTS "notes"`;
        console.log('✓ Removed old columns from SyllabusLesson\n');

        console.log('✨ Migration complete!\n');
        console.log('Summary:');
        console.log('  • Syllabus now has isGlobal flag');
        console.log('  • ClassroomLessonProgress table created');
        console.log('  • Existing progress data migrated');
        console.log('  • Each classroom can now track progress independently\n');

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateLessonProgress();
