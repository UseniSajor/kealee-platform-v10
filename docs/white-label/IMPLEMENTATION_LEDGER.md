# White-Label Implementation Ledger

Snapshot date: 2026-09-24

This ledger records verified repository state and next actions. Update it in the
same change that materially changes a listed capability. `IN PROGRESS` means
code may exist but has not passed the release gate.

## Current repository findings

| Capability | Status | Current evidence | Required next evidence |
| --- | --- | --- | --- |
| Canonical organization and membership | SCAFFOLDED | `Org`, `OrgMember`, and `ModuleEntitlement` exist in `packages/database/schema-src/identity/models.prisma` | Explicit tenant selection, full route adoption, negative authorization tests |
| Canonical white-label control-plane schema | IN PROGRESS | `packages/database/schema-src/identity/white-label.prisma` defines profile, domain, product, plan, usage, secret reference, deployment, evaluation, support, and audit models | Generated schema validation, migration, database apply, service/API tests |
| Legacy V30 branding config | SCAFFOLDED | `V30WhiteLabelConfig` exists in `packages/database/schema-src/workflow/loops.prisma` | Migration/compatibility plan into canonical profile; prevent dual writes |
| Tenant request context | IN PROGRESS | Clerk middleware verifies a selected membership and has platform-admin middleware | Remove `orgMemberships[0]` fallback everywhere; trusted host/session resolver; worker context tests |
| Professional/homeowner separation | SCAFFOLDED | Separate professional and owner portal applications exist | Formal audience claims/guards, project-scoped homeowner policy, cross-audience tests |
| Module licensing | SCAFFOLDED | `ModuleEntitlement` schema and admin UI concepts exist | Central fail-closed guard used by every licensed API/service and UI derivation |
| Kealee management console | SCAFFOLDED | `apps/os-admin` includes orgs, modules, subscriptions, audit, and enterprise areas | Unified White Label navigation, live APIs, platform-admin guard, test coverage |
| Tenant professional administration | NOT STARTED | Professional portals exist, but a unified delegated tenant-admin experience is not verified | Role-scoped team/workflow/integration/brand/usage administration |
| Homeowner white-label presentation | NOT STARTED | `apps/portal-owner` exists | Branded project presentation without tenant-admin access; boundary tests |
| Custom domains | SCAFFOLDED | Legacy and canonical schema fields/models exist | DNS/TLS verification, hostname resolver, auth/email links, lifecycle tests |
| Branded reports/email/documents | SCAFFOLDED | Platform has report, email, and document systems; canonical branding fields are in progress | Shared render context adopted and snapshot/delivery tested |
| Usage metering | IN PROGRESS | Canonical event/rollup schema is in progress; older API usage data exists | Instrument all billable paths, idempotency/reconciliation, billing integration |
| Subscription billing | SCAFFOLDED | Stripe software subscription infrastructure exists | Org-centric white-label plans, usage overages, webhooks, reconciliation tests |
| Tenant secrets | IN PROGRESS | Canonical secret-reference schema is in progress; org integration credentials exist | Approved vault integration, rotation/revocation flows, no plaintext tests |
| Storage/queue/vector/cache isolation | NOT STARTED | Individual systems exist, but a platform-wide tenant-isolation inventory is not verified | Namespacing utilities, migrations/config, leakage tests for each system |
| Support access | IN PROGRESS | Canonical time-bound support-session schema is in progress | Approval/activation/expiry enforcement, UI, real-actor audit tests |
| Tenant audit | IN PROGRESS | General audit infrastructure exists; canonical tenant audit schema is in progress | Service adoption, immutable retention, admin/support/export coverage |
| Tenant evaluations | IN PROGRESS | General AI evaluation concepts exist; tenant suite/case/run schema is in progress | Runner, thresholds, promotion gate, customer-specific regression evidence |
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

- [ ] Validate the assembled Prisma schema and generate the client.
- [ ] Add and review the canonical white-label migration.
- [ ] Seed versioned product templates from `product-templates.v1.json` through
      runtime-owned seed code.
- [ ] Create a single tenant-context contract for HTTP, workers, and internal
      calls.
- [ ] Remove all implicit first-organization selection.
- [ ] Protect all platform control-plane routes with platform-admin policy.
- [ ] Define audience (`PLATFORM`, `PROFESSIONAL`, `HOMEOWNER`, `SERVICE`) in
      authorization context.

### Managed branded pilot

- [ ] Build White Label tenant management in `apps/os-admin`.
- [ ] Add tenant profile, product, module, plan, domain, deployment, support,
      evaluation, usage, and audit services/APIs.
- [ ] Add branded theme/navigation resolution to professional portal shell.
- [ ] Add shared branded email/report/document rendering context.
- [ ] Implement Builder Acquisition Intelligence OS as first product assignment.
- [ ] Add homeowner branded project presentation without admin controls.
- [ ] Instrument usage and audit events for the pilot paths.
- [ ] Pass Gate A.

### Full SaaS

- [ ] Add verified custom-domain and TLS lifecycle.
- [ ] Add tenant professional self-service administration.
- [ ] Complete metering, included usage, overages, and reconciliation.
- [ ] Implement data export/deletion/retention workflows.
- [ ] Run tenant-specific evaluations before model/prompt/workflow promotion.
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
