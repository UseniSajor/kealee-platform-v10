# Marketing card media

Generated assets for **homepage service cards** and **product/service pages**.

## Quick start (already run if manifest.json exists)

```bash
cd apps/web-main
pnpm run setup:card-media          # sync fallbacks OR full AI if keys set
```

## Full AI generate (requires keys in `.env.local`)

```bash
# OPENAI_API_KEY and/or REPLICATE_API_TOKEN — images
# NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — cloud storage (optional; saves to public/media/ if missing)
# ANTHROPIC_API_KEY — MarketingBot prompt refinement
pnpm run generate:card-media -- --scope=home
pnpm run generate:card-media -- --scope=product
pnpm run generate:card-media -- --scope=all --skip-video   # images only (faster)
```

Or POST to `/api/marketing/card-media/generate` with header `x-cron-secret: $CRON_SECRET`.

Pipeline:

1. **MarketingBot** (Claude) refines image prompts  
2. **Design engine** — DALL-E 3 square images (Replicate SDXL fallback)  
3. **Concept video engine** — img2video via Sora/Veo/Kling (`lib/ai-video.ts`)  
4. Upload to Supabase bucket `marketing-media`  
5. Manifest written to `public/media/manifest.json`

## Manual drops

Legacy paths under `service-videos/` and `service-photos/` still work as fallbacks in `home-services-data.ts` until manifest entries exist.
