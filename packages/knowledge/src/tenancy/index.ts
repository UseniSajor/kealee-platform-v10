/**
 * Tenant context, and the boundary the retrieval corpus must not cross.
 *
 * See `docs/decisions/white-label-and-tenancy.md`. Kealee runs two businesses
 * on one codebase:
 *
 *   KEALEE_DIRECT  the homeowner business — Kealee produces the deliverable
 *                  and owes the duty to get it professionally reviewed
 *   WHITE_LABEL    a firm licensing the software — THEIR professionals are
 *                  responsible and Kealee is the vendor
 *
 * The corpus added in Phase G exists to carry one job's findings into the next.
 * That is exactly the behaviour that must not cross a tenant line: a
 * homeowner's property, or a professional's judgement, surfacing in a
 * competitor's workspace. So retrieval takes a `TenantScope` rather than an
 * optional filter, and there is no call signature that omits it.
 *
 * The design rule here is worth stating because it is easy to get backwards:
 * a filter you can forget is not a boundary. Anything that reads the corpus
 * must be unable to express "all tenants" without saying so in a named,
 * greppable way.
 */

/**
 * Mirrors `OrgTenantKind` in the Prisma schema.
 *
 * AN ORG IS THE TENANT (resolved 2026-09-24, see the decision doc §4b). There
 * is no separate Tenant entity: `organizationId` already sits on the models
 * that carry customer data, so scoping costs nothing extra, and a second
 * identifier would be one more thing every query has to remember.
 */
export type TenantKind = 'KEALEE_DIRECT' | 'WHITE_LABEL'

export interface TenantScope {
  /** An Org id. Named `tenantId` because that is the ROLE the Org plays here. */
  tenantId: string
  kind: TenantKind
}

/**
 * The homeowner business's Org id, from `SITE_PLAN_ORG_ID`.
 *
 * Read at call time rather than captured at module load: the value differs
 * per deployment, and a captured undefined would silently become the empty
 * string — which `requireTenantScope` rejects, but only after something has
 * already tried to use it.
 */
export function kealeeDirectOrgId(): string | null {
  const v = process.env.SITE_PLAN_ORG_ID
  return v && v.trim() ? v.trim() : null
}

export class CrossTenantAccessError extends Error {
  readonly requested: string
  readonly scope: string
  constructor(requested: string, scope: string, what: string) {
    super(
      `Refusing cross-tenant access to ${what}: scope is tenant "${scope}" but the ` +
      `record belongs to tenant "${requested}". This is a containment failure, not a ` +
      'missing filter — the caller should never have been able to name that record.',
    )
    this.name = 'CrossTenantAccessError'
    this.requested = requested
    this.scope = scope
  }
}

export class MissingTenantScopeError extends Error {
  constructor(operation: string) {
    super(
      `${operation} requires a TenantScope. Corpus reads and writes are tenant-scoped ` +
      'because the corpus carries findings between jobs; an unscoped one would carry ' +
      'them between customers.',
    )
    this.name = 'MissingTenantScopeError'
  }
}

/**
 * Asserts a scope is present and well formed.
 *
 * Rejects the empty string explicitly. `tenantId: ''` would otherwise pass a
 * truthiness check in some call paths and match nothing — or, worse, be
 * concatenated into a hand-written SQL predicate that matches everything.
 */
export function requireTenantScope(
  scope: TenantScope | null | undefined,
  operation: string,
): TenantScope {
  if (!scope || typeof scope.tenantId !== 'string' || scope.tenantId.trim() === '') {
    throw new MissingTenantScopeError(operation)
  }
  return scope
}

/** Throws unless the record belongs to the scope. */
export function assertSameTenant(
  scope: TenantScope,
  recordTenantId: string | null | undefined,
  what: string,
): void {
  if (recordTenantId !== scope.tenantId) {
    throw new CrossTenantAccessError(recordTenantId ?? '(none)', scope.tenantId, what)
  }
}

/**
 * Whether one tenant may read another's corpus. It may not — ever.
 *
 * Kept as a named function rather than an inlined `===` so the rule has one
 * place to live, is greppable, and is testable. The homeowner/professional
 * line is the case that matters most, and it falls out of the same rule: two
 * different tenants, therefore no.
 */
export function mayReadCorpusOf(reader: TenantScope, ownerTenantId: string): boolean {
  return reader.tenantId === ownerTenantId
}

/**
 * The ONLY way to read across tenants, and it is not for serving customers.
 *
 * Platform operations — a support engineer reproducing a failure, an
 * aggregate health query — occasionally need to. Those callers name this
 * function, which makes every such call greppable and auditable. Nothing on a
 * request path may use it.
 */
export interface PlatformOperationScope {
  readonly crossTenant: true
  /** Why. Recorded in the audit trail; not optional and not a default. */
  readonly reason: string
  readonly operatorId: string
}

export function platformOperation(reason: string, operatorId: string): PlatformOperationScope {
  if (!reason.trim()) {
    throw new Error('A cross-tenant platform operation must state its reason; it is audited.')
  }
  return { crossTenant: true, reason, operatorId }
}

export function isPlatformOperation(
  scope: TenantScope | PlatformOperationScope,
): scope is PlatformOperationScope {
  return (scope as PlatformOperationScope).crossTenant === true
}

/**
 * Storage path prefix for a tenant.
 *
 * Every file a tenant owns lives beneath this. A path built any other way is
 * a bug: shared buckets with unprefixed keys are how one tenant's document id
 * becomes another tenant's download.
 */
export function tenantStoragePrefix(scope: TenantScope): string {
  requireTenantScope(scope, 'tenantStoragePrefix')
  return `tenants/${scope.tenantId}`
}

/**
 * Queue job key prefix. BullMQ jobs carry no tenant today, which means a job
 * cannot be attributed, rate-limited or cancelled per tenant.
 */
export function tenantJobKey(scope: TenantScope, job: string): string {
  requireTenantScope(scope, 'tenantJobKey')
  return `${scope.tenantId}:${job}`
}

/**
 * Whether a module may be licensed to a tenant.
 *
 * Homeowner SKUs are NOT licensable. They are the KEALEE_DIRECT catalogue —
 * what a property owner buys from Kealee — and licensing one to a white-label
 * firm would let them resell Kealee's own product at their margin.
 */
export const HOMEOWNER_ONLY_SKUS = [
  'preliminary_site_plan',
  'verified_site_feasibility',
  'permit_site_plan',
  'cost_estimate',
  'certified_estimate',
  'permit_path_only',
  'permit_filing',
  'permit_managed',
  'professional_drawings',
  'managed_bid',
  'pm_advisory',
  'pm_oversight',
  'contractor_match',
] as const

export const LICENSABLE_MODULES = [
  'acquisition',
  'feasibility',
  'site_plans',
  'design_concepts',
  'estimating',
  'permits',
  'project_management',
  'payments',
  'marketplace',
  'operations',
  'knowledge_base',
  'executive_reporting',
] as const

export type LicensableModule = (typeof LICENSABLE_MODULES)[number]

export function assertLicensableModule(moduleKey: string): LicensableModule {
  if ((HOMEOWNER_ONLY_SKUS as readonly string[]).includes(moduleKey)) {
    throw new Error(
      `"${moduleKey}" is a homeowner SKU and cannot be licensed to a tenant. ` +
      'Those are what a property owner buys from Kealee directly; licensing one would ' +
      "let a white-label firm resell Kealee's own product. See " +
      'docs/decisions/white-label-and-tenancy.md.',
    )
  }
  if (!(LICENSABLE_MODULES as readonly string[]).includes(moduleKey)) {
    throw new Error(
      `"${moduleKey}" is not a known module. Licensable modules: ${LICENSABLE_MODULES.join(', ')}.`,
    )
  }
  return moduleKey as LicensableModule
}

export function tenantHasModule(
  enabledModules: readonly string[],
  moduleKey: LicensableModule,
): boolean {
  return enabledModules.includes(moduleKey)
}

/**
 * Guards the sale itself: a module may only be licensed to a WHITE_LABEL Org.
 *
 * Licensing a module to the homeowner Org is not a smaller mistake than
 * licensing a homeowner SKU to a white-label firm — it is the same error
 * pointed the other way, and it quietly turns Kealee's own business into a
 * tenant of itself, with a licence term and an expiry it was never meant to
 * have.
 */
export function assertModuleLicensableTo(
  scope: TenantScope,
  moduleKey: string,
): LicensableModule {
  const m = assertLicensableModule(moduleKey)
  if (scope.kind === 'KEALEE_DIRECT') {
    throw new Error(
      `Cannot license module "${m}" to the KEALEE_DIRECT organization. That Org is ` +
      "Kealee's own homeowner business, not a customer of it — modules are what a " +
      'white-label firm buys. See docs/decisions/white-label-and-tenancy.md.',
    )
  }
  return m
}

/**
 * Who carries professional responsibility for work produced under this scope.
 *
 * The single most consequential difference between the two businesses, kept as
 * a function so it is answered the same way everywhere — a report footer, a
 * review routing decision and a contract template must not disagree about it.
 */
export function professionalResponsibility(scope: TenantScope): {
  party: 'kealee' | 'tenant'
  statement: string
} {
  return scope.kind === 'KEALEE_DIRECT'
    ? {
        party: 'kealee',
        statement:
          'Kealee produces this deliverable and arranges review by a licensed ' +
          'professional before it is released.',
      }
    : {
        party: 'tenant',
        statement:
          'This deliverable is produced by the licensee using Kealee software. ' +
          'Professional review and certification are the licensee\u2019s responsibility; ' +
          'Kealee is the software vendor and does not certify this work.',
      }
}
