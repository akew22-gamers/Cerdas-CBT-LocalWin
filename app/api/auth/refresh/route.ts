import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_SESSION', message: 'Tidak ada session aktif' } },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SESSION', message: 'Session tidak valid' } },
        { status: 401 }
      );
    }

    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/'
    });

    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

    return NextResponse.json({
      success: true,
      data: {
        expires_at: newExpiresAt.toISOString(),
        refreshed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server' } },
      { status: 500 }
    );
  }
}