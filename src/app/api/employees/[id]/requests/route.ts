import { listRequestsForEmployee } from '../../../../../app/(frontend)/lib/server/requests.repo'
import { handleApiError, jsonOk, parseId } from '../../../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../../../app/(frontend)/lib/server/guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

/** Every request filed by this roster entry, newest first, with its history. */
export async function GET(_request: Request, context: Context) {
  try {
    await requireStaff()
    const { id } = await context.params
    return jsonOk(await listRequestsForEmployee(parseId(id)))
  } catch (error) {
    return handleApiError(error)
  }
}
