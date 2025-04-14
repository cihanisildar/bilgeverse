import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest, isAuthenticated } from '@/lib/server-auth';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting classroom info fetch...');
    const currentUser = await getUserFromRequest(request);
    console.log('Current user:', { id: currentUser?.id, role: currentUser?.role });
    
    if (!isAuthenticated(currentUser)) {
      console.log('User not authenticated');
      return NextResponse.json(
        { error: 'Oturum açmanız gerekmektedir' },
        { status: 401 }
      );
    }

    // Check if user is a student
    if (currentUser.role !== UserRole.STUDENT) {
      console.log('User is not a student:', currentUser.role);
      return NextResponse.json(
        { error: 'Bu sayfaya erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    console.log('Fetching student and tutor info for ID:', currentUser.id);
    
    // Get the student with their tutor and classmates
    const student = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            avatarUrl: true,
            students: {
              where: {
                id: { not: currentUser.id }, // Exclude current student
                role: UserRole.STUDENT
              },
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                points: true // Include points
              },
              orderBy: [
                { points: 'desc' }, // Order by points first
                { firstName: 'asc' } // Then by name
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

    if (!student.tutor) {
      return NextResponse.json(
        { error: 'Henüz bir danışman öğretmene atanmamışsınız' },
        { status: 404 }
      );
    }

    const response = {
      tutor: {
        id: student.tutor.id,
        username: student.tutor.username,
        firstName: student.tutor.firstName,
        lastName: student.tutor.lastName,
        role: student.tutor.role,
        avatarUrl: student.tutor.avatarUrl
      },
      students: student.tutor.students
    };

    console.log('Returning classroom info:', {
      tutorId: response.tutor.id,
      studentCount: response.students.length
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching classroom info:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Check for specific Prisma errors
    if (error.code === 'P2023') {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı kimliği' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Öğrenci kaydı bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Sınıf bilgileri alınırken bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
} 