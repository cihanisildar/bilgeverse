import { getServerSession, Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';
import { isAuthorized, isPartLicensed, PART_NOT_LICENSED } from './permissions.server';
import { UserRole } from '@prisma/client';
import { NextResponse } from 'next/server';

export { USER_AUTH_SELECT, normalizeUserRoles, isUserInAcademy } from './auth-helpers';

interface RequireAuthOptions {
    partId?: number;
    roles?: UserRole[];
    redirectTo?: string;
}

/**
 * Helper to check if a user has any of the required roles.
 * Handles both the single 'role' property and the 'roles' array.
 */
export function hasRole(session: Session | null, roles: UserRole[]): boolean {
    if (!session?.user) return false;

    const user = session.user;
    const userRole = user.role;
    const userRoles = user.roles || [userRole];

    return roles.some(role => userRoles.includes(role));
}

/**
 * A centralized utility for server components to enforce authentication and authorization.
 */
export async function requireAuth(options: RequireAuthOptions = {}) {
    const { partId, roles, redirectTo = '/dashboard' } = options;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/login');
    }

    if (partId !== undefined) {
        const isAuth = await isAuthorized(session, partId);
        if (!isAuth) {
            redirect(redirectTo);
        }
    }

    if (roles && roles.length > 0) {
        if (!hasRole(session, roles)) {
            redirect(redirectTo);
        }
    }

    return session;
}

/**
 * A centralized utility for API routes.
 * Returns either the session or a NextResponse error.
 */
export async function requireApiAuth(roles?: UserRole[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { session: null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    if (roles && roles.length > 0) {
        if (!hasRole(session, roles)) {
            return { session: null, errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
        }
    }

    return { session, errorResponse: null };
}

/**
 * A centralized utility for Server Actions.
 * Returns either the session or an error object.
 */
export async function requireActionAuth(roles?: UserRole[], options?: { partId?: number }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { session: null, error: 'Oturum açmanız gerekiyor' };
    }

    // Kurum paketi kapısı rol kontrolünden ÖNCE: kurumun satın almadığı bir
    // modülü hiçbir rol açamamalı. Sayfa katmanındaki requireAuth({ partId })
    // ile aynı kural; buradaki kopya, action'ın doğrudan çağrılmasını kapatır.
    if (options?.partId !== undefined) {
        if (!(await isPartLicensed(session, options.partId))) {
            return { session: null, error: PART_NOT_LICENSED };
        }
    }

    if (roles && roles.length > 0) {
        if (!hasRole(session, roles)) {
            return { session: null, error: 'Bu işlem için yetkiniz yok' };
        }
    }

    return { session, error: null };
}
