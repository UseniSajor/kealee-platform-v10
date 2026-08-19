# Kealee Platform: Complete Environment Variables Setup
## All Phases (1–3) + Marketing Engine + Nextdoor

**Date:** May 8, 2026  
**Status:** Production Configuration  
**Target:** Vercel Environment Variables (Production)

---

## 🚀 Quick Setup (Copy & Paste)

Go to: **Vercel Dashboard → kealee-platform-v10 → Settings → Environment Variables → Production**

Copy & paste each section below, fill in YOUR values, and save.

---

## ✅ PHASE 1: Lead Scoring + SMS Alerts

### GoHighLevel (GHL)
```
GHL_API_KEY=<your-ghl-api-key>
GHL_LOCATION_ID=<your-ghl-location-id>
GHL_WEBHOOK_SECRET=<generate-random-32-chars>
```

**How to get:**
1. GoHighLevel app → Settings → API Keys
2. Copy API Key
3. Find Location ID in dashboard URL or app

**Generate secret:**
```bash
openssl rand -hex 16  # Generates random 32-char secret
```

### Twilio (SMS Alerts)
```
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE=+1<your-twilio-phone-number>
YOUR_SMS_NUMBER=+1<your-personal-cell-number>
```

**How to get:**
1. Twilio Console → Account Info (Account SID, Auth Token)
2. Twilio Console → Phone Numbers → Manage (your Twilio number)
3. `YOUR_SMS_NUMBER` = your personal phone (receives hot lead alerts)

**Format:** Must be international format: `+1` + area code + number
- Example: `+15551234567`

### Cron Authentication
```
CRON_SECRET=<generate-random-32-chars>
```

**Generate:**
```bash
openssl rand -hex 16
```

---

## ✅ PHASE 2: AI Qualification + Calendly

### Claude API (AI Qualification)
```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

**How to get:**
1. https://console.anthropic.com
2. API Keys → Create Key
3. Copy key (store securely!)

### Calendly (Auto-Scheduling)
```
CALENDLY_API_TOKEN=<your-calendly-api-token>
CALENDLY_CALENDAR_UUID=<your-calendly-calendar-uuid>
```

**How to get:**
1. Calendly → Settings → Integrations → API Tokens
2. Create new token, copy
3. For UUID, run this:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.calendly.com/users/me
   # Look for "uri" field, extract UUID
   ```

### Slack (Notifications)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_BOT_TOKEN=xoxb-...
```

**How to get:**
1. Slack Workspace → Apps → Create App
2. Enable Incoming Webhooks
3. Create webhook for `#leads` channel
4. Copy webhook URL
5. (Optional) Create bot token for richer formatting

---

## ✅ PHASE 3: Multi-Channel + ROI

### Facebook / Meta
```
META_APP_ID=<your-meta-app-id>
META_APP_SECRET=<your-meta-app-secret>
FACEBOOK_PAGE_ACCESS_TOKEN=<your-page-access-token>
META_WEBHOOK_VERIFY_TOKEN=<generate-random-32-chars>
```

**How to get:**
1. Meta Developers → My Apps
2. Create app (type: Business)
3. Settings → Basic (App ID, Secret)
4. Facebook → Manage Pages (access token)
5. Webhooks → Create verify token

### Google Ads
```
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=<your-developer-token>
GOOGLE_CONVERSION_ID=<your-conversion-id>
GOOGLE_ADS_ACCESS_TOKEN=<your-oauth-refresh-token>
```

**How to get:**
1. Google Cloud Console → Create project
2. Enable: Google Ads API, Google Analytics 4
3. Create OAuth 2.0 credential (Desktop)
4. Google Ads → Tools → Conversions (get Conversion ID)
5. Set refresh token in env var

---

## ✅ NEXTDOOR: Neighborhood Ads

### Nextdoor Integration
```
NEXTDOOR_API_KEY=<your-nextdoor-api-key>
NEXTDOOR_WEBHOOK_SECRET=<generate-random-32-chars>
```

**How to get:**
1. Nextdoor Ads Manager → Settings → API
2. Request API access
3. Generate webhook secret (random 32 chars)

---

## ✅ MARKETING ENGINE: Campaigns

### Marketing Configuration (Optional - Already in Code)
```
# These are OPTIONAL - defaults are in lib/marketing/marketing-engine.ts
# Only set if you want to override defaults:

MARKETING_WEEK_START=1
MARKETING_CAMPAIGN_TYPE=product_rotation
MARKETING_CHANNEL_PRIMARY=email
```

---

## ✅ DATABASE: Supabase

### Supabase (Already in Code)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**How to get:**
1. Supabase Dashboard → Settings → API
2. Copy Project URL
3. Copy Anon Key
4. Copy Service Role Key

---

## ✅ STRIPE: Payments (Existing)

### Stripe (Already configured, verify)
```
STRIPE_SECRET_KEY=sk_live_... (Production) or sk_test_... (Staging)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
```

**Status:** Already set up, just verify correct keys

---

## ✅ RESEND: Email (Already in Code)

### Resend (Email Service)
```
RESEND_API_KEY=<your-resend-api-key>
```

**How to get:**
1. https://resend.com → API Keys
2. Create key, copy

---

## 📋 Complete Environment Variables (Production)

Copy this entire block and fill in YOUR values:

```
# ═════════════════════════════════════════════════════════════════════════
# PHASE 1: LEAD SCORING + SMS ALERTS
# ═════════════════════════════════════════════════════════════════════════

GHL_API_KEY=<YOUR-GHL-API-KEY>
GHL_LOCATION_ID=<YOUR-GHL-LOCATION-ID>
GHL_WEBHOOK_SECRET=<RANDOM-32-CHAR-SECRET>

TWILIO_ACCOUNT_SID=<YOUR-TWILIO-SID>
TWILIO_AUTH_TOKEN=<YOUR-TWILIO-TOKEN>
TWILIO_PHONE=+1<YOUR-TWILIO-NUMBER>
YOUR_SMS_NUMBER=+1<YOUR-PERSONAL-PHONE>

CRON_SECRET=<RANDOM-32-CHAR-SECRET>

# ═════════════════════════════════════════════════════════════════════════
# PHASE 2: AI QUALIFICATION + CALENDLY + SLACK
# ═════════════════════════════════════════════════════════════════════════

ANTHROPIC_API_KEY=<YOUR-ANTHROPIC-KEY>

CALENDLY_API_TOKEN=<YOUR-CALENDLY-TOKEN>
CALENDLY_CALENDAR_UUID=<YOUR-CALENDLY-UUID>

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/<YOUR-WEBHOOK>
SLACK_BOT_TOKEN=xoxb-<YOUR-BOT-TOKEN>

# ═════════════════════════════════════════════════════════════════════════
# PHASE 3: MULTI-CHANNEL + ROI TRACKING
# ═════════════════════════════════════════════════════════════════════════

META_APP_ID=<YOUR-META-APP-ID>
META_APP_SECRET=<YOUR-META-APP-SECRET>
FACEBOOK_PAGE_ACCESS_TOKEN=<YOUR-PAGE-TOKEN>
META_WEBHOOK_VERIFY_TOKEN=<RANDOM-32-CHAR-SECRET>

GOOGLE_ADS_CUSTOMER_ID=<YOUR-CUSTOMER-ID>
GOOGLE_ADS_DEVELOPER_TOKEN=<YOUR-DEVELOPER-TOKEN>
GOOGLE_CONVERSION_ID=<YOUR-CONVERSION-ID>
GOOGLE_ADS_ACCESS_TOKEN=<YOUR-OAUTH-TOKEN>

# ═════════════════════════════════════════════════════════════════════════
# NEXTDOOR: NEIGHBORHOOD ADS
# ═════════════════════════════════════════════════════════════════════════

NEXTDOOR_API_KEY=<YOUR-NEXTDOOR-KEY>
NEXTDOOR_WEBHOOK_SECRET=<RANDOM-32-CHAR-SECRET>

# ═════════════════════════════════════════════════════════════════════════
# DATABASE: SUPABASE
# ═════════════════════════════════════════════════════════════════════════

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR-ANON-KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR-SERVICE-ROLE-KEY>

# ═════════════════════════════════════════════════════════════════════════
# STRIPE: PAYMENTS (Already set, verify)
# ═════════════════════════════════════════════════════════════════════════

STRIPE_SECRET_KEY=sk_live_<YOUR-STRIPE-LIVE-KEY>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<YOUR-STRIPE-LIVE-KEY>

# ═════════════════════════════════════════════════════════════════════════
# EMAIL: RESEND
# ═════════════════════════════════════════════════════════════════════════

RESEND_API_KEY=<YOUR-RESEND-KEY>
```

---

## 🔑 Complete Variable Checklist

### Phase 1 (Required for SMS + GHL)
- [ ] `GHL_API_KEY`
- [ ] `GHL_LOCATION_ID`
- [ ] `GHL_WEBHOOK_SECRET`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE`
- [ ] `YOUR_SMS_NUMBER`
- [ ] `CRON_SECRET`

### Phase 2 (Required for AI + Scheduling)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `CALENDLY_API_TOKEN`
- [ ] `CALENDLY_CALENDAR_UUID`
- [ ] `SLACK_WEBHOOK_URL`
- [ ] (Optional) `SLACK_BOT_TOKEN`

### Phase 3 (Required for Multi-Channel)
- [ ] `META_APP_ID`
- [ ] `META_APP_SECRET`
- [ ] `FACEBOOK_PAGE_ACCESS_TOKEN`
- [ ] `META_WEBHOOK_VERIFY_TOKEN`
- [ ] `GOOGLE_ADS_CUSTOMER_ID`
- [ ] `GOOGLE_ADS_DEVELOPER_TOKEN`
- [ ] `GOOGLE_CONVERSION_ID`
- [ ] `GOOGLE_ADS_ACCESS_TOKEN`

### Nextdoor (Required for Neighborhood Ads)
- [ ] `NEXTDOOR_API_KEY`
- [ ] `NEXTDOOR_WEBHOOK_SECRET`

### Database (Already Set - Verify)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Payments (Already Set - Verify)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Email (Already Set - Verify)
- [ ] `RESEND_API_KEY`

---

## 📝 Step-by-Step Vercel Setup

### 1. Go to Vercel Dashboard
```
https://vercel.com/your-account/kealee-platform-v10/settings/environment-variables
```

### 2. Select Environment
Click: **Production** (not staging/preview)

### 3. Add Each Variable
For each variable:
1. Name: `VARIABLE_NAME`
2. Value: `your-actual-value`
3. Click "Save"

### 4. Redeploy
After adding all variables:
1. Go to: Deployments
2. Find latest deployment
3. Click "Redeploy"
4. Choose "Production"
5. Wait for build to complete

### 5. Verify
After deploy:
1. Go to: Logs → Deployment
2. Look for: "Build successful"
3. Test endpoints:
   ```bash
   pnpm run activate:phase1
   pnpm run test:ghl
   ```

---

## 🔐 Security Best Practices

✅ **DO:**
- Use Vercel's production environment
- Keep secrets in Vercel, NOT in code
- Use random 32-char secrets for webhooks
- Rotate secrets regularly
- Use separate keys for prod vs staging

❌ **DON'T:**
- Commit `.env` files to git
- Share secrets in Slack/email
- Use weak secrets
- Use same secret for multiple services
- Leave secrets in code comments

---

## 🧪 Testing After Setup

### Test Phase 1
```bash
pnpm run activate:phase1
pnpm run test:ghl
pnpm run test:marketing-setup
```

Expected output:
```
✅ GHL location connected: "Your Location"
✅ Twilio account connected
✅ Phase 1 activation complete!
```

### Test Manual Lead
1. Go to: `https://kealee.com/intake/concept`
2. Fill form (budget=$50k, timeline=ASAP, upload photo)
3. Submit payment
4. Wait 5 minutes
5. Check:
   - SMS alert on YOUR_SMS_NUMBER
   - Supabase: lead_score + routing_tag populated
   - GHL: new contact created

---

## 📱 Variable Reference

| Variable | Service | Type | Required |
|----------|---------|------|----------|
| GHL_API_KEY | GoHighLevel | API Key | Phase 1 |
| GHL_LOCATION_ID | GoHighLevel | ID | Phase 1 |
| GHL_WEBHOOK_SECRET | GoHighLevel | Secret | Phase 1 |
| TWILIO_ACCOUNT_SID | Twilio | Account ID | Phase 1 |
| TWILIO_AUTH_TOKEN | Twilio | Token | Phase 1 |
| TWILIO_PHONE | Twilio | Phone | Phase 1 |
| YOUR_SMS_NUMBER | Twilio | Phone | Phase 1 |
| CRON_SECRET | Kealee | Secret | Phase 1 |
| ANTHROPIC_API_KEY | Claude | API Key | Phase 2 |
| CALENDLY_API_TOKEN | Calendly | Token | Phase 2 |
| CALENDLY_CALENDAR_UUID | Calendly | UUID | Phase 2 |
| SLACK_WEBHOOK_URL | Slack | URL | Phase 2 |
| SLACK_BOT_TOKEN | Slack | Token | Phase 2 (opt) |
| META_APP_ID | Meta | ID | Phase 3 |
| META_APP_SECRET | Meta | Secret | Phase 3 |
| FACEBOOK_PAGE_ACCESS_TOKEN | Facebook | Token | Phase 3 |
| META_WEBHOOK_VERIFY_TOKEN | Meta | Secret | Phase 3 |
| GOOGLE_ADS_CUSTOMER_ID | Google | ID | Phase 3 |
| GOOGLE_ADS_DEVELOPER_TOKEN | Google | Token | Phase 3 |
| GOOGLE_CONVERSION_ID | Google | ID | Phase 3 |
| GOOGLE_ADS_ACCESS_TOKEN | Google | Token | Phase 3 |
| NEXTDOOR_API_KEY | Nextdoor | Key | Nextdoor |
| NEXTDOOR_WEBHOOK_SECRET | Nextdoor | Secret | Nextdoor |

---

## 💾 Where to Get Each Value

| Service | Value | Where to Get |
|---------|-------|-------------|
| GHL | API Key | GHL App → Settings → API Keys |
| GHL | Location ID | GHL Dashboard URL or app |
| Twilio | Account SID | Twilio Console → Account Info |
| Twilio | Auth Token | Twilio Console → Account Info |
| Twilio | Phone Number | Twilio Console → Phone Numbers |
| Claude | API Key | console.anthropic.com → API Keys |
| Calendly | API Token | Calendly → Settings → Integrations |
| Calendly | Calendar UUID | Calendly API call (see instructions) |
| Slack | Webhook URL | Slack Workspace → Apps → Webhooks |
| Meta | App ID/Secret | Meta Developers → Apps → Settings |
| Facebook | Access Token | Facebook → Manage Pages |
| Google | Credentials | Google Cloud Console |
| Nextdoor | API Key | Nextdoor Ads → Settings |

---

## ✅ Deployment Checklist

- [ ] All Phase 1 variables set
- [ ] All Phase 2 variables set
- [ ] All Phase 3 variables set
- [ ] Nextdoor variables set (optional)
- [ ] Database variables verified
- [ ] Stripe variables verified
- [ ] Email variables verified
- [ ] Redeploy to Production
- [ ] Run verification scripts
- [ ] Test with manual lead
- [ ] Go live!

---

## 🆘 Troubleshooting

### "Environment variable not found"
- Verify spelling (case-sensitive)
- Verify in correct environment (Production)
- Redeploy after adding

### "API Key invalid"
- Verify key is complete (not truncated)
- Check key is for correct environment (test vs live)
- Regenerate if necessary

### "Webhook not firing"
- Verify webhook URL is exactly correct
- Verify in Vercel environment variables
- Verify service sending to correct URL
- Check firewall/security rules

### "Cron job not running"
- Verify `CRON_SECRET` set
- Verify cron service configured (EasyCron, Railway, etc.)
- Verify endpoint URL is accessible
- Test manually with curl

---

**Status:** Ready for Production Configuration  
**Next Step:** Copy variables, fill in YOUR values, save in Vercel, redeploy  
**Time:** 30 minutes to complete all variables

Let me know when you've set the variables and I'll help verify! 🚀
