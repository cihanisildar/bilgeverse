import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({
        error: "Unauthorized"
      }, { status: 401 });
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isTutor && !isAdmin && !isAsistan) {
      return NextResponse.json({
        error: "Forbidden - Tutor, Admin, or Asistan access required"
      }, { status: 403 });
    }

    // Fetch active point reasons only
    const reasons = await prisma.pointReason.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      reasons: reasons || [],
    });
  } catch (error) {
    console.error("Error fetching point reasons:", error);
    return NextResponse.json(
      {
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}