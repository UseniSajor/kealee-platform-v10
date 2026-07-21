# Kealee Platform — Schema Governance

## Architecture: Single DB, Modular Schema

One PostgreSQL database with logical domain separation via modular `.prisma` source files.

**Current state:** 364 models, 211 enums across 14 domains.

## Directory Structure

```
packages/database/
  prisma/
    schema.prisma              ← Original (preserved for backward compat)
    schema.generated.prisma    ← Composed from schema-src/ (use for new work)
    migrations/
  schema-src/
    00-generator.prisma        ← Prisma generator config
    01-datasource.prisma       ← PostgreSQL datasource
    foundation/                ← System infra, notifications, messaging
    identity/                  ← Users, orgs, roles, permissions, auth
    ddts/                      ← Digital Development Twin System
    land/                      ← Parcels, zoning, assessments
    feasibility/               ← Studies, scenarios, proformas
    development/               ← Capital stacks, draws, entitlements
    pm/                        ← Project management (24 sub-files)
      projects.prisma
      schedule.prisma
      rfis-submittals.prisma
      change-orders.prisma
      inspections.prisma
      daily-logs.prisma
      meetings.prisma
      drawings.prisma
      budget.prisma
      closeout.prisma
      safety.prisma
      time-entries.prisma
      permits.prisma
      design.prisma
      estimation.prisma
      bids.prisma
      sops.prisma
      procurement.prisma
      selections.prisma
      warranty.prisma
      multifamily.prisma
      field-ops.prisma
      reports.prisma
      enums.prisma
    payments/                  ← Milestones, escrow, disputes, accounting
    operations/                ← Turnover, maintenance, work orders
    marketplace/               ← Contractors, leads, bids, listings
    documents/                 ← Files, templates, document management
    workflow/                  ← Approvals, compliance, audit, automation
    integrations/              ← GHL, Stripe, webhooks, API connections
    analytics/                 ← KPIs, reports, predictions, snapshots
  scripts/
    split-schema.ts            ← Parse monolith → domain files
    merge-schema.ts            ← Compose domain files → generated schema
    validate-schema.ts         ← CI validation (structure + Prisma validate)
    split-pm-domain.ts         ← Further split PM into sub-files
```

## Domain Ownership

| Domain | Service Owner | Models | Enums |
|--------|--------------|--------|-------|
| foundation | Platform Core | 29 | 11 |
| identity | Auth Service | 16 | 0 |
| ddts | DDTS Core | 5 | 3 |
| land | OS-Land | 10 | 5 |
| feasibility | OS-Feas | 6 | 2 |
| development | OS-Dev | 14 | 11 |
| pm | OS-PM | 157 | 101 |
| payments | OS-Pay | 37 | 32 |
| operations | OS-Ops | 4 | 3 |
| marketplace | Marketplace | 31 | 11 |
| documents | Document Service | 7 | 0 |
| workflow | Workflow Engine | 19 | 18 |
| integrations | Integration Layer | 10 | 4 |
| analytics | Analytics Service | 19 | 10 |

## Governance Rules

### Rule 1: Domain Ownership
Each model belongs to exactly one domain. The domain's service is the system of record.

### Rule 2: Cross-Domain References
Allowed via foreign keys. Reference must go through anchor models (Project, User, Org, DigitalTwin).

### Rule 3: Bot Persistence
Bots NEVER own system-of-record tables. Bots may have:
- Bot task/action logs (analytics domain)
- Bot suggestions (workflow domain)
- Bot conversation history (analytics domain)

### Rule 4: Shared Base Patterns
Every major model MUST include:
- `id String @id @default(uuid())`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `organizationId` where relevant
- `projectId` where relevant

### Rule 5: Core Anchor Models
All project-facing domains connect through:
- **Global:** User, Org, Project, DigitalTwin
- **Lifecycle:** Parcel, FeasibilityStudy, CapitalStack, Permit, Schedule, Milestone, TurnoverChecklist
- **Cross-cutting:** Document, WorkflowInstance, IntegrationCredential, AuditLog

### Rule 6: Naming Conventions
- Singular model names (Project, not Projects)
- Explicit relation names (no ambiguous references)
- PascalCase models, camelCase fields
- Enum values in SCREAMING_SNAKE_CASE
- No vague names (Data, Info, Record2, TempThing)

### Rule 7: Status Enums
Every status enum must include terminal states and be documented.

### Rule 8: Metadata JSON
Use `metadata Json?` sparingly — only for truly unstructured data. Prefer explicit fields.

## Developer Workflow

```bash
# Edit schema files in schema-src/<domain>/
# Then compose:
pnpm --filter @kealee/database schema:merge

# Validate:
pnpm --filter @kealee/database schema:validate

# Generate Prisma client:
DATABASE_URL=... npx prisma generate --schema=prisma/schema.generated.prisma

# Create migration:
DATABASE_URL=... npx prisma migrate dev --schema=prisma/schema.generated.prisma --name your_migration_name
```

## CI Pipeline

The `schema:validate` script checks:
1. All 14 domain directories exist
2. Generator and datasource files present
3. Merge produces valid output
4. Model/enum counts >= expected minimums
5. No duplicate model/enum names
6. `prisma validate` passes

## Future Split Candidates

Only split if operational pain is real:

| Candidate | Trigger Condition |
|-----------|-------------------|
| Payments/Escrow | Compliance audit requires isolated ledger |
| Analytics Warehouse | Query load impacts transactional performance |
| Document Search | Full-text search needs dedicated infrastructure |
| AI/Bot Telemetry | Bot conversation volume warrants separate store |
| Public Reporting | External data sharing needs read replica |

Until triggered, keep everything in the single operational database.
