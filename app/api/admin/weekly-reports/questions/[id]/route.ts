import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/auth.config';

// GET - Fetch a specific question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const questionId = params.id;

    const question = await prisma.weeklyReportQuestion.findUnique({
      where: { id: questionId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          }
        }
      }
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch question" },
      { status: 500 }
    );
  }
}

// PUT - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const questionId = params.id;
    const body = await request.json();

    // Find the existing question
    const existingQuestion = await prisma.weeklyReportQuestion.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Validate the update data
    const updateData: any = {};

    if (body.text !== undefined) {
      if (!body.text.trim()) {
        return NextResponse.json(
          { error: "Question text cannot be empty" },
          { status: 400 }
        );
      }
      updateData.text = body.text;
    }

    if (body.type !== undefined) {
      if (!["FIXED", "VARIABLE"].includes(body.type)) {
        return NextResponse.json(
          { error: "Invalid question type" },
          { status: 400 }
        );
      }
      updateData.type = body.type;
    }

    if (body.targetRole !== undefined) {
      if (!["TUTOR", "ASISTAN"].includes(body.targetRole)) {
        return NextResponse.json(
          { error: "Invalid target role" },
          { status: 400 }
        );
      }
      updateData.targetRole = body.targetRole;
    }

    if (body.orderIndex !== undefined) {
      updateData.orderIndex = body.orderIndex;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    // Update the question
    const updatedQuestion = await prisma.weeklyReportQuestion.update({
      where: { id: questionId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error: any) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const questionId = params.id;

    // Find the existing question
    const existingQuestion = await prisma.weeklyReportQuestion.findUnique({
      where: { id: questionId },
      include: {
        responses: true
      }
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check if the question has any responses
    if (existingQuestion.responses.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete question that has responses. Deactivate it instead." },
        { status: 400 }
      );
    }

    // Delete the question
    await prisma.weeklyReportQuestion.delete({
      where: { id: questionId }
    });

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete question" },
      { status: 500 }
    );
  }
}