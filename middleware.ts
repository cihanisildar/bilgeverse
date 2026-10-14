import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

// Export config first
export const config = {
  matcher: [
    // Protected API routes
    "/api/admin/:path*",
    "/api/tutor/:path*",
    "/api/student/:path*",
    "/api/superadmin/:path*",
    // Protected pages
    "/dashboard/:path*",
    "/superadmin/:path*",
    "/check-in/:path*", // Check-in pages require authentication
  ]
};

/**
 * Middleware her istekte çalışır ve çıktısı üretim log'larına düşer.
 * Buradan ASLA sır (NEXT_AUTH_SECRET) ya da çerez basılmaz: log'lara erişen
 * biri o sırla istediği rolde token üretebilir. Ayrıntılı iz yalnız
 * geliştirmede açıktır.
 */
const debug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') console.log(...args);
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  debug('Middleware - Request URL:', request.url);
  debug('Middleware - Pathname:', pathname);

  // Skip middleware for public assets and auth API routes
  if (pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/register' ||
    pathname === '/favicon.ico') {
    debug('Skipping middleware for:', pathname);
    return NextResponse.next();
  }

  // Allow public paths
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    debug('Public path accessed:', pathname);
    return NextResponse.next();
  }

  // Allow public syllabus feedback pages (no auth required)
  if (pathname.startsWith('/syllabus/')) {
    debug('Public syllabus page accessed:', pathname);
    return NextResponse.next();
  }

  try {
    debug('Checking auth for path:', pathname);

    const token = await getToken({
      req: request,
      secret: process.env.NEXT_AUTH_SECRET,
    });

    debug('Token check result:', {
      hasToken: !!token,
      role: token?.role,
      roles: (token as any)?.roles,
      path: pathname,
    });

    const isApiRoute = pathname.startsWith('/api/');

    if (!token) {
      debug('No token found - redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return isApiRoute
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(loginUrl);
    }

    // Helper function to check if a path matches a route pattern
    const matchesRoute = (path: string, pattern: string) => {
      return path.startsWith(pattern.replace('*', ''));
    };

    // Allow check-in pages and meeting detail pages for all authenticated users
    // Unified check-in route at /check-in/* is accessible to all authenticated users
    // (students, tutors, etc. can check in as guests and view meetings they're attending)
    const isCheckInPage = pathname.startsWith('/check-in/') ||
      ((pathname.includes('/meetings/') || pathname.includes('/attendance/')) && pathname.includes('/check-in'));
    const isMeetingDetailPage = pathname.match(/\/dashboard\/part1\/meetings\/[^\/]+$/);
    const isAttendanceDetailPage = pathname.match(/\/dashboard\/part2\/attendance\/[^\/]+$/);

    // --- Çok kurumlu kontroller ---
    const isSuperAdmin = Boolean((token as any)?.isSuperAdmin);
    const orgParts = ((token as any)?.orgParts as number[]) || [];

    // Göç öncesi oluşturulmuş (kurumsuz) oturumlar geçersizdir.
    if (!(token as any)?.organizationId) {
      const loginUrl = new URL('/login', request.url);
      return isApiRoute
        ? NextResponse.json({ error: 'Oturum geçersiz, lütfen tekrar giriş yapın' }, { status: 401 })
        : NextResponse.redirect(loginUrl);
    }

    // Süper admin paneli yalnız süper adminlere; süper admin de kurum
    // sayfalarında işi olmadığı için kendi paneline yönlendirilir.
    if (pathname.startsWith('/superadmin') || pathname.startsWith('/api/superadmin')) {
      if (!isSuperAdmin) {
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          : NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return NextResponse.next();
    }
    if (isSuperAdmin && pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }

    // Paket kapısı: kurumun lisanslamadığı modüle hiç girilemez.
    // (Ucuz ön eleme; asıl karar sunucuda isAuthorized ile DB'den verilir.)
    const partMatch = pathname.match(/^\/dashboard\/part(\d+)/);
    if (partMatch) {
      const partId = Number(partMatch[1]);
      if (!orgParts.includes(partId)) {
        debug(`Part ${partId} kurumun paketinde yok, /dashboard'a yönlendiriliyor`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    const userRoles = ((token as any)?.roles as UserRole[]) || (token?.role ? [token.role as UserRole] : []);
    const hasAdmin = userRoles.includes(UserRole.ADMIN);
    const hasBoardMember = userRoles.includes(UserRole.BOARD_MEMBER);
    const hasTutor = userRoles.includes(UserRole.TUTOR) || userRoles.includes(UserRole.ASISTAN);
    const hasStudent = userRoles.includes(UserRole.STUDENT);

    // Part2 is accessible by ADMIN and TUTOR
    if (pathname.startsWith('/dashboard/part2')) {
      if (!hasAdmin && !hasTutor && !hasBoardMember) {
        // Students can access check-in pages
        if (!isCheckInPage) {
          debug('Non-tutor user attempting to access part2, redirecting');
          const roleBasedPath = '/dashboard/part7/student';
          return NextResponse.redirect(new URL(roleBasedPath, request.url));
        }
      }
    }

    // Redirect students away from the main /dashboard page
    if (pathname === '/dashboard') {
      if (hasStudent && !hasAdmin && !hasBoardMember) {
        debug('Student attempting to access /dashboard, redirecting to part7/student');
        return NextResponse.redirect(new URL('/dashboard/part7/student', request.url));
      }
    }

    // Kullanıcıya tek tek verilmiş ek modül izinleri (Kullanıcı Yönetimi'ndeki
    // "Ek modül erişimi" anahtarları). Bu alan token'da olmadığı sürece
    // aşağıdaki yönlendirme, izin verilmiş bir modüle girişi de engelliyordu.
    const userAllowedParts = ((token as any)?.allowedParts as number[]) || [];
    const grantedThisPart = partMatch ? userAllowedParts.includes(Number(partMatch[1])) : false;

    // Bilge Spor Kulübü (part9) tüm öğrencilere ve sporculara açık — Akademi
    // gibi. Kurum paketi yukarıda zaten kontrol edildi; yönetim sayfaları
    // ManagerGuard + server action rol kontrolleriyle korunuyor.
    const hasAthlete = userRoles.includes((UserRole as any).ATHLETE);
    const isSportsClubForMember = pathname.startsWith('/dashboard/part9') && (hasStudent || hasAthlete);

    // Redirect non-admin/board users away from parts 1, 3-6 and 8-9 to part 7 (except check-in and detail pages)
    if (pathname.startsWith('/dashboard/part') &&
      !pathname.startsWith('/dashboard/part7') &&
      !pathname.startsWith('/dashboard/part2') &&
      !pathname.startsWith('/dashboard/part4') &&
      !isCheckInPage &&
      !isMeetingDetailPage &&
      !grantedThisPart &&
      !isSportsClubForMember) {
      if (!hasAdmin && !hasBoardMember) {
        debug('Non-admin/board user attempting to access restricted part, redirecting to part 7');
        const roleBasedPath = hasStudent
          ? '/dashboard/part7/student'
          : hasTutor
            ? '/dashboard/part7/tutor'
            : '/dashboard/part7/student';
        return NextResponse.redirect(new URL(roleBasedPath, request.url));
      }
    }


    // Check route permissions
    if (pathname.startsWith('/dashboard/part7/admin') || pathname.startsWith('/api/admin')) {
      // Allow privileged users to GET periods (needed for event creation)
      if (pathname === '/api/admin/periods' && request.method === 'GET') {
        if (!hasAdmin && !hasTutor && !hasBoardMember) {
          debug('Unauthorized user attempting to access periods');
          return isApiRoute
            ? NextResponse.json({ error: 'Forbidden: Admin, Board Member, Tutor, or Asistan access required' }, { status: 403 })
            : NextResponse.redirect(new URL('/', request.url));
        }
      } else if (!hasAdmin && !hasBoardMember) {
        debug('Non-privileged user attempting to access admin route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin or Board Member access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/dashboard/part7/tutor') || pathname.startsWith('/api/tutor')) {
      if (!hasTutor && !hasBoardMember && !hasAdmin) {
        debug('Non-tutor/asistan/board-member/admin user attempting to access tutor route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Tutor, Asistan, Board Member, or Admin access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/api/student/reports')) {
      // Allow ADMIN, TUTOR, ASISTAN, BOARD_MEMBER and STUDENT for /api/student/reports endpoints
      if (!hasAdmin && !hasTutor && !hasBoardMember && !hasStudent) {
        debug('Unauthorized user attempting to access student reports API');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin, Tutor, Asistan, Board Member, or Student access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }
    else if (pathname.startsWith('/dashboard/part7/student') || pathname.startsWith('/api/student')) {
      if (!hasStudent && !hasAdmin && !hasBoardMember) {
        debug('Non-student (or admin/board) user attempting to access student route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Student, Admin, or Board Member access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    const response = NextResponse.next();

    // Add user info to headers for debugging
    response.headers.set('x-user-role', token.role as string);
    response.headers.set('x-user-id', token.sub as string);
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store, must-revalidate');

    debug('Auth check passed, proceeding with request');
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    const isApiRoute = pathname.startsWith('/api/');
    return isApiRoute
      ? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      : NextResponse.redirect(new URL('/login', request.url));
  }
}

export function corsMiddleware(request: NextRequest) {
  try {
    // Add CORS headers
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  } catch (error) {
    // Return JSON error instead of HTML
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export default middleware;