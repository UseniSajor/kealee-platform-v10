# @kealee/seeds

KeaCore seed blueprint — the single source of truth for all platform configuration data.

## What's in here

| Pack | File | Records |
|------|------|---------|
| Intents | `src/intent/intent.seed.ts` | 11 |
| Workflow Templates | `src/workflows/workflow-templates.seed.ts` | 9 |
| Tools | `src/tools/tool-registry.seed.ts` | 12 |
| Jurisdictions (DMV) | `src/jurisdictions/dmv.jurisdictions.seed.ts` | 7 |
| Service Offerings | `src/services/service-catalog.seed.ts` | ~18 |
| Roles + Permissions | `src/roles/roles-permissions.seed.ts` | 10 |
| Risk / Approval Rules | `src/rules/risk-approval-rules.seed.ts` | 12 |
| Prompt Policies | `src/prompts/prompts-policies.seed.ts` | 8 |

## Commands

```bash
# Validate all seed packs with Zod (throws on error)
pnpm --filter @kealee/seeds validate

# Print active templates and offerings for operator review
pnpm --filter @kealee/seeds print-active

# Write dist/seed-snapshot.json
pnpm --filter @kealee/seeds seed:load

# Write snapshot AND upsert into the database
DATABASE_URL=... pnpm --filter @kealee/seeds seed:load
```

## Importing in code

```ts
import { keacoreSeedBlueprint } from "@kealee/seeds";
// or pick individual packs:
import { intentSeeds, workflowTemplateSeeds } from "@kealee/seeds";
```

## Adding / updating seeds

1. Edit the relevant `*.seed.ts` file.
2. Run `pnpm --filter @kealee/seeds validate` — fix any Zod errors.
3. Run `pnpm --filter @kealee/seeds print-active` — review the change.
4. Commit. CI runs validate automatically.

## Jurisdiction maintenance

Jurisdiction URLs in `src/jurisdictions/dmv.jurisdictions.seed.ts` should be re-verified annually. Check the `lastVerifiedAt` field on each record. Agencies occasionally rebrand or move their portals.

## Prisma tables

The seed-load script upserts into these Prisma models when `DATABASE_URL` is set:

- `IntentSeed`
- `WorkflowTemplate`
- `ServiceOffering`
- `JurisdictionConfig`
- `RoleDefinition`
- `PolicyRule`
- `PromptTemplate`

These models are defined in `packages/database/prisma/schema.prisma` (or `schema-src/` in v20).
