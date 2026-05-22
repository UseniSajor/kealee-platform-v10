# Kealee v30 — remaining work

**Last updated:** 2026-05-22

## Completed (P1 core)

| # | Task | Status |
|---|------|--------|
| 1 | Stripe webhook → v30 generate after `paid` | ✅ `public_intake_v30` + `triggerV30GenerationForIntake` |
| 2 | Live DesignBot via `ClaudeCachedClient` | ✅ `executeV30BotWithLlm` (other bots stub until wired) |
| 3 | Customer workspace tabs | ✅ `/workspace/[intakeId]` + `GET /v30/project/:id/workspace` |
| — | Post-pay status UI | ✅ `/concept/success` + `/api/v30/status` |
| — | os-intake / os-ai-orch packages | ✅ |
| — | `/get-concept` UX | ✅ |

## P0 — Before production rollout

- [ ] Run `cd packages/database && npx prisma migrate deploy` on Supabase
- [ ] Env on **API**: `KEALEE_V30_ENABLED`, `KEALEE_V30_PUBLIC_USER_ID`, `ANTHROPIC_API_KEY`
- [ ] Env on **web-main**: `NEXT_PUBLIC_KEALEE_V30_ENABLED`, `KEALEE_V30_ENABLED`, `INTERNAL_API_URL`
- [ ] Stripe webhook URL includes `checkout.session.completed` for production
- [ ] Smoke: `/get-concept` → pay → webhook → `/workspace/:intakeId`

## P1 — Still open

| Task | Notes |
|------|--------|
| Wire remaining 9 bots to LLM | estimate, zoning, permit, floorplan, video, … |
| Map DesignBot JSON → concept portal renders | replace raw JSON in workspace |
| Full 9-question intake UI | utilities + code considerations |
| Homepage v30 mode | hide fixed tier cards when flag on |

## P2 — Spec services / portals

- [ ] Deployable `services/os-intake`, `services/os-ai-orch`
- [ ] `apps/portal-admin` (bot prompts, pricing formula, metrics)
- [ ] `apps/portal-projects`, analytics, white-label
- [ ] `os-admin`, `os-analytics`, `os-white-label` API stubs

## P3 — Polish & B2B

- [ ] Intake “AI analyzing…” animation
- [ ] B2B contractor subscription flows
- [ ] White-label partner portal

## P4 — Repo hygiene

- [ ] Optional gitignore for `*.zip` in `Kealee Platform Agents/`
- [ ] Untracked `testskeabots/`, `replicate/`, duplicate Pascal SQL

## Env reference

```bash
# web-main + API
KEALEE_V30_ENABLED=true
NEXT_PUBLIC_KEALEE_V30_ENABLED=true

# API only
KEALEE_V30_PUBLIC_USER_ID=<User.id>
ANTHROPIC_API_KEY=sk-...
KEALEE_V30_LLM_ENABLED=true   # set false to force dry-run bots
```
