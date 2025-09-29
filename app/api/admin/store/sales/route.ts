import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { UserRole, RequestStatus } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/auth.config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const status = searchParams.get('status') as RequestStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    let where: any = {};
    
    if (itemId) {
      where.itemId = itemId;
    }
    
    if (status && Object.values(RequestStatus).includes(status)) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get sales data with detailed information
    const salesData = await prisma.itemRequest.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        student: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        tutor: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        item: {
          select: {
            id: true,
            name: true,
            pointsRequired: true,
            imageUrl: true
          }
        }
      }
    });

    // Get aggregated statistics
    const stats = await prisma.itemRequest.aggregate({
      where,
      _count: {
        id: true
      },
      _sum: {
        pointsSpent: true
      }
    });

    // Get sales by item
    const salesByItem = await prisma.itemRequest.groupBy({
      by: ['itemId'],
      where,
      _count: {
        id: true
      },
      _sum: {
        pointsSpent: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get item details for sales by item
    const itemIds = salesByItem.map(sale => sale.itemId);
    const items = await prisma.storeItem.findMany({
      where: {
        id: {
          in: itemIds
        }
      },
      select: {
        id: true,
        name: true,
        pointsRequired: true,
        imageUrl: true
      }
    });

    // Combine sales data with item details
    const salesByItemWithDetails = salesByItem.map(sale => {
      const item = items.find(i => i.id === sale.itemId);
      return {
        ...sale,
        item
      };
    });

    // Get sales by status
    const salesByStatus = await prisma.itemRequest.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true
      },
      _sum: {
        pointsSpent: true
      }
    });

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = await prisma.itemRequest.count({
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get top buyers (students who bought most items)
    const topBuyers = await prisma.itemRequest.groupBy({
      by: ['studentId'],
      where,
      _count: {
        id: true
      },
      _sum: {
        pointsSpent: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get student details for top buyers
    const studentIds = topBuyers.map(buyer => buyer.studentId);
    const students = await prisma.user.findMany({
      where: {
        id: {
          in: studentIds
        }
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Combine top buyers with student details
    const topBuyersWithDetails = topBuyers.map(buyer => {
      const student = students.find(s => s.id === buyer.studentId);
      return {
        ...buyer,
        student
      };
    });

    return NextResponse.json({
      sales: salesData,
      statistics: {
        totalSales: stats._count.id || 0,
        totalPointsSpent: stats._sum.pointsSpent || 0,
        recentSales: recentSales
      },
      salesByItem: salesByItemWithDetails,
      salesByStatus: salesByStatus,
      topBuyers: topBuyersWithDetails
    });

  } catch (error) {
    console.error('Admin fetch sales data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
