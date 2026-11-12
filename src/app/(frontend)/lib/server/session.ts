import { randomBytes } from 'node:crypto'
import type { RowDataPacket } from 'mysql2/promise'
import { cookies } from 'next/headers'
import { execute, queryRows } from '../db'
import { SESSION_COOKIE, signSessionId, verifySessionCookie } from './session-token'

/**
 * Staff sessions.
 *
 * The cookie holds a random 64-char session id plus an HMAC of that id. The
 * authoritative record lives in `staff_sessions`, so signing out (or revoking a
 * row) kills the session immediately — the cookie alone proves nothing.
 */

/** Eight hours, refreshed on every successful lookup. */
export const SESSION_TTL_SECONDS = 8 * 60 * 60

export type StaffRole = 'admin' | 'hr_staff'

export type StaffMember = {
  id: number
  username: string
  displayName: string
  role: StaffRole
}

export type ActiveSession = {
  sessionId: string
  staff: StaffMember
}

export function sessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() ?? ''
}

export function isSessionConfigured() {
  return sessionSecret().length >= 16
}

type SessionRow = RowDataPacket & {
  session_id: string
  staff_id: number
  username: string
  display_name: string
  role: string
}

/**
 * Reads and validates the current request's session.
 * Returns null for a missing, forged, expired or revoked cookie.
 */
export async function getSession(): Promise<ActiveSession | null> {
  const secret = sessionSecret()
  if (!secret) return null

  const store = await cookies()
  const sessionId = await verifySessionCookie(store.get(SESSION_COOKIE)?.value, secret)
  if (!sessionId) return null

  const rows = await queryRows<SessionRow>(
    `SELECT s.id AS session_id, st.id AS staff_id, st.username, st.display_name, st.role
       FROM staff_sessions s
       JOIN staff st ON st.id = s.staff_id
      WHERE s.id = ? AND s.expires_at > UTC_TIMESTAMP() AND st.is_active = 1
      LIMIT 1`,
    [sessionId],
  )
  const row = rows[0]
  if (!row) return null

  // Sliding expiry: an active admin is not kicked out mid-shift.
  await execute(
    'UPDATE staff_sessions SET expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND) WHERE id = ?',
    [SESSION_TTL_SECONDS, sessionId],
  )

  return {
    sessionId,
    staff: {
      id: row.staff_id,
      username: row.username,
      displayName: row.display_name,
      role: (row.role === 'admin' ? 'admin' : 'hr_staff') as StaffRole,
    },
  }
}

export async function createSession(staffId: number, userAgent?: string | null) {
  const secret = sessionSecret()
  if (!secret) throw new Error('SESSION_SECRET is not configured')

  const sessionId = randomBytes(32).toString('hex')
  await execute(
    'INSERT INTO staff_sessions (id, staff_id, user_agent, expires_at) VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))',
    [sessionId, staffId, userAgent?.slice(0, 255) ?? null, SESSION_TTL_SECONDS],
  )

  return {
    sessionId,
    cookieValue: await signSessionId(sessionId, secret),
    maxAge: SESSION_TTL_SECONDS,
  }
}

/** Deletes the session row behind the current cookie, if it is valid. */
export async function destroySession(): Promise<void> {
  const secret = sessionSecret()
  if (!secret) return

  const store = await cookies()
  const sessionId = await verifySessionCookie(store.get(SESSION_COOKIE)?.value, secret)
  if (!sessionId) return

  await execute('DELETE FROM staff_sessions WHERE id = ?', [sessionId])
}

/** Housekeeping: drop expired rows (safe to call on every sign-in). */
export async function purgeExpiredSessions(): Promise<void> {
  await execute('DELETE FROM staff_sessions WHERE expires_at < UTC_TIMESTAMP()')
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }
}
