import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing for the HRMD staff table.
 *
 * Uses Node's built-in scrypt (no native dependency, no registry package), with
 * a per-password salt. The stored value is self-describing:
 *
 *   scrypt$<N>$<r>$<p>$<salt-hex>$<key-hex>
 *
 * so the cost can be raised later without invalidating existing rows.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>

const PARAMS = { N: 16384, r: 8, p: 1 }
const KEY_LENGTH = 64
const PREFIX = 'scrypt'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, PARAMS)
  return `${PREFIX}$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== PREFIX) return false

  const [, rawN, rawR, rawP, salt, hash] = parts
  const expected = Buffer.from(hash, 'hex')
  if (!salt || expected.length === 0) return false

  const N = Number(rawN)
  const r = Number(rawR)
  const p = Number(rawP)
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false

  const derived = await scrypt(password.normalize('NFKC'), salt, expected.length, { N, r, p })
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}
