import { NextResponse } from 'next/server'
import { handleApiError } from '../../../../app/(frontend)/lib/server/http'
import { getSession, sessionCookieOptions } from '../../../../app/(frontend)/lib/server/session'
import { SESSION_COOKIE } from '../../../../app/(frontend)/lib/server/session-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      // A cookie can carry a valid signature while its session row is expired or
      // revoked. Clearing it here keeps "signed out" a terminal state instead of
      // bouncing between the gate and the login page.
      const response = NextResponse.json(
        { error: 'unauthorized', message: 'Not signed in.' },
        { status: 401 },
      )
      response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
      return response
    }

    return NextResponse.json({ data: session.staff })
  } catch (error) {
    return handleApiError(error)
  }
}
