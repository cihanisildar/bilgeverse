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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        questionResponses: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                targetRole: true,
                orderIndex: true,
              },
            },
          },
          orderBy: [
            { question: { type: 'asc' } },
            { question: { orderIndex: 'asc' } }
          ]
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Transform fixedCriteria and variableCriteria to plain objects
    const transformedReport = {
      ...report,
      fixedCriteria: report.fixedCriteria ? {
        // Remove id and reportId fields, keep only the criteria fields
        ...Object.fromEntries(
          Object.entries(report.fixedCriteria).filter(
            ([key]) => key !== 'id' && key !== 'reportId'
          )
        )
      } : null,
      variableCriteria: report.variableCriteria ? {
        // Remove id and reportId fields, keep only the criteria fields
        ...Object.fromEntries(
          Object.entries(report.variableCriteria).filter(
            ([key]) => key !== 'id' && key !== 'reportId'
          )
        )
      } : null,
    };

    return NextResponse.json(transformedReport);
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        questionResponses: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true,
                targetRole: true,
                orderIndex: true,
              },
            },
          },
          orderBy: [
            { question: { type: 'asc' } },
            { question: { orderIndex: 'asc' } }
          ]
        },
      },
    });

    // Transform fixedCriteria and variableCriteria to plain objects
    const transformedReport = {
      ...updatedReport,
      fixedCriteria: updatedReport.fixedCriteria ? {
        ...Object.fromEntries(
          Object.entries(updatedReport.fixedCriteria).filter(
            ([key]) => key !== 'id' && key !== 'reportId'
          )
        )
      } : null,
      variableCriteria: updatedReport.variableCriteria ? {
        ...Object.fromEntries(
          Object.entries(updatedReport.variableCriteria).filter(
            ([key]) => key !== 'id' && key !== 'reportId'
          )
        )
      } : null,
    };

    return NextResponse.json({
      message: "Report updated successfully",
      report: transformedReport,
    });
  } catch (error: any) {
    console.error("Error updating weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update weekly report" },
      { status: 500 }
    );
  }
}
