# Hero Video Carousel Setup

## Overview

The web-main homepage hero section now features a **dynamic video carousel** showcasing three different project types:

1. **Kitchen Remodel** — Before/after kitchen transformation
2. **Home Addition** — New construction with professional rendering  
3. **Garden & Landscaping** — Outdoor living space transformation

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# Hero video URLs (AI-generated showcases)
# Generated via Replicate Kling 2.5 API
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://...cdn-url.../kitchen-hero.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://...cdn-url.../addition-hero.mp4
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://...cdn-url.../garden-hero.mp4
```

### Video Generation via Replicate

Each hero video should be:
- **Duration**: 8–10 seconds (auto-rotates every 8s)
- **Format**: MP4, H.264 codec, max 4K (3840×2160)
- **Framerate**: 30fps
- **File size**: < 10MB for CDN optimization

#### Example Replicate Prompt (Kling 2.5)

```typescript
// Kitchen transformation: modern kitchen renovation
const kitchenPrompt = {
  prompt: `Professional 4K video showing a kitchen transformation. Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s tile. After: modern contemporary kitchen with white shaker cabinets, stainless steel appliances, waterfall island, LED lighting. Show quick transitions and professional zoom-in shots. Include person touching counter or opening cabinet for scale. Shot in natural daylight from kitchen window. Duration: 8 seconds.`,
  duration: 8,
  aspect_ratio: '16:9',
  quality: '4k',
}

// Home addition: new living space
const additionPrompt = {
  prompt: `Professional construction progress video showing a home addition. Scene: 2-story house with new master suite addition on the side. Show framing phase, electrical rough-in, drywall installation, and final walkthrough. Include construction crew in hard hats, close-ups of quality work, and time-lapse of finishing. Sunny day, clear skies. Duration: 8 seconds.`,
  duration: 8,
  aspect_ratio: '16:9',
  quality: '4k',
}

// Garden: landscape design
const gardenPrompt = {
  prompt: `Beautiful garden transformation video. Before: basic backyard with bare lawn and wooden fence. After: lush landscape design with curved flower beds, mature plantings, hardscape patio with seating, ambient lighting. Show multiple angles: wide shot of entire garden, close-ups of plants and flowers, evening ambiance with garden lights. Professional cinematography. Duration: 8 seconds.`,
  duration: 8,
  aspect_ratio: '16:9',
  quality: '4k',
}
```

## Component Details

### HomeHero.tsx

**Features:**
- Auto-rotating carousel (8-second intervals)
- Manual navigation with previous/next buttons (left/right arrow icons)
- Dot indicators at bottom (clickable to jump to specific video)
- Dynamic headings that update with each video
- Responsive design (mobile-optimized)
- Fallback poster images (Unsplash) if video URL is empty

**Video State Management:**
```typescript
interface HeroVideo {
  src: string              // Video URL from env
  poster: string           // Fallback placeholder image
  label: string           // e.g., "Kitchen Remodel"
  description: string     // Custom text per project type
}

// Three-video carousel automatically rotates
const heroVideos: HeroVideo[] = [
  { src: process.env.NEXT_PUBLIC_HERO_VIDEO_KITCHEN, ... },
  { src: process.env.NEXT_PUBLIC_HERO_VIDEO_ADDITION, ... },
  { src: process.env.NEXT_PUBLIC_HERO_VIDEO_GARDEN, ... },
]
```

**Auto-rotate logic:**
- Starts automatically on page load
- Pauses when user clicks carousel controls (prev/next buttons or dot indicators)
- Resumes after 10 seconds of inactivity
- Video plays muted (autoplay requirement)

## Testing

### Tier Configuration Tests

Run the tier verification script:
```bash
cd apps/web-main
node __tests__/verify-tiers.js
```

Expected output:
```
=============================================================
🧪 INTAKE TIER VERIFICATION TEST
=============================================================

📦 Kitchen Remodel
   ✅ Tier 1 (Basic): $149.00 — 3–5 days
   ✅ Tier 2 (Premium): $699.00 — 3–5 days
   ✅ Tier 3 (Premium+): $1,299.00 — 3–5 days

📦 Bathroom Remodel
   ✅ Tier 1 (Basic): $129.00 — 2–4 days
   ✅ Tier 2 (Premium): $549.00 — 2–4 days
   ✅ Tier 3 (Premium+): $999.00 — 2–4 days

...
=============================================================
✅ ALL TIER TESTS PASSED
=============================================================
```

### Manual Browser Testing

1. **Homepage hero display:**
   - [ ] All 3 videos should display in carousel
   - [ ] Auto-rotation works every 8 seconds
   - [ ] Previous/next arrows change videos
   - [ ] Dot indicators at bottom are clickable
   - [ ] Heading and description update with each video
   - [ ] Videos play muted on load (autoplay policy compliance)

2. **Intake flow — kitchen_remodel:**
   - [ ] Tier 1 option shows ($149) with "Basic" label
   - [ ] Tier 2 option shows ($699) with "Premium" label and "Popular" badge
   - [ ] Tier 3 option shows ($1,299) with "Premium+" label and "Best Value" badge
   - [ ] Selecting each tier updates price in order summary
   - [ ] Stripe checkout shows correct amount

3. **Intake flow — garden_concept:**
   - [ ] Tier 1: $99
   - [ ] Tier 2: $399 with video badge
   - [ ] Tier 3: $799 with 4K video deliverables
   - [ ] All tiers have correct delivery days

4. **Intake flow — addition_expansion:**
   - [ ] Tier 1: $199
   - [ ] Tier 2: $799
   - [ ] Tier 3: $1,499
   - [ ] Pricing logic works across all project types

## Troubleshooting

### Video doesn't play on homepage

1. Check if `NEXT_PUBLIC_HERO_VIDEO_*` env vars are set
2. Verify video URLs are public CDN links (not private)
3. Test video URLs directly in browser (check CORS headers)
4. Fallback poster image should display if video fails to load

### Tier pricing not updating on intake form

1. Verify `INTAKE_TIER_PRICE_CENTS` is imported from `@kealee/core-rules`
2. Check that `[projectPath]` matches intake route (e.g., `kitchen_remodel`)
3. Ensure Stripe price IDs match tier prices in checkout API
4. Run `node __tests__/verify-tiers.js` to validate configuration

## Deliverables by Tier

### Tier 1: Basic
- 3 AI-rendered concept images
- Cost summary with material breakdown
- Bill of Materials (basic)
- Permit scope brief
- Zoning & building code overview
- **Delivery**: 3–5 days

### Tier 2: Premium
- 6 AI-rendered concept images (day/night/seasonal)
- 60-second AI transformation video
- Professional voiceover narration
- HD downloadable MP4 + shareable link
- Full Bill of Materials with line-item costs
- MEP specifications
- 3D floor plan mockup
- **Delivery**: 3–5 days
- **Badge**: Popular

### Tier 3: Premium+
- 12 AI-rendered concept images (high variation)
- Full 60-second HD/4K video
- 30-second mobile version (Instagram/Facebook)
- 15-second short clip (TikTok/Reels)
- 10-second social preview
- 3 different music variations
- CAD floorplan export (DWG)
- 3D interactive walkthrough preview
- Professional consultation call
- **Delivery**: 3–5 days
- **Badge**: Best Value

## Related Files

- `apps/web-main/components/HomeHero.tsx` — Hero component with carousel
- `apps/web-main/.env.local` — Environment variables
- `packages/core-rules/src/pricing.ts` — Tier pricing source of truth
- `apps/web-main/lib/services-config.ts` — Service tier definitions
- `apps/web-main/__tests__/intake-tiers.test.ts` — Jest test suite
- `apps/web-main/__tests__/verify-tiers.js` — Verification script

## Video Generation Script (Reference)

```typescript
// packages/api/src/routes/video/generate-hero-video.ts
async function generateHeroVideo(projectType: 'kitchen' | 'addition' | 'garden') {
  const prompt = getHeroVideoPrompt(projectType);
  
  const prediction = await replicate.predictions.create({
    version: 'kling-2.5',
    input: {
      prompt,
      duration: 8,
      aspect_ratio: '16:9',
      quality: '4k',
    },
  });

  // Poll for completion...
  const completed = await replicate.wait(prediction);
  
  // Upload to CDN
  const videoUrl = await uploadToCDN(completed.output.video);
  
  // Update environment
  await updateEnvVar(
    `NEXT_PUBLIC_HERO_VIDEO_${projectType.toUpperCase()}`,
    videoUrl
  );
}
```
