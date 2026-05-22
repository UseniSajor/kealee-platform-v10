# Kealee v30 — remaining work

**Last updated:** 2026-05-22 (P0–P4 implementation pass)

## Completed

| Area | Status |
|------|--------|
| Stripe webhook → v30 generate | ✅ |
| 10 bots LLM + wired prompts | ✅ |
| Customer workspace + tab renders (design/estimate/permits) | ✅ |
| 9-question intake (utilities + code) | ✅ |
| Homepage v30 pricing band (hides tier cards) | ✅ |
| Intake “AI analyzing” overlay | ✅ |
| `services/os-intake`, `services/os-ai-orch` microservices | ✅ |
| `apps/portal-admin`, `apps/portal-projects` | ✅ |
| API stubs: `/v30/admin/*`, `/v30/analytics/*`, `/v30/white-label/*` | ✅ |
| B2B `/contractors/subscribe` + `/partners` | ✅ |
| P0 runbook + `pnpm v30:smoke` + API `.env.example` | ✅ |
| P4 gitignore (`testskeabots/`, `replicate/`) | ✅ |

## P0 — Ops (you run in prod)

- [ ] `pnpm v30:migrate` on Supabase production
- [ ] Set env on API + Vercel (see [DEPLOY-RUNBOOK.md](./DEPLOY-RUNBOOK.md))
- [ ] Stripe production webhook → `checkout.session.completed`
- [ ] `pnpm v30:smoke --api <api> --web <web>` after deploy

## Optional follow-ups

- [ ] Map DesignBot image prompts → Replicate/Runway generation pipeline
- [ ] portal-admin auth + live prompt editing (DB `V30BotConfiguration`)
- [ ] Railway services for `os-intake` :3016 and `os-ai-orch` :3017 (optional split from main API)

## Env reference

```bash
KEALEE_V30_ENABLED=true
NEXT_PUBLIC_KEALEE_V30_ENABLED=true
KEALEE_V30_PUBLIC_USER_ID=<User.id>
ANTHROPIC_API_KEY=sk-...
KEALEE_V30_LLM_ENABLED=true
INTERNAL_API_URL=https://your-api.railway.app
```
