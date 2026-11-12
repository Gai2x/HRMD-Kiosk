import { UnauthorizedError } from './http'
import { getSession, type StaffMember } from './session'

/**
 * Every staff-only API handler starts with this. It validates the signed cookie
 * against `staff_sessions` (expiry, revocation, active account) and returns the
 * signed-in staff member — which is also the only source of the audit actor.
 */
export async function requireStaff(): Promise<StaffMember> {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session.staff
}
