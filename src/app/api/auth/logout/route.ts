import { NextResponse } from 'next/server'
import { handleApiError } from '../../../../app/(frontend)/lib/server/http'
import { recordActivity } from '../../../../app/(frontend)/lib/server/activity.repo'
import {
  destroySession,
  getSession,
  sessionCookieOptions,
} from '../../../../app/(frontend)/lib/server/session'
import { SESSION_COOKIE } from '../../../../app/(frontend)/lib/server/session-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Read the identity before the session row disappears.
    const session = await getSession()
    await destroySession()

    if (session) {
      await recordActivity({
        staff: session.staff,
        action: 'sign_out',
        entity: 'session',
        summary: 'Signed out of the workspace',
        request,
      })
    }

    const response = NextResponse.json({ data: { signedOut: true } })
    response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
