# Platform simplification plan — 2026-08-26

## Objective

Reduce duplicated deployment and workflow surfaces while preserving every
customer-facing service, product, and compatibility route. This is a staged
refactor; no Railway service is deleted or disabled by this document.

## Current inventory

The generated inventory is the baseline for consolidation decisions:

- Evidence: `reports/platform/workspace-inventory.json`
- Generator: `scripts/generate-workspace-inventory.mjs`
- Latest inventory: 96 workspaces (30 duplicate, 7 experimental, 14 production,
  and 45 supporting)

The lifecycle labels are triage signals, not deletion instructions. A workspace
may be marked duplicate because it is a legacy implementation while still
being needed for compatibility or historical migrations.

## Canonical production boundaries

| Capability | Canonical owner | Compatibility rule |
|---|---|---|
| Customer web and checkout | `apps/web-main` | Preserve existing public routes and redirects |
| Owner delivery portal | `apps/portal-owner` | Keep emailed order links stable |
| Contractor/developer portals | Their existing portal apps | Share auth and delivery contracts; do not merge UI apps prematurely |
| API and provider boundary | `services/api` plus `packages/core-ai-gateway` | New provider calls go through the gateway |
| Background fulfillment | `services/worker` and `packages/queue` | One queue contract per job type; retain idempotency keys |
| Product rules and catalog | `packages/core-rules` plus web catalog adapters | Apps consume canonical rules instead of copying SKU definitions |
| Database access | `packages/database` | Prisma schema/migrations remain the source of truth |
| Auth | `packages/auth` / Clerk | No new Supabase Auth path |
| Observability | `packages/observability` | Preserve incident and audit events during refactors |

## Staged changes

### Phase 1 — inventory and contracts (current)

- Generate the workspace inventory before each consolidation batch.
- Record public routes, package exports, queue names, and Railway service names.
- Add tests for compatibility behavior before moving implementation.
- Treat retired cron services as pending external approval; do not delete them.

### Phase 2 — consolidate code paths

- Route each paid product through one canonical automation mapping.
- Move shared provider calls into the existing gateway and shared storage helpers.
- Replace duplicate scripts with thin wrappers that invoke the canonical runner.
- Keep legacy entry points as adapters until usage and logs show they are safe to retire.

### Phase 3 — consolidate operations

- Standardize health, status, retry, and incident fields across API and worker.
- Keep customer status positive and non-technical while retaining internal errors.
- Compare delivery time, reviewer minutes, retry rate, and artifact completeness before and after each batch.

### Phase 4 — external cleanup (approval required)

- Review Railway services using the inventory and deployment logs.
- Disable or delete only explicitly approved retired services.
- Verify DNS, secrets, database migrations, and production runtime before any final audit.

## No-loss acceptance criteria

Each consolidation batch is acceptable only when:

1. Existing public URLs and emailed delivery links still resolve.
2. Product routing and prices remain unchanged.
3. Queue jobs remain idempotent and retryable.
4. Generated artifacts retain their current storage and metadata contracts.
5. Typecheck, build, boundary checks, and targeted delivery tests pass.
6. Any unavailable external verification is recorded as blocked, never treated as passed.

## Explicit non-actions

- No Vercel deployment.
- No Railway service deletion without approval.
- No destructive worktree cleanup.
- No replacement of real generated artifacts with fixtures or placeholder URLs.
