import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { UserRole } from "@prisma/client";

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

    const students = await prisma.user.findMany({
      where: {
        role: UserRole.STUDENT,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        points: true,
        experience: true,
      },
      orderBy: {
        points: 'desc',
      },
    });

    return new NextResponse(
      JSON.stringify({ students }),
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