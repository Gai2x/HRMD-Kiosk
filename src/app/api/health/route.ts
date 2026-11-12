import { probeDatabase } from '../../../app/(frontend)/lib/db'
import { jsonOk } from '../../../app/(frontend)/lib/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Database status for the admin badge and for local setup checks. */
export async function GET() {
  const status = await probeDatabase()
  return jsonOk(status)
}
