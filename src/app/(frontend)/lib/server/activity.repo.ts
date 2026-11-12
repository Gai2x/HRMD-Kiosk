import type { RowDataPacket } from 'mysql2/promise'
import { execute, queryRows } from '../db'
import type { ActivityAction, ActivityEntity, ActivityEntry } from '../types'
import type { StaffMember } from './session'

/**
 * Admin activity log.
 *
 * Every entry is written with the staff identity resolved from the server-side
 * session (`requireStaff()`), never from request input, so the trail can't be
 * attributed to someone else. Writing an entry must never break the action it
 * describes, so failures are logged and swallowed.
 */

export type ActivityInput = {
  staff: StaffMember
  action: ActivityAction
  entity?: ActivityEntity | null
  entityRef?: string | null
  summary: string
  detail?: Record<string, unknown> | null
  request?: Request
}

function clientIp(request?: Request): string | null {
  if (!request) return null
  const forwarded = request.headers.get('x-forwarded-for')
  const value = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')
  return value ? value.slice(0, 64) : null
}

function userAgent(request?: Request): string | null {
  const value = request?.headers.get('user-agent')
  return value ? value.slice(0, 255) : null
}

export async function recordActivity(input: ActivityInput): Promise<void> {
  try {
    await execute(
      `INSERT INTO staff_activity
         (staff_id, staff_name, action, entity, entity_ref, summary, detail, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.staff.id,
        input.staff.displayName.slice(0, 96),
        input.action,
        input.entity ?? null,
        input.entityRef ? input.entityRef.slice(0, 64) : null,
        input.summary.slice(0, 255),
        input.detail ? JSON.stringify(input.detail) : null,
        clientIp(input.request),
        userAgent(input.request),
      ],
    )
  } catch (error) {
    console.error('[activity] could not record entry', error)
  }
}

type ActivityRow = RowDataPacket & {
  id: number | string
  staff_id: number | null
  staff_name: string
  action: string
  entity: string | null
  entity_ref: string | null
  summary: string
  detail: unknown
  ip: string | null
  created_at: Date
}

function parseDetail(value: unknown): Record<string, unknown> | null {
  if (!value) return null
  if (typeof value === 'object') return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
  return null
}

function mapRow(row: ActivityRow): ActivityEntry {
  return {
    id: Number(row.id),
    staffId: row.staff_id,
    staffName: row.staff_name,
    action: row.action as ActivityAction,
    entity: (row.entity as ActivityEntity | null) ?? null,
    entityRef: row.entity_ref,
    summary: row.summary,
    detail: parseDetail(row.detail),
    ip: row.ip,
    createdAt: row.created_at.toISOString(),
  }
}

export type ActivityListOptions = {
  /** Exact action names to include; empty means "everything". */
  actions?: string[]
  staffId?: number
  q?: string
  limit?: number
  offset?: number
}

export async function listActivity(options: ActivityListOptions = {}) {
  const where: string[] = []
  const params: unknown[] = []

  if (options.actions?.length) {
    where.push(`action IN (${options.actions.map(() => '?').join(', ')})`)
    params.push(...options.actions)
  }
  if (options.staffId) {
    where.push('staff_id = ?')
    params.push(options.staffId)
  }
  if (options.q) {
    const like = `%${options.q}%`
    where.push('(summary LIKE ? OR staff_name LIKE ? OR entity_ref LIKE ?)')
    params.push(like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500)
  const offset = Math.max(options.offset ?? 0, 0)

  const [rows, totals] = await Promise.all([
    queryRows<ActivityRow>(
      `SELECT id, staff_id, staff_name, action, entity, entity_ref, summary, detail, ip, created_at
         FROM staff_activity
         ${whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
    queryRows<RowDataPacket & { total: number | string }>(
      `SELECT COUNT(*) AS total FROM staff_activity ${whereSql}`,
      params,
    ),
  ])

  return { entries: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) }
}

/** Counts for the module's summary cards. */
export async function activitySummary() {
  const rows = await queryRows<RowDataPacket & { action: string; total: number | string }>(
    `SELECT action, COUNT(*) AS total
       FROM staff_activity
      WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY action`,
  )
  const byAction = new Map<string, number>(rows.map((row) => [row.action, Number(row.total)]))

  const signInsToday = await queryRows<RowDataPacket & { total: number | string }>(
    `SELECT COUNT(*) AS total FROM staff_activity
      WHERE action = 'sign_in' AND created_at >= UTC_DATE()`,
  )

  return {
    signInsToday: Number(signInsToday[0]?.total ?? 0),
    signIns7d: byAction.get('sign_in') ?? 0,
    statusChanges7d: byAction.get('request_status') ?? 0,
    rosterEdits7d: (byAction.get('employee_create') ?? 0) + (byAction.get('employee_update') ?? 0),
  }
}
