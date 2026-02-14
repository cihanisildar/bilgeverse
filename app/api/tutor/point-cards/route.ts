export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasRole } = await import('@/app/lib/auth-utils');
    const userRoles = session.user.roles || [session.user.role].filter(Boolean) as UserRole[];
    const isTutor = userRoles.includes(UserRole.TUTOR);
    const isAsistan = userRoles.includes(UserRole.ASISTAN);

    if (!isTutor && !isAsistan) {
      return NextResponse.json({ error: "Unauthorized - Tutor or Asistan access required" }, { status: 403 });
    }

    const cards = await prisma.pointEarningCard.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(cards);
  } catch (error: unknown) {
    console.error('Failed to fetch cards:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch cards";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}