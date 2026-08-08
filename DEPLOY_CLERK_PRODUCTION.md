# Deploy Clerk to Production — Quick Action Guide

**Timeline**: ~30 minutes  
**Risk Level**: Low (Supabase fallback active)  
**Rollback**: Easy (revert env vars)

---

## Pre-Flight Checklist

- [ ] All code changes committed to main
- [ ] Have Clerk Dashboard open (API keys ready)
- [ ] Have Railway Dashboard open (to set env vars)
- [ ] Database credentials ready

---

## 🚀 DEPLOYMENT STEPS

### 1. Configure Clerk Webhook (5 min)

**In Clerk Dashboard (https://dashboard.clerk.com):**

1. Select your application
2. Go to **Configure** → **Webhooks**
3. Click **+ Create Endpoint**
4. Fill in:
   - **URL**: `https://api.kealee.com/api/clerk/webhooks`
   - **Events**: Check: `user.created`, `user.updated`, `user.deleted`
5. Click **Create**
6. **Copy the signing secret** (save it, you'll need it)

### 2. Set Environment Variables (10 min)

**Get Clerk keys from Dashboard:**
1. Go to **Configure** → **API Keys**
2. Copy: **Publishable Key** (starts with `pk_live_`)
3. Copy: **Secret Key** (starts with `sk_live_`)

**Set on all 14 Railway services:**

Via CLI (faster):
```bash
railway link  # if not already linked

# Set for current service
railway variables set \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY \
  CLERK_SECRET_KEY=sk_live_YOUR_SECRET

# Repeat for each service:
# web-main, portal-owner, portal-contractor, portal-developer,
# command-center, os-admin, m-architect, m-estimation, m-finance-trust,
# m-marketplace, m-ops-services, m-permits-inspections, m-project-owner, marketing-os
```

Or via Dashboard:
1. Railway → Services → [service-name]
2. Settings → Environment
3. Add each variable

**For API service (services/api), also add:**
```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_YOUR_SIGNING_SECRET
```

### 3. Run Database Migration (5 min)

```bash
cd packages/database

# Verify pending migrations
npx prisma migrate status

# Apply migrations (creates clerkUserId, clerkOrgId columns)
npx prisma migrate deploy
```

### 4. Commit & Push (automated deploy)

```bash
git add -A
git commit -m "feat: deploy Clerk authentication to production"
git push origin main

# Railway auto-deploys all services
# Wait ~5 minutes for all services to redeploy
```

### 5. Verify Deployment (5 min)

**Check API service is running:**
```bash
curl https://api.kealee.com/health
# Should return 200 OK
```

**Test sign-in on web-main:**
1. Visit `https://kealee.com/sign-in`
2. Sign up with test email (e.g., `test+$(date +%s)@example.com`)
3. You should see Clerk signup form
4. After signup, should redirect to `/onboarding` or `/dashboard`

**Test sign-in on portal:**
1. Visit `https://portal-owner.kealee.com/sign-in` (or other portal)
2. Sign up with another test email
3. Verify redirect works

**Check webhook is receiving events:**
1. Railway Dashboard → Services → kealee-api → Logs
2. Look for: `[Clerk Webhook] user.created`
3. Check database for new user with `clerkUserId` populated

---

## ✅ Success Criteria

You'll know it's working when:

- [ ] `/sign-in` page shows Clerk form (not blank)
- [ ] Signup completes without errors
- [ ] User redirected to `/onboarding` or `/dashboard`
- [ ] New user appears in database with `clerkUserId` field
- [ ] API logs show `[Clerk Webhook] user.created`
- [ ] No 401/403 errors on API routes

---

## 🔄 Fallback Testing (Optional)

Test that Supabase auth still works:

1. Go to `portal-owner.kealee.com`
2. Try logging in with an **existing** Supabase user
3. Should work (fallback is active)

---

## ⚠️ Troubleshooting

### "Sign-in page is blank"
- [ ] Check NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set on service
- [ ] Check value starts with `pk_live_` or `pk_test_`
- [ ] Restart service in Railway

### "Webhook signature invalid"
- [ ] Check CLERK_WEBHOOK_SIGNING_SECRET is exact match from Clerk
- [ ] Check webhook URL is exactly `https://api.kealee.com/api/clerk/webhooks`
- [ ] Test webhook with Clerk Dashboard "Send Test" button

### "User not appearing in database"
- [ ] Check Railway logs: `railway logs api`
- [ ] Look for errors in webhook handler
- [ ] Verify webhook endpoint is reachable: `curl -X POST https://api.kealee.com/api/clerk/webhooks`

### "API returns 401 Unauthorized"
- [ ] Token may have expired (default 1 hour)
- [ ] Try fresh login
- [ ] Check auth middleware logs

---

## 🎉 Post-Deployment

Once verified in production:

1. **Monitor logs** for next 30 minutes
2. **Test different paths**: web-main, portals, m-apps
3. **Try signup + login flow** on each
4. **Check database growth** (users table)
5. **Enable monitoring** for webhook failures (optional)

---

## 🛑 Rollback (If Needed)

If something's wrong:

```bash
# 1. Remove Clerk env vars from all services
# 2. Or revert to previous git commit
git revert HEAD
git push origin main

# Railway auto-redeploys
# Services fall back to Supabase auth
```

No data loss — Supabase users unaffected.

---

## ✨ What's Now Live

- Clerk signup/login across all 14 apps
- Automatic user sync to database via webhooks
- Clerk + Supabase coexistence (fallback active)
- JWT-based API authentication
- Organization isolation ready (via Kealee DB)

---

## 📞 Need Help?

Refer to:
- `CLERK_DAY2_COMPLETE.md` — Full summary
- `docs/env-variables-clerk.md` — Detailed env var guide
- `docs/audits/clerk-auth-audit-20260807.md` — Technical deep-dive

---

**Status**: Ready to deploy.  
**Time to deploy**: 30 minutes.  
**Risk**: Low (fallback active).  

👉 **Next**: Follow steps 1-5 above, then test.
