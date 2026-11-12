import {
  getEmployeeById,
  updateEmployee,
} from '../../../../app/(frontend)/lib/server/employees.repo'
import {
  assertSameOrigin,
  handleApiError,
  jsonError,
  jsonOk,
  optionalString,
  parseId,
  readJsonBody,
  ValidationError,
} from '../../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../../app/(frontend)/lib/server/guard'
import { recordActivity } from '../../../../app/(frontend)/lib/server/activity.repo'
import {
  EMPLOYMENT_STATUSES,
  type EmployeePatch,
  type EmploymentStatus,
} from '../../../../app/(frontend)/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: Context) {
  try {
    await requireStaff()
    const { id } = await context.params
    const employee = await getEmployeeById(parseId(id))
    if (!employee) return jsonError(404, 'not-found', 'No employee with that id.')
    return jsonOk(employee)
  } catch (error) {
    return handleApiError(error)
  }
}

type PatchBody = {
  employeeNo?: string | null
  firstName?: string
  middleName?: string | null
  lastName?: string
  suffix?: string | null
  position?: string | null
  office?: string | null
  employmentStatus?: string | null
  email?: string | null
  contact?: string | null
  salaryGrade?: number | string | null
  rate?: number | string | null
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export async function PATCH(request: Request, context: Context) {
  try {
    const staff = await requireStaff()
    assertSameOrigin(request)
    const { id } = await context.params
    const body = await readJsonBody<PatchBody>(request)

    const patch: EmployeePatch = {}
    if ('employeeNo' in body) patch.employeeNo = optionalString(body.employeeNo, 32)
    if ('firstName' in body) {
      const value = optionalString(body.firstName, 96)
      if (!value) throw new ValidationError('First name is required.', { field: 'firstName' })
      patch.firstName = value
    }
    if ('lastName' in body) {
      const value = optionalString(body.lastName, 96)
      if (!value) throw new ValidationError('Last name is required.', { field: 'lastName' })
      patch.lastName = value
    }
    if ('middleName' in body) patch.middleName = optionalString(body.middleName, 96) ?? ''
    if ('suffix' in body) patch.suffix = optionalString(body.suffix, 24) ?? ''
    if ('position' in body) patch.position = optionalString(body.position, 160) ?? ''
    if ('office' in body) patch.office = optionalString(body.office, 160) ?? ''
    if ('employmentStatus' in body) {
      const value = optionalString(body.employmentStatus, 48) ?? ''
      if (value && !(EMPLOYMENT_STATUSES as readonly string[]).includes(value)) {
        throw new ValidationError('Unknown employment status.', { field: 'employmentStatus' })
      }
      patch.employmentStatus = value as EmploymentStatus | ''
    }
    if ('email' in body) patch.email = optionalString(body.email, 190) ?? ''
    if ('contact' in body) patch.contact = optionalString(body.contact, 32) ?? ''
    if ('salaryGrade' in body) patch.salaryGrade = toNumberOrNull(body.salaryGrade)
    if ('rate' in body) patch.rate = toNumberOrNull(body.rate)

    const updated = await updateEmployee(parseId(id), patch)
    if (!updated) return jsonError(404, 'not-found', 'No employee with that id.')

    const fields = Object.keys(patch)
    await recordActivity({
      staff,
      action: 'employee_update',
      entity: 'employee',
      entityRef: updated.employeeNo ?? String(updated.id),
      summary: `Updated ${fields.join(', ') || 'details'} for ${updated.lastName}, ${updated.firstName}`,
      // Field names only — never the values, which are personal data.
      detail: { employeeId: updated.id, fields },
      request,
    })

    return jsonOk(updated)
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    if (code === 'ER_DUP_ENTRY') {
      return handleApiError(new ValidationError('That employee number already exists.', { field: 'employeeNo' }))
    }
    return handleApiError(error)
  }
}
