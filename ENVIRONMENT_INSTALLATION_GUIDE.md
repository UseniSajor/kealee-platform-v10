# Environment Variables Installation Guide
## For Existing Setup (Most Already Set)

**Status:** Identifying missing variables  
**Time:** 15-30 minutes to complete  
**Complexity:** Low (copy-paste)

---

## What's Likely ALREADY Set

Based on your existing production setup, these are probably already in Vercel:

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ DATABASE_URL
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_)
✅ STRIPE_SECRET_KEY (sk_live_)
✅ STRIPE_WEBHOOK_SECRET
✅ NEXTAUTH_SECRET
✅ NEXTAUTH_URL
✅ NEXT_PUBLIC_ENVIRONMENT
✅ STRIPE_ENABLED
✅ STRIPE_MODE
```

**Total:** ~13 variables already set

---

## What's MISSING (New Marketing Features)

These are the NEW variables needed for marketing automation:

```
❌ GHL_API_KEY
❌ GHL_LOCATION_ID
❌ GHL_WEBHOOK_VERIFY_TOKEN
❌ TWILIO_ACCOUNT_SID
❌ TWILIO_AUTH_TOKEN
❌ TWILIO_PHONE_NUMBER
❌ YOUR_SMS_NUMBER
❌ CALENDLY_API_TOKEN
❌ CALENDLY_USER_URI
❌ SLACK_WEBHOOK_URL_LEADS
❌ SLACK_WEBHOOK_URL_URGENT
❌ SLACK_WEBHOOK_URL_ALERTS
❌ FACEBOOK_PIXEL_ID
❌ FACEBOOK_APP_ID
❌ FACEBOOK_APP_SECRET
❌ FACEBOOK_WEBHOOK_VERIFY_TOKEN
❌ FACEBOOK_WEBHOOK_SECRET
❌ GOOGLE_ADS_CLIENT_ID
❌ GOOGLE_ADS_CLIENT_SECRET
❌ GOOGLE_ADS_DEVELOPER_TOKEN
❌ GOOGLE_ADS_REFRESH_TOKEN
❌ NEXTDOOR_API_KEY
❌ NEXTDOOR_WEBHOOK_VERIFY_TOKEN
❌ REDDIT_API_CLIENT_ID
❌ REDDIT_API_CLIENT_SECRET
❌ REDDIT_API_USERNAME
❌ REDDIT_API_PASSWORD
❌ REDDIT_WEBHOOK_VERIFY_TOKEN
❌ CRON_SECRET
❌ KEALEE_OPS_SECRET
```

**Total:** ~30 new variables to add

---

# PART 1: Check Current Setup

## Step 1: Verify Existing Variables in Vercel

```
Go to: https://vercel.com/dashboard
→ web-main project
→ Settings
→ Environment Variables
```

**Screenshot what you see and count:**
- [ ] How many total variables are shown?
- [ ] Verify Stripe is using `pk_live_` and `sk_live_` (not test keys)
- [ ] Check DATABASE_URL exists
- [ ] Check SUPABASE keys exist

---

## Step 2: Check Railway (if used)

```
Go to: https://railway.app
→ Your project
→ Variables tab
```

**Screenshot what you see and count:**
- [ ] How many variables?
- [ ] Is DATABASE_URL set?
- [ ] Are Stripe keys set?

---

# PART 2: Add Missing Marketing Variables

## VERCEL - Adding New Variables

**Go to:** https://vercel.com/dashboard → web-main → Settings → Environment Variables

### Option A: Add One By One (Safest)

**Step 1: Add GHL variables**

```
Variable Name: GHL_API_KEY
Value: [Get from: GHL Dashboard → Settings → API Keys]
Click "Add"

Variable Name: GHL_LOCATION_ID
Value: [Get from: GHL Dashboard → Settings → Location ID]
Click "Add"

Variable Name: GHL_WEBHOOK_VERIFY_TOKEN
Value: [Create any secure random string]
Click "Add"
```

**Step 2: Add Twilio variables**

```
Variable Name: TWILIO_ACCOUNT_SID
Value: [Get from: Twilio Console → Account Info]
Click "Add"

Variable Name: TWILIO_AUTH_TOKEN
Value: [Get from: Twilio Console → Account Info]
Click "Add"

Variable Name: TWILIO_PHONE_NUMBER
Value: +1[YOUR-TWILIO-NUMBER]
Click "Add"

Variable Name: YOUR_SMS_NUMBER
Value: +1[YOUR-PERSONAL-PHONE]
Click "Add"
```

**Step 3: Add Slack variables**

```
Variable Name: SLACK_WEBHOOK_URL_LEADS
Value: https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
Click "Add"

Variable Name: SLACK_WEBHOOK_URL_URGENT
Value: https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
Click "Add"

Variable Name: SLACK_WEBHOOK_URL_ALERTS
Value: https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
Click "Add"
```

**Step 4: Add Security variables**

```
Variable Name: CRON_SECRET
Value: [Generate: openssl rand -base64 32]
Click "Add"

Variable Name: KEALEE_OPS_SECRET
Value: [Generate: openssl rand -base64 32]
Click "Add"
```

---

### Option B: Bulk Copy-Paste (Faster, if Vercel supports it)

**Try this approach:**

1. Go to Vercel Environment Variables page
2. Check if there's a "Bulk add" or "Import" option
3. If yes, copy this entire block:

```
GHL_API_KEY=[YOUR-VALUE]
GHL_LOCATION_ID=[YOUR-VALUE]
GHL_WEBHOOK_VERIFY_TOKEN=[YOUR-VALUE]
TWILIO_ACCOUNT_SID=[YOUR-VALUE]
TWILIO_AUTH_TOKEN=[YOUR-VALUE]
TWILIO_PHONE_NUMBER=[YOUR-VALUE]
YOUR_SMS_NUMBER=[YOUR-VALUE]
CALENDLY_API_TOKEN=[YOUR-VALUE]
CALENDLY_USER_URI=[YOUR-VALUE]
SLACK_WEBHOOK_URL_LEADS=[YOUR-VALUE]
SLACK_WEBHOOK_URL_URGENT=[YOUR-VALUE]
SLACK_WEBHOOK_URL_ALERTS=[YOUR-VALUE]
FACEBOOK_PIXEL_ID=[YOUR-VALUE]
FACEBOOK_APP_ID=[YOUR-VALUE]
FACEBOOK_APP_SECRET=[YOUR-VALUE]
FACEBOOK_WEBHOOK_VERIFY_TOKEN=[YOUR-VALUE]
FACEBOOK_WEBHOOK_SECRET=[YOUR-VALUE]
GOOGLE_ADS_CLIENT_ID=[YOUR-VALUE]
GOOGLE_ADS_CLIENT_SECRET=[YOUR-VALUE]
GOOGLE_ADS_DEVELOPER_TOKEN=[YOUR-VALUE]
GOOGLE_ADS_REFRESH_TOKEN=[YOUR-VALUE]
NEXTDOOR_API_KEY=[YOUR-VALUE]
NEXTDOOR_WEBHOOK_VERIFY_TOKEN=[YOUR-VALUE]
REDDIT_API_CLIENT_ID=[YOUR-VALUE]
REDDIT_API_CLIENT_SECRET=[YOUR-VALUE]
REDDIT_API_USERNAME=[YOUR-VALUE]
REDDIT_API_PASSWORD=[YOUR-VALUE]
REDDIT_WEBHOOK_VERIFY_TOKEN=[YOUR-VALUE]
CRON_SECRET=[YOUR-VALUE]
KEALEE_OPS_SECRET=[YOUR-VALUE]
```

---

## Practical Approach: Priority-Based Setup

### Phase 1: Add ONLY Critical (5 min)

These are the minimum needed to go live:

**In Vercel, add:**

```
CRON_SECRET=<generate-random>
KEALEE_OPS_SECRET=<generate-random>
GHL_API_KEY=<your-key>
GHL_LOCATION_ID=<your-id>
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-number>
YOUR_SMS_NUMBER=<your-personal-phone>
```

**In Vercel, verify already exist:**

```
SLACK_WEBHOOK_URL_LEADS (should exist)
SLACK_WEBHOOK_URL_URGENT (should exist)
SLACK_WEBHOOK_URL_ALERTS (should exist)
```

Then: **Redeploy in Vercel**

---

### Phase 2: Add Ads Variables (10 min)

**In Vercel, add:**

```
FACEBOOK_PIXEL_ID=<your-id>
FACEBOOK_APP_ID=<your-id>
FACEBOOK_APP_SECRET=<your-secret>
FACEBOOK_WEBHOOK_VERIFY_TOKEN=<random-string>
FACEBOOK_WEBHOOK_SECRET=<your-secret>
GOOGLE_ADS_CLIENT_ID=<your-id>
GOOGLE_ADS_CLIENT_SECRET=<your-secret>
NEXTDOOR_API_KEY=<your-key>
NEXTDOOR_WEBHOOK_VERIFY_TOKEN=<random-string>
REDDIT_API_CLIENT_ID=<your-id>
REDDIT_API_CLIENT_SECRET=<your-secret>
REDDIT_API_USERNAME=<your-username>
REDDIT_API_PASSWORD=<your-password>
REDDIT_WEBHOOK_VERIFY_TOKEN=<random-string>
```

Then: **Redeploy in Vercel**

---

### Phase 3: Add Optional Variables (5 min)

**In Vercel, add:**

```
CALENDLY_API_TOKEN=<your-token>
CALENDLY_USER_URI=https://api.calendly.com/users/<your-id>
RESEND_API_KEY=<optional>
SENDGRID_API_KEY=<optional>
```

---

# PART 3: Railway Setup (If Used)

## Add Missing Variables to Railway

**Go to:** https://railway.app → Your Project → Variables

**Add the same variables as Vercel, but only:**

```
DATABASE_URL (already should exist)
STRIPE_SECRET_KEY (already should exist)
GHL_API_KEY
GHL_LOCATION_ID
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
SLACK_WEBHOOK_URLs (all 3)
CRON_SECRET
KEALEE_OPS_SECRET
```

---

# PART 4: After Adding Variables

## Step 1: Redeploy

**In Vercel:**
1. Settings → Environment Variables → (verify all added)
2. Deployments → Latest deployment → Click "Redeploy"
3. Wait for build to complete (5-10 min)
4. Check for "Ready" status

**In Railway:**
1. Variables → (verify all added)
2. Railway auto-deploys, wait 2-3 minutes

---

## Step 2: Test Each Connection

### Test 1: GHL Connection

```bash
cd apps/web-main
pnpm run test:ghl
```

**Expected output:**
```
✓ GHL connection successful
✓ Location details fetched
✓ Contacts search working
```

---

### Test 2: Full Marketing Setup

```bash
pnpm run test:marketing-setup
```

**Expected output:**
```
✓ Environment variables present
✓ GHL connected
✓ Twilio connected
✓ Slack webhooks responding
✓ Cron secret configured
✓ System ready for launch
```

---

### Test 3: Full Activation

```bash
pnpm run activate:phase1
```

**Expected output:**
```
✓ Vercel deployment ready
✓ Database migrations present
✓ Webhooks registered
✓ Cron jobs configured
✓ System ready for go-live
```

---

## Step 3: Manual Verification

### Test Slack Webhook

```bash
curl -X POST [YOUR-SLACK-WEBHOOK-URL-LEADS] \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message from Kealee"}' 
```

**Expected:** Message appears in Slack #leads channel

---

### Test Twilio

```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/[YOUR_ACCOUNT_SID]/Messages.json \
  -u [YOUR_ACCOUNT_SID]:[YOUR_AUTH_TOKEN] \
  -d "To=[YOUR_SMS_NUMBER]&From=[YOUR_TWILIO_PHONE]&Body=Test%20from%20Kealee"
```

**Expected:** SMS text received on your phone

---

### Test Database

```bash
psql [YOUR-DATABASE-URL] -c "SELECT COUNT(*) FROM public_intake_leads;"
```

**Expected:** Returns a number (count of leads)

---

# PART 5: Complete Checklist

## Before Going Live

### Vercel Variables

- [ ] All Stripe keys use `pk_live_` and `sk_live_` (NOT test keys)
- [ ] DATABASE_URL set and working
- [ ] GHL_API_KEY and GHL_LOCATION_ID set
- [ ] TWILIO keys set with correct phone numbers
- [ ] SLACK webhook URLs all set (3 different URLs for 3 channels)
- [ ] CRON_SECRET set
- [ ] KEALEE_OPS_SECRET set
- [ ] Latest deployment shows "Ready"

### Railway Variables (if used)

- [ ] DATABASE_URL set
- [ ] All critical keys set
- [ ] Deployment auto-redeployed

### Connection Tests

- [ ] `pnpm run test:ghl` passes
- [ ] `pnpm run test:marketing-setup` passes
- [ ] `pnpm run activate:phase1` passes
- [ ] Manual Slack test sends message
- [ ] Manual Twilio test sends SMS
- [ ] Manual database test returns count

### Ready to Launch?

- [ ] All checks above pass
- [ ] No error messages in logs
- [ ] Deployment is "Ready"
- [ ] You can proceed with PARALLEL_DEPLOYMENT_PLAN

---

# Quick Reference: Where to Get Each Variable

| Variable | Where to Get | Platform |
|----------|-------------|----------|
| GHL_API_KEY | GHL Dashboard → Settings → API Keys | GHL |
| GHL_LOCATION_ID | GHL Dashboard → Settings (top) | GHL |
| TWILIO_ACCOUNT_SID | Twilio Console → Account Info | Twilio |
| TWILIO_AUTH_TOKEN | Twilio Console → Account Info | Twilio |
| TWILIO_PHONE_NUMBER | Twilio Console → Phone Numbers | Twilio |
| YOUR_SMS_NUMBER | Your personal phone | Manual |
| SLACK_WEBHOOK_URLs | Slack → Settings → Incoming Webhooks | Slack |
| FACEBOOK_APP_ID | Meta Developers → App Settings | Meta |
| GOOGLE_ADS_KEYS | Google Cloud → APIs & Services | Google |
| CRON_SECRET | Generate: `openssl rand -base64 32` | Generate |
| KEALEE_OPS_SECRET | Generate: `openssl rand -base64 32` | Generate |

---

# Troubleshooting

## "Variable not found" Error

**Problem:** Code can't find the variable

**Solution:**
1. Verify variable is in Vercel/Railway
2. Check spelling (case-sensitive)
3. Redeploy after adding
4. Clear browser cache

---

## "Connection failed" Error

**Problem:** Connection to external service failed

**Solution:**
1. Verify key is correct
2. Verify service is active
3. Check webhook URL is correct
4. Test with curl command above

---

## "Unauthorized" Error

**Problem:** Keys are wrong or expired

**Solution:**
1. Regenerate keys in source service
2. Update in Vercel/Railway
3. Redeploy
4. Test again

---

# Summary

**Your Setup:**

1. **Already Have:** ~13 production variables
2. **Need to Add:** ~30 new marketing variables
3. **Time:** 15-30 minutes
4. **Complexity:** Low (copy-paste)
5. **Risk:** Low (no breaking changes)

**Next Steps:**

1. Go through Phase 1: Add critical GHL, Twilio, Slack vars
2. Redeploy in Vercel
3. Run `pnpm run activate:phase1` to verify
4. Add Phase 2 vars (ads)
5. Run full verification
6. You're ready to go live!

---

**Status:** Ready to Install  
**Next Action:** Go to Vercel and start adding Phase 1 variables
