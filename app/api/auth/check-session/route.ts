import { NextRequest, NextResponse } from 'next/server'
import { getSession, deleteSession } from '@/lib/auth/session'

// Server-side inactivity timeout (30 minutes)
const SERVER_INACTIVITY_TIMEOUT_MS = parseInt(process.env.SESSION_MAX_INACTIVITY_SECONDS || '1800', 10) * 1000

/**
 * GET /api/auth/check-session
 * 
 * Check if user session is still valid and not timed out due to inactivity.
 * Used by client-side idle timeout hook to verify before redirecting to login.
 * 
 * Response:
 * - { isActive: true, inactiveTimeMs: number } - Session still valid
 * - { isActive: false, reason: 'session_timeout' } - Session expired due to inactivity
 * - { isActive: false, reason: 'no_session' } - No active session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      console.log('[API] Session check: No active session found')
      return NextResponse.json(
        { isActive: false, reason: 'no_session' },
        { status: 401 }
      )
    }

    // Get last activity time from request cookie
    const lastActivityCookie = request.cookies.get('cbt_last_activity')?.value

    if (!lastActivityCookie) {
      // No tracking cookie but session exists - this is OK for legacy sessions
      console.log('[API] Session check: No activity cookie (legacy session)')
      return NextResponse.json({
        isActive: true,
        inactiveTimeMs: 0,
        isLegacy: true,
      })
    }

    const lastActivity = parseInt(lastActivityCookie, 10)
    const now = Date.now()
    const inactiveTimeMs = now - lastActivity

    console.log(
      `[API] Session check: Inactive for ${Math.floor(inactiveTimeMs / 1000)}s`,
      `(limit: ${SERVER_INACTIVITY_TIMEOUT_MS / 1000}s)`
    )

    // Check if inactive longer than timeout
    if (inactiveTimeMs > SERVER_INACTIVITY_TIMEOUT_MS) {
      console.log('[API] Session check: INACTIVE - deleting session')
      await deleteSession()

      return NextResponse.json(
        {
          isActive: false,
          reason: 'session_timeout',
          inactiveTimeMs,
          inactiveSeconds: Math.floor(inactiveTimeMs / 1000),
        },
        { status: 401 }
      )
    }

    // Session is active
    return NextResponse.json({
      isActive: true,
      inactiveTimeMs,
      inactiveSeconds: Math.floor(inactiveTimeMs / 1000),
      user: {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
      },
    })
  } catch (error) {
    console.error('[API] Session check failed:', error)
    return NextResponse.json(
      { isActive: false, reason: 'error', error: 'Failed to check session' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/check-session
 * 
 * Update last activity timestamp (called when user becomes active after background)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { success: false, reason: 'no_session' },
        { status: 401 }
      )
    }

    // Update activity timestamp
    const response = NextResponse.json({ success: true })
    response.cookies.set('cbt_last_activity', Date.now().toString(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SERVER_INACTIVITY_TIMEOUT_MS / 1000,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[API] Activity update failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}
