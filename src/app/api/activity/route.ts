import { activitySummary, listActivity } from '../../../app/(frontend)/lib/server/activity.repo'
import { handleApiError, jsonOk } from '../../../app/(frontend)/lib/server/http'
import { requireStaff } from '../../../app/(frontend)/lib/server/guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * The admin activity log: sign-ins, sign-outs, status changes and roster edits.
 * Staff only — the middleware rejects anonymous callers before this runs, and
 * requireStaff() validates the session row.
 *
 *   /api/activity?actions=sign_in,sign_out&q=reyes&limit=50
 */
export async function GET(request: Request) {
  try {
    await requireStaff()

    const url = new URL(request.url)
    const actions = (url.searchParams.get('actions') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    const result = await listActivity({
      actions,
      staffId: Number.parseInt(url.searchParams.get('staffId') ?? '', 10) || undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: Number.parseInt(url.searchParams.get('limit') ?? '', 10) || undefined,
      offset: Number.parseInt(url.searchParams.get('offset') ?? '', 10) || 0,
    })

    return jsonOk({ ...result, summary: await activitySummary() })
  } catch (error) {
    return handleApiError(error)
  }
}
