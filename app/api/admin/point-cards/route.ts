import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";

// GET all point cards
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

// POST new card
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, points, icon } = await req.json();

    const card = await prisma.pointEarningCard.create({
      data: {
        title,
        description,
        points,
        icon,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}

// PUT update card
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, description, points, icon, isActive } = await req.json();

    const card = await prisma.pointEarningCard.update({
      where: { id },
      data: {
        title,
        description,
        points,
        icon,
        isActive,
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

// DELETE card
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    await prisma.pointEarningCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
} 