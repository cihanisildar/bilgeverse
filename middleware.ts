import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
import { withAuth } from "next-auth/middleware";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware - Request URL:', request.url);
  console.log('Middleware - Pathname:', pathname);
  console.log('Middleware - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
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
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log('Token check result:', { 
      hasToken: !!token,
      tokenContents: token ? {
        role: token.role,
        username: token.username,
        // Don't log sensitive information
      } : null,
      path: pathname,
    });

    const isApiRoute = pathname.startsWith('/api/');

    if (!token) {
      console.log('No token found - redirecting to login');
      return isApiRoute 
        ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
    }

    // Helper function to check if a path matches a route pattern
    const matchesRoute = (path: string, pattern: string) => {
      const regexPattern = pattern
        .replace(/\//g, '\\/')
        .replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(path);
    };

    // Define protected route patterns
    const adminRoutes = ['/admin*', '/api/admin*'];
    const tutorRoutes = ['/tutor*', '/api/tutor*'];
    const studentRoutes = ['/student*', '/api/student*'];

    // Check admin routes
    if (adminRoutes.some(pattern => matchesRoute(pathname, pattern))) {
      console.log('Admin route check:', {
        path: pathname,
        userRole: token.role,
        isAdmin: token.role === UserRole.ADMIN
      });
      
      if (token.role !== UserRole.ADMIN) {
        console.log('Non-admin user attempting to access admin route');
        return isApiRoute
          ? NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
          : NextResponse.redirect(new URL('/', request.url));
      }
    }

    // Check tutor routes
    if (tutorRoutes.some(pattern => matchesRoute(pathname, pattern)) && token.role !== UserRole.TUTOR) {
      console.log('Non-tutor user attempting to access tutor route');
      return isApiRoute
        ? NextResponse.json({ error: 'Forbidden: Tutor access required' }, { status: 403 })
        : NextResponse.redirect(new URL('/', request.url));
    }

    // Check student routes
    if (studentRoutes.some(pattern => matchesRoute(pathname, pattern)) && token.role !== UserRole.STUDENT) {
      console.log('Non-student user attempting to access student route');
      return isApiRoute
        ? NextResponse.json({ error: 'Forbidden: Student access required' }, { status: 403 })
        : NextResponse.redirect(new URL('/', request.url));
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

// Consolidated config for all matchers
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