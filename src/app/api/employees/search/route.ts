import { searchEmployees } from '../../../../app/(frontend)/lib/server/employees.repo'
import { handleApiError, jsonOk } from '../../../../app/(frontend)/lib/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Kiosk combobox lookup.
 *   /api/employees/search?first=Jo          → first-name matches
 *   /api/employees/search?first=Joel&last=R → related surnames
 *
 * Public, because the kiosk has no staff session — so it deliberately returns
 * names, position and office only. Email, phone, SG and rate stay behind the
 * authenticated roster endpoints.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const firstName = url.searchParams.get('first')?.trim() ?? ''
    const lastName = url.searchParams.get('last')?.trim() ?? ''
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '', 10) || undefined

    if (firstName.length < 2 && lastName.length < 2) return jsonOk([])

    const employees = await searchEmployees({ firstName, lastName, limit })
    return jsonOk(
      employees.map((employee) => ({
        id: employee.id,
        employeeNo: employee.employeeNo,
        firstName: employee.firstName,
        middleName: employee.middleName,
        lastName: employee.lastName,
        suffix: employee.suffix,
        position: employee.position,
        office: employee.office,
      })),
    )
  } catch (error) {
    return handleApiError(error)
  }
}
