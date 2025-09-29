import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { UserRole } from "@prisma/client";
import { calculateMultipleUserPoints, calculateUserExperience } from "@/lib/points";
import { requireActivePeriod } from "@/lib/periods";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403 }
      );
    }

    // Get active period
    const activePeriod = await requireActivePeriod();

    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    // Calculate period-aware points for all students efficiently
    const userIds = students.map(s => s.id);
    const pointsMap = await calculateMultipleUserPoints(userIds, activePeriod.id);

    // Calculate experience for each student (period-aware)
    const studentsWithCalculatedStats = await Promise.all(
      students.map(async (student) => {
        const calculatedPoints = pointsMap.get(student.id) || 0;
        const calculatedExperience = await calculateUserExperience(student.id, activePeriod.id);

        return {
          ...student,
          points: calculatedPoints,
          experience: calculatedExperience,
        };
      })
    );

    // Sort by calculated points
    studentsWithCalculatedStats.sort((a, b) => b.points - a.points);

    return new NextResponse(
      JSON.stringify({ students: studentsWithCalculatedStats }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error("Error in /api/admin/students:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
} 