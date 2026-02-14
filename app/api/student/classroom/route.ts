import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekmektedir' },
        { status: 401 }
      );
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = (session.user as any)?.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isStudent = userRoles.includes(UserRole.STUDENT);

    if (!isStudent) {
      return NextResponse.json(
        { error: 'Bu sayfaya erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // Get student's classroom
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        studentClassroomId: true,
        classroomStudents: {
          include: {
            tutor: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                roles: true,
                avatarUrl: true,
              }
            },
            students: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                roles: true,
                avatarUrl: true,
                points: true
              },
              orderBy: [
                { points: 'desc' },
                { firstName: 'asc' }
              ]
            }
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Öğrenci bilgileri bulunamadı' },
        { status: 404 }
      );
    }

    if (!student.classroomStudents) {
      return NextResponse.json(
        { error: 'Henüz bir sınıfa atanmamışsınız' },
        { status: 404 }
      );
    }

    // Return all students except current user
    const otherStudents = student.classroomStudents.students.filter(s => s.id !== session.user.id);

    const response = {
      tutor: student.classroomStudents.tutor,
      students: otherStudents
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching classroom info:', error);
    return NextResponse.json(
      { error: 'Sınıf bilgileri alınırken bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}