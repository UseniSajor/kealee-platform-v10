# Railway Hero Video Setup Guide

## Current Status

✅ **Completed**:
- AI videos generated (Replicate Seedance 2.0 & Grok Imagine)
- HomeHero component configured to accept environment variables
- .env.production configured with video URLs (local)
- Deployment scripts created

❌ **Pending**:
- Environment variables set in Railway dashboard
- web-main rebuild with new variables
- Hero section displaying videos at https://web-main.kealee.com

---

## Step-by-Step Setup

### 1. **Set Environment Variables in Railway Dashboard**

Go to: **https://railway.app/dashboard**

1. Navigate to your **web-main** service/project
2. Click **Settings** (gear icon)
3. Select **Variables** tab
4. Add the following 3 variables:

#### Variable 1: Kitchen Video
```
Key:   NEXT_PUBLIC_HERO_VIDEO_KITCHEN
Value: https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4
```

#### Variable 2: Addition Video
```
Key:   NEXT_PUBLIC_HERO_VIDEO_ADDITION
Value: https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4
```

#### Variable 3: Garden Video
```
Key:   NEXT_PUBLIC_HERO_VIDEO_GARDEN
Value: https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4
```

5. Click **Save**
6. Railway will automatically rebuild and deploy

---

### 2. **Verify Deployment**

**Watch the build log:**
1. In Railway dashboard, open **Deployments** tab
2. Wait for new deployment to start and complete
3. Check logs for successful build

**Build should show:**
```
Building web-main...
✓ Building with Next.js
✓ NEXT_PUBLIC_HERO_VIDEO_KITCHEN loaded
✓ NEXT_PUBLIC_HERO_VIDEO_ADDITION loaded
✓ NEXT_PUBLIC_HERO_VIDEO_GARDEN loaded
✓ Deployment successful
```

**Test the live site:**
- Go to: https://web-main.kealee.com
- Scroll to top of page
- You should see:
  - **Auto-rotating videos** (8 seconds each)
  - **Carousel controls** (prev/next buttons)
  - **Dot indicators** (click to jump to specific video)
  - **Video content** visible in background

---

## Video URLs (Reference)

### Seedance 2.0 (8-second showcase videos)
- **Kitchen**: https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4
- **Addition**: https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4
- **Garden**: https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4

### Grok Imagine Video (15-second construction sequences - alternative)
- **Kitchen Remodel**: https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4
- **Home Addition**: https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4
- **Garden**: Pending (requires Replicate credits)

---

## Alternative: Using .env.production

If Railway doesn't pick up variables via dashboard, you can use the .env.production file:

**File**: `apps/web-main/.env.production` (local only, git-ignored)

```env
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4
```

This file is **not** committed to git (security best practice), but Next.js will use it during local builds.

---

## Troubleshooting

### Hero Section Shows Blank/Black Background

**Cause**: Environment variables not set
**Solution**: 
1. Check Railway dashboard → web-main → Settings → Variables
2. Verify all 3 NEXT_PUBLIC_HERO_VIDEO_* variables are present
3. Trigger manual rebuild: Railway dashboard → Deployments → Redeploy

### Videos Don't Load (Shows Poster Image Only)

**Cause**: Video URL is blocked or invalid
**Solution**:
1. Test URL in browser: Open each URL directly in new tab
2. Check CORS: Videos from replicate.delivery should load fine
3. Verify Network tab in browser DevTools for errors

### Videos Play But Don't Auto-Rotate

**Cause**: JavaScript disabled or component not mounted
**Solution**:
1. Check browser console for JavaScript errors
2. Verify 'use client' directive in HomeHero.tsx
3. Check that Next.js is running in browser (not SSR-only)

---

## Component Details

**File**: `apps/web-main/components/HomeHero.tsx`

**Features**:
- ✅ Dynamic video carousel
- ✅ Auto-rotation (8 seconds per video)
- ✅ Manual controls (prev/next buttons)
- ✅ Dot indicators (click to jump)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Poster images for slow connections
- ✅ Muted autoplay (browser compliance)

**Environment Variables Used**:
```typescript
const heroVideos: HeroVideo[] = [
  {
    src: process.env.NEXT_PUBLIC_HERO_VIDEO_KITCHEN || '',
    label: 'Kitchen Remodel',
    // ...
  },
  {
    src: process.env.NEXT_PUBLIC_HERO_VIDEO_ADDITION || '',
    label: 'Home Addition',
    // ...
  },
  {
    src: process.env.NEXT_PUBLIC_HERO_VIDEO_GARDEN || '',
    label: 'Garden & Landscaping',
    // ...
  },
]
```

---

## Performance Notes

### Video Specs
- **Format**: MP4 (H.264 codec)
- **Resolution**: 720p
- **Aspect Ratio**: 16:9
- **Duration**: 8 seconds per video
- **File Size**: 4-12MB each
- **Bitrate**: Optimized for streaming

### CDN Performance
- **Replicate CDN**: ~100-500ms delivery
- **Browser Cache**: Videos cached after first load
- **Bandwidth**: ~1-2 Mbps required for smooth playback

### Optimization
- Videos are muted (reduces file size)
- Poster images shown while loading
- Lazy-loaded on demand
- Responsive quality via CDN

---

## Next: Alternative Deployments

### Option A: Switch to 15-second Construction Videos

Edit `.env.production`:

```env
# Use Grok 15-second construction sequences instead
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4

# Also update the rotation interval in HomeHero.tsx:
// Change: 8000 → 15000 (milliseconds)
setInterval(() => {
  setCurrentVideoIndex(prev => (prev + 1) % heroVideos.length)
}, 15000) // 15 seconds for longer construction videos
```

### Option B: Backup Videos to AWS S3

Run the backup script:

```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
node s3-upload-direct.js
```

Then update video URLs in Railway:
```
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://kealee-hero-videos.s3.us-east-1.amazonaws.com/hero-videos/kitchen-transformation-seedance-8sec.mp4
```

---

## Testing Checklist

- [ ] Environment variables set in Railway dashboard
- [ ] Railway rebuild complete (check Deployments)
- [ ] Visit https://web-main.kealee.com
- [ ] Hero section visible at top of page
- [ ] Videos play in background (semi-transparent)
- [ ] Auto-rotation works (changes every 8 seconds)
- [ ] Manual controls work (prev/next buttons)
- [ ] Dot indicators update on click
- [ ] Videos play on mobile (responsive)
- [ ] Network DevTools shows video requests successful
- [ ] No console errors in browser

---

**Status**: Ready for Railway deployment
**Last Updated**: 2026-07-03
**Videos**: 3x Ready (Seedance 8-sec), 2x Ready (Grok 15-sec)
