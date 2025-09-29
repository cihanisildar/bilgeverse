import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireActivePeriod } from "@/lib/periods";

// GET - Fetch weekly reports for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const activePeriod = await requireActivePeriod();

    const reports = await prisma.weeklyReport.findMany({
      where: {
        userId: userId,
        periodId: activePeriod.id,
      },
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
      },
      orderBy: {
        weekNumber: "asc",
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Error fetching weekly reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch weekly reports" },
      { status: 500 }
    );
  }
}

// POST - Create a new weekly report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== UserRole.TUTOR && session.user.role !== UserRole.ASISTAN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    const body = await request.json();
    const {
      weekNumber,
      periodId,
      status,
      fixedCriteria,
      variableCriteria,
      comments,
      questionResponses, // New field for dynamic questions
    } = body;

    // Validate required fields
    if (!weekNumber || !periodId) {
      return NextResponse.json(
        { error: "Week number and period ID are required" },
        { status: 400 }
      );
    }

    // Check if period exists and is active
    const period = await prisma.period.findUnique({
      where: { id: periodId },
    });

    if (!period || period.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid or inactive period" },
        { status: 400 }
      );
    }

    // Check if report already exists for this week and period
    const existingReport = await prisma.weeklyReport.findUnique({
      where: {
        userId_periodId_weekNumber: {
          userId: userId,
          periodId: periodId,
          weekNumber: weekNumber,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "Report already exists for this week" },
        { status: 409 }
      );
    }

    // Calculate points automatically based on question responses
    let calculatedPoints = 0;
    if (questionResponses && Array.isArray(questionResponses)) {
      // Each question answered (YAPILDI) is worth 10 points
      calculatedPoints = questionResponses.filter(response =>
        response.response === "YAPILDI"
      ).length * 10;
    }

    // Create the report with criteria
    const result = await prisma.$transaction(async (tx) => {
      // Create the main report
      const report = await tx.weeklyReport.create({
        data: {
          weekNumber,
          userId,
          periodId,
          status: status || "DRAFT",
          submissionDate: status === "SUBMITTED" ? new Date() : null,
          comments,
          pointsAwarded: calculatedPoints, // Automatic point calculation
        },
      });

      // Handle dynamic question responses (new way)
      if (questionResponses && Array.isArray(questionResponses)) {
        for (const response of questionResponses) {
          if (response.questionId && response.response) {
            await tx.weeklyReportQuestionResponse.create({
              data: {
                questionId: response.questionId,
                reportId: report.id,
                response: response.response,
              },
            });
          }
        }
      } else {
        // Fallback to old static criteria system
        // Create fixed criteria if provided
        if (fixedCriteria && Object.keys(fixedCriteria).length > 0) {
          await tx.weeklyReportFixedCriteria.create({
            data: {
              reportId: report.id,
              ...fixedCriteria,
            },
          });
        }

        // Create variable criteria if provided
        if (variableCriteria && Object.keys(variableCriteria).length > 0) {
          await tx.weeklyReportVariableCriteria.create({
            data: {
              reportId: report.id,
              ...variableCriteria,
            },
          });
        }
      }

      return report;
    });

    return NextResponse.json(
      {
        message: "Weekly report created successfully",
        reportId: result.id,
        pointsAwarded: calculatedPoints
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create weekly report" },
      { status: 500 }
    );
  }
}