# Portal API Integration & Environment Setup

This guide explains how to configure the three portal applications (Owner, Contractor, Developer) to connect to the live Kealee API and set up email/payment services on Railway.

**Status**: Portal apps currently use mock/localhost data. This guide moves them to production.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Variables Required](#environment-variables-required)
4. [Railway Configuration](#railway-configuration)
5. [API Endpoints](#api-endpoints)
6. [Testing Connectivity](#testing-connectivity)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Three Portal Applications

| Portal | Path | Purpose | Key Features |
|--------|------|---------|--------------|
| **Owner** | `apps/portal-owner/` | Homeowner project management | Track builds, approve payments, messages, project dashboard |
| **Contractor** | `apps/portal-contractor/` | Construction company operations | Lead matching, bid management, scheduling, crew communication |
| **Developer** | `apps/portal-developer/` | Development deal management | Feasibility studies, pro forma tracking, capital stack, portfolio analytics |

### Current State

- **Development**: Using `http://localhost:3001` (local mock API)
- **Production**: Need to update to live API endpoint (e.g., `https://api.kealee.com`)

### What We're Configuring

1. **API Connectivity** - `NEXT_PUBLIC_API_URL` to live endpoint
2. **Email Service** - `RESEND_API_KEY` for transactional emails
3. **Payments** - Stripe keys (usually already set up)
4. **Authentication** - Supabase (usually already set up)

---

## Quick Start

### Step 1: Get Your Credentials

Before starting, gather:

| Service | Get From | What You Need |
|---------|----------|---------------|
| API Endpoint | Ops team / Internal docs | `https://api.kealee.com` or your API URL |
| Resend API Key | https://resend.com → API Keys | `re_...` key |
| Supabase URL | https://supabase.com → Settings | Already set up (usually) |
| Stripe Keys | https://dashboard.stripe.com | Already set up (usually) |

### Step 2: Update Environment Variables on Railway

For each portal service, add variables to Railway:

```bash
# In Railway Dashboard:
# 1. Go to portal-owner service → Variables
# 2. Click "Add Variable"
# 3. Add each key-value pair below
```

**Copy-paste values for each portal:**

#### portal-owner
```
NEXT_PUBLIC_API_URL=https://api.kealee.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>
```

#### portal-contractor
```
NEXT_PUBLIC_API_URL=https://api.kealee.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>
```

#### portal-developer
```
NEXT_PUBLIC_API_URL=https://api.kealee.com
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>
```

### Step 3: Redeploy Services

In Railway:

```bash
# Redeploy each service:
# 1. portal-owner → Deploy → Trigger Deploy
# 2. portal-contractor → Deploy → Trigger Deploy
# 3. portal-developer → Deploy → Trigger Deploy
```

### Step 4: Verify Connectivity

After deployment:

1. Go to https://portal-owner.kealee.com (or your URL)
2. Open DevTools → Network tab
3. Look for API calls to `/api/v1/...` endpoints
4. Verify `200` responses (not `404` or `500`)

---

## Environment Variables Required

### Core (All Portals)

| Variable | Example | Purpose | Required? |
|----------|---------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://api.kealee.com` | Live API endpoint | **YES** |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Auth backend | Usually preset |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Auth token | Usually preset |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Payment processing | Usually preset |

### Email (Conditional)

| Variable | Example | Purpose | Required? |
|----------|---------|---------|-----------|
| `RESEND_API_KEY` | `re_xxxxxxxxxx` | Email service | If sending emails |
| `RESEND_FROM_EMAIL` | `noreply@kealee.com` | Email from address | If sending emails |

### Stripe Price IDs (Owner Portal Example)

```env
NEXT_PUBLIC_STRIPE_PRICE_DESIGN_CONCEPT=price_1Pxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_DESIGN_ADVANCED=price_1Pxxxxxx
NEXT_PUBLIC_STRIPE_PRICE_PERMIT_SIMPLE=price_1Pxxxxxx
# ... etc (see .env.production for full list)
```

**Get these from**: Stripe Dashboard → Products → Copy price IDs

---

## Railway Configuration

### How to Update Variables in Railway

#### Option 1: Railway Dashboard (Easiest)

1. Go to https://railway.app → Your Project
2. Click **portal-owner** service
3. Click **Variables** tab
4. Click **Add Variable**
5. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://api.kealee.com`
6. Click **Add**
7. Repeat for other variables
8. Click **Deploy** → **Trigger Deploy**

#### Option 2: Railway CLI

```bash
# Install Railway CLI (if not already)
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set variables (one at a time or in bulk)
railway variables set NEXT_PUBLIC_API_URL=https://api.kealee.com
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Or edit the .env file directly
railway variables edit

# Deploy
railway deploy
```

#### Option 3: Environment File Upload

You can upload `.env.production` files to each service:

```bash
# Copy the template
cp apps/portal-owner/.env.production apps/portal-owner/.env

# Edit with real values
# Then in Railway: Variables → Upload .env file
```

---

## API Endpoints

The portals call these API endpoints from `NEXT_PUBLIC_API_URL`:

### Messages API (portal-owner, portal-contractor)

```
GET  /api/v1/messages/conversations
GET  /api/v1/messages/conversations/:convId
POST /api/v1/messages/conversations/:convId/send
```

### Projects API (portal-owner, portal-developer)

```
GET  /api/v1/projects
GET  /api/v1/projects/:projectId
POST /api/v1/projects
PATCH /api/v1/projects/:projectId
```

### Payments / Checkout (all portals)

```
POST /api/v1/checkout/sessions
GET  /api/v1/checkout/sessions/:sessionId
```

### Authentication (all portals)

Uses Supabase JWT in Authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

---

## Testing Connectivity

### 1. Verify API URL in Browser

```javascript
// Open DevTools Console on any portal page

// Check what URL is being used
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should output: https://api.kealee.com

// Test a simple API call
fetch('https://api.kealee.com/api/v1/health')
  .then(r => r.json())
  .then(data => console.log('API Status:', data))
```

### 2. Check Network Requests

1. Open DevTools → Network tab
2. Reload the page
3. Look for requests to `/api/v1/...`
4. Verify status is `200` (not `404` or `500`)
5. Check response body has expected data

### 3. Test Each Portal

| Portal | URL | Expected Data |
|--------|-----|----------------|
| Owner | https://portal-owner.app/dashboard | User project list |
| Contractor | https://portal-contractor.app/dashboard | Contractor's active bids/jobs |
| Developer | https://portal-developer.app/dashboard | Developer's projects/deals |

---

## Email Configuration (Resend)

### If You're Using Resend

1. Sign up at https://resend.com
2. Go to **API Keys**
3. Copy your API key (format: `re_xxxxxxxxxxxxx`)
4. Add to Railway for each portal:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=Kealee Platform <noreply@kealee.com>
   ```

### Which Features Need Email?

- **portal-owner**: Payment confirmations, project updates, team invitations
- **portal-contractor**: Lead notifications, bid confirmations, payment alerts
- **portal-developer**: Deal status updates, team communications

If a portal doesn't send emails, you can skip `RESEND_API_KEY` for that one.

---

## Troubleshooting

### Problem: Portal Shows "Failed to load data"

**Cause**: `NEXT_PUBLIC_API_URL` is wrong or API is unreachable

**Solution**:
1. Check DevTools Console → Look for CORS errors
2. Verify API endpoint is correct: `https://api.kealee.com` (not `http://localhost:3001`)
3. Verify API service is running and healthy
4. Check that Bearer token is being sent (Supabase JWT)

### Problem: Emails Not Sending

**Cause**: `RESEND_API_KEY` is missing or invalid

**Solution**:
1. Verify `RESEND_API_KEY` is set in Railway Variables
2. Check key format starts with `re_`
3. Test key at https://resend.com/api-tokens
4. Check for typos

### Problem: "401 Unauthorized" API Errors

**Cause**: Supabase auth token is expired or invalid

**Solution**:
1. Log out and log back in to portal
2. Check Supabase service is accessible
3. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Problem: Payments Not Working

**Cause**: Stripe keys are missing or wrong environment (test vs. live)

**Solution**:
1. Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` for production
2. Verify all `STRIPE_PRICE_*` IDs match your Stripe account
3. Check Stripe Dashboard for webhook errors

### Problem: After Deploy, Still Using Old Values

**Cause**: Railway hasn't rebuilt the application yet

**Solution**:
1. In Railway, force a deploy: **Deploy** → **Trigger Deploy**
2. Wait for build to complete (2-5 minutes)
3. Clear browser cache: Cmd+Shift+Delete
4. Test in incognito window

---

## File Reference

Generated template files (customize with your values):

- `apps/portal-owner/.env.production` — Owner Portal template
- `apps/portal-contractor/.env.production` — Contractor Portal template
- `apps/portal-developer/.env.production` — Developer Portal template

**None of these should be committed to git.** They're templates only. Real values live in Railway.

---

## Next Steps

1. ✅ Get API endpoint URL from ops team
2. ✅ Get Resend API key
3. ✅ Update Railway variables for each portal
4. ✅ Trigger deployments
5. ✅ Test connectivity
6. ✅ Verify emails are sending (if applicable)
7. ✅ Monitor logs for errors

---

## Questions?

- Check Railway logs: **portal-service** → **Logs** tab
- Check browser console: DevTools → Console tab
- Check Stripe Dashboard for payment errors
- Check Resend Dashboard for email delivery issues

Good luck! 🚀
