import {
  createEmployee,
  listEmployees,
} from '../../../app/(frontend)/lib/server/employees.repo'
import {
  assertSameOrigin,
  handleApiError,
  jsonCreated,
  jsonOk,
  optionalString,
  readJsonBody,
  requiredString,
  ValidationError,
} from '../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../app/(frontend)/lib/server/guard'
import { recordActivity } from '../../../app/(frontend)/lib/server/activity.repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireStaff()
    const url = new URL(request.url)
    const result = await listEmployees({
      q: url.searchParams.get('q') ?? undefined,
      office: url.searchParams.get('office') ?? undefined,
      limit: Number.parseInt(url.searchParams.get('limit') ?? '', 10) || undefined,
      offset: Number.parseInt(url.searchParams.get('offset') ?? '', 10) || 0,
    })
    return jsonOk(result)
  } catch (error) {
    return handleApiError(error)
  }
}

type CreateBody = {
  employeeNo?: string
  firstName?: string
  lastName?: string
  middleName?: string
  suffix?: string
  position?: string
  office?: string
  employmentStatus?: string
  email?: string
  contact?: string
  salaryGrade?: number | string | null
  rate?: number | string | null
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff()
    assertSameOrigin(request)
    const body = await readJsonBody<CreateBody>(request)
    const employeeNo = optionalString(body.employeeNo, 32)

    const created = await createEmployee({
      employeeNo,
      firstName: requiredString(body.firstName, 'First name', 96),
      lastName: requiredString(body.lastName, 'Last name', 96),
      middleName: optionalString(body.middleName, 96),
      suffix: optionalString(body.suffix, 24),
      position: optionalString(body.position, 160),
      office: optionalString(body.office, 160),
      employmentStatus: optionalString(body.employmentStatus, 48),
      email: optionalString(body.email, 190),
      contact: optionalString(body.contact, 32),
      salaryGrade: body.salaryGrade === null || body.salaryGrade === undefined || body.salaryGrade === ''
        ? null
        : Number(body.salaryGrade),
      rate: body.rate === null || body.rate === undefined || body.rate === '' ? null : Number(body.rate),
      source: 'manual',
    })

    await recordActivity({
      staff,
      action: 'employee_create',
      entity: 'employee',
      entityRef: created.employeeNo ?? String(created.id),
      summary: `Added ${created.lastName}, ${created.firstName} to the roster`,
      detail: { employeeId: created.id },
      request,
    })

    return jsonCreated(created)
  } catch (error) {
    if (error instanceof ValidationError) return handleApiError(error)
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
    if (code === 'ER_DUP_ENTRY') {
      return handleApiError(new ValidationError('That employee number already exists.', { field: 'employeeNo' }))
    }
    return handleApiError(error)
  }
}
