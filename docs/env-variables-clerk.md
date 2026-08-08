# Clerk Configuration — Environment Variables

This document lists all Clerk-related environment variables required for the Kealee Platform.

## Quick Setup

1. Create a Clerk application at https://clerk.com
2. Copy values from Clerk Dashboard → Configure → API Keys
3. Add these values to your deployment environment

---

## Frontend Apps (Next.js — web-main, portals, mini-apps)

### Required Variables

```bash
# Publishable Key (safe to expose to browser)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx... OR pk_test_xxx...

# Secret Key (NEVER expose to browser — API-only)
CLERK_SECRET_KEY=sk_live_xxx... OR sk_test_xxx...

# Sign-in page URL (where unauthenticated users are redirected)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Sign-up page URL
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# After sign-in redirect (where authenticated users land)
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

# After sign-up redirect (onboarding or dashboard)
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Optional Variables

```bash
# Force Clerk to use specific domain (useful for multi-tenant)
NEXT_PUBLIC_CLERK_FRONTEND_API=https://your-domain.clerk.accounts.dev

# Rate limiting: max login attempts
CLERK_MAX_SIGN_IN_ATTEMPTS=5

# Rate limiting: lockout duration (seconds)
CLERK_SIGN_IN_LOCKOUT_DURATION=600
```

### Where to Set These

**Local Development:**
- Create `.env.local` in each Next.js app (apps/web-main, apps/portal-owner, etc.)
- Or in root `.env.local` (if using monorepo env setup)

**Railway Deployment:**
- Dashboard → Services → [app name] → Settings → Environment
- OR via CLI: `railway variables set KEY=VALUE`

**GitHub Actions (CI/CD):**
- Settings → Secrets and variables → Actions
- Add as `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, etc.

---

## Backend API (services/api — Fastify)

### Required Variables

```bash
# Secret Key for webhook verification (NEVER expose to browser)
CLERK_SECRET_KEY=sk_live_xxx... OR sk_test_xxx...

# Webhook Signing Secret (from Clerk Dashboard → Webhooks)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx...

# Optional: For API-to-Clerk communication
CLERK_API_KEY=sk_live_xxx... (same as CLERK_SECRET_KEY)
```

### Where to Set These

**Local Development:**
- Create `.env` in services/api/
- Or in root `.env` (if using shared env)

**Railway Deployment:**
- Dashboard → Services → kealee-api → Settings → Environment
- Set both webhook secret and API key

**GitHub Actions:**
- Secrets for CI/CD webhook validation

---

## Clerk Dashboard Configuration

### 1. Create Application

```
Clerk Dashboard → Applications → Create Application
→ Name: "Kealee Platform"
→ Type: "Next.js"
→ Development/Production environment
```

### 2. Configure Allowed Redirect URLs

```
Configure → Session Settings → Allowed redirect URLs
Add:
  - http://localhost:3000
  - http://localhost:3001 (other dev ports)
  - https://kealee.com
  - https://api.kealee.com
  - https://portal-owner.kealee.com
  - https://portal-contractor.kealee.com
  - https://portal-developer.kealee.com
  - https://admin.kealee.com
```

### 3. Configure Sign-In/Sign-Up URLs

```
Configure → Paths
Sign-in URL:   /sign-in
Sign-up URL:   /sign-up
After sign-in: /dashboard
After sign-up: /onboarding
```

### 4. Enable Authentication Methods

```
Configure → Authentication Methods
✓ Email & Password
✓ Email verification (required)
✓ Google (recommended)
✓ Microsoft (recommended)
- Magic Link (optional)
- Phone Number (optional for now)
```

### 5. Configure Webhooks

```
Configure → Webhooks → Create Endpoint
Endpoint URL: https://api.kealee.com/api/clerk/webhooks
Signing Secret: (auto-generated — save as CLERK_WEBHOOK_SIGNING_SECRET)

Events to enable:
  ✓ user.created
  ✓ user.updated
  ✓ user.deleted
  ✓ organization.created (if using Clerk Organizations)
  ✓ organization.updated
  ✓ organization.deleted
```

### 6. Configure Organizations (Optional)

```
Configure → Organizations → Enable
- Allows users to create and manage organizations
- Maps to Kealee Org model
```

### 7. Customize Email Templates

```
Configure → Email → Customize
- Verification email: Add Kealee branding (logo, colors)
- Password reset email: Same branding
- Invitation email: Add org context
```

---

## Development Workflow

### 1. Get Test Keys

```bash
# From Clerk Dashboard
1. Go to Configure → API Keys
2. Copy "Publishable Key" (starts with pk_test_)
3. Copy "Secret Key" (starts with sk_test_)
4. Create/Edit .env.local with these values
```

### 2. Test Locally

```bash
# In apps/web-main (or another Next.js app)
cd apps/web-main
npm install  # Clerk dependencies
npm run dev

# Visit http://localhost:3000/sign-in
# Sign up with test email
# Verify signup works
```

### 3. Deploy to Staging

```bash
# Set Railway env vars (Dashboard or CLI)
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
railway variables set CLERK_SECRET_KEY=sk_test_xxx

# Push to main — auto-deploys
git push origin main
```

### 4. Switch to Production

```bash
# In Clerk Dashboard
1. Create "Production" environment
2. Copy production keys (pk_live_, sk_live_)
3. Set Railway env vars with production keys
4. Redeploy
```

---

## Troubleshooting

### "Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"

- **Cause**: Key doesn't match environment (test key in production env)
- **Fix**: Use correct key for your environment (test vs. production)

### "Webhook signature invalid"

- **Cause**: `CLERK_WEBHOOK_SIGNING_SECRET` doesn't match
- **Fix**: Copy exact value from Clerk Dashboard → Webhooks

### "User not found in database"

- **Cause**: Clerk webhook didn't run or failed
- **Fix**: Check `services/api/logs` for webhook errors
- **Manual fix**: Create user via `POST /api/clerk/webhooks` (test from Clerk Dashboard)

### "Sign-in page not found"

- **Cause**: `/sign-in` route not created in app
- **Fix**: Check that route exists in `apps/[app]/app/sign-in/page.tsx`

### "CORS error on sign-in"

- **Cause**: Frontend domain not in Clerk redirect URLs
- **Fix**: Add domain to Clerk Dashboard → Configure → Allowed redirect URLs

---

## All 15 Apps — Environment Variables Checklist

Each app needs these vars in their environment (local or Railway):

- [ ] web-main
- [ ] portal-owner
- [ ] portal-contractor
- [ ] portal-developer
- [ ] command-center
- [ ] os-admin
- [ ] m-architect
- [ ] m-estimation
- [ ] m-finance-trust
- [ ] m-marketplace
- [ ] m-ops-services
- [ ] m-permits-inspections
- [ ] m-project-owner
- [ ] marketing
- [ ] marketing-os

Plus API service (services/api) needs webhook secret.

---

## Reference: Clerk Documentation

- Main docs: https://clerk.com/docs
- API keys: https://clerk.com/docs/backend-requests/handling/auth
- Webhooks: https://clerk.com/docs/backend-requests/webhooks
- Email templates: https://clerk.com/docs/references/email-templates
- Next.js guide: https://clerk.com/docs/quickstarts/nextjs
