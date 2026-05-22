# KEALEE v30 — Integration Strategy

**Companion to:** `KEALEE-v30-COMPLETE-MASTER-SPEC.md`  
**Status:** Implemented in monorepo (agent layer + API + schema); portals/services roll out behind feature flag.

---

## Principles

1. **Additive upgrade** — no deletions from v20; new models, routes, and packages only.
2. **Feature flag** — `KEALEE_V30_ENABLED=true` gates v30 intake and parallel bot runs.
3. **Pricing** — never hardcode amounts; use `@kealee/core-rules` and `PricingFormula` rows.
4. **AI** — Claude via existing patterns; model IDs from `AI_MODELS` in core-rules.

---

## What stays unchanged

- Existing Prisma models (368+)
- Stripe webhooks and `public_intake_leads` flow (v30 adds parallel path)
- Pascal Editor (`@kealee/pascal-wrapper`)
- Portal apps not yet built (portal-admin, portal-projects) remain future work

---

## What was added (this repo)

| Layer | Location |
|-------|----------|
| Agent types, prompts, orchestrator | `packages/kealee-agent-stack/src/v30/` |
| HTTP API | `services/api` → `POST/GET /v30/intake`, `POST /v30/project/:id/generate` |
| Database | `V30IntakeResponse`, `V30CustomPackage`, `V30BotExecution`, … on `Project` / `User` |
| Docs | `Kealee Platform Agents/v30/*.md` |

---

## Rollout (recommended)

| Phase | Flag | Audience |
|-------|------|----------|
| 1 | `KEALEE_V30_ENABLED=false` | Internal only; API smoke tests |
| 2 | `true` for new intakes only | 10% traffic |
| 3 | Default on | All new customers |
| 4 | Migrate legacy | 6-month v20 support window |

**Rollback:** set `KEALEE_V30_ENABLED=false` — web-main and checkout fall back to v20 tier pricing.

---

## Migration checklist

- [ ] Run `prisma migrate deploy` for `20260522_add_v30_models`
- [ ] Seed `V30PricingFormula` default row (admin or script)
- [ ] Set `KEALEE_V30_ENABLED` on Railway (API) and Vercel (web-main when intake UI ships)
- [ ] Wire `POST /v30/intake` from web-main `/get-concept` page
- [ ] Connect `POST /v30/project/:id/generate` after Stripe webhook marks intake paid
- [ ] Add Replicate webhook to `pascal_render_jobs` (already at `/api/editor/renders/webhook`)

---

## Risk mitigation

| Risk | Mitigation |
|------|------------|
| Bot cost overrun | `maxCostUSD` on `V30BotConfiguration`; parallel cap in orchestrator |
| Wrong dynamic price | A/B test; admin edits `V30PricingFormula` |
| DB migration failure | Test on staging clone first |
| Customer confusion | Keep v20 intake URLs until v30 UI is validated |
