import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { withAuth } from "next-auth/middleware";

// Export config first
export const config = {
  matcher: [
    // Protected API routes
    "/api/admin/:path*",
    "/api/tutor/:path*",
    "/api/student/:path*",
    // Protected pages
    "/admin/:path*",
    "/tutor/:path*",
    "/student/:path*",
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

    // Check route permissions
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (token.role !== UserRole.ADMIN) {
        console.log('Non-admin user attempting to access admin route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    if (pathname.startsWith('/tutor') || pathname.startsWith('/api/tutor')) {
      if (token.role !== UserRole.TUTOR) {
        console.log('Non-tutor user attempting to access tutor route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Tutor access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    if (pathname.startsWith('/student') || pathname.startsWith('/api/student')) {
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

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
}); 