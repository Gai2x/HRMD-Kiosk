import {
  getRequestByReference,
  updateRequestStatus,
} from '../../../../app/(frontend)/lib/server/requests.repo'
import {
  assertSameOrigin,
  handleApiError,
  jsonError,
  jsonOk,
  readJsonBody,
  ValidationError,
} from '../../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../../app/(frontend)/lib/server/guard'
import { recordActivity } from '../../../../app/(frontend)/lib/server/activity.repo'
import { ALL_STATUSES, type RequestStatus } from '../../../../app/(frontend)/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ reference: string }> }

export async function GET(_request: Request, context: Context) {
  try {
    await requireStaff()
    const { reference } = await context.params
    const found = await getRequestByReference(reference)
    if (!found) return jsonError(404, 'not-found', 'No request with that reference.')
    return jsonOk(found)
  } catch (error) {
    return handleApiError(error)
  }
}

type PatchBody = { status?: string; note?: string }

export async function PATCH(request: Request, context: Context) {
  try {
    // The actor is taken from the session, never from the request body, so the
    // audit trail cannot be forged.
    const staff = await requireStaff()
    assertSameOrigin(request)

    const { reference } = await context.params
    const body = await readJsonBody<PatchBody>(request)

    const status = body.status as RequestStatus
    if (!status || !ALL_STATUSES.includes(status)) {
      throw new ValidationError('Unknown status.', { field: 'status' })
    }

    const updated = await updateRequestStatus(reference, status, {
      note: body.note,
      actor: staff.displayName,
    })
    if (!updated) return jsonError(404, 'not-found', 'No request with that reference.')

    await recordActivity({
      staff,
      action: 'request_status',
      entity: 'request',
      entityRef: updated.reference,
      summary: `${updated.reference} marked ${status}`,
      detail: { status, note: body.note?.trim() || null },
      request,
    })

    return jsonOk(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
