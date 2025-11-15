import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Parse DATABASE_URL and add connection pool parameters if not present
  let databaseUrl = process.env.DATABASE_URL || '';
  
  // Add connection pool parameters to handle concurrent requests
  // connection_limit: Maximum number of connections in the pool (default is 1)
  // pool_timeout: Maximum time to wait for a connection (default is 10 seconds)
  if (databaseUrl && !databaseUrl.includes('connection_limit')) {
    try {
      const url = new URL(databaseUrl);
      url.searchParams.set('connection_limit', '10');
      url.searchParams.set('pool_timeout', '60');
      databaseUrl = url.toString();
    } catch (error) {
      // If URL parsing fails, try to append parameters manually
      // This handles PostgreSQL connection strings that might not be standard URLs
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}connection_limit=10&pool_timeout=60`;
    }
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    transactionOptions: {
      timeout: 10000, // 10 seconds default timeout
    },
  });

  // Handle connection errors gracefully
  prisma.$connect().catch(error => {
    console.error('Failed to connect to database:', error);
  });

  return prisma;
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma; 