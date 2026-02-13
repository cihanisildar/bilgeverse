import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillRoles() {
    console.log('🚀 Role backfill script starting...');

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                roles: true,
            }
        });

        console.log(`Found ${users.length} users to check.`);

        let updatedCount = 0;
        for (const user of users) {
            // Force sync: Ensure the current 'role' is in the 'roles' array
            // Since we just added the column, we want it to match the old source of truth exactly.
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    roles: [user.role]
                }
            });
            updatedCount++;
        }

        console.log(`✅ Successfully updated ${updatedCount} users.`);
        console.log('🎉 Backfill completed!');
    } catch (error) {
        console.error('❌ Error during backfill:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfillRoles();
