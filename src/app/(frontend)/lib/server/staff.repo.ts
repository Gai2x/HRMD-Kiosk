import type { RowDataPacket } from 'mysql2/promise'
import { execute, queryRows } from '../db'
import type { StaffMember, StaffRole } from './session'

type StaffRow = RowDataPacket & {
  id: number
  username: string
  display_name: string
  role: string
  password_hash: string
  is_active: number
}

export type StaffWithSecret = StaffMember & { passwordHash: string; isActive: boolean }

function mapRole(role: string): StaffRole {
  return role === 'admin' ? 'admin' : 'hr_staff'
}

/** Sign-in lookup. Returns null for unknown usernames. */
export async function findStaffByUsername(username: string): Promise<StaffWithSecret | null> {
  const rows = await queryRows<StaffRow>(
    'SELECT id, username, display_name, role, password_hash, is_active FROM staff WHERE username = ? LIMIT 1',
    [username.trim().toLowerCase()],
  )
  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: mapRole(row.role),
    passwordHash: row.password_hash,
    isActive: row.is_active === 1,
  }
}

export async function touchStaffLogin(staffId: number): Promise<void> {
  await execute('UPDATE staff SET last_login_at = UTC_TIMESTAMP() WHERE id = ?', [staffId])
}

export async function countStaff(): Promise<number> {
  const rows = await queryRows<RowDataPacket & { total: number | string }>('SELECT COUNT(*) AS total FROM staff')
  return Number(rows[0]?.total ?? 0)
}
