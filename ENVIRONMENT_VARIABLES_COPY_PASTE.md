# Environment Variables - Copy & Paste Format
## By Service/Platform

**Last Updated:** May 8, 2026  
**Total Variables:** 40+  
**Status:** Production Ready

---

## ⚠️ CRITICAL NOTES BEFORE STARTING

1. **Never commit .env files to git** (already in .gitignore)
2. **Use LIVE keys in production**, TEST keys in preview/staging
3. **Rotate keys quarterly**
4. **Back up your current env vars** before making changes
5. **Test in preview first**, then promote to production

---

# VERCEL (web-main Frontend)

## Section 1: Database & Core

Copy and paste into: **Vercel → Settings → Environment Variables**

```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY-FROM-SUPABASE]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY-FROM-SUPABASE]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB_NAME]
```

Where to get these:
- **SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
- **ANON_KEY**: Supabase Dashboard → Settings → API → `anon` key
- **SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → `service_role` key
- **JWT_SECRET**: Supabase Dashboard → Settings → API → JWT Secret
- **DATABASE_URL**: Supabase Dashboard → Database → Connection String (select "URI")

---

## Section 2: Stripe (Payments)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR-LIVE-KEY]
STRIPE_SECRET_KEY=sk_live_[YOUR-LIVE-KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR-WEBHOOK-SECRET]
STRIPE_ENABLED=true
STRIPE_MODE=live
```

**⚠️ IMPORTANT:**
- Use `pk_live_` and `sk_live_` **ONLY in production**
- Use `pk_test_` and `sk_test_` in preview/staging
- Get from: Stripe Dashboard → Developers → API Keys
- Webhook Secret: Stripe Dashboard → Developers → Webhooks → Click webhook endpoint → Signing secret

---

## Section 3: GoHighLevel (GHL) Integration

```
GHL_API_KEY=[YOUR-GHL-API-KEY]
GHL_LOCATION_ID=[YOUR-GHL-LOCATION-ID]
GHL_WEBHOOK_VERIFY_TOKEN=[ANY-RANDOM-STRING-YOU-CREATE]
```

Where to get these:
- **GHL_API_KEY**: GHL Dashboard → Settings → API Keys → Generate New Key
- **GHL_LOCATION_ID**: GHL Dashboard → Settings → Location ID (shown at top)
- **GHL_WEBHOOK_VERIFY_TOKEN**: Create any secure random string (used to verify webhook calls)

---

## Section 4: Twilio (SMS Alerts)

```
TWILIO_ACCOUNT_SID=[YOUR-ACCOUNT-SID]
TWILIO_AUTH_TOKEN=[YOUR-AUTH-TOKEN]
TWILIO_PHONE_NUMBER=+1[YOUR-TWILIO-PHONE]
YOUR_SMS_NUMBER=+1[YOUR-PERSONAL-PHONE]
```

Where to get these:
- **ACCOUNT_SID & AUTH_TOKEN**: Twilio Console → Account Info (top right)
- **TWILIO_PHONE_NUMBER**: Twilio Console → Phone Numbers → Manage Numbers → Choose your number
- **YOUR_SMS_NUMBER**: Your personal phone number (alerts will go here)

---

## Section 5: Calendly (Auto-Scheduling)

```
CALENDLY_API_TOKEN=[YOUR-CALENDLY-API-TOKEN]
CALENDLY_USER_URI=https://api.calendly.com/users/[YOUR-USER-ID]
```

Where to get these:
- **API_TOKEN**: Calendly → Settings → Integrations → API Token (generate if needed)
- **USER_URI**: Calendly API Documentation → Get "user" endpoint, use your user ID

---

## Section 6: Slack (Notifications)

```
SLACK_WEBHOOK_LEADS=#leads
SLACK_WEBHOOK_URL_LEADS=https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
SLACK_WEBHOOK_URL_URGENT=https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
SLACK_WEBHOOK_URL_ALERTS=https://hooks.slack.com/services/[YOUR-WEBHOOK-ID]
```

Where to get these:
- Go to: Slack → Your Workspace → Settings & administration → Manage apps → Custom Integrations → Incoming Webhooks
- Create 3 webhooks (one for each channel)
- Copy the full webhook URL for each

---

## Section 7: Meta / Facebook Ads

```
FACEBOOK_PIXEL_ID=[YOUR-PIXEL-ID]
FACEBOOK_APP_ID=[YOUR-APP-ID]
FACEBOOK_APP_SECRET=[YOUR-APP-SECRET]
FACEBOOK_WEBHOOK_VERIFY_TOKEN=[RANDOM-STRING-YOU-CREATE]
FACEBOOK_WEBHOOK_SECRET=[YOUR-WEBHOOK-SECRET]
```

Where to get these:
- **PIXEL_ID**: Facebook Ads Manager → Settings → Pixels → Your Pixel ID
- **APP_ID & SECRET**: Facebook Developers → My Apps → Your App → Settings → Basic
- **WEBHOOK tokens**: You create these, Facebook will use them to authenticate with your endpoints

---

## Section 8: Google Ads

```
GOOGLE_ADS_CLIENT_ID=[YOUR-CLIENT-ID]
GOOGLE_ADS_CLIENT_SECRET=[YOUR-CLIENT-SECRET]
GOOGLE_ADS_DEVELOPER_TOKEN=[YOUR-DEVELOPER-TOKEN]
GOOGLE_ADS_REFRESH_TOKEN=[YOUR-REFRESH-TOKEN]
```

Where to get these:
- Go to: Google Cloud Console → APIs & Services → OAuth 2.0 Client ID
- Use Google Ads API credentials (requires approval from Google)
- More info: https://developers.google.com/google-ads/api/docs/get-started/authentication

---

## Section 9: Nextdoor Ads

```
NEXTDOOR_API_KEY=[YOUR-NEXTDOOR-API-KEY]
NEXTDOOR_WEBHOOK_VERIFY_TOKEN=[RANDOM-STRING-YOU-CREATE]
```

Where to get these:
- Nextdoor Ads Platform → Settings → API Keys
- Generate a new API key and copy

---

## Section 10: Reddit Ads

```
REDDIT_API_CLIENT_ID=[YOUR-CLIENT-ID]
REDDIT_API_CLIENT_SECRET=[YOUR-CLIENT-SECRET]
REDDIT_API_USERNAME=[YOUR-REDDIT-USERNAME]
REDDIT_API_PASSWORD=[YOUR-REDDIT-PASSWORD]
REDDIT_WEBHOOK_VERIFY_TOKEN=[RANDOM-STRING-YOU-CREATE]
```

Where to get these:
- Reddit Ads Manager → Settings → API Credentials
- Must register as a developer first on reddit.com/settings/apps

---

## Section 11: Email & Communication

```
RESEND_API_KEY=[YOUR-RESEND-API-KEY]
SENDGRID_API_KEY=[YOUR-SENDGRID-API-KEY]
NEXT_PUBLIC_SUPPORT_EMAIL=support@kealee.com
```

Where to get these:
- **RESEND_API_KEY**: Resend Dashboard → API Keys → Create new (for transactional email)
- **SENDGRID_API_KEY**: SendGrid Dashboard → Settings → API Keys

---

## Section 12: Authentication & Security

```
NEXTAUTH_SECRET=[GENERATE-NEW-WITH-OPENSSL]
NEXTAUTH_URL=https://kealee.com
KEALEE_OPS_SECRET=[YOUR-SECRET-OPS-KEY]
CRON_SECRET=[YOUR-CRON-SECRET]
API_AUTH_TOKEN=[YOUR-API-TOKEN]
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/

---

## Section 13: Feature Flags & Configuration

```
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
ENABLE_REAL_INTAKE=true
ENABLE_STRIPE_LIVE=true
MAINTENANCE_MODE=false
```

---

## Section 14: Analytics & Monitoring

```
NEXT_PUBLIC_ANALYTICS_ID=[YOUR-GOOGLE-ANALYTICS-ID]
SENTRY_AUTH_TOKEN=[YOUR-SENTRY-TOKEN]
DATADOG_API_KEY=[YOUR-DATADOG-KEY]
```

Where to get these:
- **GOOGLE_ANALYTICS_ID**: Google Analytics → Admin → Property Settings → Measurement ID
- **SENTRY_TOKEN**: Sentry → Settings → Auth Tokens
- **DATADOG_KEY**: Datadog → Settings → API Keys

---

## Quick Copy-Paste Template for Vercel

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
DATABASE_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_
STRIPE_SECRET_KEY=sk_live_
STRIPE_WEBHOOK_SECRET=whsec_
STRIPE_ENABLED=true
STRIPE_MODE=live
GHL_API_KEY=
GHL_LOCATION_ID=
GHL_WEBHOOK_VERIFY_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
YOUR_SMS_NUMBER=
CALENDLY_API_TOKEN=
CALENDLY_USER_URI=https://api.calendly.com/users/
SLACK_WEBHOOK_URL_LEADS=https://hooks.slack.com/services/
SLACK_WEBHOOK_URL_URGENT=https://hooks.slack.com/services/
SLACK_WEBHOOK_URL_ALERTS=https://hooks.slack.com/services/
FACEBOOK_PIXEL_ID=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=
FACEBOOK_WEBHOOK_SECRET=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_REFRESH_TOKEN=
NEXTDOOR_API_KEY=
NEXTDOOR_WEBHOOK_VERIFY_TOKEN=
REDDIT_API_CLIENT_ID=
REDDIT_API_CLIENT_SECRET=
REDDIT_API_USERNAME=
REDDIT_API_PASSWORD=
REDDIT_WEBHOOK_VERIFY_TOKEN=
RESEND_API_KEY=
SENDGRID_API_KEY=
NEXT_PUBLIC_SUPPORT_EMAIL=support@kealee.com
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://kealee.com
KEALEE_OPS_SECRET=
CRON_SECRET=
API_AUTH_TOKEN=
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://kealee.com
NEXT_PUBLIC_API_URL=https://api.kealee.com
ENABLE_REAL_INTAKE=true
ENABLE_STRIPE_LIVE=true
MAINTENANCE_MODE=false
NEXT_PUBLIC_ANALYTICS_ID=
SENTRY_AUTH_TOKEN=
DATADOG_API_KEY=
```

---

# RAILWAY (API Services)

## Section 1: Database

Copy and paste into: **Railway → Project → Variables**

```
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB_NAME]
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

---

## Section 2: Stripe

```
STRIPE_SECRET_KEY=sk_live_[YOUR-KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR-SECRET]
```

---

## Section 3: GoHighLevel

```
GHL_API_KEY=[YOUR-KEY]
GHL_LOCATION_ID=[YOUR-ID]
```

---

## Section 4: Twilio

```
TWILIO_ACCOUNT_SID=[YOUR-SID]
TWILIO_AUTH_TOKEN=[YOUR-TOKEN]
TWILIO_PHONE_NUMBER=+1[YOUR-NUMBER]
```

---

## Section 5: Slack

```
SLACK_WEBHOOK_URL_LEADS=https://hooks.slack.com/services/[YOUR-WEBHOOK]
SLACK_WEBHOOK_URL_URGENT=https://hooks.slack.com/services/[YOUR-WEBHOOK]
SLACK_WEBHOOK_URL_ALERTS=https://hooks.slack.com/services/[YOUR-WEBHOOK]
```

---

## Section 6: Security

```
API_SECRET=[YOUR-SECRET]
JWT_SECRET=[YOUR-SECRET]
REDIS_URL=redis://[HOST]:[PORT]
```

---

## Section 7: Configuration

```
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

---

# SUPABASE (Database)

## Setup Instructions

**No environment variables needed for Supabase itself**, but here's what you need to know:

1. **Project URL**: Shown in Settings → API
2. **Service Role Key**: Use this for backend operations (keep secret!)
3. **Anon Key**: Use this for frontend operations (public)
4. **JWT Secret**: Never share, keep secure

**Verify connection:**
```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DB_NAME]"
```

---

# EXTERNAL SERVICES (Third-Party Platforms)

## GHL (GoHighLevel)

**Setup in GHL Dashboard:**
1. Settings → API Keys → Generate New Key
2. Settings → Location ID (copy it)
3. Settings → Webhooks → Add webhook
   - URL: `https://kealee.com/api/webhooks/ghl`
   - Events: `contact.updated`, `opportunity.stage_changed`

---

## Twilio

**Setup in Twilio Console:**
1. Account Info (top right) → Copy Account SID & Auth Token
2. Phone Numbers → Manage Numbers → Copy your Twilio phone
3. Your personal phone: Copy your real phone number (for alerts)

**Verify connection:**
```bash
curl -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN \
  https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID.json
```

---

## Slack

**Setup in Slack:**
1. Your Workspace → Settings & administration → Manage apps
2. Search "Incoming Webhooks"
3. Create 3 webhooks:
   - One for `#leads` channel
   - One for `#urgent` channel
   - One for `#alerts` channel
4. Copy each webhook URL

**Verify connection:**
```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'
```

---

## Facebook Ads

**Setup in Facebook:**
1. Meta Ads Manager → Settings → Pixels → Create Pixel (copy Pixel ID)
2. Facebook Developers → My Apps → Your App → Settings → Basic (copy App ID & Secret)
3. Webhooks → Add webhook
   - URL: `https://kealee.com/api/webhooks/facebook-leads`
   - Events: `lead`

---

## Google Ads

**Setup in Google Cloud:**
1. Google Cloud Console → APIs & Services → Enable "Google Ads API"
2. Create OAuth 2.0 credentials (Web application)
3. Add redirect URI: `https://kealee.com/auth/google/callback`
4. Generate and download credentials JSON
5. Extract: Client ID, Client Secret, Refresh Token

---

## Nextdoor Ads

**Setup in Nextdoor:**
1. Nextdoor Ads Manager → Settings → API Credentials
2. Generate new API key
3. Webhooks → Add webhook
   - URL: `https://kealee.com/api/webhooks/nextdoor-leads`

---

## Reddit Ads

**Setup in Reddit:**
1. Create Reddit app at: reddit.com/prefs/apps → Create new app (type: web app)
2. Copy Client ID and Client Secret
3. Use your Reddit username and password
4. Webhooks → Add webhook
   - URL: `https://kealee.com/api/webhooks/reddit-leads`

---

# SETUP CHECKLIST

## Priority 1 (Required to Go Live)

- [ ] Supabase (DATABASE_URL, keys)
- [ ] Stripe (LIVE keys, webhook secret)
- [ ] Vercel (deploy with env vars)
- [ ] Railway (if using API services)

## Priority 2 (Lead Processing)

- [ ] GHL (API key, location ID, webhook)
- [ ] Twilio (Account SID, Auth Token, phone numbers)
- [ ] Slack (webhook URLs for 3 channels)

## Priority 3 (Lead Generation)

- [ ] Facebook (Pixel ID, App credentials, webhook)
- [ ] Google Ads (API credentials)
- [ ] Nextdoor (API key, webhook)
- [ ] Reddit (API credentials, webhook)

## Priority 4 (Optional)

- [ ] Calendly (for auto-scheduling)
- [ ] Analytics (Datadog, Sentry)
- [ ] Email (Resend, SendGrid)

---

# STEP-BY-STEP SETUP

## 1. Vercel (5 minutes)

```
Vercel Dashboard → web-main → Settings → Environment Variables
```

Add all variables from the Vercel section above.

Test:
```bash
pnpm run activate:phase1
```

---

## 2. Railway (5 minutes)

```
Railway Dashboard → Your Project → Variables
```

Add all variables from the Railway section above.

---

## 3. Supabase (2 minutes)

Get your credentials:
```
Supabase → Settings → API
```

Copy and verify in Vercel/Railway env vars.

---

## 4. Stripe (2 minutes)

```
Stripe → Developers → API Keys
Get LIVE keys (NOT test keys for production)
```

Add to Vercel env vars.

---

## 5. GHL (5 minutes)

```
1. Go to GHL Dashboard
2. Settings → API Keys → Generate
3. Settings → Location ID
4. Settings → Webhooks → Add webhook
   URL: https://kealee.com/api/webhooks/ghl
   Events: contact.updated, opportunity.stage_changed
```

Add keys to Vercel.

---

## 6. Twilio (3 minutes)

```
1. Twilio Console → Account Info → Copy SID & Token
2. Phone Numbers → Manage → Copy your Twilio number
3. Add your personal phone for alerts
```

Add to Vercel.

---

## 7. Slack (5 minutes)

```
1. Create 3 incoming webhooks for 3 different channels
2. Copy webhook URLs
3. Add to Vercel env vars
```

---

## 8. Facebook (5 minutes)

```
1. Meta Ads Manager → Settings → Pixels → Create
2. Meta Developers → App ID & Secret
3. Add webhook
4. Add to Vercel
```

---

## 9. Google Ads (5 minutes)

```
1. Google Cloud → APIs & Services → Google Ads API
2. Create OAuth credentials
3. Add to Vercel
```

---

## 10. Nextdoor & Reddit (10 minutes)

```
1. Nextdoor Ads → Settings → API
2. Reddit → Create app
3. Add webhooks
4. Add to Vercel
```

---

# VERIFICATION COMMANDS

```bash
# Test GHL connection
pnpm run test:ghl

# Test all marketing setup
pnpm run test:marketing-setup

# Run full activation
pnpm run activate:phase1

# Check Slack webhook
curl -X POST $SLACK_WEBHOOK_URL_LEADS \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test from Kealee"}'

# Check database connection
psql $DATABASE_URL -c "SELECT version();"
```

---

# QUICK REFERENCE TABLE

| Service | Variable | Format | Where |
|---------|----------|--------|-------|
| Supabase | DATABASE_URL | postgresql://... | Supabase → Settings |
| Stripe | STRIPE_SECRET_KEY | sk_live_... | Stripe → API Keys |
| GHL | GHL_API_KEY | [32-char key] | GHL → Settings |
| Twilio | TWILIO_ACCOUNT_SID | AC... | Twilio Console |
| Slack | SLACK_WEBHOOK_URL | https://hooks.slack... | Slack → Webhooks |
| Facebook | FACEBOOK_APP_ID | [numeric] | Meta → App Settings |
| Google | GOOGLE_ADS_CLIENT_ID | [string].apps.google... | Google Cloud |

---

**Status:** Ready for Setup  
**Time Required:** 60–90 minutes total  
**Next Step:** Start with Priority 1, then Priority 2, then launch!
