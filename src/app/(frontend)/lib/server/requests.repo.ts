import type { PoolConnection, RowDataPacket } from 'mysql2/promise'
import { queryRows, withTransaction } from '../db'
import type { HrmdRequest, RequestDraft, RequestStatus, ServiceId } from '../types'

type RequestRow = RowDataPacket & {
  id: number
  reference: string
  service: string
  option_id: string | null
  purpose: string
  copies: number | null
  remarks: string | null
  others_specified: string | null
  employee_id: number | null
  emp_first: string
  emp_middle: string | null
  emp_last: string
  emp_suffix: string | null
  emp_position: string | null
  emp_office: string | null
  emp_status: string | null
  emp_email: string | null
  emp_phone: string | null
  submitted_at: Date
  status: string
}

type HistoryRow = RowDataPacket & {
  request_id: number
  status: string
  note: string | null
  actor: string
  occurred_at: Date
}

function mapRequest(row: RequestRow, history: HistoryRow[]): HrmdRequest & { id: number; employeeId: number | null } {
  return {
    id: row.id,
    employeeId: row.employee_id,
    reference: row.reference,
    service: row.service as ServiceId,
    optionId: row.option_id ?? undefined,
    purpose: row.purpose,
    copies: row.copies ?? undefined,
    remarks: row.remarks ?? undefined,
    othersSpecified: row.others_specified ?? undefined,
    submittedAt: row.submitted_at.toISOString(),
    status: row.status as RequestStatus,
    employee: {
      employeeId: row.employee_id,
      firstName: row.emp_first,
      middleName: row.emp_middle ?? '',
      lastName: row.emp_last,
      suffix: row.emp_suffix ?? '',
      position: row.emp_position ?? '',
      office: row.emp_office ?? '',
      employmentStatus: (row.emp_status as HrmdRequest['employee']['employmentStatus']) ?? '',
      email: row.emp_email ?? '',
      contact: row.emp_phone ?? '',
    },
    history: history
      .sort((a, b) => b.occurred_at.getTime() - a.occurred_at.getTime())
      .map((event) => ({
        status: event.status as RequestStatus,
        at: event.occurred_at.toISOString(),
        by: event.actor,
        note: event.note ?? undefined,
      })),
  }
}

async function attachHistory(rows: RequestRow[]) {
  if (!rows.length) return new Map<number, HistoryRow[]>()
  const placeholders = rows.map(() => '?').join(', ')
  const history = await queryRows<HistoryRow>(
    `SELECT request_id, status, note, actor, occurred_at
     FROM request_history
     WHERE request_id IN (${placeholders})`,
    rows.map((row) => row.id),
  )

  const grouped = new Map<number, HistoryRow[]>()
  for (const event of history) {
    const list = grouped.get(event.request_id) ?? []
    list.push(event)
    grouped.set(event.request_id, list)
  }
  return grouped
}

export type RequestListOptions = {
  status?: string
  service?: string
  q?: string
  limit?: number
}

export async function listRequests(options: RequestListOptions = {}) {
  const where: string[] = []
  const params: unknown[] = []

  if (options.status) {
    where.push('status = ?')
    params.push(options.status)
  }
  if (options.service) {
    where.push('service = ?')
    params.push(options.service)
  }
  if (options.q) {
    const like = `%${options.q}%`
    where.push(
      '(reference LIKE ? OR CONCAT(emp_last, ", ", emp_first) LIKE ? OR emp_last LIKE ? OR emp_first LIKE ? OR emp_office LIKE ?)',
    )
    params.push(like, like, like, like, like)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500)

  const rows = await queryRows<RequestRow>(
    `SELECT * FROM requests ${whereSql} ORDER BY submitted_at DESC LIMIT ?`,
    [...params, limit],
  )
  const history = await attachHistory(rows)

  return rows.map((row) => mapRequest(row, history.get(row.id) ?? []))
}

export async function getRequestByReference(reference: string) {
  const rows = await queryRows<RequestRow>('SELECT * FROM requests WHERE reference = ? LIMIT 1', [
    reference.trim().toUpperCase(),
  ])
  if (!rows[0]) return null
  const history = await attachHistory(rows)
  return mapRequest(rows[0], history.get(rows[0].id) ?? [])
}

export async function listRequestsForEmployee(employeeId: number) {
  const rows = await queryRows<RequestRow>(
    `SELECT * FROM requests WHERE employee_id = ? OR (emp_email <> '' AND emp_email = (
        SELECT email FROM employees WHERE id = ?
      ))
     ORDER BY submitted_at DESC
     LIMIT 100`,
    [employeeId, employeeId],
  )
  const history = await attachHistory(rows)
  return rows.map((row) => mapRequest(row, history.get(row.id) ?? []))
}

/** Next sequential reference for the current year, e.g. HR-2026-0007. */
async function nextReference(connection: PoolConnection, now: Date) {
  const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric' }).format(now)
  const prefix = `HR-${year}-`

  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT reference FROM requests WHERE reference LIKE ? ORDER BY reference DESC LIMIT 1 FOR UPDATE',
    [`${prefix}%`],
  )
  const highest = rows[0]
    ? Number.parseInt(String(rows[0].reference).slice(prefix.length), 10)
    : 0

  return `${prefix}${String(Number.isFinite(highest) ? highest + 1 : 1).padStart(4, '0')}`
}

export async function createRequest(draft: RequestDraft, now = new Date()) {
  return withTransaction(async (connection) => {
    const reference = await nextReference(connection, now)
    const employeeId = draft.employee.employeeId ?? null

    const [result] = await connection.execute(
      `INSERT INTO requests
         (reference, service, option_id, purpose, copies, remarks, others_specified, employee_id,
          emp_first, emp_middle, emp_last, emp_suffix, emp_position, emp_office, emp_status, emp_email, emp_phone,
          submitted_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        reference,
        draft.service,
        draft.optionId ?? null,
        draft.purpose,
        draft.copies ?? null,
        draft.remarks ?? null,
        draft.othersSpecified ?? null,
        employeeId,
        draft.employee.firstName,
        draft.employee.middleName || null,
        draft.employee.lastName,
        draft.employee.suffix || null,
        draft.employee.position || null,
        draft.employee.office || null,
        draft.employee.employmentStatus || null,
        draft.employee.email || null,
        draft.employee.contact || null,
        now,
      ],
    )

    const requestId = Number((result as { insertId?: number }).insertId)
    await connection.execute(
      `INSERT INTO request_history (request_id, status, note, actor, occurred_at)
       VALUES (?, 'Pending', NULL, 'Kiosk', ?)`,
      [requestId, now],
    )

    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM requests WHERE id = ?', [requestId])
    const [history] = await connection.query<RowDataPacket[]>(
      'SELECT request_id, status, note, actor, occurred_at FROM request_history WHERE request_id = ?',
      [requestId],
    )

    return mapRequest(rows[0] as RequestRow, history as HistoryRow[])
  })
}

export async function updateRequestStatus(
  reference: string,
  status: RequestStatus,
  options: { note?: string; actor?: string; now?: Date } = {},
) {
  const now = options.now ?? new Date()
  const note = options.note?.trim() || null
  const actor = options.actor?.trim() || 'HRMD staff'

  const updated = await withTransaction(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM requests WHERE reference = ? LIMIT 1 FOR UPDATE',
      [reference.trim().toUpperCase()],
    )
    if (!rows[0]) return false

    const requestId = Number(rows[0].id)
    await connection.execute('UPDATE requests SET status = ? WHERE id = ?', [status, requestId])
    await connection.execute(
      `INSERT INTO request_history (request_id, status, note, actor, occurred_at)
       VALUES (?, ?, ?, ?, ?)`,
      [requestId, status, note, actor, now],
    )
    return true
  })

  if (!updated) return null
  return getRequestByReference(reference)
}

export async function countRequests() {
  const rows = await queryRows<RowDataPacket & { total: number | string }>(
    'SELECT COUNT(*) AS total FROM requests',
  )
  return Number(rows[0]?.total ?? 0)
}
