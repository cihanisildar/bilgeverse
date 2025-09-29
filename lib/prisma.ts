import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
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