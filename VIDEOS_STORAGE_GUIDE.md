# Video Storage Guide — Kealee Platform

## Overview

All generated videos are tracked in the Kealee repository and stored in multiple locations for redundancy and performance.

## Video Locations

### 1. **Replicate CDN (Primary - Live)**
Direct streaming from Replicate's infrastructure.

```
https://replicate.delivery/xezq/[unique-path]/[filename].mp4
```

**Seedance 2.0 Videos (8 seconds)**:
- Kitchen: https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4
- Addition: https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4
- Garden: https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4

**Grok Imagine Videos (15 seconds - Construction Order)**:
- Kitchen Remodel: https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4
- Home Addition: https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4
- Garden Landscaping: **Pending** (requires Replicate credits)

**Pros**:
✅ Free CDN delivery included with Replicate
✅ High-speed streaming
✅ Professional infrastructure
✅ Immediate playback without local storage

**Cons**:
⚠️ External dependency (requires Replicate availability)
⚠️ URLs may expire after extended periods
⚠️ Not version-controlled

**Use Case**: Production delivery to end users

---

### 2. **Repository Manifest (Version Control)**
Location: `VIDEO_MANIFEST.json`

All video metadata is stored in the repository for version control and documentation:
- Video URLs (all versions)
- Generation timestamps
- Model information (Seedance 2.0 vs Grok Imagine)
- Duration and resolution
- Generation times
- Prediction IDs (for Replicate API reference)
- Content descriptions
- Construction phase breakdowns

```bash
cat VIDEO_MANIFEST.json | jq '.videos.construction_sequences.videos.kitchen_remodel'
```

**Pros**:
✅ Version-controlled history
✅ Git commit tracking
✅ Reproducible generation parameters
✅ Easy to audit and review

**Use Case**: Repository documentation and deployment reference

---

### 3. **AWS S3 (Backup + Long-term Storage)**
**Bucket**: `kealee-hero-videos`
**Region**: `us-east-1`
**CloudFront CDN**: `d123456.cloudfront.net`

```
https://kealee-hero-videos.s3.us-east-1.amazonaws.com/hero-videos/[type]-transformation-v1.mp4
https://d123456.cloudfront.net/hero-videos/[type]-transformation-v1.mp4
```

**Status**: Ready to implement
**Configuration**: AWS credentials available in environment

**Pros**:
✅ Long-term archival storage
✅ Version control with tagging
✅ CloudFront distribution for global CDN
✅ Automatic backup capability
✅ Versioning support (kitchen-v1, kitchen-v2, etc.)

**Use Case**: Production redundancy, disaster recovery, version management

---

### 4. **Environment Variables (.env files)**
Videos are referenced via Next.js public environment variables:

**Local Development** (`apps/web-main/.env.local`):
```env
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://replicate.delivery/xezq/.../tmp918wegji.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://replicate.delivery/xezq/.../tmpxd4angyk.mp4
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://replicate.delivery/xezq/.../tmp8af2hnud.mp4
```

**Production Build** (`apps/web-main/.env.production`):
```env
NEXT_PUBLIC_HERO_VIDEO_KITCHEN=https://replicate.delivery/xezq/.../tmp918wegji.mp4
NEXT_PUBLIC_HERO_VIDEO_ADDITION=https://replicate.delivery/xezq/.../tmpxd4angyk.mp4
NEXT_PUBLIC_HERO_VIDEO_GARDEN=https://replicate.delivery/xezq/.../tmp8af2hnud.mp4
```

**Railway Dashboard** (via `Settings → Environment`):
- Same variables for production deployment
- Set automatically on next Railway build

---

## Directory Structure

```
kealee-platform-v10/
├── VIDEO_MANIFEST.json                    # Central video registry
├── VIDEOS_STORAGE_GUIDE.md                # This file
├── DEPLOYMENT_MANIFEST.md                 # Deployment checklist
├── generate-grok-videos.js                # Grok Imagine video generator
├── generate-with-seedance.js              # Seedance 2.0 video generator
├── tasks-2-4-final.js                     # Deployment automation
├── apps/web-main/
│   ├── .env.local                         # Local dev video URLs
│   ├── .env.production                    # Production video URLs
│   ├── components/HomeHero.tsx            # Hero carousel component
│   └── __tests__/
│       └── intake-tiers.test.ts           # Tier pricing tests
└── assets/
    └── videos/                            # (Optional) Local backup
        ├── seedance-2.0/
        │   ├── kitchen-8sec.mp4
        │   ├── addition-8sec.mp4
        │   └── garden-8sec.mp4
        └── grok-imagine/
            ├── kitchen-15sec.mp4
            ├── addition-15sec.mp4
            └── garden-15sec.mp4
```

---

## How Videos Are Used

### 1. Web-Main Hero Section
**Component**: `apps/web-main/components/HomeHero.tsx`
**Feature**: Auto-rotating carousel with 8-second Seedance videos
**Update**: Set `NEXT_PUBLIC_HERO_VIDEO_*` env vars

### 2. Construction Progress Pages
**Future Enhancement**: Display 15-second Grok videos
**New Component**: Construction sequence gallery
**Update**: Add `NEXT_PUBLIC_GROK_VIDEO_*` env vars

### 3. Email Marketing
**Use Case**: Embed construction videos in campaign emails
**Format**: MP4 or WebM with fallback images

### 4. Social Media
**Use Case**: TikTok, Instagram Reels, YouTube Shorts
**Format**: 15-second Grok videos (perfect for platform limits)
**Editing**: Upload to platforms directly

---

## Downloading Videos Locally

### Download from Replicate
```bash
# Kitchen (Seedance 8-second)
curl -L "https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4" \
  -o assets/videos/seedance-2.0/kitchen-8sec.mp4

# Kitchen (Grok 15-second)
curl -L "https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4" \
  -o assets/videos/grok-imagine/kitchen-15sec.mp4
```

### Upload to S3
```bash
# Configure AWS credentials (set in your environment)
export AWS_ACCESS_KEY_ID="your-aws-key-id"
export AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Upload to S3
aws s3 cp assets/videos/seedance-2.0/kitchen-8sec.mp4 \
  s3://kealee-hero-videos/hero-videos/kitchen-transformation-v1.mp4

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id D123456 --paths "/hero-videos/*"
```

---

## Video Generation Models

### Seedance 2.0 (8-second versions)
- **Model**: `bytedance/seedance-2.0`
- **Version**: `a6dcbae88b153e75fcccabacfb0eb430ab5be0a7ae27b316fc6f983658b349bc`
- **Duration**: 8 seconds
- **Speed**: 90-185 seconds generation time
- **Quality**: 720p
- **Use**: Hero carousel showcase
- **Generator**: `generate-with-seedance.js`

### Grok Imagine Video (15-second versions)
- **Model**: `xai/grok-imagine-video`
- **Version**: `ec05ebf490fb5db7e17e73c456e80cb1242d4df8ade9bd7300c66ea2108288bc`
- **Duration**: 15 seconds (construction order, no duplicate frames)
- **Speed**: 230-240 seconds generation time
- **Quality**: 1080p
- **Use**: Construction sequence documentation
- **Generator**: `generate-grok-videos.js`

---

## Regenerating Videos

### Regenerate Seedance Videos
```bash
export REPLICATE_API_TOKEN="your-replicate-api-token"
node generate-with-seedance.js
```

### Regenerate Grok Videos
```bash
export REPLICATE_API_TOKEN="your-replicate-api-token"
node generate-grok-videos.js
```

**Note**: Garden landscaping video requires additional Replicate credits.

---

## Video Specifications

| Aspect | Seedance 2.0 | Grok Imagine |
|--------|------------|--------------|
| Duration | 8 seconds | 15 seconds |
| Resolution | 720p | 1080p |
| Aspect Ratio | 16:9 | 16:9 |
| Format | MP4 | MP4 |
| Generation Time | 90-185s | 230-240s |
| Audio | Yes (optional) | Yes (optional) |
| Use Case | Hero carousel | Construction sequence |
| Typical Size | 20-40MB | 40-80MB |

---

## Deployment Checklist

- [x] Generate 3 Seedance videos (8-sec, hero showcase)
- [x] Generate 2 Grok videos (15-sec, construction order)
- [x] Create VIDEO_MANIFEST.json registry
- [x] Update .env.local with video URLs
- [x] Create .env.production for builds
- [x] Update HomeHero component
- [ ] Download videos to assets/videos/ (optional)
- [ ] Upload videos to AWS S3 (backup)
- [ ] Set env vars in Railway dashboard
- [ ] Test production deployment
- [ ] Monitor video playback performance

---

**Last Updated**: 2026-07-03
**Videos Generated**: 5 (3 Seedance + 2 Grok)
**Total Generation Time**: ~17 minutes
**Status**: Ready for Production Deployment
