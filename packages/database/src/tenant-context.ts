/**
 * Per-connection tenant context — the application half of row-level security.
 *
 * The RLS policies in `20260924120000_tenant_rls` filter on
 * `current_setting('app.tenant_id', true)`. Something has to SET it, and it
 * has to be set on the same connection that runs the query. This is that.
 *
 * Why `SET LOCAL` inside a transaction rather than `SET` on the session:
 * connections come from a pool and are handed to the next caller when
 * released. A session-level `SET` would leak one tenant's context to whoever
 * picks the connection up next — which is the exact failure RLS exists to
 * prevent, reintroduced by the mechanism meant to enforce it. `SET LOCAL` is
 * scoped to the transaction and is discarded on commit or rollback.
 *
 * The policy fails CLOSED. With no setting, `current_setting(..., true)`
 * returns NULL, `"tenantId" = NULL` is NULL rather than true, and the query
 * returns no rows. A caller that forgets `withTenant` sees an empty result,
 * not another tenant's data.
 */

import { prisma } from './client'

/**
 * Rejects anything that could break out of the `set_config` call or match
 * more than one tenant.
 *
 * The value is passed as a bound parameter below, so this is belt-and-braces
 * — but a tenant id is a cuid or a known constant, and anything else reaching
 * this function means a caller is passing something it should not.
 */
const TENANT_ID = /^[A-Za-z0-9_-]{1,64}$/

export class InvalidTenantIdError extends Error {
  constructor(value: string) {
    super(
      `"${value}" is not a valid tenant id. Expected up to 64 characters of ` +
      '[A-Za-z0-9_-]. A tenant id reaches the database session setting, so it is ' +
      'validated rather than trusted.',
    )
    this.name = 'InvalidTenantIdError'
  }
}

export function assertTenantId(tenantId: string): string {
  if (typeof tenantId !== 'string' || !TENANT_ID.test(tenantId)) {
    throw new InvalidTenantIdError(String(tenantId))
  }
  return tenantId
}

/**
 * Runs `fn` inside a transaction with the tenant context set.
 *
 * Every read or write of a policy-protected table must happen inside one of
 * these. The transaction is not incidental: `SET LOCAL` has no meaning outside
 * one, and using it outside a transaction is silently a no-op — which would
 * leave the policy with no tenant and return nothing, rather than failing
 * loudly. So the transaction and the setting are bound together here and
 * cannot be used apart.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  const id = assertTenantId(tenantId)
  return prisma.$transaction(async (tx) => {
    // Bound parameter, not interpolation. `set_config`'s third argument true
    // means transaction-local.
    await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, id)
    return fn(tx)
  })
}

/**
 * The cross-tenant escape, named so every use is greppable and auditable.
 *
 * Platform operations occasionally need to read across tenants: a support
 * engineer reproducing a failure, a health aggregate, a migration. Those
 * callers say so here rather than quietly omitting `withTenant` — an omission
 * is indistinguishable from a bug, whereas this is a decision with a reason
 * attached.
 *
 * This does NOT bypass RLS by itself. It requires the connecting role to hold
 * the `kealee_platform_ops` policy grant. Application roles do not, so a
 * misplaced call here fails closed rather than opening the door.
 */
export async function withPlatformOperation<T>(
  reason: string,
  operatorId: string,
  fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  if (!reason.trim()) {
    throw new Error('A cross-tenant platform operation must state its reason; it is audited.')
  }
  if (!operatorId.trim()) {
    throw new Error('A cross-tenant platform operation must name its operator; it is audited.')
  }
  // eslint-disable-next-line no-console
  console.warn(`[tenancy] CROSS-TENANT operation by ${operatorId}: ${reason}`)
  return prisma.$transaction(async (tx) => fn(tx))
}

/**
 * Reads back the tenant the current transaction is scoped to.
 *
 * For tests and for asserting in a processor that context was actually
 * established, rather than assuming a caller wrapped things correctly.
 */
export async function currentTenantId(
  tx: { $queryRawUnsafe: (q: string) => Promise<unknown> },
): Promise<string | null> {
  const rows = (await tx.$queryRawUnsafe(
    `SELECT current_setting('app.tenant_id', true) AS tenant`,
  )) as { tenant: string | null }[]
  const v = rows?.[0]?.tenant
  return v && v.length > 0 ? v : null
}
