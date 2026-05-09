# Environment Variables Status - May 9, 2026

**Status:** ✅ All variable placeholders created  
**Next:** Add the actual values

---

## Summary

You've successfully created **30 environment variables** in Vercel with empty values.

Now you need to:
1. Add **2 auto-generated secrets** (below)
2. Fill in **24 service API keys** (from external services)

---

## Part 1: Add Auto-Generated Secrets (DO THIS NOW)

### Option A: Via Vercel Dashboard (Easiest)

Go to: `https://vercel.com/dashboard → web-main → Settings → Environment Variables`

Add these 2 variables:

**Variable 1:**
```
Name: CRON_SECRET
Value: cb0d7162acd52923e233deccfc2e90ef94928332886f92c53fdb1fac9dcd0155
```

**Variable 2:**
```
Name: KEALEE_OPS_SECRET
Value: 4c46ac596739718fffde574f8484a0ca72086ba169a2aa264295d0da925a80de
```

Then click "Save" and **Redeploy**.

---

### Option B: Via Terminal

```bash
vercel env add CRON_SECRET "cb0d7162acd52923e233deccfc2e90ef94928332886f92c53fdb1fac9dcd0155" --yes

vercel env add KEALEE_OPS_SECRET "4c46ac596739718fffde574f8484a0ca72086ba169a2aa264295d0da925a80de" --yes
```

---

## Part 2: Fill in Service API Keys

You have **24 empty variables** waiting for actual values:

### Priority 1: CRITICAL (Get Today)

```
GHL_API_KEY                    [from GoHighLevel]
GHL_LOCATION_ID                [from GoHighLevel]
TWILIO_ACCOUNT_SID             [from Twilio]
TWILIO_AUTH_TOKEN              [from Twilio]
TWILIO_PHONE_NUMBER            [your Twilio phone]
YOUR_SMS_NUMBER                [your personal phone]
```

### Priority 2: IMPORTANT (Get This Week)

```
SLACK_WEBHOOK_URL_LEADS        [from Slack]
SLACK_WEBHOOK_URL_URGENT       [from Slack]
SLACK_WEBHOOK_URL_ALERTS       [from Slack]
CALENDLY_API_TOKEN             [from Calendly]
CALENDLY_USER_URI              [from Calendly]
```

### Priority 3: ADS (Get When Ready)

```
FACEBOOK_PIXEL_ID              [from Meta]
FACEBOOK_APP_ID                [from Meta]
FACEBOOK_APP_SECRET            [from Meta]
FACEBOOK_WEBHOOK_SECRET        [from Meta]
GOOGLE_ADS_CLIENT_ID           [from Google Cloud]
GOOGLE_ADS_CLIENT_SECRET       [from Google Cloud]
GOOGLE_ADS_DEVELOPER_TOKEN     [from Google]
GOOGLE_ADS_REFRESH_TOKEN       [from Google]
NEXTDOOR_API_KEY               [from Nextdoor]
REDDIT_API_CLIENT_ID           [from Reddit]
REDDIT_API_CLIENT_SECRET       [from Reddit]
REDDIT_API_USERNAME            [your Reddit username]
REDDIT_API_PASSWORD            [your Reddit password]
```

---

## Where to Get Each Value

### GoHighLevel (GHL)

1. Go to: `GHL Dashboard → Settings → API Keys`
2. Click "Generate New Key"
3. Copy the API key
4. Copy Location ID from dashboard header

### Twilio

1. Go to: `Twilio Console → Account Info`
2. Copy: Account SID, Auth Token
3. Go to: `Phone Numbers → Manage`
4. Copy your Twilio phone number
5. Your personal phone: Any phone to receive SMS alerts

### Slack

1. Go to: `Slack workspace → Settings & administration → Manage apps`
2. Search: "Incoming Webhooks"
3. Click "New webhook"
4. Select channel: #leads → Authorize
5. Copy webhook URL → paste as `SLACK_WEBHOOK_URL_LEADS`
6. Repeat for #urgent and #alerts

### Facebook/Meta

1. Go to: `Meta Ads Manager → Settings`
2. Click "Business Integrations"
3. Copy: Pixel ID, App ID, App Secret
4. Or: `Meta Developers → Your App → Settings → Basic`

### Google Ads

1. Go to: `Google Cloud Console → APIs & Services`
2. Enable "Google Ads API"
3. Create OAuth 2.0 credentials
4. Download JSON file
5. Extract Client ID, Client Secret, Refresh Token

### Nextdoor

1. Go to: `Nextdoor Ads Manager → Settings`
2. Click "API Keys"
3. Generate & copy new key

### Reddit

1. Go to: `reddit.com/prefs/apps`
2. Click "Create new app"
3. Type: "web app"
4. Copy: Client ID, Client Secret
5. Use your Reddit username & password

### Calendly

1. Go to: `Calendly → Settings → Integrations`
2. Click "API Token"
3. Generate new token
4. Copy token & your User URI

---

## Current Status

| Component | Status |
|-----------|--------|
| Variables created | ✅ 30 placeholders |
| Auto-secrets ready | ✅ 2 values generated |
| Code deployed | ✅ Vercel ready |
| Database migrations | ✅ Applied (from previous) |
| Next action | ⏳ Add 2 secrets + 24 API keys |

---

## Next Steps (in order)

1. **TODAY** (30 min):
   - [ ] Add CRON_SECRET value
   - [ ] Add KEALEE_OPS_SECRET value
   - [ ] Redeploy in Vercel
   - [ ] Run: `pnpm run activate:phase1`

2. **This Week** (2 hours):
   - [ ] Get GHL, Twilio, Slack keys
   - [ ] Add Priority 1 variables
   - [ ] Test with: `pnpm run test:ghl`

3. **When Ready** (ongoing):
   - [ ] Add Facebook, Google, Nextdoor, Reddit keys
   - [ ] Test each connection
   - [ ] Launch ad campaigns

---

## Quick Commands Reference

```bash
# After adding secrets, redeploy
vercel redeploy

# Test GHL connection
pnpm run test:ghl

# Test full setup
pnpm run activate:phase1

# Generate new random secret if needed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Important Notes

- ✅ All 30 variables created successfully
- ✅ Code is deployed and ready
- ✅ Database migrations applied
- ✅ Webhooks configured
- ⏳ Waiting for API keys to be added
- 🎯 Start with Priority 1 (GHL, Twilio, Slack)

---

**Status:** Ready for secret values  
**Time to go live:** 1–2 hours once you add the API keys  
**Support:** See ENVIRONMENT_VARIABLES_COPY_PASTE.md for detailed instructions
