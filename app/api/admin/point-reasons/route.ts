import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

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
              where: { rolledBack: false }
            },
          },
        },
        transactions: {
          where: { rolledBack: false },
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

    // Add detailed logging
    console.log('Point reasons query result with sample transactions:', reasons.map(r => ({
      id: r.id,
      name: r.name,
      transactionCount: r._count?.transactions,
      sampleTransaction: r.transactions[0] || null
    })));

    // Remove transactions from response to keep it clean
    const cleanReasons = reasons.map(({ transactions, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      reasons: cleanReasons,
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
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
  } catch (error) {
    console.error("Error creating point reason:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 