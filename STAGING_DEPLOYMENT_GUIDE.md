# Staging Deployment Guide — Hero Video Carousel & Tier Testing

**Date**: 2026-07-03  
**Status**: Ready for deployment  
**Commit**: `6d4530fe` feat: add hero video carousel and comprehensive tier testing

---

## 📋 Pre-Deployment Checklist

### Phase 1: Video Generation (Parallel)

These steps can be done while building:

- [ ] **Option A: Manual Replicate Generation** (Recommended for first deployment)
  1. Go to: https://replicate.com/kling-ai/kling-video
  2. Click "Run"
  3. Use prompts from `apps/web-main/HERO_VIDEO_SETUP.md` (Section: "Example Replicate Prompt")
  4. Generate 3 videos:
     - Kitchen transformation (8s, 4K, 16:9)
     - Home addition construction (8s, 4K, 16:9)
     - Garden landscape (8s, 4K, 16:9)
  5. Save output URLs

- [ ] **Option B: Via API** (if account has Replicate API access)
  ```bash
  REPLICATE_API_TOKEN=<your-token> node generate-hero-videos-v2.js
  ```
  Note: Requires current Kling model version (check replicate.com)

### Phase 2: CDN Upload

Once videos are generated:

- [ ] **Upload to CDN** (Cloudflare, AWS S3, or similar)
  - Kitchen video → `https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4`
  - Addition video → `https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4`
  - Garden video → `https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4`

- [ ] **Verify CORS headers** (CDN must allow cross-origin video playback)
  - Allow-Origin: `https://staging.kealee.com`
  - Allow-Origin: `https://kealee.com`

- [ ] **Test video URLs** (ensure they're publicly accessible)
  ```bash
  curl -I https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
  # Should return: HTTP 200 OK
  ```

### Phase 3: Environment Configuration

- [ ] **Update Vercel environment variables** (Staging)
  ```
  NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
  NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4
  NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4
  ```

- [ ] **Verify local .env.local** has placeholder URLs
  ```bash
  grep NEXT_PUBLIC_HERO_VIDEO apps/web-main/.env.local
  ```

### Phase 4: Build & Test Locally

- [ ] **Install dependencies**
  ```bash
  cd \\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10
  pnpm install
  ```

- [ ] **Run tier verification**
  ```bash
  cd apps/web-main
  node __tests__/verify-tiers.js
  ```
  Expected: ✅ ALL TIER TESTS PASSED

- [ ] **Build web-main**
  ```bash
  pnpm turbo run build --filter=web-main
  ```

- [ ] **Start dev server** (if possible)
  ```bash
  cd apps/web-main
  npm run dev  # or: next dev
  ```

- [ ] **Manual browser test** (http://localhost:3000)
  - [ ] Hero carousel displays
  - [ ] Videos autoplay muted
  - [ ] Carousel rotates every 8 seconds
  - [ ] Previous/next buttons work
  - [ ] Dot indicators clickable
  - [ ] Heading updates with each video

### Phase 5: Deploy to Staging

- [ ] **Trigger Vercel deployment** (Staging environment)
  ```bash
  # Commit and push (already done)
  # OR manually trigger in Vercel dashboard
  ```

- [ ] **Wait for deployment** (typically 2-5 minutes)

- [ ] **Verify deployment** (check Vercel dashboard)
  - [ ] Build succeeded
  - [ ] Deployment status: "Ready"

### Phase 6: Staging Testing

#### A. Hero Carousel Functionality

- [ ] **Visual display**
  - [ ] Hero section loads without errors
  - [ ] Video poster images display as fallback
  - [ ] All 3 projects visible (Kitchen, Addition, Garden)

- [ ] **Auto-rotation**
  - [ ] Videos change every 8 seconds automatically
  - [ ] Heading text updates (e.g., "Kitchen Remodel" → "Home Addition")
  - [ ] Description text updates

- [ ] **Manual navigation**
  - [ ] Left arrow (◀) changes to previous video
  - [ ] Right arrow (▶) changes to next video
  - [ ] Dot indicators highlight current video
  - [ ] Clicking dot jumps to that video
  - [ ] Auto-rotate pauses when user interacts

- [ ] **Video playback**
  - [ ] Videos autoplay muted on load
  - [ ] Sound icon shows muted state
  - [ ] Videos loop seamlessly
  - [ ] No console errors

- [ ] **Responsive design**
  - [ ] Test on mobile (320px)
  - [ ] Test on tablet (768px)
  - [ ] Test on desktop (1920px)
  - [ ] All controls visible and clickable

#### B. Intake Tier Selection (Kitchen Remodel)

- [ ] **Navigate to intake**
  - [ ] Go to: https://staging.kealee.com/services/kitchen
  - [ ] Click "Get Your Design Package"
  - [ ] Should reach tier selection page

- [ ] **Verify Tier 1 (Basic)**
  - [ ] Label: "Kitchen Design Package — Basic"
  - [ ] Price: $149
  - [ ] Badge: None
  - [ ] Delivery: "3–5 days"

- [ ] **Verify Tier 2 (Premium)**
  - [ ] Label: "Kitchen Design Package — Premium"
  - [ ] Price: $699
  - [ ] Badge: "Popular" (visible)
  - [ ] Includes: "60s AI transformation video"
  - [ ] Delivery: "3–5 days"

- [ ] **Verify Tier 3 (Premium+)**
  - [ ] Label: "Kitchen Design Package — Premium+"
  - [ ] Price: $1,299
  - [ ] Badge: "Best Value" (visible)
  - [ ] Includes: "60s full version (YouTube/email)", "30s mobile version", etc.
  - [ ] Delivery: "3–5 days"

- [ ] **Select each tier and verify**
  - [ ] Order summary updates price
  - [ ] Stripe checkout reflects correct amount

#### C. Intake Tier Selection (Garden Concept)

- [ ] **Garden tier prices**
  - [ ] Tier 1: $99 ✓
  - [ ] Tier 2: $399 with video badge ✓
  - [ ] Tier 3: $799 with 4K video ✓

#### D. Intake Tier Selection (Home Addition)

- [ ] **Addition tier prices**
  - [ ] Tier 1: $199 ✓
  - [ ] Tier 2: $799 ✓
  - [ ] Tier 3: $1,499 ✓

#### E. Analytics & Performance

- [ ] **Check browser console** for errors
  - [ ] No 404s for video URLs
  - [ ] No CORS errors
  - [ ] No TypeScript errors

- [ ] **Lighthouse audit**
  - [ ] Performance > 80
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90

- [ ] **Network tab** (DevTools)
  - [ ] Video files load (check size, duration)
  - [ ] Videos are streaming (HTTP 206 Partial Content)
  - [ ] No failed requests

### Phase 7: Production Deployment (When Ready)

- [ ] **Repeat staging tests** on production environment
- [ ] **Monitor for 24 hours**
  - [ ] Error rates stable
  - [ ] Video engagement metrics tracking
  - [ ] No user complaints
- [ ] **Rollback plan** ready (if needed)

---

## 🎥 Video Generation Command Reference

### Replicate Web UI (Easiest)
1. Go to: https://replicate.com/kling-ai/kling-video
2. Paste prompt from `HERO_VIDEO_SETUP.md`
3. Set: Duration = 8, Aspect = 16:9, Quality = 4K
4. Click "Run"
5. Wait for video URL in output

### Replicate API (Programmatic)
```bash
# First, check latest Kling version
curl https://api.replicate.com/v1/models/kling-ai/kling-video \
  -H "Authorization: Token $REPLICATE_API_TOKEN"

# Get version ID from: latest_version.id
# Then run generation script with that version
REPLICATE_API_TOKEN=<token> node generate-hero-videos-v2.js
```

### CDN Upload Examples

**AWS S3:**
```bash
aws s3 cp kitchen-hero.mp4 s3://kealee-cdn/hero-videos/kitchen-transformation-v1.mp4 \
  --region us-east-1 \
  --acl public-read \
  --content-type video/mp4
```

**Cloudflare R2:**
```bash
rclone copy kitchen-hero.mp4 r2:kealee-cdn/hero-videos/kitchen-transformation-v1.mp4
```

---

## 📊 Success Criteria

### Build
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ All tier pricing loads correctly

### Hero Carousel
- ✅ Videos autoplay and rotate
- ✅ Manual navigation works
- ✅ Responsive on all screen sizes
- ✅ No video playback errors

### Intake Tiers
- ✅ All 3 tiers display for each service
- ✅ Prices match configured amounts
- ✅ Badges show correctly
- ✅ Stripe checkout shows correct price

### Performance
- ✅ Lighthouse score > 80
- ✅ Page load time < 3 seconds
- ✅ Video load time < 2 seconds (with CDN)

---

## 🔧 Troubleshooting

### Hero videos don't play
- [ ] Check video URLs in `.env.local`
- [ ] Verify videos exist on CDN
- [ ] Check CORS headers (DevTools → Network)
- [ ] Try direct URL in browser

### Videos pause instead of autoplay
- [ ] Browser autoplay policy: videos must be muted (✅ we are)
- [ ] Check browser permissions (Settings → Cookies and site permissions)
- [ ] Try incognito mode to test

### Tier prices show $0
- [ ] Check if `INTAKE_TIER_PRICE_CENTS` imported correctly
- [ ] Verify `@kealee/core-rules` package built successfully
- [ ] Check browser console for import errors

### Build fails
- [ ] Run: `pnpm install`
- [ ] Run: `pnpm turbo run build --filter=@kealee/core-rules`
- [ ] Check `apps/web-main/components/HomeHero.tsx` for syntax errors

---

## 📞 Support & Escalation

| Issue | Who to Contact | Channel |
|-------|---------------|---------|
| Video generation problems | Replicate team | help@replicate.com |
| CDN/video delivery | Infrastructure team | #infrastructure Slack |
| Tier pricing issues | Backend team | #backend Slack |
| Frontend carousel bugs | Frontend team | #frontend Slack |

---

## 📝 Deployment Notes

- **Commit**: `6d4530fe`
- **Branch**: `main`
- **Tests passing**: ✅ Tier verification script
- **Code review**: Ready for approval
- **Estimated deployment time**: 10-15 minutes
- **Estimated staging test time**: 30-45 minutes
- **Rollback time**: < 2 minutes (revert commit and redeploy)

---

**Last Updated**: 2026-07-03  
**Prepared By**: Claude Code  
**Status**: Ready for staging deployment 🚀
