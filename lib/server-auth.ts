import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { UserJwtPayload } from './auth';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// Name of the auth cookie - specific to this project
const AUTH_COOKIE_NAME = 'ogrtakip-session';
// Token expiration time in seconds (24 hours)
const TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60;
// Refresh token expiration time in seconds (7 days)
const REFRESH_TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;
const REFRESH_TOKEN_COOKIE_NAME = 'ogrtakip-refresh';

// Add authentication utility functions
export function isAuthenticated(user: UserJwtPayload | null) {
  return user !== null;
}

export function isAdmin(user: UserJwtPayload | null) {
  return user?.role === UserRole.ADMIN;
}

export function isTutor(user: UserJwtPayload | null) {
  return user?.role === UserRole.TUTOR;
}

export function isStudent(user: UserJwtPayload | null) {
  return user?.role === UserRole.STUDENT;
}

export async function verifyJWT(token: string): Promise<UserJwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserJwtPayload;
  } catch (error) {
    return null;
  }
}

export async function signJWT(payload: UserJwtPayload) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRATION_SECONDS}s`)
    .sign(secret);
  
  const refreshToken = await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_EXPIRATION_SECONDS}s`)
    .sign(secret);
  
  return { token, refreshToken };
}

export async function getJWTFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token;
}

export function setJWTCookie(response: NextResponse, token: string, refreshToken: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_EXPIRATION_SECONDS,
    sameSite: 'strict',
    path: '/',
  });

  response.cookies.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TOKEN_EXPIRATION_SECONDS,
    sameSite: 'strict',
    path: '/',
  });
  
  return response;
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  
  console.log('Checking tokens:', { hasToken: !!token, hasRefreshToken: !!refreshToken });
  
  // First try the access token
  if (token) {
    const user = await verifyJWT(token);
    if (user) {
      console.log('Access token valid, user:', user);
      return user;
    }
    console.log('Access token invalid');
  }
  
  // If access token is invalid or missing, try refresh token
  if (refreshToken) {
    console.log('Attempting refresh with refresh token');
    const result = await refreshAccessToken(refreshToken);
    if (result) {
      console.log('Refresh successful, new token generated');
      // Create a new response
      const response = NextResponse.next();
      
      // Set the new tokens in the response
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: result.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: TOKEN_EXPIRATION_SECONDS,
        sameSite: 'strict',
        path: '/',
      });
      
      // Update the request cookies for the current request
      request.cookies.set(AUTH_COOKIE_NAME, result.token);
      request.headers.set('Cookie', request.cookies.toString());
      
      // Ensure no caching
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      response.headers.set('x-middleware-cache', 'no-cache');
      
      return result.user;
    }
    console.log('Refresh token invalid or refresh failed');
  }
  
  console.log('No valid tokens found');
  return null;
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  
  // First try the access token
  if (token) {
    const user = await verifyJWT(token);
    if (user) {
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    }
  }
  
  // If access token is invalid or missing, try refresh token
  if (refreshToken) {
    const result = await refreshAccessToken(refreshToken);
    if (result) {
      // Create a new response
      const response = NextResponse.next();
      
      // Set the new tokens
      setJWTCookie(response, result.token, refreshToken);
      
      return {
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role
        }
      };
    }
  }
  
  return null;
}

export async function refreshAccessToken(refreshToken: string): Promise<{ token: string; user: UserJwtPayload } | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(refreshToken, secret);
    
    if (payload.type !== 'refresh') {
      return null;
    }
    
    const user: UserJwtPayload = {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };
    
    const newToken = await new SignJWT(user)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_EXPIRATION_SECONDS}s`)
      .sign(secret);
    
    return { token: newToken, user };
  } catch (error) {
    return null;
  }
}

export async function checkIsAdmin(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    return user?.role === UserRole.ADMIN;
  } catch (error) {
    return false;
  }
} 