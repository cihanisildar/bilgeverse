import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import prisma from "@/lib/prisma";
import { getActivePeriod } from "@/lib/periods";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Get the active period to filter transactions
    const activePeriod = await getActivePeriod();

    // Fetch all point reasons with creator info and usage count
    const reasons = await prisma.pointReason.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            transactions: {
              where: {
                rolledBack: false,
                ...(activePeriod && { periodId: activePeriod.id })
              }
            },
          },
        },
        transactions: {
          where: {
            rolledBack: false,
            ...(activePeriod && { periodId: activePeriod.id })
          },
          take: 1,
          select: {
            id: true,
            pointReasonId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });


    // Remove transactions from response to keep it clean
    const cleanReasons = reasons.map(({ transactions, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      reasons: cleanReasons || [],
    });
  } catch (error) {
    console.error("Error fetching point reasons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if reason with same name already exists
    const existingReason = await prisma.pointReason.findUnique({
      where: { name: name.trim() },
    });

    if (existingReason) {
      return NextResponse.json(
        { error: "Bu isimde bir sebep zaten mevcut" },
        { status: 400 }
      );
    }

    // Create the new point reason
    const newReason = await prisma.pointReason.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reason: newReason,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating point reason:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 