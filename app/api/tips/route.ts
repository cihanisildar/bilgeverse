export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth.config';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reasons = await prisma.pointReason.findMany({
      where: { isActive: true, showInTips: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        points: true,
        minPoints: true,
        maxPoints: true,
        icon: true,
        isActive: true,
      },
    });

    // Map to the shape the tips page expects (title/description/points)
    const cards = reasons.map((r) => ({
      id: r.id,
      title: r.name,
      description: r.description || "",
      points: r.points ?? 0,
      minPoints: r.minPoints,
      maxPoints: r.maxPoints,
      icon: r.icon,
      isActive: r.isActive,
    }));

    return NextResponse.json(cards);
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
} 