import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getUserFromRequest, isAuthenticated, isAdmin, isTutor } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!isAuthenticated(currentUser)) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const searchQuery = searchParams.get('q');
    const tutorId = searchParams.get('tutorId');
    const assigned = searchParams.get('assigned') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let where: any = {};
    
    // Filter by role if provided
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      where.role = role;
    }
    
    // Filter by tutorId if provided
    if (tutorId) {
      where.tutorId = tutorId;
    }
    
    // If user is a tutor and requesting students, restrict to only their students
    if (isTutor(currentUser) && role === UserRole.STUDENT && !isAdmin(currentUser)) {
      where.tutorId = currentUser.id;
    }
    
    // If assigned=true is specified, only show students with a tutorId
    if (assigned && role === UserRole.STUDENT) {
      where.tutorId = { not: null };
    }
    
    // Admin can see all users, but non-admins have restrictions
    if (!isAdmin(currentUser)) {
      // Non-admins can only query specific roles
      if (role !== UserRole.STUDENT) {
        return NextResponse.json(
          { error: 'Unauthorized: Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Add search query if provided
    if (searchQuery) {
      where.OR = [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { firstName: { contains: searchQuery, mode: 'insensitive' } },
        { lastName: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        points: true,
        tutorId: true,
        createdAt: true,
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 