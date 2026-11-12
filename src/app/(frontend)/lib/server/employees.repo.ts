import type { RowDataPacket } from 'mysql2/promise'
import { execute, queryRows } from '../db'
import type { EmployeePatch, EmployeeRecord, EmploymentStatus } from '../types'

type EmployeeRow = RowDataPacket & {
  id: number
  employee_no: string | null
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  position_title: string | null
  salary_grade: number | null
  rate: string | number | null
  email: string | null
  phone: string | null
  office: string | null
  employment_status: string | null
  source: 'seed' | 'import' | 'manual'
  created_at: Date
  updated_at: Date
  request_count?: number | string | null
  last_request_at?: Date | null
}

function decimalOrNull(value: string | number | null) {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mapRow(row: EmployeeRow): EmployeeRecord {
  return {
    id: row.id,
    employeeNo: row.employee_no,
    firstName: row.first_name,
    middleName: row.middle_name ?? '',
    lastName: row.last_name,
    suffix: row.suffix ?? '',
    position: row.position_title ?? '',
    office: row.office ?? '',
    employmentStatus: (row.employment_status as EmploymentStatus | null) ?? '',
    email: row.email ?? '',
    contact: row.phone ?? '',
    salaryGrade: row.salary_grade ?? null,
    rate: decimalOrNull(row.rate),
    source: row.source,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    ...(row.request_count !== undefined
      ? { requestCount: Number(row.request_count ?? 0) }
      : {}),
    ...(row.last_request_at !== undefined
      ? { lastRequestAt: row.last_request_at ? row.last_request_at.toISOString() : null }
      : {}),
  }
}

const ROSTER_SELECT = `
  SELECT e.*, COUNT(r.id) AS request_count, MAX(r.submitted_at) AS last_request_at
  FROM employees e
  LEFT JOIN requests r ON r.employee_id = e.id
`

export type EmployeeListOptions = {
  q?: string
  office?: string
  limit?: number
  offset?: number
}

export async function listEmployees(options: EmployeeListOptions = {}) {
  const where: string[] = []
  const params: unknown[] = []

  if (options.q) {
    const like = `%${options.q}%`
    where.push(
      '(e.first_name LIKE ? OR e.last_name LIKE ? OR e.middle_name LIKE ? OR CONCAT(e.last_name, ", ", e.first_name) LIKE ? OR e.employee_no LIKE ? OR e.email LIKE ?)',
    )
    params.push(like, like, like, like, like, like)
  }
  if (options.office) {
    where.push('e.office = ?')
    params.push(options.office)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500)
  const offset = Math.max(options.offset ?? 0, 0)

  const [rows, totals] = await Promise.all([
    queryRows<EmployeeRow>(
      `${ROSTER_SELECT} ${whereSql} GROUP BY e.id ORDER BY e.last_name ASC, e.first_name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    ),
    queryRows<RowDataPacket & { total: number | string }>(
      `SELECT COUNT(*) AS total FROM employees e ${whereSql}`,
      params,
    ),
  ])

  return { employees: rows.map(mapRow), total: Number(totals[0]?.total ?? 0) }
}

export async function getEmployeeById(id: number): Promise<EmployeeRecord | null> {
  const rows = await queryRows<EmployeeRow>(
    `${ROSTER_SELECT} WHERE e.id = ? GROUP BY e.id`,
    [id],
  )
  return rows[0] ? mapRow(rows[0]) : null
}

/**
 * Kiosk combobox lookup. Matches on the given name and, when supplied, the
 * family name — so typing a first name lists the related surnames.
 */
export async function searchEmployees(options: {
  firstName?: string
  lastName?: string
  limit?: number
}): Promise<EmployeeRecord[]> {
  const where: string[] = []
  const params: unknown[] = []

  if (options.firstName) {
    where.push('first_name LIKE ?')
    params.push(`${options.firstName}%`)
  }
  if (options.lastName) {
    where.push('last_name LIKE ?')
    params.push(`${options.lastName}%`)
  }
  if (!where.length) return []

  const limit = Math.min(Math.max(options.limit ?? 8, 1), 25)

  const rows = await queryRows<EmployeeRow>(
    `SELECT * FROM employees WHERE ${where.join(' AND ')} ORDER BY first_name ASC, last_name ASC LIMIT ?`,
    [...params, limit],
  )
  return rows.map(mapRow)
}

export type EmployeeInput = {
  employeeNo?: string | null
  firstName: string
  lastName: string
  middleName?: string | null
  suffix?: string | null
  position?: string | null
  office?: string | null
  employmentStatus?: string | null
  email?: string | null
  contact?: string | null
  salaryGrade?: number | null
  rate?: number | null
  source?: 'seed' | 'import' | 'manual'
}

export async function createEmployee(input: EmployeeInput): Promise<EmployeeRecord> {
  const result = await execute(
    `INSERT INTO employees
       (employee_no, first_name, last_name, middle_name, suffix, position_title,
        office, employment_status, email, phone, salary_grade, rate, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.employeeNo ?? null,
      input.firstName,
      input.lastName,
      input.middleName ?? null,
      input.suffix ?? null,
      input.position ?? null,
      input.office ?? null,
      input.employmentStatus ?? null,
      input.email ?? null,
      input.contact ?? null,
      input.salaryGrade ?? null,
      input.rate ?? null,
      input.source ?? 'manual',
    ],
  )

  const id = Number((result as { insertId?: number }).insertId)
  const created = await getEmployeeById(id)
  if (!created) throw new Error('Employee could not be read back after insert')
  return created
}

const PATCH_COLUMNS: Record<keyof EmployeePatch, string> = {
  employeeNo: 'employee_no',
  firstName: 'first_name',
  middleName: 'middle_name',
  lastName: 'last_name',
  suffix: 'suffix',
  position: 'position_title',
  office: 'office',
  employmentStatus: 'employment_status',
  email: 'email',
  contact: 'phone',
  salaryGrade: 'salary_grade',
  rate: 'rate',
}

export async function updateEmployee(id: number, patch: EmployeePatch): Promise<EmployeeRecord | null> {
  const assignments: string[] = []
  const params: unknown[] = []

  for (const [key, column] of Object.entries(PATCH_COLUMNS) as [keyof EmployeePatch, string][]) {
    if (!(key in patch)) continue
    assignments.push(`${column} = ?`)
    params.push(patch[key] ?? null)
  }

  if (assignments.length) {
    params.push(id)
    await execute(`UPDATE employees SET ${assignments.join(', ')} WHERE id = ?`, params)
  }

  return getEmployeeById(id)
}

export async function countEmployees() {
  const rows = await queryRows<RowDataPacket & { total: number | string }>(
    'SELECT COUNT(*) AS total FROM employees',
  )
  return Number(rows[0]?.total ?? 0)
}

/** Distinct offices present in the roster, for the admin office filter. */
export async function listRosterOffices() {
  const rows = await queryRows<RowDataPacket & { office: string }>(
    "SELECT DISTINCT office FROM employees WHERE office IS NOT NULL AND office <> '' ORDER BY office ASC",
  )
  return rows.map((row) => row.office)
}
