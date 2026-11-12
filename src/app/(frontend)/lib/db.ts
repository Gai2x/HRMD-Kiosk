import mysql, {
  type Pool,
  type PoolConnection,
  type PoolOptions,
  type RowDataPacket,
} from 'mysql2/promise'

/**
 * MySQL access for the API route handlers.
 *
 * `DATABASE_URL` is read from the environment on the server only — it is never
 * imported into a client component, so the connection string cannot reach the
 * browser. When the variable is missing (or the server is unreachable) every
 * caller gets a `DatabaseUnavailableError`, which the API turns into a 503 and
 * the UI turns into its demo-mode fallback instead of a broken page.
 */

export class DatabaseUnavailableError extends Error {
  constructor(message = 'DATABASE_URL is not configured') {
    super(message)
    this.name = 'DatabaseUnavailableError'
  }
}

const POOL_KEY = '__hrmdMysqlPool'

type PoolHolder = { [POOL_KEY]?: Pool }

const holder = globalThis as unknown as PoolHolder

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

/** Parses mysql://user:password@host:3306/database?ssl=true into pool options. */
function buildPoolOptions(raw: string): PoolOptions {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    throw new DatabaseUnavailableError('DATABASE_URL is not a valid mysql:// connection string')
  }

  if (!/^mysql2?:$/.test(parsed.protocol)) {
    throw new DatabaseUnavailableError('DATABASE_URL must start with mysql://')
  }

  const database = parsed.pathname.replace(/^\/+/, '')
  if (!database) {
    throw new DatabaseUnavailableError('DATABASE_URL is missing a database name')
  }

  const sslParam = parsed.searchParams.get('ssl')
  const ssl = sslParam === 'true' || sslParam === 'required' ? { rejectUnauthorized: true } : undefined

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl,
    // Lambda-friendly: a small pool, nothing left half-open.
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    // DATETIME columns are UTC; dates round-trip as ISO strings unchanged.
    timezone: 'Z',
    charset: 'utf8mb4_general_ci',
  }
}

export function getPool(): Pool {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) throw new DatabaseUnavailableError()

  if (!holder[POOL_KEY]) {
    holder[POOL_KEY] = mysql.createPool(buildPoolOptions(raw))
  }
  return holder[POOL_KEY] as Pool
}

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await getPool().query<T[]>(sql, params)
  return rows
}

export async function execute(sql: string, params: unknown[] = []) {
  const [result] = await getPool().execute(sql, params as never)
  return result
}

export async function withTransaction<T>(run: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection()
  try {
    await connection.beginTransaction()
    const result = await run(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/** Health probe used by /api/health and the admin database badge. */
export async function probeDatabase(): Promise<{
  configured: boolean
  connected: boolean
  database?: string
  error?: string
}> {
  if (!isDatabaseConfigured()) return { configured: false, connected: false }

  try {
    const rows = await queryRows<RowDataPacket & { database_name: string }>(
      'SELECT DATABASE() AS database_name',
    )
    return { configured: true, connected: true, database: rows[0]?.database_name }
  } catch (error) {
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown connection error',
    }
  }
}
