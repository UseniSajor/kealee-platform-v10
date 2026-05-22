# v30 UI/UX — implementation verification

**Source:** `UI UX v30.zip` (May 2026)  
**Verified:** 2026-05-22 against `apps/web-main`

## Customer-facing (web-main)

| Spec (UI-UX-SUMMARY) | Status | Implementation |
|----------------------|--------|----------------|
| Intake **before** payment | ✅ | `/get-concept` → quote → contact → Stripe |
| `/get-concept` page | ✅ | `apps/web-main/app/get-concept/page.tsx` |
| Personalized price (not fixed tiers) | ✅ | IntakeBot quote + `useV30Pricing` checkout |
| Package customizer (toggle features, live price) | ✅ | Feature chips on quote step; re-runs `/api/v30/intake` |
| Price **breakdown** (base + sqft + complexity…) | ✅ | Quote step shows `pricingBreakdown` lines |
| Progressive intake (1 question at a time) | ✅ | Question sub-steps with “N of M” progress |
| Nav CTA when v30 flag on | ✅ | `NAV_CTA_V30` → `/get-concept` |
| Post-pay generation trigger | ✅ | `/concept/success?v30=1` → `/api/v30/generate` |
| Post-pay bot progress UI | ✅ | `V30GenerationStatus` on `/concept/success` (polls `/api/v30/status`) |
| Redirect if v30 disabled | ✅ | `/get-concept` → `/concept` |

## Not yet built (spec / later phases)

| Spec | Status |
|------|--------|
| Homepage: remove 3 fixed tier cards | ⏳ v20 homepage unchanged until flag rollout |
| `/package-customizer` standalone route | ⏳ merged into `/get-concept` quote step |
| `/workspace/:projectId` tabbed workspace | ✅ `/workspace/[intakeId]` (Overview, Concepts, Estimate, Permits, Floorplan, Video) |
| Stripe webhook v30 generate | ✅ `public_intake_v30` → `triggerV30GenerationForIntake` |
| Live DesignBot | ✅ when `ANTHROPIC_API_KEY` set (`executeV30BotWithLlm`) |
| `portal-admin` dashboard | ⏳ not started |
| Intake “AI thinking…” animation | ⏳ optional polish |
| Utilities + code considerations UI | ⏳ defaults in form_data; full 9th-field UI later |

## Enable in Vercel

```bash
NEXT_PUBLIC_KEALEE_V30_ENABLED=true
KEALEE_V30_ENABLED=true
KEALEE_V30_PUBLIC_USER_ID=<User.id>  # API only
```
