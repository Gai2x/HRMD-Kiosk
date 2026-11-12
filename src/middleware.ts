import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionCookie } from './app/(frontend)/lib/server/session-token'

/**
 * Outer authentication gate.
 *
 * Runs on every admin page and API request and rejects anything without a
 * correctly HMAC-signed session cookie. It cannot read MySQL, so it trusts the
 * signature only; each handler still validates the session row (expiry,
 * revocation, active staff) before touching data. Forged cookies are stopped
 * here; revoked ones are stopped there.
 */

const LOGIN_PATH = '/hrmd-admin/login'

/** Endpoints the public kiosk needs, plus auth itself. */
const PUBLIC_ENDPOINTS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/health',
  '/api/employees/search',
])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = await verifySessionCookie(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET,
  )

  // The login page always renders. Whether a session is actually alive can only
  // be confirmed against MySQL, which the edge cannot reach — so the page checks
  // /api/auth/me itself. Redirecting here on the cookie signature alone would
  // bounce a stale cookie (valid signature, revoked session) forever.
  if (pathname === LOGIN_PATH) return NextResponse.next()

  if (pathname.startsWith('/hrmd-admin')) {
    if (sessionId) return NextResponse.next()
    const loginUrl = new URL(LOGIN_PATH, request.url)
    if (pathname !== '/hrmd-admin') loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_ENDPOINTS.has(pathname)) return NextResponse.next()
    // The kiosk files requests without a staff session.
    if (pathname === '/api/requests' && request.method === 'POST') return NextResponse.next()
    // Public tracking by reference, contact fields excluded server-side.
    if (pathname.startsWith('/api/tracking/')) return NextResponse.next()

    if (!sessionId) {
      return NextResponse.json({ error: 'unauthorized', message: 'Sign in to continue.' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/hrmd-admin/:path*', '/api/:path*'],
}
