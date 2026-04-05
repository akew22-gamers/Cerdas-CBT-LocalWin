import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'cbt_session_token'
const SESSION_CLAIMS_COOKIE_NAME = 'cbt_session_claims'
const LAST_ACTIVITY_COOKIE_NAME = 'cbt_last_activity'

// Server-side session inactivity timeout (30 minutes default)
const SERVER_INACTIVITY_TIMEOUT_MS = parseInt(process.env.SESSION_MAX_INACTIVITY_SECONDS || '1800', 10) * 1000

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.SETUP_TOKEN || 'fallback-secret-change-me'
}

/**
 * Decode base64url string (Web Crypto compatible, no Buffer needed)
 */
function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
  return atob(padded)
}

/**
 * Verifikasi claims cookie menggunakan Web Crypto API
 */
async function verifyClaimsFast(
  claims: string
): Promise<{ role: string; uid: string } | null> {
  try {
    const dotIndex = claims.lastIndexOf('.')
    if (dotIndex === -1) return null

    const data = claims.slice(0, dotIndex)
    const sig = claims.slice(dotIndex + 1)
    if (!data || !sig) return null

    const secret = getSessionSecret()
    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBinary = base64urlDecode(sig)
    const sigBytes = new Uint8Array(sigBinary.length)
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i)
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      encoder.encode(data)
    )

    if (!isValid) return null

    const payload = JSON.parse(base64urlDecode(data))
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.role || !payload.uid) return null

    return { role: payload.role, uid: payload.uid }
  } catch {
    return null
  }
}

/**
 * Check if session has been inactive for too long (server-side validation)
 * This works even when client-side idle timer freezes (background tabs, mobile)
 */
function checkServerInactivity(
  request: NextRequest,
  isAuthenticated: boolean
): { shouldLogout: boolean; inactiveTimeMs: number } {
  if (!isAuthenticated) {
    return { shouldLogout: false, inactiveTimeMs: 0 }
  }

  const lastActivityCookie = request.cookies.get(LAST_ACTIVITY_COOKIE_NAME)?.value
  
  if (!lastActivityCookie) {
    // No last activity tracked - this is first request or legacy session
    return { shouldLogout: false, inactiveTimeMs: 0 }
  }

  const lastActivity = parseInt(lastActivityCookie, 10)
  const now = Date.now()
  const inactiveTimeMs = now - lastActivity

  // Check if inactive longer than allowed timeout
  const shouldLogout = inactiveTimeMs > SERVER_INACTIVITY_TIMEOUT_MS

  return { shouldLogout, inactiveTimeMs }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const claimsCookie = request.cookies.get(SESSION_CLAIMS_COOKIE_NAME)?.value

  const isAuthenticated = !!sessionToken

  let sessionClaims: { role: string; uid: string } | null = null
  if (sessionToken && claimsCookie) {
    sessionClaims = await verifyClaimsFast(claimsCookie)
  }

  // === SERVER-SIDE INACTIVITY CHECK ===
  const { shouldLogout, inactiveTimeMs } = checkServerInactivity(request, isAuthenticated)

  if (shouldLogout) {
    console.log(`[Middleware] Session inactive for ${Math.floor(inactiveTimeMs / 1000)}s - forcing logout`)
    
    // Clear session cookies
    response.cookies.delete(SESSION_COOKIE_NAME)
    response.cookies.delete(SESSION_CLAIMS_COOKIE_NAME)
    response.cookies.delete(LAST_ACTIVITY_COOKIE_NAME)

    // Redirect to login with timeout reason
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'session_timeout')
    url.searchParams.set('inactive', Math.floor(inactiveTimeMs / 1000).toString())
    return NextResponse.redirect(url)
  }

  // === UPDATE LAST ACTIVITY TIMESTAMP ON EVERY REQUEST ===
  // This ensures active sessions stay alive, inactive ones expire
  const now = Date.now()
  response.cookies.set(LAST_ACTIVITY_COOKIE_NAME, now.toString(), {
    httpOnly: false, // Client can read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SERVER_INACTIVITY_TIMEOUT_MS / 1000, // Match timeout
    path: '/',
  })

  const protectedRoutes = ['/dashboard', '/ujian', '/admin', '/guru', '/siswa']
  const publicRoutes = ['/login', '/register']
  const rootRoute = '/'

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  )
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route
  )
  const isRootRoute = request.nextUrl.pathname === rootRoute

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Role-based routing
  if (isAuthenticated && sessionClaims) {
    const role = sessionClaims.role
    const path = request.nextUrl.pathname

    if (role === 'super_admin' && (path.startsWith('/guru') || path.startsWith('/siswa'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    if (role === 'guru' && path.startsWith('/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/guru'
      return NextResponse.redirect(url)
    }

    if (role === 'siswa' && (path.startsWith('/admin') || path.startsWith('/guru'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/siswa'
      return NextResponse.redirect(url)
    }
  }

  // Redirect from public routes if already logged in
  if ((isPublicRoute || isRootRoute) && isAuthenticated) {
    const url = request.nextUrl.clone()

    if (sessionClaims) {
      const roleRedirectMap: Record<string, string> = {
        super_admin: '/admin',
        guru: '/guru',
        siswa: '/siswa'
      }
      url.pathname = roleRedirectMap[sessionClaims.role] || '/admin'
    } else {
      url.pathname = '/admin'
    }
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
