import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

// GET - Fetch questions for the user's role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user;

    if (role !== "TUTOR" && role !== "ASISTAN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch questions for the user's role
    const questions = await prisma.weeklyReportQuestion.findMany({
      where: {
        targetRole: role,
        isActive: true,
      },
      orderBy: [
        { type: 'asc' },
        { orderIndex: 'asc' }
      ]
    });

    // Group questions by type
    const groupedQuestions = {
      FIXED: questions.filter(q => q.type === "FIXED"),
      VARIABLE: questions.filter(q => q.type === "VARIABLE")
    };

    return NextResponse.json({
      questions: groupedQuestions,
      pointsPerQuestion: 10 // Each question is worth 10 points
    });
  } catch (error: any) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch questions" },
      { status: 500 }
    );
  }
}