import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Point reasons API - Session:', {
      exists: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id
    });

    if (!session?.user) {
      return NextResponse.json({ 
        error: "Unauthorized",
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          headers: Object.fromEntries(request.headers.entries())
        }
      }, { status: 401 });
    }

    // Check if user is tutor or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    console.log('Point reasons API - User role:', user?.role);

    if (!user || (user.role !== "TUTOR" && user.role !== "ADMIN" && user.role !== "ASISTAN")) {
      return NextResponse.json({ 
        error: "Forbidden - Tutor, Admin, or Asistan access required",
        debug: {
          userExists: !!user,
          userRole: user?.role
        }
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
    console.log('Point reasons API - Found reasons:', reasons.length);

    // Handle case when no reasons exist
    if (reasons.length === 0) {
      console.log('Point reasons API - No active point reasons found in database');
    }

    return NextResponse.json({
      success: true,
      reasons: reasons || [],
    });
  } catch (error) {
    console.error("Error fetching point reasons:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        debug: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 