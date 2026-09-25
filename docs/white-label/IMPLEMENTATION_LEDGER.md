# White-Label Implementation Ledger

Snapshot date: 2026-09-24

This ledger records verified repository state and next actions. Update it in the
same change that materially changes a listed capability. `IN PROGRESS` means
code may exist but has not passed the release gate.

## Current repository findings

| Capability | Status | Current evidence | Required next evidence |
| --- | --- | --- | --- |
| Canonical organization and membership | IN PROGRESS | `Org.tenantKind`, `OrgMember`, and `ModuleEntitlement` distinguish direct/homeowner commerce from professional white-label tenants | Apply migrations and finish platform-wide route inventory |
| Canonical white-label control-plane schema | IN PROGRESS | Assembled schema validates with 525 models/311 enums; additive SQL covers control plane, tenant kind, usage idempotency, and data lifecycle | Apply migrations in staging/production-like database and record evidence |
| Legacy V30 branding config | IN PROGRESS | V30 reads canonical profiles, writes return 410, and the migration imports compatible rows | Apply migration and verify imported production data |
| Tenant request context | IN PROGRESS | Explicit membership selector, platform-admin guard, host presentation resolver, worker/database tenant context, and negative tests exist | Finish platform-wide HTTP/worker/raw-SQL inventory |
| Professional/homeowner separation | IN PROGRESS | Professional org membership and `tenantKind` are separate from project-scoped homeowner access; focused denial tests pass | Production-like two-audience end-to-end test |
| Module licensing | IN PROGRESS | Central fail-closed plan+entitlement decision, route guard, protected entitlement administration, and negative route tests exist | Adopt guard across every licensed product route |
| Kealee management console | IN PROGRESS | `apps/os-admin/white-label` manages tenants, brand, products, modules, plans, usage, domains, deployment, evaluations, support, and data lifecycle | Browser verification against deployed API/database |
| Tenant professional administration | IN PROGRESS | Contractor/developer Company OS settings provide delegated brand/support, plan, usage, evaluation and data-request access | Add team/workflow/integration administration and browser verification |
| Homeowner white-label presentation | IN PROGRESS | Owner shell resolves tenant brand/metadata from verified host with `HOMEOWNER_PROJECT` audience and no admin controls | Bind host brand to explicit shared project in end-to-end authorization tests |
| Custom domains | IN PROGRESS | Vercel provisioning/verification/deprovisioning, hostname resolver, TLS status, and admin actions exist | Verify DNS/TLS/auth callbacks in a deployed Vercel project |
| Branded reports/email/documents | IN PROGRESS | Shared sanitized render context is adopted by stored-template email, React Email layout, and document generator; full white-label output tests pass | Inventory remaining report/document emitters and delivery-test verified sender domains |
| Usage metering | IN PROGRESS | Tenant-local idempotency, media-router recording, rollups, Stripe meter reporting, reconciliation and tests exist | Instrument remaining billable paths and reconcile in Stripe test mode |
| Subscription billing | IN PROGRESS | Stripe subscription/invoice webhooks reconcile only explicitly bound white-label plans; active plan intersects module entitlements | Test-mode checkout/provisioning and webhook replay evidence |
| Tenant secrets | IN PROGRESS | Canonical secret-reference schema is in progress; org integration credentials exist | Approved vault integration, rotation/revocation flows, no plaintext tests |
| Storage/queue/vector/cache isolation | IN PROGRESS | Shared fail-closed namespace/job helpers and tenant-aware media jobs exist | Adopt across all historical call sites and add leakage tests per subsystem |
| Support access | IN PROGRESS | Canonical time-bound support-session schema is in progress | Approval/activation/expiry enforcement, UI, real-actor audit tests |
| Tenant audit | IN PROGRESS | General audit infrastructure exists; canonical tenant audit schema is in progress | Service adoption, immutable retention, admin/support/export coverage |
| Tenant evaluations | IN PROGRESS | Tenant suites/cases/runs and assertion runner record versions, results, thresholds, and failures | Connect promotion workflow and obtain customer-specific regression evidence |
| Managed branded release | NOT STARTED | Architecture and schema work are underway | All Gate A evidence in `SECURITY_AND_RELEASE_GATES.md` |
| Full white-label SaaS release | NOT STARTED | Target documented | Gate B after Gate A verification |
| Private enterprise release | NOT STARTED | Deployment model documented | Gate C after Gate B verification and provisioning automation |

## Known risks to close

1. Authentication and billing code historically selected the first organization
   membership when no explicit tenant was provided. All such fallbacks must be
   removed, not merely hidden by UI behavior.
2. Existing enterprise service/routes and data model have had drift between
   service names and canonical Prisma models. Avoid `as any` around tenancy and
   authorization. Consolidate on `Org`, `OrgMember`, `ModuleEntitlement`, and the
   canonical white-label models.
3. Multiple feature-control mechanisms exist. Entitlements must become the
   authority for paid module access; rollout flags cannot grant billing access.
4. Existing V30 white-label configuration must not remain a competing source of
   truth after canonical profile activation.
5. Application-level `orgId` filters have not yet been proven equivalent to
   database-enforced isolation across Prisma, raw SQL, workers, storage, vectors,
   and caches.
6. The existing low-cost "White-Label Reporting" add-on must not be confused
   with a complete managed/full white-label platform plan.
7. Screens and schema alone are not proof of readiness. Each release state
   requires test and operational evidence.

## Ordered implementation checklist

### Foundation

- [x] Validate the assembled Prisma schema.
- [x] Add and review the canonical white-label migrations.
- [x] Seed versioned product templates from `product-templates.v1.json` through
      runtime-owned seed code.
- [x] Create shared tenant-context contracts for HTTP, workers, and internal
      calls.
- [x] Remove known implicit first-organization selection from authentication and billing paths.
- [x] Protect white-label and entitlement control-plane routes with platform-admin policy.
- [x] Define audience (`PLATFORM`, `PROFESSIONAL`, `HOMEOWNER`, `SERVICE`) in
      authorization context.

### Managed branded pilot

- [x] Build White Label tenant management in `apps/os-admin`.
- [x] Add tenant profile, product, module, plan, domain, deployment, support,
      evaluation, usage, and audit services/APIs.
- [x] Add branded theme/navigation resolution to professional portal shell.
- [x] Add shared branded email/report/document rendering context.
- [x] Implement Builder Acquisition Intelligence OS as a runtime product template.
- [x] Add homeowner branded project presentation without admin controls.
- [ ] Instrument usage and audit events for the pilot paths.
- [ ] Pass Gate A.

### Full SaaS

- [x] Add custom-domain and TLS lifecycle code (deployed verification remains required).
- [x] Add initial tenant professional self-service administration.
- [x] Implement metering, included usage, overages, and reconciliation services.
- [x] Implement bounded control-plane export/deletion/retention workflows.
- [x] Implement tenant-specific evaluation execution (promotion integration remains required).
- [ ] Pass Gate B.

### Private enterprise

- [ ] Automate dedicated environment, database, storage, secrets, and monitoring.
- [ ] Implement customer-cloud responsibility/configuration workflow.
- [ ] Test backup restoration, rollback, disaster recovery, and SLO monitoring.
- [ ] Pass Gate C.

## Change record

| Date | Change | Evidence/status |
| --- | --- | --- |
| 2026-09-24 | Established white-label architecture, product catalog, professional/homeowner boundary, operations runbook, and release gates | Documentation complete; runtime implementation remains governed by statuses above |
| 2026-09-24 | Added professional control plane, tenant presentation, delegated Company OS, domains, products, plans, usage, billing reconciliation, support state machine, evaluations, bounded data lifecycle, branded outputs, and tenant-scope helpers | Schema/type checks and focused tests pass; no release gate is marked complete until migrations and external services are verified in a production-like environment |

## Latest local verification (2026-09-24)

- Prisma: `prisma validate` passed for the merged 525-model/311-enum schema.
- TypeScript: API, shared, communications, automation, UI, os-admin,
  contractor portal, developer portal, and owner portal passed.
- API security/runtime: 10 files, 47 tests passed (tenant context,
  professional/homeowner boundary, entitlement routes, billing, usage,
  support, evaluations, and data lifecycle).
- Branding/scope: 3 files, 13 tests passed.
- Media router: 1 file, 8 tests passed.

These results are local code evidence, not deployed-environment approval.

## Future-agent handoff protocol

Before working on white labeling:

1. Read every file in `docs/white-label`.
2. Inspect `git status` and preserve concurrent/user changes.
3. Confirm which ledger item and release gate the change advances.
4. Inspect the canonical schema and existing services before adding new models.
5. Include both same-tenant success and cross-tenant/audience denial tests.
6. Update this ledger with honest status and exact verification evidence.
7. Never mark a release gate complete without an applied migration and
   end-to-end verification in an appropriate environment.
