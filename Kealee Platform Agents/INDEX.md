# Kealee Platform Agents — Index

**Updated:** 2026-05-22  
**Runnable code:** `packages/kealee-agent-stack` (`@kealee/kealee-agent-stack`)  
**API:** `services/api` → `/v30/*` and `/agent-ops/*`

---

## v30 specification (start here)

| Document | Purpose |
|----------|---------|
| [v30/README-START-HERE.md](./v30/README-START-HERE.md) | Orientation and reading order |
| [v30/KEALEE-v30-IMPLEMENTATION-GUIDE.md](./v30/KEALEE-v30-IMPLEMENTATION-GUIDE.md) | Quick start, critical changes, checklist |
| [v30/KEALEE-v30-COMPLETE-MASTER-SPEC.md](./v30/KEALEE-v30-COMPLETE-MASTER-SPEC.md) | Full architecture, Prisma, APIs, Cursor prompts |
| [v30/KEALEE-v30-INTEGRATION-STRATEGY.md](./v30/KEALEE-v30-INTEGRATION-STRATEGY.md) | v20 → v30 rollout and feature flag |
| [KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md](./KEALEE-v30-ALL-10-BOTS-COMPLETE-WIRED.md) | **All 10 bot prompts (wired)** → `packages/kealee-agent-stack/src/v30/prompts/` |
| [docs/system/REPLICATE-VS-PASCAL.md](../docs/system/REPLICATE-VS-PASCAL.md) | Replicate = images; Pascal = 2D editor |

Extracted from `Kealee v30 files.zip` into `v30/`.

**zip2 (Days 1–7 combined):** [v30/zip2/](./v30/zip2/) — from `kealeev30 2.zip`; includes os-intake / os-ai-orch build prompts.

**UI/UX impact:** [v30/uiux/](./v30/uiux/) — from `UI UX v30.zip`; see [VERIFICATION.md](./v30/uiux/VERIFICATION.md) for web-main checklist.

---

## Legacy agent / ops docs

| Document | Purpose |
|----------|---------|
| [Kealee_Production_Build_Plan.md](./Kealee_Production_Build_Plan.md) | Production build plan |
| [Kealee_Command_Center_Integration_Guide.md](./Kealee_Command_Center_Integration_Guide.md) | Command Center integration |
| [Kealee_PM_App_Specifications.md](./Kealee_PM_App_Specifications.md) | PM app specifications |
| [Permit_Scraping_Technical_Guide.md](./Permit_Scraping_Technical_Guide.md) | Permit scraping |
| [_docs/Kealee agent INDEX.md](../_docs/Kealee%20agent%20INDEX.md) | Hermes / Orgo / Obsidian layer index |

---

## Implementation map (spec → code)

| Spec area | Monorepo location |
|-----------|-------------------|
| 10 bots + IntakeBot | `packages/kealee-agent-stack/src/v30/` |
| os-intake (zip2) | `packages/os-intake` |
| os-ai-orch (zip2) | `packages/os-ai-orch` |
| Dynamic pricing formula | `packages/kealee-agent-stack/src/v30/pricing.ts` (uses `@kealee/core-rules`) |
| Parallel orchestration | `packages/kealee-agent-stack/src/v30/orchestrator.ts` |
| Intake + generate API | `services/api/src/modules/v30/v30.routes.ts` |
| Public intake → generate | `apps/web-main/app/api/v30/generate/route.ts` |
| 12 Prisma models | `packages/database/prisma/schema.prisma` + migration `20260522_add_v30_models` |
| Feature flag | `KEALEE_V30_ENABLED` / `NEXT_PUBLIC_KEALEE_V30_ENABLED` |
| Public project owner | `KEALEE_V30_PUBLIC_USER_ID` on API (User.id for `/get-concept`) |

---

## v30 bots (KeaBot 3.0)

1. **IntakeBot** — analyze 9-question form before payment  
2. **DesignBot** — 3 concepts (Opus)  
3. **EstimateBot** — preliminary / detailed costs  
4. **ZoningBot** — permit requirements by jurisdiction  
5. **FloorplanBot** — 2D coordinate data  
6. **PermitBot** — permit-ready specifications  
7. **VideoBot** — walkthrough prompts  
8. **ContractorBot** — recommendations  
9. **SalesBot** — objection handling  
10. **SupportBot** — customer Q&A  
11. **ProjectBot** — workspace workflow  

---

## P0–P4 (implemented in repo)

| Item | Location |
|------|----------|
| Deploy runbook + smoke | [v30/DEPLOY-RUNBOOK.md](./v30/DEPLOY-RUNBOOK.md), `pnpm v30:smoke` |
| portal-admin | `apps/portal-admin` |
| portal-projects | `apps/portal-projects` |
| os-intake / os-ai-orch services | `services/os-intake`, `services/os-ai-orch` |
| Partners / contractors | `apps/web-main/app/partners`, `/contractors/subscribe` |

See [v30/REMAINING.md](./v30/REMAINING.md) — only production ops steps remain.

---

## Quick commands

```bash
# Typecheck agent stack
pnpm --filter @kealee/kealee-agent-stack build

# Apply v30 DB migration (after review)
cd packages/database && npx prisma migrate deploy
```
