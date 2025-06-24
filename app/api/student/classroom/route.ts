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

    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json(
        { error: 'Bu sayfaya erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    console.log('Current user ID:', session.user.id);

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

    console.log('Student query result:', {
      found: !!student,
      username: student?.username,
      studentClassroomId: student?.studentClassroomId,
      hasClassroom: !!student?.classroomStudents,
      totalStudentsInClassroom: student?.classroomStudents?.students?.length || 0,
      studentsIds: student?.classroomStudents?.students?.map(s => ({ id: s.id, username: s.username })) || []
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

    console.log('Filtering result:', {
      currentUserId: session.user.id,
      totalStudents: student.classroomStudents.students.length,
      otherStudents: otherStudents.length,
      otherStudentIds: otherStudents.map(s => ({ id: s.id, username: s.username }))
    });

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