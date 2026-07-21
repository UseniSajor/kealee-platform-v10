# Installation & process media — QA checklist

Phases 1–7: shot scripts, Kling card loops, Sora Premium+ deliverables, before/after stills, UI, generator, and this runbook.

## Prerequisites

- `REPLICATE_API_TOKEN` — card process videos (Kling 2.5)
- `OPENAI_API_KEY` — Premium+ deliverable segments (Sora 2 Pro)
- Optional: `ffmpeg` on the host — stitches multi-segment Premium+ deliverables (~30–45s)

## Generate marketing card assets

From `apps/web-main`:

```bash
pnpm run generate:card-media --scope=product
pnpm run generate:card-media --scope=home
```

Dry run (no API spend):

```bash
pnpm run generate:card-media --dry-run
```

Fallback sync (stock photos + home stock video, no AI):

```bash
pnpm run sync:card-media-fallbacks --scope=all --with-videos
```

Commit updated `public/media/manifest.json` and `public/media/service-*` after generation.

## Manual QA — website cards

| Check | Where |
|-------|--------|
| Process video loops on hover / in-view | Homepage journey circles (`CircularServiceCard`) |
| Before / After toggle on kitchen, bath, garden | `/gallery`, `/services/kitchen`, `/services/bathroom`, `/services/garden` |
| Photo-only cards (permits) | Home `permits` circle, product if `permits-static` |
| Manifest loads | Network: `GET /api/marketing/card-media` |

## Manual QA — customer deliverables

1. Complete a **Premium** intake (tier 2) for kitchen or bath.
2. Confirm `POST /api/concept/video` returns `videoKind: "process"` with segment list.
3. Poll `GET /api/concept/video?intakeId=…` until `status: "completed"`.
4. Owner portal deliverables page plays `conceptVideo.outputUrl` (not placeholder).
5. Repeat with **Premium+** (tier 3) for addition or new-construction — expect more segments; stitched MP4 if ffmpeg present, else last segment URL.

## Provider rules (do not change without product sign-off)

| Surface | Provider |
|---------|----------|
| Marketing card loops | Kling 2.5 (`generateCardProcessVideo`) |
| Premium deliverable | Kling 2.5, up to 3 segments |
| Premium+ deliverable | Sora 2 Pro, up to 6 segments + optional ffmpeg stitch |

Prices and tier defaults: `packages/core-rules/src/pricing.ts` (`TIER_VIDEO_DEFAULTS`).

## Known limitations

- Card generation is sequential and API-heavy; run per scope, not full catalog in CI.
- Without ffmpeg, Premium+ deliverables expose the final segment URL only (not full 30–45s stitch).
- All imagery is AI-generated until real jobsite media replaces manifest entries.
