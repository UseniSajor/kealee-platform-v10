# 🚀 DEPLOY HERO VIDEOS TO RAILWAY - FINAL STEPS

## Status: ✅ VIDEOS READY

**Fresh videos generated & verified (2026-07-03)**:
- ✅ Kitchen: 4.42MB
- ✅ Addition: 4.87MB  
- ✅ Garden: 6.93MB
- **All URLs verified HTTP 200 ✓**

---

## 📋 COPY THESE EXACT VALUES

```
NEXT_PUBLIC_HERO_VIDEO_KITCHEN
https://replicate.delivery/xezq/ViAoWS3GPGoiEJOZpfMX5VSyJIgplFE66FZReGwQe4ZObCrtA/tmpgjvxumny.mp4

NEXT_PUBLIC_HERO_VIDEO_ADDITION
https://replicate.delivery/xezq/WK3vf0fEoQms4UCf6YthBePfemi8cjG3sYGHUkesb3S09nwaLA/tmpmiobyq3m.mp4

NEXT_PUBLIC_HERO_VIDEO_GARDEN
https://replicate.delivery/xezq/qQnfhgqraKTfsE5tGpH0oU2UdjgJJCRaEGvrN5qcF2PaTh1WA/tmpniiena3x.mp4
```

---

## 🔧 STEP-BY-STEP DEPLOYMENT (5 minutes)

### 1️⃣ Go to Railway Dashboard
```
https://railway.app/dashboard
```

### 2️⃣ Select web-main Service
- Click on **web-main** project/service
- Click **Settings** (⚙️ icon)
- Click **Variables** tab

### 3️⃣ Add 3 Environment Variables

**First Variable:**
```
Key:   NEXT_PUBLIC_HERO_VIDEO_KITCHEN
Value: https://replicate.delivery/xezq/ViAoWS3GPGoiEJOZpfMX5VSyJIgplFE66FZReGwQe4ZObCrtA/tmpgjvxumny.mp4
```
Click **Add Variable**

**Second Variable:**
```
Key:   NEXT_PUBLIC_HERO_VIDEO_ADDITION
Value: https://replicate.delivery/xezq/WK3vf0fEoQms4UCf6YthBePfemi8cjG3sYGHUkesb3S09nwaLA/tmpmiobyq3m.mp4
```
Click **Add Variable**

**Third Variable:**
```
Key:   NEXT_PUBLIC_HERO_VIDEO_GARDEN
Value: https://replicate.delivery/xezq/qQnfhgqraKTfsE5tGpH0oU2UdjgJJCRaEGvrN5qcF2PaTh1WA/tmpniiena3x.mp4
```
Click **Add Variable**

### 4️⃣ Click **Save**
Railway will:
- Detect changes
- Trigger automatic rebuild
- Deploy new version
- Restart web-main service

### 5️⃣ Verify Deployment
**Watch the build:**
- Go to **Deployments** tab
- Wait for "Deployment successful"
- Check logs for confirmation

**Test live site:**
```
https://web-main.kealee.com
```

**What you should see:**
- Hero section at top of page
- 🎥 Video playing in background (semi-transparent)
- 🔄 Auto-rotating videos (8 seconds each)
- ⬅️➡️ Previous/Next buttons
- 🟤 Dot indicators (clickable)
- Text overlay: "AI-Powered Construction Design"

---

## ✅ Testing Checklist

After deployment completes:

- [ ] Visit https://web-main.kealee.com
- [ ] Scroll to top of page
- [ ] Hero section visible
- [ ] Video plays in background
- [ ] Video auto-rotates (8 sec intervals)
- [ ] Click dot indicators → changes video
- [ ] Click prev/next buttons → works
- [ ] Works on mobile
- [ ] No console errors (F12 DevTools)
- [ ] Video plays smoothly (no buffering)

---

## 🔍 Troubleshooting

### Hero Section Shows Black Screen
**Cause**: Env variables not set in Railway yet
**Fix**: 
1. Verify all 3 variables added to Railway
2. Check **Deployments** - rebuild complete?
3. Hard refresh browser (Ctrl+Shift+R)

### Videos Don't Play (Shows Poster Only)
**Cause**: Video URL blocked or unreachable
**Fix**:
1. Open video URL in new browser tab (should download)
2. Check Network tab in DevTools for errors
3. Verify no typos in URL

### Auto-rotation Not Working
**Cause**: JavaScript issue or autoplay blocked
**Fix**:
1. Check browser console (F12 → Console)
2. No errors? Refresh page
3. Try different browser

### Deploy Took Too Long
**Expected**: 2-3 minutes for rebuild & deploy
**Check**: Deployments tab → logs for any errors

---

## 📱 Mobile Testing

After deployment, test on mobile:
```
https://web-main.kealee.com
```

Expected:
- Hero section full width
- Videos display responsively
- Controls visible and clickable
- Text readable on small screens

---

## 🎯 Final Confirmation

Once videos are live:

**Share the live link:**
```
https://web-main.kealee.com
```

**What's new:**
- 🎬 AI-generated hero carousel
- 🎨 3 construction project types
- ⏱️ 8-second showcase videos
- 🎭 Professional construction content
- 🚀 Seedance 2.0 model (Replicate)

---

## Next Steps (Optional)

### Option A: Switch to 15-Second Videos
Replace URLs with Grok Imagine videos:
```
Kitchen: https://replicate.delivery/xezq/jhHpAZi5iY59KZ43Ve97mcE2laoZfeSRIf94K2yw6bCMS9VbB/tmpdcant39j.mp4
Addition: https://replicate.delivery/xezq/QfzXmwSpzU2IKifjG6I0JvCQYpiVpZ3zg4YpNZ8GQkufweVbB/tmpzxtam51k.mp4
```

### Option B: Backup to AWS S3
Run backup script (optional):
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
node s3-upload-direct.js
```

### Option C: Regenerate Videos
Run generator (if quality issues):
```bash
export REPLICATE_API_TOKEN="your-replicate-token"
node generate-with-seedance.js
```

---

## 📞 Quick Reference

| Item | Details |
|------|---------|
| **Dashboard** | https://railway.app/dashboard |
| **Live Site** | https://web-main.kealee.com |
| **Component** | apps/web-main/components/HomeHero.tsx |
| **Env Vars** | NEXT_PUBLIC_HERO_VIDEO_* (3 total) |
| **Video Format** | MP4, 720p, 8 seconds |
| **File Sizes** | 4-7MB each |
| **Auto-rotation** | 8 seconds per video |
| **Controls** | Prev/Next buttons + dot indicators |

---

**⏱️ Total Time: ~5 minutes**
**🎯 Result: AI hero carousel live in production**

---

Generated: 2026-07-03
Videos: Fresh & Verified ✅
Ready to deploy: YES ✅
