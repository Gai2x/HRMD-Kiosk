import { getRequestByReference } from '../../../../app/(frontend)/lib/server/requests.repo'
import { handleApiError, jsonError, jsonOk } from '../../../../app/(frontend)/lib/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ reference: string }> }

/**
 * Kiosk tracking. Public by design — the reference number is the only key, and
 * the payload carries no email, phone, purpose or remarks, so guessing a
 * reference cannot leak employee contact details.
 */
export async function GET(_request: Request, context: Context) {
  try {
    const { reference } = await context.params
    const found = await getRequestByReference(reference)
    if (!found) return jsonError(404, 'not-found', 'No request with that reference.')

    return jsonOk({
      reference: found.reference,
      service: found.service,
      optionId: found.optionId,
      othersSpecified: found.othersSpecified,
      submittedAt: found.submittedAt,
      status: found.status,
      history: found.history,
      employee: {
        firstName: found.employee.firstName,
        middleName: found.employee.middleName,
        lastName: found.employee.lastName,
        suffix: found.employee.suffix,
        position: found.employee.position,
        office: found.employee.office,
        employmentStatus: found.employee.employmentStatus,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
