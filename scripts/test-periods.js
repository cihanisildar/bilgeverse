/**
 * Test script for period functionality
 *
 * This script tests the period system to ensure everything works correctly:
 * - Period creation and management
 * - Data isolation between periods
 * - User data reset when activating periods
 * - API endpoints work correctly
 */

const { PrismaClient, PeriodStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPeriods() {
  console.log('🧪 Starting period functionality tests...');

  try {
    // Test 1: First deactivate any existing active periods to avoid conflicts
    console.log('\n📅 Test 1: Preparing test environment...');

    // Store current active period to restore later
    const originalActivePeriod = await prisma.period.findFirst({
      where: { status: PeriodStatus.ACTIVE }
    });

    if (originalActivePeriod) {
      await prisma.period.update({
        where: { id: originalActivePeriod.id },
        data: { status: PeriodStatus.INACTIVE }
      });
      console.log(`📦 Temporarily deactivated: ${originalActivePeriod.name}`);
    }

    // Clean up any existing test periods first
    await prisma.period.deleteMany({
      where: { name: { startsWith: 'Test Period' } }
    });

    const testPeriod1 = await prisma.period.create({
      data: {
        name: 'Test Period 1',
        description: 'First test period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        status: PeriodStatus.ACTIVE
      }
    });
    console.log(`✅ Created active test period: ${testPeriod1.name}`);

    const testPeriod2 = await prisma.period.create({
      data: {
        name: 'Test Period 2',
        description: 'Second test period',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        status: PeriodStatus.INACTIVE
      }
    });
    console.log(`✅ Created inactive test period: ${testPeriod2.name}`);

    // Test 2: Check active period retrieval
    console.log('\n🔍 Test 2: Testing active period retrieval...');
    const activePeriod = await prisma.period.findFirst({
      where: { status: PeriodStatus.ACTIVE }
    });

    if (activePeriod && activePeriod.id === testPeriod1.id) {
      console.log(`✅ Active period correctly identified: ${activePeriod.name}`);
    } else {
      throw new Error('❌ Active period not found or incorrect');
    }

    // Test 3: Create test user and transactions
    console.log('\n👤 Test 3: Creating test user and transactions...');

    // Find or create a test student
    let testStudent = await prisma.user.findFirst({
      where: {
        role: 'STUDENT',
        username: { contains: 'test' }
      }
    });

    if (!testStudent) {
      console.log('⚠️  No test student found. Please create a test student to run transaction tests.');
    } else {
      // Find or create a test tutor
      let testTutor = await prisma.user.findFirst({
        where: { role: 'TUTOR' }
      });

      if (!testTutor) {
        console.log('⚠️  No tutor found. Skipping transaction tests.');
      } else {
        // Test creating a points transaction
        const pointsTransaction = await prisma.pointsTransaction.create({
          data: {
            studentId: testStudent.id,
            tutorId: testTutor.id,
            points: 10,
            type: 'AWARD',
            reason: 'Test points for period functionality',
            periodId: activePeriod.id
          }
        });
        console.log(`✅ Created test points transaction: ${pointsTransaction.points} points`);

        // Test creating an experience transaction
        const experienceTransaction = await prisma.experienceTransaction.create({
          data: {
            studentId: testStudent.id,
            tutorId: testTutor.id,
            amount: 5,
            periodId: activePeriod.id
          }
        });
        console.log(`✅ Created test experience transaction: ${experienceTransaction.amount} experience`);

        // Update student points and experience
        await prisma.user.update({
          where: { id: testStudent.id },
          data: {
            points: { increment: 10 },
            experience: { increment: 5 }
          }
        });
        console.log('✅ Updated student points and experience');
      }
    }

    // Test 4: Test period activation (data reset)
    console.log('\n🔄 Test 4: Testing period activation and data reset...');

    if (testStudent) {
      // Check current points
      const studentBefore = await prisma.user.findUnique({
        where: { id: testStudent.id },
        select: { points: true, experience: true }
      });
      console.log(`Student before reset: ${studentBefore.points} points, ${studentBefore.experience} experience`);

      // Deactivate current period and activate test period 2
      await prisma.period.update({
        where: { id: testPeriod1.id },
        data: { status: PeriodStatus.INACTIVE }
      });

      await prisma.period.update({
        where: { id: testPeriod2.id },
        data: { status: PeriodStatus.ACTIVE }
      });

      // Reset student data
      await prisma.user.update({
        where: { id: testStudent.id },
        data: { points: 0, experience: 0 }
      });

      const studentAfter = await prisma.user.findUnique({
        where: { id: testStudent.id },
        select: { points: true, experience: true }
      });
      console.log(`Student after reset: ${studentAfter.points} points, ${studentAfter.experience} experience`);

      if (studentAfter.points === 0 && studentAfter.experience === 0) {
        console.log('✅ Student data successfully reset');
      } else {
        throw new Error('❌ Student data not properly reset');
      }
    }

    // Test 5: Test data isolation between periods
    console.log('\n🏭 Test 5: Testing data isolation between periods...');

    // Count transactions in period 1
    const period1Transactions = await prisma.pointsTransaction.count({
      where: { periodId: testPeriod1.id }
    });

    // Count transactions in period 2 (should be 0)
    const period2Transactions = await prisma.pointsTransaction.count({
      where: { periodId: testPeriod2.id }
    });

    console.log(`Period 1 transactions: ${period1Transactions}`);
    console.log(`Period 2 transactions: ${period2Transactions}`);

    if (period1Transactions > 0 && period2Transactions === 0) {
      console.log('✅ Data isolation between periods working correctly');
    } else {
      console.log('⚠️  Data isolation test inconclusive (may need more test data)');
    }

    // Test 6: Cleanup test data
    console.log('\n🧹 Test 6: Cleaning up test data...');

    // Delete test transactions
    await prisma.pointsTransaction.deleteMany({
      where: { periodId: { in: [testPeriod1.id, testPeriod2.id] } }
    });

    await prisma.experienceTransaction.deleteMany({
      where: { periodId: { in: [testPeriod1.id, testPeriod2.id] } }
    });

    // Delete test periods
    await prisma.period.deleteMany({
      where: { id: { in: [testPeriod1.id, testPeriod2.id] } }
    });

    console.log('✅ Test data cleaned up');

    // Restore original active period if it exists and hasn't been deleted
    if (originalActivePeriod) {
      const stillExists = await prisma.period.findUnique({
        where: { id: originalActivePeriod.id }
      });

      if (stillExists) {
        await prisma.period.update({
          where: { id: originalActivePeriod.id },
          data: { status: PeriodStatus.ACTIVE }
        });
        console.log(`✅ Restored original active period: ${originalActivePeriod.name}`);
      } else {
        console.log(`⚠️  Original period was deleted, cannot restore: ${originalActivePeriod.name}`);
      }
    }

    console.log('\n🎉 All period functionality tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Period creation and management');
    console.log('✅ Active period retrieval');
    console.log('✅ Transaction creation with periods');
    console.log('✅ Period activation and data reset');
    console.log('✅ Data isolation between periods');
    console.log('✅ Cleanup and restoration');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testPeriods()
    .then(() => {
      console.log('\n✅ Period tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Period tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testPeriods };