import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

// GET - Fetch a specific weekly report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = session.user;

    if (role !== "TUTOR" && role !== "ASISTAN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const reportId = params.id;

    const report = await prisma.weeklyReport.findUnique({
      where: { id: reportId },
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

    // Check if user has access to this report
    // Users can only view their own reports, unless they're an admin
    if (role !== "ADMIN" && report.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Convert the criteria relations to simple objects
    const reportData = {
      ...report,
      fixedCriteria: report.fixedCriteria
        ? Object.fromEntries(
            Object.entries(report.fixedCriteria).filter(
              ([key, value]) => key !== "id" && key !== "reportId" && value !== null
            )
          )
        : null,
      variableCriteria: report.variableCriteria
        ? Object.fromEntries(
            Object.entries(report.variableCriteria).filter(
              ([key, value]) => key !== "id" && key !== "reportId" && value !== null
            )
          )
        : null,
    };

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error("Error fetching weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch weekly report" },
      { status: 500 }
    );
  }
}

// PUT - Update a weekly report
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = session.user;

    const reportId = params.id;
    const body = await request.json();

    // Find the existing report
    const existingReport = await prisma.weeklyReport.findUnique({
      where: { id: reportId },
      include: {
        fixedCriteria: true,
        variableCriteria: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check permissions
    if (role === "ADMIN") {
      // Admins can both review reports AND edit content
      const { status, reviewNotes, pointsAwarded, fixedCriteria, variableCriteria, comments, questionResponses } = body;

      // If only review fields are provided, it's a review operation
      if ((status || reviewNotes !== undefined || pointsAwarded !== undefined) &&
          !fixedCriteria && !variableCriteria && comments === undefined && !questionResponses) {

        const updatedReport = await prisma.weeklyReport.update({
          where: { id: reportId },
          data: {
            status: status || existingReport.status,
            reviewNotes: reviewNotes !== undefined ? reviewNotes : existingReport.reviewNotes,
            pointsAwarded: pointsAwarded !== undefined ? pointsAwarded : existingReport.pointsAwarded,
            reviewDate: status && status !== existingReport.status ? new Date() : existingReport.reviewDate,
            reviewedById: status && status !== existingReport.status ? userId : existingReport.reviewedById,
          },
        });

        return NextResponse.json({
          message: "Report reviewed successfully",
          report: updatedReport,
        });
      } else {
        // This is a content edit operation - same as tutor/asistan editing
        // Calculate automatic points if question responses are provided
        let calculatedPoints = pointsAwarded;
        if (questionResponses && Array.isArray(questionResponses)) {
          calculatedPoints = questionResponses.filter(response =>
            response.response === "YAPILDI"
          ).length * 10;
        }

        const result = await prisma.$transaction(async (tx) => {
          // Update the main report
          const updatedReport = await tx.weeklyReport.update({
            where: { id: reportId },
            data: {
              status: status || existingReport.status,
              submissionDate: status === "SUBMITTED" ? new Date() : existingReport.submissionDate,
              comments: comments !== undefined ? comments : existingReport.comments,
              reviewNotes: reviewNotes !== undefined ? reviewNotes : existingReport.reviewNotes,
              pointsAwarded: calculatedPoints !== undefined ? calculatedPoints : existingReport.pointsAwarded,
            },
          });

          // Handle dynamic question responses (new way)
          if (questionResponses && Array.isArray(questionResponses)) {
            // Delete existing responses
            await tx.weeklyReportQuestionResponse.deleteMany({
              where: { reportId }
            });

            // Create new responses
            for (const response of questionResponses) {
              if (response.questionId && response.response) {
                await tx.weeklyReportQuestionResponse.create({
                  data: {
                    questionId: response.questionId,
                    reportId: reportId,
                    response: response.response,
                  },
                });
              }
            }
          } else {
            // Fallback to old static criteria system
            // Update fixed criteria
            if (fixedCriteria) {
              if (existingReport.fixedCriteria) {
                await tx.weeklyReportFixedCriteria.update({
                  where: { reportId },
                  data: fixedCriteria,
                });
              } else {
                await tx.weeklyReportFixedCriteria.create({
                  data: {
                    reportId,
                    ...fixedCriteria,
                  },
                });
              }
            }

            // Update variable criteria
            if (variableCriteria) {
              if (existingReport.variableCriteria) {
                await tx.weeklyReportVariableCriteria.update({
                  where: { reportId },
                  data: variableCriteria,
                });
              } else {
                await tx.weeklyReportVariableCriteria.create({
                  data: {
                    reportId,
                    ...variableCriteria,
                  },
                });
              }
            }
          }

          return updatedReport;
        });

        return NextResponse.json({
          message: "Report updated successfully",
          report: result,
        });
      }
    } else if ((role === "TUTOR" || role === "ASISTAN") && existingReport.userId === userId) {
      // Users can only edit their own reports and only if they're in DRAFT status
      if (existingReport.status !== "DRAFT") {
        return NextResponse.json(
          { error: "Can only edit reports in draft status" },
          { status: 400 }
        );
      }

      const { status, fixedCriteria, variableCriteria, comments, questionResponses } = body;

      // Calculate automatic points if question responses are provided
      let calculatedPoints = 0;
      if (questionResponses && Array.isArray(questionResponses)) {
        calculatedPoints = questionResponses.filter(response =>
          response.response === "YAPILDI"
        ).length * 10;
      }

      // Update the report in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the main report
        const updatedReport = await tx.weeklyReport.update({
          where: { id: reportId },
          data: {
            status: status || "DRAFT",
            submissionDate: status === "SUBMITTED" ? new Date() : null,
            comments: comments !== undefined ? comments : existingReport.comments,
            pointsAwarded: questionResponses ? calculatedPoints : existingReport.pointsAwarded,
          },
        });

        // Handle dynamic question responses (new way)
        if (questionResponses && Array.isArray(questionResponses)) {
          // Delete existing responses
          await tx.weeklyReportQuestionResponse.deleteMany({
            where: { reportId }
          });

          // Create new responses
          for (const response of questionResponses) {
            if (response.questionId && response.response) {
              await tx.weeklyReportQuestionResponse.create({
                data: {
                  questionId: response.questionId,
                  reportId: reportId,
                  response: response.response,
                },
              });
            }
          }
        } else {
          // Fallback to old static criteria system
          // Update fixed criteria
          if (fixedCriteria) {
            if (existingReport.fixedCriteria) {
              await tx.weeklyReportFixedCriteria.update({
                where: { reportId },
                data: fixedCriteria,
              });
            } else {
              await tx.weeklyReportFixedCriteria.create({
                data: {
                  reportId,
                  ...fixedCriteria,
                },
              });
            }
          }

          // Update variable criteria
          if (variableCriteria) {
            if (existingReport.variableCriteria) {
              await tx.weeklyReportVariableCriteria.update({
                where: { reportId },
                data: variableCriteria,
              });
            } else {
              await tx.weeklyReportVariableCriteria.create({
                data: {
                  reportId,
                  ...variableCriteria,
                },
              });
            }
          }
        }

        return updatedReport;
      });

      return NextResponse.json({
        message: "Report updated successfully",
        report: result,
      });
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  } catch (error: any) {
    console.error("Error updating weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update weekly report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a weekly report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = session.user;

    const reportId = params.id;

    // Find the existing report
    const existingReport = await prisma.weeklyReport.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check permissions - only report owner can delete, and only if in DRAFT status
    if (existingReport.userId !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (existingReport.status !== "DRAFT" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Can only delete reports in draft status" },
        { status: 400 }
      );
    }

    // Delete the report (cascade will handle related records)
    await prisma.weeklyReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting weekly report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete weekly report" },
      { status: 500 }
    );
  }
}