const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });

  try {
    console.log('🔄 Testing database connection...');

    // Test basic connection
    await prisma.$connect();
    console.log('✅ Successfully connected to database');

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Simple query successful:', result);

    // Test getting periods
    const periodCount = await prisma.period.count();
    console.log('✅ Period count query successful:', periodCount, 'periods found');

  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);

    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Suggestion: Your Neon database may be sleeping or having connection issues');
      console.log('   - Try refreshing your Neon dashboard');
      console.log('   - Check if the database is active');
      console.log('   - Consider switching to the unpooled connection string');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();