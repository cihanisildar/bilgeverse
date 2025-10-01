/**
 * Test direct event deletion to identify the issue
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEventDelete() {
  console.log('🧪 Testing event deletion...\n');

  const eventId = 'a4ab9d7f-3eef-4594-8774-fe57c6b60db5'; // test event ID

  try {
    // First, show the event exists
    const eventBefore = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
        createdBy: { select: { username: true } },
        period: { select: { name: true } }
      }
    });

    if (!eventBefore) {
      console.log('❌ Event not found - already deleted?');
      return;
    }

    console.log('📋 Event before deletion:');
    console.log(`   ID: ${eventBefore.id}`);
    console.log(`   Title: ${eventBefore.title}`);
    console.log(`   Creator: ${eventBefore.createdBy.username}`);
    console.log(`   Period: ${eventBefore.period.name}`);
    console.log(`   Participants: ${eventBefore.participants.length}`);

    // Try to delete the event directly using Prisma
    console.log('\n🗑️  Attempting direct deletion...');

    const deletedEvent = await prisma.event.delete({
      where: { id: eventId }
    });

    console.log('✅ Event deleted successfully!');
    console.log(`   Deleted event ID: ${deletedEvent.id}`);

    // Verify it's gone
    const eventAfter = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!eventAfter) {
      console.log('✅ Confirmed: Event no longer exists in database');
    } else {
      console.log('❌ Error: Event still exists after deletion');
    }

    // Check period count now
    const periodAfter = await prisma.period.findUnique({
      where: { id: '566c736e-92eb-4a47-9b59-f4a02abf739c' }, // test period
      include: {
        _count: { select: { events: true } }
      }
    });

    console.log(`\n📊 Test period events count: ${periodAfter?._count.events || 0}`);

  } catch (error) {
    console.error('❌ Error during deletion:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    // Check if it's a foreign key constraint error
    if (error.code === 'P2003') {
      console.log('\n🔍 Foreign key constraint violation detected');
      console.log('This means there are related records preventing deletion');
    } else if (error.code === 'P2025') {
      console.log('\n🔍 Record not found - event may have been deleted already');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  testEventDelete()
    .then(() => {
      console.log('\n✅ Event deletion test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Event deletion test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEventDelete };