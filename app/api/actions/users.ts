'use server';

import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Gets all students assigned to a tutor
 */
export async function getTutorStudents(tutorId: string) {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
        tutorId: tutorId
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true
      }
    });
    
    return students;
  } catch (error) {
    console.error('Get tutor students error:', error);
    throw new Error('Failed to fetch tutor students');
  }
}

/**
 * Gets all students with pagination and filtering options
 */
export async function getStudents(options: { 
  page?: number, 
  limit?: number, 
  search?: string,
  tutorId?: string
}) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      tutorId
    } = options;
    
    const where = {
      role: UserRole.STUDENT,
      ...(tutorId && { tutorId }),
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };
    
    const [total, students] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          points: true,
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
          points: 'desc'
        }
      })
    ]);
    
    return {
      students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get students error:', error);
    throw new Error('Failed to fetch students');
  }
} 