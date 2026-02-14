import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { requireActivePeriod } from "@/lib/periods";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { title, content } = await request.json();
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Get the active period
    const activePeriod = await requireActivePeriod();

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        createdById: session.user.id,
        periodId: activePeriod.id,
      },
    });

    return NextResponse.json(announcement);
  } catch (error: unknown) {
    console.error("Error creating announcement:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create announcement";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, title, content } = await request.json();
    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "ID, title and content are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(announcement);
  } catch (error: unknown) {
    console.error("Error updating announcement:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update announcement";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error: unknown) {
    console.error("Error fetching announcements:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch announcements";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isAdmin = userRoles.includes(UserRole.ADMIN);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Announcement ID is required" },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting announcement:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete announcement";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}