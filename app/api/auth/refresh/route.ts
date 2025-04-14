import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, setJWTCookie } from '@/lib/server-auth';

const REFRESH_TOKEN_COOKIE_NAME = 'ogrtakip-refresh';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const result = await refreshAccessToken(refreshToken);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const { token, user } = result;

    const response = NextResponse.json(
      {
        message: 'Token refreshed successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tutorId: user.tutorId
        }
      },
      { status: 200 }
    );

    return setJWTCookie(response, token, refreshToken);
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 