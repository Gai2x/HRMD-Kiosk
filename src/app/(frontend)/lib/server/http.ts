import { DatabaseUnavailableError } from '../db'

/** Bad input from the client (400). */
export class ValidationError extends Error {
  details?: unknown

  constructor(message: string, details?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

/** Missing record (404). */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/** No valid staff session (401). */
export class UnauthorizedError extends Error {
  constructor(message = 'Sign in to continue.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/** Authenticated but not allowed (403). */
export class ForbiddenError extends Error {
  constructor(message = 'Not allowed.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Rejects mutations whose Origin is not this host. Cookies are SameSite=Lax,
 * so this is belt-and-braces against a cross-site form post.
 */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return

  const allowed = new Set<string>()
  for (const header of ['host', 'x-forwarded-host']) {
    const value = request.headers.get(header)
    if (value) allowed.add(value.split(',')[0].trim())
  }
  try {
    const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (publicUrl) allowed.add(new URL(publicUrl).host)
  } catch {
    // ignore malformed configuration
  }

  try {
    if (!allowed.has(new URL(origin).host)) throw new ForbiddenError('Cross-origin request rejected.')
  } catch (error) {
    if (error instanceof ForbiddenError) throw error
    throw new ForbiddenError('Cross-origin request rejected.')
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, { status: 200, ...init })
}

export function jsonCreated<T>(data: T) {
  return Response.json({ data }, { status: 201 })
}

export function jsonError(status: number, code: string, message?: string, details?: unknown) {
  return Response.json({ error: code, message, details }, { status })
}

export const DATABASE_UNAVAILABLE_MESSAGE =
  'MySQL is not configured. Add DATABASE_URL to the environment to enable the database.'

/**
 * Maps a thrown error onto a JSON response. Database outages are reported as
 * 503 with a stable `database-unavailable` code so the client can switch to
 * its demo fallback instead of showing a generic failure.
 */
export function handleApiError(error: unknown) {
  if (error instanceof DatabaseUnavailableError) {
    return jsonError(503, 'database-unavailable', DATABASE_UNAVAILABLE_MESSAGE)
  }
  if (error instanceof ValidationError) {
    return jsonError(400, 'validation-failed', error.message, error.details)
  }
  if (error instanceof NotFoundError) {
    return jsonError(404, 'not-found', error.message)
  }
  if (error instanceof UnauthorizedError) {
    return jsonError(401, 'unauthorized', error.message)
  }
  if (error instanceof ForbiddenError) {
    return jsonError(403, 'forbidden', error.message)
  }

  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' || code === 'ER_ACCESS_DENIED_ERROR') {
    return jsonError(503, 'database-unavailable', 'MySQL could not be reached. Check DATABASE_URL and that the server is running.')
  }

  console.error('[api] unexpected error', error)
  return jsonError(500, 'internal-error', 'Unexpected server error.')
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new ValidationError('Request body must be valid JSON.')
  }
}

export function requiredString(value: unknown, field: string, max = 255): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${field} is required.`, { field })
  }
  const trimmed = value.trim()
  if (trimmed.length > max) throw new ValidationError(`${field} is too long.`, { field, max })
  return trimmed
}

export function optionalString(value: unknown, max = 255): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export function parseId(value: string): number {
  const id = Number.parseInt(value, 10)
  if (!Number.isFinite(id) || id <= 0) throw new ValidationError('Invalid id.')
  return id
}

export function parseLimit(value: string | null, fallback = 50, max = 500): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}
