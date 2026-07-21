# Autonomous Runtime Certification

Updated: 2026-07-20

Status: **local implementation verified; production certification is not complete**.

## Canonical model and compatibility

`AutonomousGoal → AutonomousRun → AutonomousStep → capability/tool invocation → evidence → completion decision` is the durable cross-system runtime. Existing `V30Loop*`, `V30BotExecution`, `V30BotResult`, `V30AgentMemory`, and `V30AutomationEvent` remain V30 execution projections. `KealeeWorkflowEngine` remains deterministic domain workflow state. `WorkflowGovernor` remains authority/risk policy. No legacy tables were deleted.

## Capability ledger

| Area | Implemented | Unit tested | Integration tested | Runtime verified | DB verified | Remaining dependency | Evidence |
|---|---:|---:|---:|---:|---:|---|---|
| Goal contracts, plans, dependencies, cycles | Yes | Yes | Local | In-memory | N/A | None | `corepack pnpm --filter @kealee/autonomous-runtime test` |
| Budgets, cancellation, partial/fatal/retry states | Yes | Yes | Local | In-memory | N/A | None | 18 focused tests |
| Approval and customer-input suspension/resume | Yes | Yes | Local | In-memory | Schema only | Deployed approval/input APIs | 18 focused tests |
| Evidence expiry and completion | Yes | Yes | Local | In-memory | Schema valid | Production evidence sources | 18 focused tests |
| Provider failover | Yes | Yes | Local | Mock providers | N/A | Provider test credentials for live failover | `provider failed_over` test |
| Prisma store and idempotent creation | Yes | Unit mock | No live DB | No | Prisma generated/validated | Apply scoped migration to test DB | `src/prisma-store.ts` |
| Atomic step claims and lease reclamation | Yes | Yes, two-worker compare-and-swap mock | No live DB | Mocked | Schema/index validation | Test Postgres concurrency run | `prisma-store.test.ts` |
| Tool calls, approvals, evidence, memory, accounting | Yes | Compile/unit coverage | No live DB | No | Schema valid | Test Postgres | Prisma store methods |
| V30/Claw/human adapters | Yes | Build verified | Payment path wired | No external workers | N/A | Queue/provider credentials | `capabilities.ts`, `kealee-adapters.ts` |
| Dead-letter, compensation, duplicate worker events, stalled recovery | Implemented | Yes | Local | In-memory/mock store | Schema valid | Queue worker integration | 20 focused tests |

## Database safety

- Migration contains only five runtime enums, nine runtime tables, their indexes, foreign keys, RLS, revokes, and comments.
- It contains no `DROP` statements.
- RLS is enabled on all nine public-schema tables.
- `anon` and `authenticated` receive no grants or policies.
- Owner-facing data must be served by curated server projections, never these internal tables.

Migration: `packages/database/prisma/migrations/20260720210000_autonomous_runtime/migration.sql`.

## Verified commands

- `corepack pnpm --filter @kealee/autonomous-runtime test` — 20/20 passed.
- `corepack pnpm --filter @kealee/autonomous-runtime build` — passed.
- `corepack pnpm --filter @kealee/database exec prisma validate --schema prisma/schema.prisma` — passed.
- `corepack pnpm --filter @kealee/database exec prisma validate --schema prisma/schema.generated.prisma` — passed.
- `corepack pnpm --filter @kealee/database exec prisma generate --schema prisma/schema.prisma` — passed with native execution approval.
- `corepack pnpm exec supabase db advisors --local` — not run: no local Supabase Postgres is listening on `127.0.0.1:54322`.

## Test deployment commands

Use a non-production database first:

```bash
corepack pnpm --filter @kealee/database exec prisma migrate deploy --schema prisma/schema.prisma
corepack pnpm --filter @kealee/database exec prisma migrate status --schema prisma/schema.prisma
corepack pnpm exec supabase db advisors
```

Do not run against production until the migration SQL and test-database advisor output have been reviewed.
