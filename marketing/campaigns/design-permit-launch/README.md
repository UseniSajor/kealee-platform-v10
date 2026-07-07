# Design + Permit Launch Campaign

Self-contained launch kit for Kealee's two headline products:
**AI Design Concept** (from $195) and **Permit Filing** ($299 / $799 / $1,499), DMV market.

## Why the old landing page was blank

The earlier plan pointed at `/campaigns/preconstruction`, which lives in the (separate, not-deployed)
`apps/marketing` app — that route **does not exist in `web-main` (kealee.com)**, so it renders blank.
This campaign instead drives to **real, live pages**:

- Design → `/products` (all AI design concepts, with prices) and `/concept-engine` (homeowner/developer paths)
- Permits → `/permits` (full intake + checkout funnel)

If you want a dedicated `/campaigns/design-permit` page on kealee.com, that's a follow-up build
in `apps/web-main/app/campaigns/` — say the word and I'll scaffold it from these assets.

## Contents

| File | What it is |
|------|------------|
| `copy.md` | All channel copy: search, LinkedIn, FB/IG, email, SMS, parcel outreach |
| `schedule.md` | Week 1–3 posting/send calendar |
| `README.md` | This file — overview, media generation, lead-flow answer |

Generated media is written to (servable from the site):
```
apps/web-main/public/media/campaigns/design-permit/
  ├─ images/   (design-concept-hero, -after, -social, -story, permit-hero, -social)
  ├─ video/    (design-concept-hero-video, permit-hero-video — 5s Kling clips)
  └─ manifest.json
```

## Generate images + video (Replicate)

Uses **Flux 1.1 Pro Ultra** (images) + **Kling 2.5 Turbo Pro** (video), the same models already
wired into the platform.

1. Add your token to `apps/web-main/.env.local`:
   ```
   REPLICATE_API_TOKEN=r8_xxx...
   ```
2. From the repo root:
   ```bash
   pnpm --filter web-main exec tsx scripts/generate-design-permit-campaign-media.ts
   # images only (skip the slower/costlier video):
   pnpm --filter web-main exec tsx scripts/generate-design-permit-campaign-media.ts --skip-video
   # regenerate a single asset:
   pnpm --filter web-main exec tsx scripts/generate-design-permit-campaign-media.ts --only=permit-hero
   ```

Script: `apps/web-main/scripts/generate-design-permit-campaign-media.ts`.
Approx cost: 6 images (~$0.06 each) + 2 short videos. Prompts use the Kealee palette and exclude
people, logos, and legible text.

> NOTE: There is currently **no `REPLICATE_API_TOKEN`** in `apps/web-main/.env.local` or the shell,
> so the media could not be generated automatically yet. Add the token and run the command above,
> or provide it and I'll run it for you.

## Does the property intelligence agent need to bring the leads first?

**No — not for this campaign to launch.** There are two independent lead engines:

1. **Inbound (this campaign):** ads / social / email / search → `/products`, `/permits`,
   `/concept-engine` → intake forms → `public_intake_leads` → lead scoring + SMS alerts.
   This works **today**, with zero dependency on the property intelligence agent. Start here.

2. **Outbound (property intelligence agent):** parcel ingestion → property twin →
   marketing intelligence + opportunity scoring → campaign routing → `parcel_outreach_targets`
   / `parcel_outreach_queue` → owner email / SMS / direct mail (Copy §7).
   This is a **separate, proactive channel**. It is *not* a prerequisite — it's an accelerator.

So: launch the inbound campaign now. The property intelligence agent only needs to "bring leads
first" for the **outbound parcel-outreach** track (Copy §7), which you can switch on in Week 3+
once it has populated targets. The two run in parallel and feed the same lead lifecycle.
