#!/usr/bin/env node
/**
 * Staff account helper.
 *
 *   node db/staff-cli.mjs --list
 *   node db/staff-cli.mjs --username jdelacruz --password 'S3cret!' \
 *        --name "Juan Dela Cruz" --role hr_staff
 *
 * Reads DATABASE_URL from .env.local so it uses the same connection as the app.
 * Passwords are hashed with scrypt before they touch the database — the plain
 * value never leaves this process. Prefer running it on the machine that hosts
 * the database; a password on the command line is visible to `ps` while it runs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import mysql from 'mysql2/promise'

const scrypt = promisify(scryptCallback)

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  for (const file of ['.env.local', '.env']) {
    const candidate = path.resolve(process.cwd(), file)
    if (!fs.existsSync(candidate)) continue
    const match = fs.readFileSync(candidate, 'utf8').match(/^DATABASE_URL=(.*)$/m)
    if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  }
  throw new Error('DATABASE_URL not found in the environment, .env.local or .env')
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      index += 1
    }
  }
  return args
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$16384$8$1$${salt}$${derived.toString('hex')}`
}

const args = parseArgs(process.argv.slice(2))

if (!args.list && (!args.username || !args.password)) {
  console.log('Usage:')
  console.log('  node db/staff-cli.mjs --list')
  console.log('  node db/staff-cli.mjs --username <user> --password <pass> [--name "Full Name"] [--role admin|hr_staff]')
  process.exit(1)
}

if (args.password && args.password.length < 8) {
  console.error('Password must be at least 8 characters.')
  process.exit(1)
}

const url = new URL(readDatabaseUrl())
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\/+/, ''),
  ssl: url.searchParams.get('ssl') === 'true' ? { rejectUnauthorized: true } : undefined,
  timezone: 'Z',
})

try {
  if (args.list) {
    const [rows] = await connection.query(
      'SELECT id, username, display_name, role, is_active, last_login_at FROM staff ORDER BY id',
    )
    console.table(rows)
  } else {
    const username = String(args.username).trim().toLowerCase()
    const displayName = String(args.name || args.username).trim()
    const role = args.role === 'admin' ? 'admin' : 'hr_staff'
    const hash = await hashPassword(String(args.password))

    await connection.execute(
      `INSERT INTO staff (username, display_name, role, password_hash)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), role = VALUES(role),
         password_hash = VALUES(password_hash), is_active = 1`,
      [username, displayName, role, hash],
    )
    console.log(`Saved staff account "${username}" (${role}). Existing sessions were not revoked.`)
  }
} finally {
  await connection.end()
}
