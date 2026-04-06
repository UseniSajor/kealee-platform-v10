# ✅ TESTING PREREQUISITES CHECKLIST

**Before starting the workflow testing**, verify the following prerequisites are met.

---

## REQUIRED SETUP (MUST COMPLETE FIRST)

### 1. Stripe Environment Variables in Railway ⚠️ CRITICAL

**Status:** 🔴 **NOT YET DONE** (manual setup required)

**What to do:**
1. Go to: https://railway.app
2. Select project: `kealee-platform-v10`
3. Select service: `arstic-kindness` (the API service)
4. Click "Variables" tab
5. **Copy-paste the entire block below into the Variables section:**

```
STRIPE_PRICE_CONCEPT=price_1SwJCZ...
STRIPE_PRICE_KITCHEN=price_1SwJCb...
STRIPE_PRICE_BATH=price_1SwJCc...
STRIPE_PRICE_INTERIOR=price_1SwJCd...
STRIPE_PRICE_EXTERIOR=price_1SwJCe...
STRIPE_PRICE_GARDEN=price_1SwJCf...
STRIPE_PRICE_LANDSCAPE=price_1SwJCg...
STRIPE_PRICE_BASEMENT=price_1SwJCh...
STRIPE_PRICE_ADU=price_1SwJCi...
STRIPE_PRICE_TINY_HOME=price_1SwJCj...
STRIPE_PRICE_NEW_BUILD=price_1SwJCk...
STRIPE_PRICE_DESIGN_STARTER=price_1SwJCl...
STRIPE_PRICE_DESIGN_VIZ=price_1SwJCm...
STRIPE_PRICE_DESIGN_FULL=price_1SwJCn...
STRIPE_PRICE_PERMIT_RESEARCH=price_1SwJCo...
STRIPE_PRICE_OD_PERMIT_APP=price_1SwJCp...
STRIPE_PRICE_OD_CONTRACTOR_COORD=price_1SwJCq...
STRIPE_PRICE_PERMIT_EXPEDITING=price_1SwJCr...
STRIPE_PRICE_EST_STANDARD=price_1SwJCs...
STRIPE_PRICE_EST_CERTIFIED=price_1SwJCt...
STRIPE_PRICE_OD_PROGRESS_REPORT=price_1SwJCu...
STRIPE_PRICE_OD_SCHEDULE_OPT=price_1SwJCv...
STRIPE_PRICE_HISTORIC=price_1SwJCw...
STRIPE_PRICE_ADU_BUNDLE=price_1SwJCx...
STRIPE_PRICE_WATER_MITIGATION=price_1SwJCy...
```

**Note:** See [DEPLOYMENT_NEXT_STEPS.md](DEPLOYMENT_NEXT_STEPS.md) for the actual price IDs (copy from that file)

6. Click "Save" or "Deploy"
7. **Wait 2-5 minutes** for redeploy to complete
8. ✅ Confirm redeploy succeeded (should see green checkmark)

### 2. Code Deployment ✅ DONE

- ✅ All code committed to git
- ✅ All commits pushed to origin/main
- ✅ Railway auto-deployed latest code to:
  - web-main
  - portal-owner
  - portal-contractor
  - portal-developer
  - arstic-kindness API

**Verify:** Check git log shows commit `a4c50c36` (latest)

### 3. API Endpoints Ready ✅ DONE

**Expected to be online:**

| Service | URL | Status |
|---------|-----|--------|
| Web-Main | https://web-main-*.up.railway.app | ✅ Auto-deployed |
| Portal-Owner | https://portal-owner-*.up.railway.app | ✅ Auto-deployed |
| API (arstic-kindness) | https://arstic-kindness.up.railway.app | ✅ Auto-deployed |

**Check if endpoints are live:**
```bash
# Test API endpoint
curl -I https://arstic-kindness.up.railway.app/health

# Expected response: HTTP 200 OK
```

### 4. Environment Configuration ✅ DONE

- ✅ `arstic-kindness` has API_URL set
- ✅ `arstic-kindness` has RESEND_API_KEY set (re_e8UV1vgf_9YeUW8intPn8SveiiuzBspCQ)
- ✅ All portal services have NEXT_PUBLIC_API_URL pointing to arstic-kindness
- ✅ Database migrations completed

---

## OPTIONAL VERIFICATION (NICE TO HAVE)

### Check Railway Logs
1. Go to: https://railway.app → arstic-kindness service
2. Click "Logs" tab
3. Look for any errors (red text)
4. Expected: Clean logs with no 500 errors

### Check Database
1. Go to: https://railway.app → PostgreSQL service
2. Verify tables exist (should have auto-created via Prisma)
3. Optional: Run `SELECT * FROM "User"` to see if auth users exist

### Check Function Status
1. Open browser DevTools (F12)
2. Go to web-main home page
3. Console tab should show no errors
4. Network tab should show clean HTTP 200 responses

---

## TESTING READINESS SUMMARY

| Item | Status | Requirement |
|------|--------|-------------|
| Code deployed | ✅ Done | Must be complete |
| API online | ✅ Done | Must be online |
| Stripe variables added | 🔴 **TODO** | **BLOCKING** - Required for checkout |
| Stripe redeploy finished | 🔴 **TODO** | **BLOCKING** - Wait 2-5 min after variables |
| Database ready | ✅ Done | Automatic |
| Auth configured | ✅ Done | Supabase pre-configured |

---

## ⚡ QUICK START

**When prerequisites are complete, start testing with:**

1. **Open [WORKFLOW_TESTING_GUIDE.md](WORKFLOW_TESTING_GUIDE.md)**
2. **Start with Test 1: AI Agents & Chatbot**
3. **Work through all tests in order**
4. **Report any failures using the test report template**

---

## 🚨 IF YOU GET STUCK

### Common Issues Before Testing:

**Q: I see "Stripe variables not configured" errors**
- A: Add the 26 variables to Railway variables section (see step 1 above)

**Q: Pages load but checkout is 503**
- A: Wait for redeploy to finish (2-5 min after adding variables) then refresh

**Q: Chat or API calls return 404**
- A: Verify arstic-kindness service is deployed (green status in Railway)

**Q: Can't access web-main at all**
- A: Check Railway deployment logs for build errors

---

**Status:** 🟡 **READY TO PROCEED** - Add Stripe variables, wait for redeploy, then start testing!
