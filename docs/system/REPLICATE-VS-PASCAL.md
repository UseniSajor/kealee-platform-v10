# Replicate vs Pascal — verified architecture (2026-05)

## Summary

| Layer | Technology | Role |
|-------|------------|------|
| **2D design / floor plans** | **Pascal** (`@kealee/pascal-wrapper`) | Interactive editor, scene geometry, autosave to `pascal_scenes` |
| **AI photorealistic renders** | **Replicate** (Flux via `REPLICATE_API_TOKEN`) | All image generation — not Pascal |

Pascal does **not** generate AI images. Replicate does **not** replace the Pascal editor.

## Replicate (image generation)

- **Library:** `apps/web-main/lib/ai-image.ts` → Replicate Flux 1.1 Pro Ultra / Pro / Recraft
- **Concept packages (v20):** `apps/web-main/app/api/concept/generate/route.ts` → `generateImages()`
- **Pascal editor renders:** `POST /api/editor/renders` → queues Replicate jobs → `pascal_render_jobs` table
- **Worker:** `services/worker/concept-engine.processor.ts` (Flux Ultra)
- **v30 DesignBot:** `POST /api/v30/renders` — image prompts from DesignBot → Replicate (same stack)

**Required env:** `REPLICATE_API_TOKEN` on web-main (and worker if using concept-engine).

## Pascal (design studio)

- **Routes:** `/editor/[sceneId]`, `/api/editor/scenes`, `/api/editor/scenes/[id]`
- **Storage:** Supabase `pascal_scenes`, `pascal_render_jobs` (job metadata only; URLs from Replicate)
- **Concept intake link:** `concept/generate` may read Pascal geometry from `pascal_scenes` to enrich Claude prompt (optional context)

## v30 flow

1. DesignBot (Claude) → JSON with `imagePrompts[]` per concept  
2. `queueV30DesignRenders` → Replicate via `generateImages`  
3. URLs stored on intake `form_data.v30RenderUrls` and `conceptOutput.renderUrls`  
4. Customer sees renders in workspace + concept portal (not Pascal unless they open editor separately)

## Verification commands

```bash
# Replicate configured
grep REPLICATE_API_TOKEN apps/web-main/.env.local

# Smoke (v30 + API)
pnpm v30:setup-check
pnpm v30:smoke
```
