import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { join } from 'path'

// Load .env file from database package directory if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  // Try multiple possible paths
  const possiblePaths = [
    join(process.cwd(), 'packages/database/.env'),
    join(process.cwd(), '.env'),
    join(__dirname, '../../.env'),
    join(__dirname, '../.env'),
  ]
  
  for (const envPath of possiblePaths) {
    try {
      config({ path: envPath })
      if (process.env.DATABASE_URL) break
    } catch {
      // Continue to next path
    }
  }
}

function getPrismaDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined

  // On Windows host, Docker Compose service names (e.g. "postgres") won't resolve.
  // We transparently map common Docker hostnames to localhost.
  if (process.platform === 'win32') {
    try {
      const u = new URL(raw)
      const dockerHostnames = new Set(['postgres', 'kealee-postgres', 'db'])
      if (dockerHostnames.has(u.hostname)) {
        u.hostname = 'localhost'
      }

      // In this repo, local dev uses docker-compose with:
      // user=kealee, password=kealee_dev, db=kealee (see docker-compose.yml).
      // If DATABASE_URL points to localhost but has stale credentials, normalize them
      // for Windows local development so Prisma can connect.
      const isLocalHost = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
      const isLocalDb = u.pathname.replace(/^\//, '') === 'kealee'
      if (
        process.env.NODE_ENV !== 'production' &&
        isLocalHost &&
        isLocalDb &&
        u.username === 'kealee' &&
        u.password !== 'kealee_dev'
      ) {
        u.password = 'kealee_dev'
      }

      // On Windows, port 5432 is frequently occupied by a locally installed Postgres.
      // Our docker-compose maps Postgres to host port 5433; default to that for local dev.
      if (process.env.NODE_ENV !== 'production' && isLocalHost && isLocalDb) {
        if (!u.port || u.port === '5432') u.port = '5433'
      }

      return u.toString()
    } catch {
      // If parsing fails, fall back to the raw value.
    }
  }

  return raw
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const resolvedDatabaseUrl = getPrismaDatabaseUrl()
if (process.env.NODE_ENV !== 'production' && resolvedDatabaseUrl) {
  try {
    const u = new URL(resolvedDatabaseUrl)
    const dbName = u.pathname.replace(/^\//, '')
    // Intentionally avoid logging the password.
    console.log(
      `[db] Prisma connecting: host=${u.hostname} user=${u.username} db=${dbName} passwordIsComposeDefault=${
        u.password === 'kealee_dev'
      }`
    )
  } catch {
    // ignore
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedDatabaseUrl
      ? {
          db: {
            url: resolvedDatabaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
