/**
 * This script migrates existing responsibleUserId data to the new DecisionResponsibleUser table
 * Run this after prisma db push and before removing the old responsibleUserId field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateResponsibleUsers() {
  try {
    console.log('Starting migration of responsible users...');

    // Get all decisions with responsibleUserId
    const decisions = await prisma.meetingDecision.findMany({
      where: {
        responsibleUserId: {
          not: null,
        },
      },
      select: {
        id: true,
        responsibleUserId: true,
      },
    });

    console.log(`Found ${decisions.length} decisions with responsibleUserId`);

    // Migrate each decision
    for (const decision of decisions) {
      if (decision.responsibleUserId) {
        // Check if the relationship already exists
        const existing = await prisma.decisionResponsibleUser.findFirst({
          where: {
            decisionId: decision.id,
            userId: decision.responsibleUserId,
          },
        });

        if (!existing) {
          await prisma.decisionResponsibleUser.create({
            data: {
              decisionId: decision.id,
              userId: decision.responsibleUserId,
            },
          });
          console.log(`Migrated decision ${decision.id} -> user ${decision.responsibleUserId}`);
        } else {
          console.log(`Relationship already exists for decision ${decision.id}`);
        }
      }
    }

    console.log('Migration completed successfully!');
    console.log('You can now remove the responsibleUserId field from the schema and run prisma db push again.');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateResponsibleUsers()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

