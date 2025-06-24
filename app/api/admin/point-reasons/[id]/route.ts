import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/auth.config";
import prisma from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();
    const { name, description, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if the reason exists
    const existingReason = await prisma.pointReason.findUnique({
      where: { id },
    });

    if (!existingReason) {
      return NextResponse.json({ error: "Point reason not found" }, { status: 404 });
    }

    // Check if another reason with the same name exists (excluding current one)
    const duplicateReason = await prisma.pointReason.findFirst({
      where: {
        name: name.trim(),
        id: { not: id },
      },
    });

    if (duplicateReason) {
      return NextResponse.json(
        { error: "Bu isimde bir sebep zaten mevcut" },
        { status: 400 }
      );
    }

    // Update the point reason
    const updatedReason = await prisma.pointReason.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : existingReason.isActive,
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
      reason: updatedReason,
    });
  } catch (error) {
    console.error("Error updating point reason:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if the reason exists
    const existingReason = await prisma.pointReason.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingReason) {
      return NextResponse.json({ error: "Point reason not found" }, { status: 404 });
    }

    // Check if the reason is being used in any transactions
    if (existingReason._count.transactions > 0) {
      return NextResponse.json(
        { 
          error: `Bu sebep ${existingReason._count.transactions} işlemde kullanılmış ve silinemez. Sebep istemiyorsanız pasif hale getirebilirsiniz.` 
        },
        { status: 400 }
      );
    }

    // Delete the point reason
    await prisma.pointReason.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Point reason deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting point reason:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 