import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { UserRole } from "@prisma/client";

// GET all point cards
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const cards = await prisma.pointEarningCard.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });
    return NextResponse.json(cards);
  } catch (error: unknown) {
    console.error("Error fetching cards:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch cards";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST new card
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { title, description, points, icon, minPoints, maxPoints } = await req.json();

    const card = await prisma.pointEarningCard.create({
      data: {
        title,
        description,
        points,
        icon,
        minPoints,
        maxPoints,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(card);
  } catch (error: unknown) {
    console.error("Error creating card:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create card";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT update card
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id, title, description, points, icon, isActive, minPoints, maxPoints } = await req.json();

    const card = await prisma.pointEarningCard.update({
      where: { id },
      data: {
        title,
        description,
        points,
        icon,
        isActive,
        minPoints,
        maxPoints,
      },
    });

    return NextResponse.json(card);
  } catch (error: unknown) {
    console.error("Error updating card:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update card";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE card
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await req.json();

    await prisma.pointEarningCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting card:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete card";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 