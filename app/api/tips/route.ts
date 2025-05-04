import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cards = await prisma.pointEarningCard.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
} 