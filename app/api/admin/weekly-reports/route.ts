import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireActivePeriod } from "@/lib/periods";
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/auth.config';

// GET - Fetch all weekly reports for admin review
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role_filter = searchParams.get("role");
    const week = searchParams.get("week");
    const periodId = searchParams.get("periodId");

    // Get active period if no specific period requested
    const activePeriod = periodId
      ? await prisma.period.findUnique({ where: { id: periodId } })
      : await requireActivePeriod();

    if (!activePeriod) {
      return NextResponse.json(
        { error: "No period found" },
        { status: 404 }
      );
    }

    // Build where clause
    const whereClause: any = {
      periodId: activePeriod.id,
    };

    if (status) {
      whereClause.status = status;
    }

    if (role_filter) {
      whereClause.user = {
        role: role_filter,
      };
    }

    if (week) {
      whereClause.weekNumber = parseInt(week);
    }

    const reports = await prisma.weeklyReport.findMany({
      where: whereClause,
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
      orderBy: [
        { weekNumber: "asc" },
        { user: { role: "asc" } },
        { user: { firstName: "asc" } },
      ],
    });

    // Calculate statistics
    const stats = {
      total: reports.length,
      byStatus: {
        DRAFT: reports.filter(r => r.status === "DRAFT").length,
        SUBMITTED: reports.filter(r => r.status === "SUBMITTED").length,
        APPROVED: reports.filter(r => r.status === "APPROVED").length,
        REJECTED: reports.filter(r => r.status === "REJECTED").length,
      },
      byRole: {
        TUTOR: reports.filter(r => r.user.role === "TUTOR").length,
        ASISTAN: reports.filter(r => r.user.role === "ASISTAN").length,
      },
      totalPointsAwarded: reports.reduce((sum, r) => sum + r.pointsAwarded, 0),
    };

    return NextResponse.json({
      reports,
      stats,
      period: activePeriod
    });
  } catch (error: any) {
    console.error("Error fetching weekly reports for admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch weekly reports" },
      { status: 500 }
    );
  }
}

// POST - Bulk review reports
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { reportIds, status, reviewNotes, pointsAwarded } = body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: "Report IDs are required" },
        { status: 400 }
      );
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (APPROVED/REJECTED) is required" },
        { status: 400 }
      );
    }

    // Update all specified reports
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

    const updatedReports = await prisma.weeklyReport.updateMany({
      where: {
        id: {
          in: reportIds,
        },
      },
      data: updateData,
    });

    return NextResponse.json({
      message: `${updatedReports.count} reports updated successfully`,
      updatedCount: updatedReports.count,
    });
  } catch (error: any) {
    console.error("Error bulk reviewing reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review reports" },
      { status: 500 }
    );
  }
}