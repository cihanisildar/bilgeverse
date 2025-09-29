import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can access this endpoint' },
        { status: 403 }
      );
    }

    const tutor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        bio: true,
        preferences: true
      }
    });

    if (!tutor) {
      return NextResponse.json(
        { error: 'Tutor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tutor }, { status: 200 });
  } catch (error) {
    console.error('Get tutor settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only tutors and asistans can update their settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      phone, 
      specialization, 
      bio,
      preferences 
    } = body;

    // Update tutor
    const updatedTutor = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(specialization !== undefined && { specialization }),
        ...(bio !== undefined && { bio }),
        ...(preferences !== undefined && { preferences })
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        specialization: true,
        bio: true,
        preferences: true
      }
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      tutor: updatedTutor
    }, { status: 200 });
  } catch (error) {
    console.error('Update tutor settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 