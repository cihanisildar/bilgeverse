import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin tutors endpoint - Starting request');
    const session = await getServerSession(authOptions);
    console.log('Admin tutors endpoint - Current user:', { id: session?.user?.id, role: session?.user?.role });
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      console.log('Admin tutors endpoint - Unauthorized access:', { 
        isAuthenticated: !!session?.user,
        isAdmin: session?.user?.role === UserRole.ADMIN
      });
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    console.log('Admin tutors endpoint - Fetching tutors');
    // Fetch all tutors
    const tutors = await prisma.user.findMany({
      where: {
        role: UserRole.TUTOR,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        username: 'asc'
      }
    });
    console.log('Admin tutors endpoint - Found tutors:', tutors.length);

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error('Admin fetch tutors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 