import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest, isAdmin } from './lib/server-auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware processing path:', pathname);

  // Skip middleware for public assets and auth API routes
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/auth/') ||
      pathname === '/favicon.ico') {
    console.log('Skipping middleware for:', pathname);
    return NextResponse.next();
  }

  // Allow public paths
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    console.log('Allowing public path:', pathname);
    return NextResponse.next();
  }

  try {
    console.log('Checking auth for path:', pathname);
    
    const user = await getUserFromRequest(request);
    console.log('Auth check result:', user ? 'authenticated' : 'not authenticated');

    if (!user) {
      console.log('No user found, redirecting to login');
      const redirectUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set('x-middleware-cache', 'no-cache');
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    // Check admin routes
    if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && !isAdmin(user)) {
      console.log('Non-admin user attempting to access admin route:', pathname);
      const response = NextResponse.json(
        { error: 'Unauthorized: Only admin can access this endpoint' },
        { status: 403 }
      );
      response.headers.set('x-middleware-cache', 'no-cache');
      response.headers.set('Cache-Control', 'no-store, must-revalidate');
      return response;
    }

    const response = NextResponse.next();
    // Add user info to headers for debugging
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    const redirectUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    return response;
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*'
  ],
}; 