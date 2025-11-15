/**
 * This script migrates existing responsibleUserId data to the new DecisionResponsibleUser table
 * Run this after prisma db push and before removing the old responsibleUserId field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateResponsibleUsers() {
  try {
    console.log('Migration script: This migration has already been completed.');
    console.log('The responsibleUserId field has been removed from the schema.');
    console.log('All decisions now use the DecisionResponsibleUser relation table.');
    console.log('No action needed.');
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

