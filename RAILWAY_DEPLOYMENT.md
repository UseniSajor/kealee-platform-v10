# Railway Deployment Guide — Hero Video Carousel

**Platform**: Railway (not Vercel)  
**App**: kealee-platform-v10  
**Status**: Ready for deployment  

---

## Step-by-Step Deployment

### Step 1: Generate Hero Videos (15-20 min)

**Method**: Manual via Replicate Web UI (Easiest)

1. Go to: https://replicate.com/kling-ai/kling-video
2. Click "Run"
3. Paste prompts from `REPLICATE_VIDEO_GENERATION.md`:

**Video 1 — Kitchen**
```
Professional 4K video showing a modern kitchen transformation. 
Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s ceramic tile. 
After: contemporary kitchen with white shaker cabinets, stainless steel appliances, waterfall marble island, LED lighting. 
Show quick transitions with zoom shots. Include person touching counter for scale. Daylight from window. High quality cinematography. 8 seconds.
```

**Video 2 — Addition**
```
Professional construction progress video showing home addition project. 
2-story house with new master suite addition on side. 
Show: site prep, wood framing, electrical rough-in, drywall, painting, flooring, final walkthrough. 
Include construction workers, close-ups of quality craftsmanship. 
Sunny day, clear skies. Time-lapse elements. 8 seconds.
```

**Video 3 — Garden**
```
Beautiful garden landscape transformation video. 
Before: bare backyard, old wooden fence. 
After: lush garden design with curved planting beds, flowering plants, hardscape patio with seating, decorative pathways, ambient landscape lighting. 
Multiple angles: wide garden shot, close flower details, evening lighting. 
Professional cinematography. 8 seconds.
```

4. Set parameters:
   - Duration: 8
   - Aspect ratio: 16:9
   - Quality: 4K (if available)

5. Click "Run" and wait (2-5 minutes per video)

6. Copy output video URLs when complete

**Expected URLs format**:
```
https://replicate.delivery/[id1]/kitchen-video.mp4
https://replicate.delivery/[id2]/addition-video.mp4
https://replicate.delivery/[id3]/garden-video.mp4
```

---

### Step 2: Upload to CDN (10-20 min)

**Option A: AWS S3** (Recommended for production)

```bash
# Prerequisites: AWS CLI configured with credentials

# Kitchen video
aws s3 cp kitchen-transformation.mp4 s3://kealee-cdn/hero-videos/kitchen-transformation-v1.mp4 \
  --region us-east-1 \
  --acl public-read \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"

# Addition video
aws s3 cp addition-construction.mp4 s3://kealee-cdn/hero-videos/addition-construction-v1.mp4 \
  --region us-east-1 \
  --acl public-read \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"

# Garden video
aws s3 cp garden-landscape.mp4 s3://kealee-cdn/hero-videos/garden-landscape-v1.mp4 \
  --region us-east-1 \
  --acl public-read \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"
```

**Option B: Cloudflare R2**

```bash
# Prerequisites: rclone configured for R2

rclone copy kitchen-transformation.mp4 r2:kealee-cdn/hero-videos/kitchen-transformation-v1.mp4
rclone copy addition-construction.mp4 r2:kealee-cdn/hero-videos/addition-construction-v1.mp4
rclone copy garden-landscape.mp4 r2:kealee-cdn/hero-videos/garden-landscape-v1.mp4
```

**Resulting CDN URLs**:
```
https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4
https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4
```

**Verify URLs are accessible**:
```bash
curl -I https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
# Should return: HTTP 200 OK
```

---

### Step 3: Update Railway Environment Variables (2-5 min)

1. Go to: https://railway.app/dashboard
2. Select project: `kealee-platform-v10`
3. Go to: **Settings** → **Environment**
4. For **Preview** environment:
   - Add variables:
     ```
     NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
     NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4
     NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4
     ```

5. For **Production** environment:
   - Add same variables (identical CDN URLs)

6. Click "Save"

7. Railway automatically triggers deployment

**Verify deployment**:
```
- Navigate to staging: https://staging.kealee.com
- Should see: Hero carousel with videos
- Videos should: Autoplay muted, rotate every 8s
```

---

### Step 4: Testing on Staging (30-45 min)

Use checklist from `STAGING_DEPLOYMENT_GUIDE.md`:

**Hero Carousel Tests** (8 items)
- [ ] Videos display in carousel
- [ ] Auto-rotation works every 8 seconds
- [ ] Previous/next buttons change videos
- [ ] Dot indicators are clickable
- [ ] Heading text updates with each video
- [ ] Description text updates
- [ ] Videos autoplay muted
- [ ] No console errors

**Intake Tier Tests** (12 items)
- [ ] Kitchen Tier 1: $149 (Basic)
- [ ] Kitchen Tier 2: $699 (Premium, with "Popular" badge)
- [ ] Kitchen Tier 3: $1,299 (Premium+, with "Best Value" badge)
- [ ] Garden Tier 1: $99
- [ ] Garden Tier 2: $399 (with video badge)
- [ ] Garden Tier 3: $799 (with 4K video)
- [ ] Addition Tier 1: $199
- [ ] Addition Tier 2: $799
- [ ] Addition Tier 3: $1,499
- [ ] Selecting tier updates order summary
- [ ] Stripe checkout shows correct price
- [ ] No pricing errors

**Performance Tests** (4 items)
- [ ] Hero loads in < 1 second
- [ ] Videos stream without buffering
- [ ] Lighthouse score > 80
- [ ] No 404 errors for video URLs

**Browser DevTools** (3 items)
- [ ] Network tab: Videos load (HTTP 200)
- [ ] Console: No errors or warnings
- [ ] Elements: Hero markup is clean

---

### Step 5: Production Deployment (When Ready)

**Prerequisites**:
- ✅ All staging tests pass
- ✅ Videos confirmed working
- ✅ Team approval obtained

**Steps**:
1. Railway auto-deploys to production when env vars are set
2. Verify production URLs are live:
   ```bash
   curl -I https://kealee.com
   # Should show hero carousel
   ```

3. Monitor for 24 hours:
   - Error rates stable
   - Video playback smooth
   - No user complaints

4. Rollback plan (if needed):
   ```
   Revert env vars in Railway
   Trigger manual redeploy
   Rollback time: < 5 minutes
   ```

---

## Troubleshooting

### Videos don't play on staging

**Check**:
1. Video URLs in Railway env vars are correct
2. Videos exist on CDN (test with curl)
3. CORS headers allow video playback
4. Browser autoplay settings not blocking

**Fix**:
```bash
# Test CDN video
curl -I https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4

# Check CORS headers
curl -I -H "Origin: https://staging.kealee.com" https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
# Should see: Access-Control-Allow-Origin header
```

### Tier pricing shows $0

1. Verify `@kealee/core-rules` built successfully
2. Check browser console for import errors
3. Reload page with hard refresh (Ctrl+Shift+R)

### Build fails after env var update

1. Go to Railway: **Settings** → **Build**
2. Trigger manual rebuild: **Deploy**
3. Check logs for errors

---

## Railway Configuration Checklist

- [ ] Project: `kealee-platform-v10` selected
- [ ] Environment: Preview configured with video URLs
- [ ] Environment: Production configured with video URLs
- [ ] Deployment: Automatic on env var change enabled
- [ ] Logs: No errors after deployment
- [ ] Staging: Videos playing
- [ ] Staging: Tiers displaying correctly

---

## Timeline

| Step | Time | Owner |
|------|------|-------|
| Generate videos | 15-20 min | User |
| Upload to CDN | 10-20 min | User |
| Update Railway env | 2-5 min | User |
| Test staging | 30-45 min | QA |
| **Total** | **60-90 min** | |

---

## Success Criteria

✅ Hero carousel displays on staging  
✅ All 3 videos autoplay and rotate  
✅ Manual navigation works  
✅ All 3 tiers show for each service  
✅ Pricing is correct ($99–$1,499)  
✅ No console errors  
✅ No 404s for video URLs  
✅ Lighthouse score > 80  

---

## Next Steps

1. ✅ Generate videos (manual)
2. ✅ Upload to CDN (manual)
3. ✅ Update Railway (manual)
4. ⏳ Test staging (QA)
5. ⏳ Deploy to production (when ready)

**Status**: Ready to proceed with step 1! 🚀
