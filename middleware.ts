import { NextResponse, type NextRequest } from 'next/server'
import { createHmac } from 'crypto'

const SESSION_COOKIE_NAME = 'cbt_session_token'
const SESSION_CLAIMS_COOKIE_NAME = 'cbt_session_claims'

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.SETUP_TOKEN || 'fallback-secret-change-me'
}

/**
 * Verifikasi claims cookie tanpa menyentuh database.
 * Jauh lebih cepat — hanya HMAC verification (operasi lokal, ~0.1ms).
 */
function verifyClaimsFast(claims: string): { role: string; uid: string } | null {
  try {
    const [data, sig] = claims.split('.')
    if (!data || !sig) return null
    const expected = createHmac('sha256', getSessionSecret()).update(data).digest('base64url')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    // Cek expiry
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!payload.role || !payload.uid) return null
    return { role: payload.role, uid: payload.uid }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const claimsCookie = request.cookies.get(SESSION_CLAIMS_COOKIE_NAME)?.value

  // Fast path: verifikasi dengan claims cookie (tidak perlu DB query)
  let sessionClaims: { role: string; uid: string } | null = null

  if (sessionToken && claimsCookie) {
    sessionClaims = verifyClaimsFast(claimsCookie)
  }

  const isAuthenticated = !!(sessionToken && sessionClaims)

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

  // Role-based route protection (dari claims, tanpa DB)
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

  if ((isPublicRoute || isRootRoute) && isAuthenticated && sessionClaims) {
    const url = request.nextUrl.clone()
    const roleRedirectMap: Record<string, string> = {
      super_admin: '/admin',
      guru: '/guru',
      siswa: '/siswa'
    }
    url.pathname = roleRedirectMap[sessionClaims.role] || '/admin'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}