/**
 * Check if the test event has participants preventing deletion
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEventParticipants() {
  console.log('🔍 Checking event participants...\n');

  try {
    // Find the test event
    const testEvent = await prisma.event.findFirst({
      where: {
        title: 'test',
        periodId: '566c736e-92eb-4a47-9b59-f4a02abf739c' // test period ID
      },
      include: {
        participants: true,
        createdBy: {
          select: { username: true, role: true }
        },
        period: {
          select: { name: true }
        }
      }
    });

    if (!testEvent) {
      console.log('❌ Test event not found');
      return;
    }

    console.log('📋 Test Event Details:');
    console.log(`   ID: ${testEvent.id}`);
    console.log(`   Title: ${testEvent.title}`);
    console.log(`   Created by: ${testEvent.createdBy.username} (${testEvent.createdBy.role})`);
    console.log(`   Period: ${testEvent.period.name}`);
    console.log(`   Created at: ${testEvent.createdAt}`);
    console.log(`   Status: ${testEvent.status}`);
    console.log(`   Event Scope: ${testEvent.eventScope}`);

    console.log(`\n👥 Participants (${testEvent.participants.length}):`);
    if (testEvent.participants.length === 0) {
      console.log('   ✅ No participants - event should be deletable');
    } else {
      testEvent.participants.forEach((participant, index) => {
        console.log(`   ${index + 1}. User ID: ${participant.userId}`);
        console.log(`      Status: ${participant.status}`);
        console.log(`      Registered at: ${participant.createdAt}`);
      });
      console.log('\n   🚫 Has participants - this may prevent deletion');
    }

    // Also check any other related data that might prevent deletion
    console.log('\n🔍 Checking other potential blocking relations...');

    // Check if there are any foreign key constraints we're missing
    const eventWithAllRelations = await prisma.event.findUnique({
      where: { id: testEvent.id },
      include: {
        participants: true,
        createdBy: true,
        period: true,
        eventType: true,
        createdForTutor: true
      }
    });

    console.log('\n📊 All relations summary:');
    console.log(`   Participants: ${eventWithAllRelations?.participants.length || 0}`);
    console.log(`   Has creator: ${eventWithAllRelations?.createdBy ? 'Yes' : 'No'}`);
    console.log(`   Has period: ${eventWithAllRelations?.period ? 'Yes' : 'No'}`);
    console.log(`   Has event type: ${eventWithAllRelations?.eventType ? 'Yes' : 'No'}`);
    console.log(`   Created for tutor: ${eventWithAllRelations?.createdForTutor ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Error checking event participants:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  checkEventParticipants()
    .then(() => {
      console.log('\n✅ Event participant check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Event participant check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkEventParticipants };