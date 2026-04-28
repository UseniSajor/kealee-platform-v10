/**
 * @kealee/database — local stub (direct PrismaClient, no monorepo dep)
 */
import { PrismaClient } from '@prisma/client'

const g = globalThis
export const prisma = g.__kealee_prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})
if (process.env.NODE_ENV !== 'production') g.__kealee_prisma = prisma

/** Compatibility shim */
export function getPrisma() { return prisma }

export { Decimal } from '@prisma/client/runtime/library'
