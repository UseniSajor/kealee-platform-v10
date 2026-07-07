# Marketing card media

Generated assets for **homepage service cards** and **product/service pages**.

## Quick start (photos + stock videos for home cards)

```bash
cd apps/web-main
pnpm run sync:card-media:home
```

Writes:

- `service-photos/home-{design|permits|estimate|build}.jpg`
- `service-videos/home-{design|estimate|build}-video.mp4`
- Legacy aliases: `design-concepts.mp4`, `cost-estimation.mp4`, `build-manage.mp4`
- `manifest.json` with `videoUrl` / `videoWebM` for video cards

## Full AI generate (requires keys in `.env.local`)

```bash
pnpm run generate:card-media -- --scope=home
pnpm run generate:card-media -- --scope=product
pnpm run generate:card-media -- --scope=all --skip-video   # images only (faster)
```

Requires:

- `OPENAI_API_KEY` and/or `REPLICATE_API_TOKEN` — images
- Optional: video providers via `lib/ai-video.ts` (Sora/Veo/Kling) when not using `--skip-video`
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — cloud storage (optional; saves to `public/media/` if missing)
- `ANTHROPIC_API_KEY` — MarketingBot prompt refinement

Pipeline:

1. **MarketingBot** (Claude) refines image prompts
2. **Design engine** — DALL-E 3 square images (Replicate SDXL fallback)
3. **Concept video engine** — img2video via Sora/Veo/Kling (`lib/ai-video.ts`)
4. Upload to Supabase bucket `marketing-media` or `public/media/`
5. Manifest written to `public/media/manifest.json`

## Manual drops

| Path | Use |
|------|-----|
| `service-photos/home-design.jpg` | design card photo |
| `service-videos/home-design-video.mp4` | design card video |
| `service-videos/design-concepts.mp4` | Legacy alias (optional) |

Homepage merges manifest in `app/page.tsx` via `mergeHomeServicesWithManifest()`.
