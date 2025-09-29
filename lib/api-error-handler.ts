import { NextResponse } from 'next/server';

export function handleDatabaseError(error: any, context: string = 'Database operation') {
  console.error(`${context} error:`, error);

  // Prisma connection errors
  if (error.message?.includes('Can\'t reach database server')) {
    return NextResponse.json(
      {
        error: 'Database connection temporarily unavailable. Please try again in a moment.',
        code: 'DB_CONNECTION_ERROR'
      },
      { status: 503 }
    );
  }

  // Prisma timeout errors
  if (error.message?.includes('timeout')) {
    return NextResponse.json(
      {
        error: 'Database request timed out. Please try again.',
        code: 'DB_TIMEOUT_ERROR'
      },
      { status: 504 }
    );
  }

  // Prisma validation errors
  if (error.code === 'P2002') {
    return NextResponse.json(
      {
        error: 'A record with this information already exists.',
        code: 'UNIQUE_CONSTRAINT_ERROR'
      },
      { status: 409 }
    );
  }

  // Foreign key constraint errors
  if (error.code === 'P2003') {
    return NextResponse.json(
      {
        error: 'This operation would violate data relationships.',
        code: 'FOREIGN_KEY_ERROR'
      },
      { status: 400 }
    );
  }

  // Record not found errors
  if (error.code === 'P2025') {
    return NextResponse.json(
      {
        error: 'The requested resource was not found.',
        code: 'NOT_FOUND_ERROR'
      },
      { status: 404 }
    );
  }

  // Generic database errors
  if (error.name === 'PrismaClientKnownRequestError' ||
      error.name === 'PrismaClientInitializationError') {
    return NextResponse.json(
      {
        error: 'Database error occurred. Please try again later.',
        code: 'DB_GENERIC_ERROR'
      },
      { status: 500 }
    );
  }

  // Default error response
  return NextResponse.json(
    {
      error: error.message || 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    { status: 500 }
  );
}

export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleDatabaseError(error, context);
    }
  };
}