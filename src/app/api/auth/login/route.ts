import { NextResponse } from 'next/server'
import {
  handleApiError,
  jsonError,
  readJsonBody,
  requiredString,
  ValidationError,
} from '../../../../app/(frontend)/lib/server/http'
import { verifyPassword } from '../../../../app/(frontend)/lib/server/password'
import { findStaffByUsername, touchStaffLogin } from '../../../../app/(frontend)/lib/server/staff.repo'
import {
  createSession,
  purgeExpiredSessions,
  sessionCookieOptions,
} from '../../../../app/(frontend)/lib/server/session'
import { SESSION_COOKIE } from '../../../../app/(frontend)/lib/server/session-token'
import { recordActivity } from '../../../../app/(frontend)/lib/server/activity.repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type LoginBody = { username?: string; password?: string }

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<LoginBody>(request)
    const username = requiredString(body.username, 'Username', 64)
    const password = typeof body.password === 'string' ? body.password : ''
    if (!password) throw new ValidationError('Password is required.', { field: 'password' })

    const staff = await findStaffByUsername(username)
    // Hash work runs even for unknown users so response time does not reveal
    // whether a username exists.
    const valid = staff ? await verifyPassword(password, staff.passwordHash) : false

    if (!staff || !valid || !staff.isActive) {
      return jsonError(401, 'invalid-credentials', 'Invalid username or password.')
    }

    await purgeExpiredSessions()
    const session = await createSession(staff.id, request.headers.get('user-agent'))
    await touchStaffLogin(staff.id)

    await recordActivity({
      staff,
      action: 'sign_in',
      entity: 'session',
      summary: `Signed in as ${staff.username} (${staff.role})`,
      request,
    })

    const response = NextResponse.json({
      data: {
        id: staff.id,
        username: staff.username,
        displayName: staff.displayName,
        role: staff.role,
      },
    })
    response.cookies.set(SESSION_COOKIE, session.cookieValue, {
      ...sessionCookieOptions(),
      maxAge: session.maxAge,
    })
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
