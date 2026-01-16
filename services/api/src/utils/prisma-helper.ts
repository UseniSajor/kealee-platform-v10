/**
 * Prisma Helper - Provides type-safe access to Prisma models
 * This file includes type assertions for models that may not be fully defined in the Prisma schema yet
 */

import { prisma } from '@kealee/database'

// Type assertion wrapper for missing Prisma models
// This allows compilation to proceed while models are being added to the schema
export const prismaAny = prisma as any

// Re-export prisma for normal usage
export { prisma }
