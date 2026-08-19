# HubSpot Integration Setup Guide

**Status:** Ready to configure  
**Replaces:** GoHighLevel  
**Cost:** FREE tier available  
**Setup Time:** 15 minutes

---

## Why HubSpot Instead of GoHighLevel?

| Feature | HubSpot | GHL |
|---------|---------|-----|
| **Cost** | FREE tier | $97+/month |
| **Contacts** | 1M free | Limited |
| **API** | Excellent | Good |
| **Ease** | Easy | Complex |
| **Automation** | Good | Excellent |
| **Best for** | Small business | Agencies |

**HubSpot Free Tier includes:**
- Unlimited contacts
- Contact management
- Deals & pipelines
- Basic automation
- Email tracking
- Forms & landing pages

---

## Step 1: Create HubSpot Account

1. Go to: `https://www.hubspot.com/pricing/crm`
2. Click "Get Started Free"
3. Sign up with email
4. Choose "Sales" (CRM)
5. Confirm email
6. Complete setup wizard (just click through)

**Time:** 3 minutes

---

## Step 2: Create Private App for API Access

This gives Kealee permission to create contacts in HubSpot.

### 2A: Go to Private Apps

1. In HubSpot, click your account icon (top right)
2. Settings → Integrations → Private apps
3. Or go directly: `https://app.hubspot.com/private-apps/create`

### 2B: Create New Private App

1. Click "Create private app"
2. Name: `Kealee Lead Sync`
3. Description: `Syncs intake leads from Kealee platform`
4. Click "Show less" under "Scopes"

### 2C: Set Permissions

You need these **scopes** (permissions):

Check these boxes:
- ✅ `crm.objects.contacts.read`
- ✅ `crm.objects.contacts.write`
- ✅ `crm.objects.deals.read`
- ✅ `crm.objects.deals.write`

Click "Create app"

### 2D: Copy Your API Key

1. Click "Show token"
2. Copy the token (starts with `pat-`)
3. **Save this somewhere safe** — you only see it once!

Example: `pat-na1-abc123def456...`

**Time:** 5 minutes

---

## Step 3: Add API Key to Vercel

1. Go to: `https://vercel.com/dashboard → web-main → Settings → Environment Variables`
2. Click "Add Variable"
3. Name: `HUBSPOT_API_KEY`
4. Value: `pat-na1-abc123def456...` (your token from step 2D)
5. Click "Save"
6. **Redeploy:** Click latest deployment → "Redeploy"
7. Wait for build to complete

**Time:** 5 minutes

---

## Step 4: Test Connection

Run this in your terminal:

```bash
pnpm run test:hubspot
```

**Expected output:**
```
✅ HubSpot API connection successful
✅ Contact search working
✅ All HubSpot tests passed!
```

---

## Step 5: Update Environment Variables

You now have ONE new variable needed:

```
HUBSPOT_API_KEY = pat-na1-...
```

All other variables from before still apply:
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- YOUR_SMS_NUMBER
- SLACK webhook URLs
- Etc.

**Removed:** GHL_API_KEY, GHL_LOCATION_ID (no longer needed)

---

## How It Works

### Lead Flow

```
Intake Form → Payment → Supabase
                ↓
          Lead Scoring (every 5 min)
                ↓
          Calculate Score & Tag
                ↓
          Create HubSpot Contact
                ↓
          Send SMS Alert (if hot)
                ↓
          Log in Supabase + Slack
```

### What Gets Synced to HubSpot

For each lead:
- **Name** (firstname + lastname)
- **Email**
- **Phone**
- **Lead Score** (0-100)
- **Lead Status** (hot, medium, cold, nurture)
- **Budget** ($)
- **Timeline** (ASAP, 1-3 months, etc.)
- **Project Type** (concept, estimate, permit)
- **Source** (web, facebook, google, etc.)

---

## Using HubSpot

### View Your Leads

1. Log in to HubSpot
2. Click "Contacts" (left sidebar)
3. See all synced leads
4. Click on a contact to view details

### Create Deals (Opportunities)

1. Go to "Deals" (left sidebar)
2. Create deals manually or via automation
3. Track pipeline stages

### Set Up Automation (Optional)

1. Settings → Workflows
2. Create workflow like: "When lead score > 80, send email"
3. Save and activate

---

## Webhook Integration (Optional)

If you want HubSpot to notify Kealee when something changes:

1. In HubSpot: Settings → Integrations → Webhooks
2. Create webhook:
   - URL: `https://kealee.com/api/webhooks/hubspot`
   - Event: `contact.updated`
   - Event: `deal.updated`
3. In Kealee: Webhook handler will process updates

---

## Troubleshooting

### "Connection Failed"

**Problem:** Invalid API key

**Solution:**
1. Copy your API key again from HubSpot
2. Verify it starts with `pat-`
3. Make sure no extra spaces
4. Redeploy in Vercel

### "Contact creation failed"

**Problem:** API key lacks permissions

**Solution:**
1. Go back to Private App
2. Check all 4 scopes are checked
3. Regenerate token if needed
4. Update HUBSPOT_API_KEY in Vercel

### "No leads appearing"

**Problem:** Leads are being scored but not synced

**Solution:**
1. Check Vercel logs: Deployments → latest → Logs
2. Run: `pnpm run test:hubspot`
3. Verify HUBSPOT_API_KEY is set

---

## Monitoring

### Check Lead Sync

```sql
-- In Supabase, see which contacts synced
SELECT 
  id, 
  email, 
  lead_score, 
  ghl_contact_id, 
  created_at
FROM public_intake_leads
WHERE ghl_contact_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check for Errors

```sql
-- See sync errors
SELECT 
  intake_id, 
  action, 
  error_message, 
  created_at
FROM ghl_sync_log
WHERE action = 'error'
ORDER BY created_at DESC;
```

---

## Migration from GHL

If you were using GHL before:

1. **Remove** GHL variables from Vercel:
   - GHL_API_KEY
   - GHL_LOCATION_ID
   - GHL_WEBHOOK_VERIFY_TOKEN

2. **Add** HubSpot variable:
   - HUBSPOT_API_KEY

3. **No database changes needed** - existing leads stay in Supabase
4. **Going forward** - new leads sync to HubSpot instead

---

## Next Steps

1. ✅ Create HubSpot account
2. ✅ Create Private App
3. ✅ Copy API token
4. ✅ Add to Vercel as HUBSPOT_API_KEY
5. ✅ Redeploy
6. ✅ Test with: `pnpm run test:hubspot`
7. ✅ Go live!

---

## Getting Help

**HubSpot Docs:** `https://developers.hubspot.com/docs/api/overview`

**HubSpot Support:** `https://help.hubspot.com/`

**Kealee Docs:** See `ENVIRONMENT_VARIABLES_COPY_PASTE.md` and `GO_LIVE_GUIDE.md`

---

**Status:** Ready to implement  
**Time to setup:** 15 minutes  
**Time to go live:** 1-2 hours (once other variables added)
