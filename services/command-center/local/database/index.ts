/**
 * Local stub for @kealee/database
 * Direct PrismaClient singleton — no monorepo workspace dependency.
 */
import { PrismaClient } from '@prisma/client'

export * from '@prisma/client'
export { Decimal } from '@prisma/client/runtime/library'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/** Compatibility shim — callers that use getPrisma() instead of the singleton */
export function getPrisma(): PrismaClient {
  return prisma
}
