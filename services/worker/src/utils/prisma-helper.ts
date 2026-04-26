/**
 * services/worker/src/utils/prisma-helper.ts
 *
 * Provides prismaAny — a lazy PrismaClient cast to any.
 * Used by processors that need to access models not yet in generated types.
 */

import { PrismaClient } from '@prisma/client'

let _client: PrismaClient | null = null

function getClient(): PrismaClient {
  if (!_client) _client = new PrismaClient()
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prismaAny: any = new Proxy({} as any, {
  get(_target, prop: string | symbol) {
    return (getClient() as any)[prop as string]
  },
})
