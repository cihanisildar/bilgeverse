import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

// GET - Fetch all questions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const questions = await prisma.weeklyReportQuestion.findMany({
      orderBy: [
        { type: 'asc' },
        { targetRole: 'asc' },
        { orderIndex: 'asc' }
      ],
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

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST - Create a new question
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = session.user;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { text, type, targetRole, orderIndex } = body;

    // Validate required fields
    if (!text || !type || !targetRole) {
      return NextResponse.json(
        { error: "Text, type, and targetRole are required" },
        { status: 400 }
      );
    }

    // Validate enum values
    if (!["FIXED", "VARIABLE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      );
    }

    if (!["TUTOR", "ASISTAN"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Invalid target role" },
        { status: 400 }
      );
    }

    // If no orderIndex is provided, get the next available index for this type and role
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const lastQuestion = await prisma.weeklyReportQuestion.findFirst({
        where: {
          type,
          targetRole,
        },
        orderBy: {
          orderIndex: 'desc'
        }
      });
      finalOrderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 0;
    }

    const question = await prisma.weeklyReportQuestion.create({
      data: {
        text,
        type,
        targetRole,
        orderIndex: finalOrderIndex,
        createdById: userId,
      },
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
      message: "Question created successfully",
      question,
    });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create question" },
      { status: 500 }
    );
  }
}