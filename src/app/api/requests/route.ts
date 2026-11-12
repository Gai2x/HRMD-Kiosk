import { createRequest, listRequests } from '../../../app/(frontend)/lib/server/requests.repo'
import {
  assertSameOrigin,
  handleApiError,
  jsonCreated,
  jsonOk,
  readJsonBody,
  requiredString,
  ValidationError,
} from '../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../app/(frontend)/lib/server/guard'
import type { EmployeeInfo, RequestDraft, ServiceId } from '../../../app/(frontend)/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICES: ServiceId[] = ['coe', 'service_record', 'leave_review', 'leave_balance', 'loan', 'others']

export async function GET(request: Request) {
  try {
    // The full request list contains employee contact details: staff only.
    await requireStaff()
    const url = new URL(request.url)
    const requests = await listRequests({
      status: url.searchParams.get('status') ?? undefined,
      service: url.searchParams.get('service') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: Number.parseInt(url.searchParams.get('limit') ?? '', 10) || undefined,
    })
    return jsonOk(requests)
  } catch (error) {
    return handleApiError(error)
  }
}

type CreateBody = {
  service?: string
  optionId?: string
  purpose?: string
  copies?: number | string
  remarks?: string
  othersSpecified?: string
  employeeId?: number | null
  employee?: Partial<EmployeeInfo>
}

export async function POST(request: Request) {
  try {
    // Public: the employee kiosk files its own requests. The history actor is
    // fixed to "Kiosk" server-side, so this cannot impersonate staff.
    assertSameOrigin(request)
    const body = await readJsonBody<CreateBody>(request)

    const service = body.service as ServiceId
    if (!service || !SERVICES.includes(service)) {
      throw new ValidationError('Unknown request type.', { field: 'service' })
    }

    const employee = body.employee ?? {}
    const draft: RequestDraft = {
      service,
      optionId: body.optionId?.trim() || undefined,
      purpose: requiredString(body.purpose, 'Purpose', 1000),
      copies: body.copies === undefined || body.copies === '' ? undefined : Number(body.copies),
      remarks: body.remarks?.trim() || undefined,
      othersSpecified: body.othersSpecified?.trim() || undefined,
      employee: {
        employeeId: body.employeeId ?? null,
        firstName: requiredString(employee.firstName, 'First name', 96),
        middleName: employee.middleName?.trim() ?? '',
        lastName: requiredString(employee.lastName, 'Last name', 96),
        suffix: employee.suffix?.trim() ?? '',
        position: employee.position?.trim() ?? '',
        office: employee.office?.trim() ?? '',
        employmentStatus: employee.employmentStatus ?? '',
        email: employee.email?.trim() ?? '',
        contact: employee.contact?.trim() ?? '',
      },
    }

    const created = await createRequest(draft)
    return jsonCreated(created)
  } catch (error) {
    return handleApiError(error)
  }
}
