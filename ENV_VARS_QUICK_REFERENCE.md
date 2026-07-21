# 🚀 Kealee Environment Variables: Quick Reference
## Copy → Paste → Fill → Deploy

---

## Phase 1: Lead Scoring + SMS (REQUIRED)

```bash
GHL_API_KEY=                          # From: GHL App → Settings → API Keys
GHL_LOCATION_ID=                      # From: GHL Dashboard
GHL_WEBHOOK_SECRET=                   # Generate: openssl rand -hex 16

TWILIO_ACCOUNT_SID=                   # From: Twilio Console → Account Info
TWILIO_AUTH_TOKEN=                    # From: Twilio Console → Account Info
TWILIO_PHONE=+1                       # Format: +1 + area code + number
YOUR_SMS_NUMBER=+1                    # Your personal cell (receives alerts)

CRON_SECRET=                          # Generate: openssl rand -hex 16
```

---

## Phase 2: AI + Calendly + Slack (RECOMMENDED)

```bash
ANTHROPIC_API_KEY=                    # From: console.anthropic.com → API Keys
CALENDLY_API_TOKEN=                   # From: Calendly → Settings → Integrations
CALENDLY_CALENDAR_UUID=               # Get via: curl to Calendly API (see docs)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/  # From: Slack App
```

---

## Phase 3: Multi-Channel + ROI (RECOMMENDED)

```bash
META_APP_ID=                          # From: Meta Developers
META_APP_SECRET=                      # From: Meta Developers
FACEBOOK_PAGE_ACCESS_TOKEN=           # From: Facebook → Manage Pages
META_WEBHOOK_VERIFY_TOKEN=            # Generate: openssl rand -hex 16

GOOGLE_ADS_CUSTOMER_ID=               # From: Google Ads
GOOGLE_ADS_DEVELOPER_TOKEN=           # From: Google Cloud Console
GOOGLE_CONVERSION_ID=                 # From: Google Ads → Conversions
GOOGLE_ADS_ACCESS_TOKEN=              # From: Google OAuth (see docs)
```

---

## Nextdoor: Neighborhood Ads (OPTIONAL)

```bash
NEXTDOOR_API_KEY=                     # From: Nextdoor Ads → Settings
NEXTDOOR_WEBHOOK_SECRET=              # Generate: openssl rand -hex 16
```

---

## Database + Payments (ALREADY SET - VERIFY)

```bash
NEXT_PUBLIC_SUPABASE_URL=             # ✓ Verify in Vercel
NEXT_PUBLIC_SUPABASE_ANON_KEY=        # ✓ Verify in Vercel
SUPABASE_SERVICE_ROLE_KEY=            # ✓ Verify in Vercel

STRIPE_SECRET_KEY=                    # ✓ Verify (sk_live_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # ✓ Verify (pk_live_...)

RESEND_API_KEY=                       # ✓ Verify in Vercel
```

---

## ✅ Deployment Steps

1. Go to: **Vercel Dashboard → Settings → Environment Variables → Production**
2. For each variable above:
   - Click "Add"
   - Name: `VARIABLE_NAME`
   - Value: `your-value`
   - Click "Save"
3. **Redeploy**: Deployments → Latest → Redeploy → Production
4. **Test**:
   ```bash
   pnpm run activate:phase1
   ```

---

## 🔄 Priority Order

**Start with Phase 1** (SMS alerts):
- GHL_API_KEY, GHL_LOCATION_ID, GHL_WEBHOOK_SECRET
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE, YOUR_SMS_NUMBER
- CRON_SECRET

**Then Phase 2** (AI qualification):
- ANTHROPIC_API_KEY, CALENDLY_API_TOKEN, CALENDLY_CALENDAR_UUID, SLACK_WEBHOOK_URL

**Then Phase 3** (multi-channel):
- META_APP_ID, META_APP_SECRET, FACEBOOK_PAGE_ACCESS_TOKEN, META_WEBHOOK_VERIFY_TOKEN
- GOOGLE_* (all 4 variables)

**Optional: Nextdoor**:
- NEXTDOOR_API_KEY, NEXTDOOR_WEBHOOK_SECRET

---

## 📞 Support

- **Full Setup Guide:** `ENVIRONMENT_VARIABLES_COMPLETE.md`
- **Phase 1 Activation:** `KEALEE_MARKETING_DEPLOYMENT.md`
- **All Documentation:** `DEPLOYMENT_COMPLETE_SUMMARY.md`

---

## ⏱️ Time Estimate

- Gather all variables: **30–45 min**
- Add to Vercel: **10 min**
- Redeploy: **5 min**
- Test: **5 min**
- **Total: ~1 hour**

---

**Status:** Ready to Deploy  
**File:** Save this as reference while setting variables  

Let's go live! 🎯
