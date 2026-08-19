import { NextRequest, NextResponse } from 'next/server';
import prisma, { prismaUnscoped } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/auth.config';
import { calculateUserPoints } from '@/lib/points';
import { getActivePeriod } from '@/lib/periods';
import { UserRole } from '@prisma/client';
import { USER_AUTH_SELECT, normalizeUserRoles, isUserInAcademy } from '@/app/lib/auth-helpers';
import { getOrgAllowedParts } from '@/app/lib/packages';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        ...USER_AUTH_SELECT,
        isSuperAdmin: true,
        organizationId: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Kurum bilgisi ve lisanslı modüller her istekte tazelenir; süper admin
    // paketleri değiştirdiğinde arayüz JWT'nin yenilenmesini beklemez.
    const organization = await prismaUnscoped.organization.findUnique({
      where: { id: user.organizationId },
      select: { code: true, name: true, packageIds: true, extraParts: true, excludedParts: true }
    });

    const userFields = user;
    const orgInfo = {
      organizationCode: organization?.code,
      organizationName: organization?.name,
      orgParts: getOrgAllowedParts(organization),
    };

    const userRoles = user.roles || [user.role].filter(Boolean) as UserRole[];
    const isStudent = userRoles.includes(UserRole.STUDENT);

    // For students, calculate points from transactions in the active period
    if (isStudent) {
      const activePeriod = await getActivePeriod();
      const calculatedPoints = activePeriod
        ? await calculateUserPoints(user.id, activePeriod.id)
        : 0;

      const userWithNormalizedRoles = {
        ...userFields,
        ...orgInfo,
        roles: normalizeUserRoles(user),
        isInAcademy: isUserInAcademy(user)
      };

      return NextResponse.json(
        { user: { ...userWithNormalizedRoles, points: calculatedPoints } },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { user: { ...userFields, ...orgInfo, roles: normalizeUserRoles(user), isInAcademy: isUserInAcademy(user) } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 