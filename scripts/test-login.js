const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('=== Testing Login Credentials ===\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        password: true,
      },
      take: 5
    });

    console.log(`Found ${users.length} users in database:\n`);

    for (const user of users) {
      console.log(`Username: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password hash: ${user.password.substring(0, 20)}...`);
      console.log(`Hash starts with $2a or $2b: ${user.password.startsWith('$2a') || user.password.startsWith('$2b')}`);
      console.log('---');
    }

    // Test a specific user
    console.log('\n=== Testing Specific User ===\n');
    console.log('Please enter a username to test:');
    const testUsername = process.argv[2];

    if (testUsername) {
      const testUser = await prisma.user.findUnique({
        where: { username: testUsername.toLowerCase() }
      });

      if (testUser) {
        console.log(`✅ User found: ${testUser.username}`);
        console.log(`Role: ${testUser.role}`);
        console.log(`Password hash length: ${testUser.password.length}`);

        // Test with a password if provided
        const testPassword = process.argv[3];
        if (testPassword) {
          const isValid = await bcrypt.compare(testPassword, testUser.password);
          console.log(`\nPassword "${testPassword}" is: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
        } else {
          console.log('\nTo test a password, run: node scripts/test-login.js <username> <password>');
        }
      } else {
        console.log(`❌ User not found: ${testUsername}`);
      }
    } else {
      console.log('To test a specific user, run: node scripts/test-login.js <username> [password]');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
