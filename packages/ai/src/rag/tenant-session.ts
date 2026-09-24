/**
 * Running corpus queries with the tenant session set, so row-level security
 * has something to filter on.
 *
 * The RLS policies on `rag_documents`, `rag_chunks` and `rag_retrievals`
 * filter on `current_setting('app.tenant_id', true)`. Something has to set it,
 * on the same connection, inside the same transaction. This is that.
 *
 * WHY `SET LOCAL` AND NOT A SESSION `SET`: connections come from a pool and go
 * back to it. A session-level setting would outlive the request and be handed
 * to whoever picks the connection up next — one tenant's context silently
 * applied to another tenant's query. That is the precise failure RLS exists to
 * prevent, reintroduced by the mechanism meant to enforce it. `SET LOCAL` dies
 * with the transaction.
 *
 * WHY THIS IS BELT AND BRACES: the application predicates in `retriever.ts`
 * and `vector-store.ts` already filter by tenant explicitly. RLS is the second
 * lock, for the query someone writes later and forgets to filter. Neither is
 * sufficient alone — the predicate can be forgotten, and the policy can be
 * bypassed by a superuser role — so both are present.
 */

import { prismaAny } from '../utils/prisma-helper.js'

/** A tenant id is a cuid, a uuid or a known constant. Nothing else belongs here. */
const TENANT_ID = /^[A-Za-z0-9_-]{1,64}$/

export class InvalidTenantIdError extends Error {
  constructor(value: unknown) {
    super(
      `"${String(value)}" is not a valid tenant id. Expected up to 64 characters of ` +
      '[A-Za-z0-9_-]. This value reaches a database session setting, so it is validated ' +
      'rather than trusted.',
    )
    this.name = 'InvalidTenantIdError'
  }
}

export function assertTenantId(tenantId: string): string {
  if (typeof tenantId !== 'string' || !TENANT_ID.test(tenantId)) {
    throw new InvalidTenantIdError(tenantId)
  }
  return tenantId
}

/**
 * Runs `fn` in a transaction with `app.tenant_id` set to `tenantId`.
 *
 * The transaction is not incidental. `SET LOCAL` outside one is silently a
 * no-op, which would leave the policy with no tenant — and because the policy
 * fails closed, the caller would get zero rows and no error. Binding the
 * setting and the transaction together here makes that unrepresentable.
 */
export async function withTenantSession<T>(
  tenantId: string,
  fn: (tx: any) => Promise<T>,
): Promise<T> {
  const id = assertTenantId(tenantId)
  return prismaAny.$transaction(async (tx: any) => {
    // Bound parameter rather than interpolation; third argument `true` makes
    // the setting transaction-local.
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, id)
    return fn(tx)
  })
}

/** Reads back the tenant the current transaction is scoped to. For assertions and tests. */
export async function currentTenantId(tx: any): Promise<string | null> {
  const rows = await tx.$queryRawUnsafe(
    `SELECT current_setting('app.tenant_id', true) AS tenant`,
  )
  const v = rows?.[0]?.tenant
  return v && v.length > 0 ? v : null
}
