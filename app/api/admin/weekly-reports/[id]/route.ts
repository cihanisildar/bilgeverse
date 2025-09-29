import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

// GET - Fetch individual weekly report for admin review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await prisma.weeklyReport.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
          },
        },
        fixedCriteria: true,
        variableCriteria: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Error fetching weekly report for admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch weekly report" },
      { status: 500 }
    );
  }
}

// PUT - Update individual weekly report (admin review)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { status, reviewNotes, pointsAwarded } = body;

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (APPROVED/REJECTED) is required" },
        { status: 400 }
      );
    }

    // Update the report
    const updateData: any = {
      status,
      reviewDate: new Date(),
      reviewedById: userId,
    };

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    if (pointsAwarded !== undefined && status === "APPROVED") {
      updateData.pointsAwarded = pointsAwarded;
    }

    const updatedReport = await prisma.weeklyReport.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
          },
        },
        fixedCriteria: true,
        variableCriteria: true,
      },
    });

    return NextResponse.json({
      message: "Report updated successfully",
      report: updatedReport,
    });
  } catch (error: any) {
    console.error("Error updating weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update weekly report" },
      { status: 500 }
    );
  }
}
