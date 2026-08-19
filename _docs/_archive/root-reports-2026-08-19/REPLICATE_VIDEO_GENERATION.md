# Replicate Video Generation Guide

## Quick Start: Manual Web UI (Easiest)

If you want to generate hero videos quickly without dealing with API versions:

### Step 1: Go to Replicate Web UI
1. Visit: https://replicate.com
2. Search for "kling" or "kling-video"
3. Look for models by "kling-ai"

### Step 2: Generate Each Video

#### Kitchen Transformation Video
1. Click the Kling video model
2. Click "Run"
3. Paste this prompt:
```
Professional 4K video showing a modern kitchen transformation. 
Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s ceramic tile. 
After: contemporary kitchen with white shaker cabinets, stainless steel appliances, waterfall marble island, LED lighting. 
Show quick transitions with zoom shots. Include person touching counter for scale. Daylight from window. High quality cinematography. 8 seconds.
```
4. Set parameters:
   - Duration: 8
   - Aspect ratio: 16:9
   - Quality: 4K (if available)
5. Click "Run"
6. Wait for completion (typically 2-5 minutes)
7. Copy the output video URL

#### Home Addition Construction Video
```
Professional construction progress video showing home addition project. 
2-story house with new master suite addition on side. 
Show: site prep, wood framing, electrical rough-in, drywall, painting, flooring, final walkthrough. 
Include construction workers, close-ups of quality craftsmanship. 
Sunny day, clear skies. Time-lapse elements. 8 seconds.
```

#### Garden Landscape Video
```
Beautiful garden landscape transformation video. 
Before: bare backyard, old wooden fence. 
After: lush garden design with curved planting beds, flowering plants, hardscape patio with seating, decorative pathways, ambient landscape lighting. 
Multiple angles: wide garden shot, close flower details, evening lighting. 
Professional cinematography. 8 seconds.
```

### Step 3: Save Video URLs

Once all 3 videos are generated, copy their URLs:

```
Kitchen: https://replicate.delivery/[id]/kitchen-hero.mp4
Addition: https://replicate.delivery/[id]/addition-hero.mp4
Garden: https://replicate.delivery/[id]/garden-hero.mp4
```

---

## Advanced: Finding Current Replicate Version

### Method 1: Check Replicate Website

1. Go to: https://replicate.com
2. Search for "kling-video" or visit model page directly
3. Look for: **Model versions** (usually on right side)
4. Find the **latest stable version**
5. Copy the **Version ID** (looks like: `abc123def456...`)

### Method 2: Use Replicate CLI

If you have Replicate CLI installed:

```bash
# Install replicate CLI (if not already)
npm install -g replicate

# Get model info
replicate get kling-ai/kling-video

# Will show latest version ID
```

### Method 3: Check Replicate API Docs

Browse: https://replicate.com/docs/reference/create-prediction

Look for Kling-video examples to find the current version format.

---

## Update Script with New Version

Once you find the latest Kling version ID:

### Step 1: Update `generate-hero-videos-v2.js`

```javascript
// Find this line (around line 16):
const KLING_VERSION = 'aff48af9c68898399378a0b60e126e95'; // Kling 2.5 or latest

// Replace with the latest version ID from Replicate:
const KLING_VERSION = 'your-new-version-id-here';
```

### Step 2: Run Generation Script

```bash
cd \\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10

# Set your API token
$env:REPLICATE_API_TOKEN = 'r8_...'

# Run the script
node generate-hero-videos-v2.js
```

### Step 3: Monitor Output

The script will:
1. Create predictions for all 3 videos
2. Poll for completion (updates every 5 seconds)
3. Display progress percentage
4. Output final video URLs
5. Generate `.env-hero-videos-generated` file

---

## Common Replicate Issues & Solutions

### "Invalid version or not permitted"

**Cause**: Version ID doesn't exist or account doesn't have access

**Solution**:
1. Double-check version ID from replicate.com
2. Verify API token is correct
3. Ensure account has Replicate credits/subscription
4. Try via web UI instead (Method 1)

### Prediction times out

**Cause**: Video generation is taking longer than 20 minutes

**Solutions**:
- Videos take 1-5 minutes typically
- If > 5 minutes, may be queue backup
- Try again later
- Use smaller duration if available

### Output URL expired

**Cause**: Replicate deletes output files after 24 hours

**Solution**:
- Download videos immediately after generation
- Or upload to your own CDN (see below)
- Keep backup copy of URLs

---

## Upload to CDN (After Generation)

Once you have video URLs from Replicate, upload to your CDN:

### AWS S3 Upload

```bash
# Install AWS CLI if needed
# Then configure credentials

aws s3 cp kitchen-hero.mp4 s3://kealee-cdn/hero-videos/kitchen-transformation-v1.mp4 \
  --region us-east-1 \
  --acl public-read \
  --content-type video/mp4 \
  --cache-control "public, max-age=31536000"

# Repeat for other videos...
```

### Cloudflare R2 Upload

```bash
# Install rclone: https://rclone.org/
# Configure: rclone config

rclone copy kitchen-hero.mp4 r2:kealee-cdn/hero-videos/kitchen-transformation-v1.mp4

# Or use Cloudflare dashboard directly
# https://dash.cloudflare.com → R2
```

### Your CDN (Generic SFTP/API)

```bash
# Use your CDN's upload tools or API
# Final URLs should be:
# https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
# https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4
# https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4
```

---

## Update Environment Variables

Once videos are on CDN:

### Step 1: Update `.env.local`

```bash
# File: apps/web-main/.env.local

NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://cdn.kealee.com/hero-videos/addition-construction-v1.mp4
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://cdn.kealee.com/hero-videos/garden-landscape-v1.mp4
```

### Step 2: Update Vercel Staging Environment

1. Go to: https://vercel.com/dashboard
2. Select project: kealee-platform-v10
3. Settings → Environment Variables
4. Add the 3 video URL variables
5. Make sure they're set for "Preview" (staging)

### Step 3: Rebuild & Deploy

```bash
cd \\wsl$\Ubuntu\home\tim_chamberlain\kealee-platform-v10

# Commit the changes if needed
git add apps/web-main/.env.local
git commit -m "chore: update hero video CDN URLs"
git push origin main

# Vercel will auto-rebuild with new URLs
```

---

## Verify Videos Work

### Local Testing

```bash
# Start dev server
cd apps/web-main
npm run dev

# Visit: http://localhost:3000
# Check:
# ✓ Hero section loads
# ✓ Videos autoplay muted
# ✓ Carousel rotates every 8s
# ✓ No console errors
```

### Browser DevTools

1. Open: DevTools → Network
2. Reload page
3. Look for requests to video URLs
4. Check:
   - Status: 200 OK
   - Content-Type: video/mp4
   - Size: reasonable (5-50MB)
   - Duration: 8 seconds

### Staging Testing

Once deployed to staging:

```
Visit: https://staging.kealee.com
1. Hero carousel displays
2. Videos play without errors
3. No 404s in console
4. Videos stream smoothly
```

---

## Troubleshooting Video Issues

### Videos don't play

**Check**:
- Video URLs in `.env.local` are correct
- CDN videos are publicly accessible
- Browser autoplay is not blocked (videos must be muted ✓)
- CORS headers allow cross-origin requests

**Fix**:
```bash
# Test URL directly
curl -I https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4
# Should return: HTTP 200 OK

# Check file exists and has size
curl -I https://cdn.kealee.com/hero-videos/kitchen-transformation-v1.mp4 | grep Content-Length
```

### Carousel doesn't rotate

**Check**:
- Videos are loading (check Network tab)
- JavaScript is enabled
- No console errors

**Fix**:
```javascript
// Open DevTools Console
console.log(document.querySelector('video').currentTime)
// Should show timestamp increasing
```

### CDN speeds are slow

**Solutions**:
- Use CDN with regional caching (Cloudflare, AWS CloudFront)
- Compress videos (H.264 codec, baseline profile)
- Pre-load videos in browser (if < 10MB)
- Use streaming format (HLS/DASH) for larger files

---

## Video Specs Reference

**What we need**:
- Duration: 8 seconds
- Aspect ratio: 16:9
- Format: MP4 (H.264 codec)
- Resolution: 4K (3840×2160) or FHD (1920×1080)
- Framerate: 30fps
- File size: < 20MB (for web performance)
- Audio: None (muted playback)

**Browser compatibility**:
- Chrome: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Edge: ✓ Full support

---

## Replicate Documentation

- **Official docs**: https://replicate.com/docs
- **Kling model**: Search "kling-ai/kling-video" on Replicate
- **API reference**: https://replicate.com/docs/reference/create-prediction
- **Support**: https://replicate.com/support

---

**Last Updated**: 2026-07-03  
**Status**: Ready for video generation
