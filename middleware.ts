import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const SESSION_COOKIE_NAME = 'cbt_session_token';
const LAST_ACTIVITY_COOKIE_NAME = 'cbt_last_activity';
const SERVER_INACTIVITY_TIMEOUT_MS = parseInt(process.env.SESSION_MAX_INACTIVITY_SECONDS || '1800', 10) * 1000;

function checkServerInactivity(
  request: NextRequest,
  isAuthenticated: boolean
): { shouldLogout: boolean; inactiveTimeMs: number } {
  if (!isAuthenticated) {
    return { shouldLogout: false, inactiveTimeMs: 0 };
  }

  const lastActivityCookie = request.cookies.get(LAST_ACTIVITY_COOKIE_NAME)?.value;
  
  if (!lastActivityCookie) {
    return { shouldLogout: false, inactiveTimeMs: 0 };
  }

  const lastActivity = parseInt(lastActivityCookie, 10);
  const now = Date.now();
  const inactiveTimeMs = now - lastActivity;

  const shouldLogout = inactiveTimeMs > SERVER_INACTIVITY_TIMEOUT_MS;

  return { shouldLogout, inactiveTimeMs };
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isAuthenticated = !!sessionToken;

  let sessionClaims: { role: string; id: string } | null = null;
  if (sessionToken) {
    const payload = verifyToken(sessionToken);
    if (payload) {
      sessionClaims = { role: payload.role, id: payload.id };
    }
  }

  const { shouldLogout, inactiveTimeMs } = checkServerInactivity(request, isAuthenticated);

  if (shouldLogout) {
    console.log(`[Middleware] Session inactive for ${Math.floor(inactiveTimeMs / 1000)}s - forcing logout`);
    
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(LAST_ACTIVITY_COOKIE_NAME);

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'session_timeout');
    url.searchParams.set('inactive', Math.floor(inactiveTimeMs / 1000).toString());
    return NextResponse.redirect(url);
  }

  const now = Date.now();
  response.cookies.set(LAST_ACTIVITY_COOKIE_NAME, now.toString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SERVER_INACTIVITY_TIMEOUT_MS / 1000,
    path: '/',
  });

  const protectedRoutes = ['/dashboard', '/admin', '/guru', '/siswa'];
  const publicRoutes = ['/login', '/register', '/ujian'];
  const rootRoute = '/';

  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route
  );
  const isRootRoute = request.nextUrl.pathname === rootRoute;

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && sessionClaims) {
    const role = sessionClaims.role;
    const path = request.nextUrl.pathname;

    if (role === 'super_admin' && (path.startsWith('/guru') || path.startsWith('/siswa'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }

    if (role === 'guru' && path.startsWith('/admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/guru';
      return NextResponse.redirect(url);
    }

    if (role === 'siswa' && (path.startsWith('/admin') || path.startsWith('/guru'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/siswa';
      return NextResponse.redirect(url);
    }
  }

  const isUjianRoute = request.nextUrl.pathname === '/ujian' || request.nextUrl.pathname.startsWith('/ujian/');
  if ((isPublicRoute || isRootRoute) && isAuthenticated && !isUjianRoute) {
    const url = request.nextUrl.clone();

    if (sessionClaims) {
      const roleRedirectMap: Record<string, string> = {
        super_admin: '/admin',
        guru: '/guru',
        siswa: '/siswa'
      };
      url.pathname = roleRedirectMap[sessionClaims.role] || '/admin';
    } else {
      url.pathname = '/admin';
    }
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};