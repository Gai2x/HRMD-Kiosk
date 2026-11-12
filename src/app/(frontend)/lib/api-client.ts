/** Thin JSON client for the MySQL-backed API routes. */

export type ApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      /** HTTP status, or 0 when the request never reached the server. */
      status: number
      code: string
      message?: string
      details?: unknown
    }

type Payload<T> = { data?: T; error?: string; message?: string; details?: unknown }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      cache: 'no-store',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers ?? {}),
      },
    })

    const payload = (await response.json().catch(() => null)) as Payload<T> | null

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        code: payload?.error ?? 'request-failed',
        message: payload?.message,
        details: payload?.details,
      }
    }

    return { ok: true, data: payload?.data as T }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      code: 'network-error',
      message: error instanceof Error ? error.message : 'Could not reach the server.',
    }
  }
}

/** True when the failure means "no database", where demo data is the answer. */
export function isUnavailable(result: Extract<ApiResult<unknown>, { ok: false }>) {
  return result.status === 503 || result.status === 0 || result.code === 'database-unavailable'
}
