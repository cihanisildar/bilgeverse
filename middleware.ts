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
    // Protected pages
    "/dashboard/:path*",
    "/check-in/:path*", // Check-in pages require authentication
  ]
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware - Request URL:', request.url);
  console.log('Middleware - Pathname:', pathname);
  console.log('Middleware - NEXT_AUTH_SECRET:', process.env.NEXT_AUTH_SECRET);
  console.log('Middleware - Cookies:', request.cookies.toString());

  // Skip middleware for public assets and auth API routes
  if (pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/register' ||
    pathname === '/favicon.ico') {
    console.log('Skipping middleware for:', pathname);
    return NextResponse.next();
  }

  // Allow public paths
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    console.log('Public path accessed:', pathname);
    return NextResponse.next();
  }

  // Allow public syllabus feedback pages (no auth required)
  if (pathname.startsWith('/syllabus/')) {
    console.log('Public syllabus page accessed:', pathname);
    return NextResponse.next();
  }

  try {
    console.log('Checking auth for path:', pathname);

    const token = await getToken({
      req: request,
      secret: process.env.NEXT_AUTH_SECRET,
    });

    console.log('Token check result:', {
      hasToken: !!token,
      role: token?.role,
      path: pathname,
    });

    const isApiRoute = pathname.startsWith('/api/');

    if (!token) {
      console.log('No token found - redirecting to login');
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

    // Part2 is accessible by ADMIN and TUTOR
    if (pathname.startsWith('/dashboard/part2')) {
      if (token.role !== UserRole.ADMIN && token.role !== UserRole.TUTOR && token.role !== UserRole.ASISTAN && token.role !== UserRole.BOARD_MEMBER) {
        // Students can access check-in pages
        if (!isCheckInPage) {
          console.log('Non-tutor user attempting to access part2, redirecting');
          const roleBasedPath = '/dashboard/part7/student';
          return NextResponse.redirect(new URL(roleBasedPath, request.url));
        }
      }
    }

    // Redirect non-admin/board users away from parts 1, 3-6 and 8-9 to part 7 (except check-in and detail pages)
    if (pathname.startsWith('/dashboard/part') &&
      !pathname.startsWith('/dashboard/part7') &&
      !pathname.startsWith('/dashboard/part2') &&
      !pathname.startsWith('/dashboard/part4') &&
      !isCheckInPage &&
      !isMeetingDetailPage) {
      if (token.role !== UserRole.ADMIN && token.role !== UserRole.BOARD_MEMBER) {
        console.log('Non-admin/board user attempting to access restricted part, redirecting to part 7');
        const roleBasedPath = token.role === UserRole.STUDENT
          ? '/dashboard/part7/student'
          : token.role === UserRole.TUTOR || token.role === UserRole.ASISTAN
            ? '/dashboard/part7/tutor'
            : '/dashboard/part7/student';
        return NextResponse.redirect(new URL(roleBasedPath, request.url));
      }
    }


    // Check route permissions
    if (pathname.startsWith('/dashboard/part7/admin') || pathname.startsWith('/api/admin')) {
      // Allow privileged users to GET periods (needed for event creation)
      if (pathname === '/api/admin/periods' && request.method === 'GET') {
        if (token.role !== UserRole.ADMIN && token.role !== UserRole.TUTOR && token.role !== UserRole.ASISTAN && token.role !== UserRole.BOARD_MEMBER) {
          console.log('Unauthorized user attempting to access periods');
          return isApiRoute
            ? NextResponse.json({ error: 'Forbidden: Admin, Board Member, Tutor, or Asistan access required' }, { status: 403 })
            : NextResponse.redirect(new URL('/', request.url));
        }
      } else if (token.role !== UserRole.ADMIN && token.role !== UserRole.BOARD_MEMBER) {
        console.log('Non-privileged user attempting to access admin route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin or Board Member access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/dashboard/part7/tutor') || pathname.startsWith('/api/tutor')) {
      if (token.role !== UserRole.TUTOR && token.role !== UserRole.ASISTAN && token.role !== UserRole.BOARD_MEMBER) {
        console.log('Non-tutor/asistan/board-member user attempting to access tutor route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Tutor, Asistan, or Board Member access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/api/student/reports')) {
      // Allow ADMIN, TUTOR, ASISTAN, BOARD_MEMBER and STUDENT for /api/student/reports endpoints
      if (![UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER, UserRole.STUDENT].includes(token.role as UserRole)) {
        console.log('Unauthorized user attempting to access student reports API');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin, Tutor, Asistan, Board Member, or Student access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }
    else if (pathname.startsWith('/dashboard/part7/student') || pathname.startsWith('/api/student')) {
      if (token.role !== UserRole.STUDENT) {
        console.log('Non-student user attempting to access student route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Student access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    const response = NextResponse.next();

    // Add user info to headers for debugging
    response.headers.set('x-user-role', token.role as string);
    response.headers.set('x-user-id', token.sub as string);
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store, must-revalidate');

    console.log('Auth check passed, proceeding with request');
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