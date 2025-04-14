import { NextRequest, NextResponse } from 'next/server';

// Name of the auth cookie - specific to this project
const AUTH_COOKIE_NAME = 'ogrtakip-session';
const REFRESH_TOKEN_COOKIE_NAME = 'ogrtakip-refresh';

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Clear the auth cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiration in the past to delete the cookie
      sameSite: 'strict',
      path: '/',
    });

    // Clear the refresh token cookie
    response.cookies.set({
      name: REFRESH_TOKEN_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Set expiration in the past to delete the cookie
      sameSite: 'strict',
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 