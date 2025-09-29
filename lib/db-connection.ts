import prisma from './prisma';

export const withDatabaseConnection = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Test connection
      await prisma.$queryRaw`SELECT 1`;
      // If connection is good, execute the operation
      return await operation();
    } catch (error: any) {
      lastError = error;

      if (error.message?.includes('Can\'t reach database server')) {
        console.warn(`Database connection failed (attempt ${i + 1}/${maxRetries}):`, error.message);

        // Wait before retry with exponential backoff
        if (i < maxRetries - 1) {
          const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } else {
        // For non-connection errors, don't retry
        throw error;
      }
    }
  }

  // If all retries failed, throw the last error
  console.error(`Database operation failed after ${maxRetries} attempts`);
  throw lastError;
};

// Helper for single database operations
export const executeWithRetry = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  return withDatabaseConnection(operation);
};