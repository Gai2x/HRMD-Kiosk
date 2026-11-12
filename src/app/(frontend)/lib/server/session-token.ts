/**
 * Session cookie signing.
 *
 * The cookie carries `<session id>.<HMAC-SHA256>` so the edge middleware can
 * reject forged cookies before any request reaches a page or an API route,
 * without a database round-trip. The API still validates the session row in
 * MySQL (expiry + revocation + active staff), so this signature is the fast
 * outer gate, not the whole check.
 *
 * Uses Web Crypto only, so the same module runs in middleware and in Node.
 */

export const SESSION_COOKIE = 'hrmd_session'

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return mismatch === 0
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function signSessionId(sessionId: string, secret: string): Promise<string> {
  const key = await importKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(sessionId))
  return `${sessionId}.${toHex(signature)}`
}

/** Returns the verified session id, or null when the cookie is missing/forged. */
export async function verifySessionCookie(
  value: string | undefined | null,
  secret: string | undefined,
): Promise<string | null> {
  if (!value || !secret) return null

  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null

  const sessionId = value.slice(0, separator)
  const signature = value.slice(separator + 1)
  if (!/^[a-f0-9]{64}$/.test(sessionId) || !/^[a-f0-9]{64}$/.test(signature)) return null

  const expected = await signSessionId(sessionId, secret)
  return constantTimeEqual(expected.slice(separator + 1), signature) ? sessionId : null
}
