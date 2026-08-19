# Clerk Implementation — Current Status

**Timeline**: 2-Day Sprint (Aug 7-8, 2026)  
**Current**: Day 1 COMPLETE ✅  
**Next**: Day 2 (Batch update 14 apps + test)

---

## What's Done (Day 1)

### Core Infrastructure ✅
- [x] Unified auth adapter (`packages/auth/src/clerk-adapter.ts`)
- [x] Centralized authorization service (`packages/auth/src/authorization-service.ts`)
- [x] Clerk webhook handler (`services/api/src/modules/clerk/clerk-webhook.routes.ts`)
- [x] Database migration (add clerkUserId, clerkOrgId)
- [x] Clerk dependencies added to auth package
- [x] web-main configured with ClerkProvider
- [x] Sign-in/sign-up pages created for web-main
- [x] API webhook registration complete
- [x] Environment variables documented
- [x] Full audit completed

### Files Created (Day 1)
1. `packages/auth/src/clerk-adapter.ts` — Unified auth layer
2. `packages/auth/src/authorization-service.ts` — Permission checks
3. `services/api/src/modules/clerk/clerk-webhook.routes.ts` — Webhook handler
4. `packages/database/prisma/migrations/20260808_add_clerk_fields/migration.sql` — DB schema
5. `apps/web-main/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page
6. `apps/web-main/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page
7. `docs/env-variables-clerk.md` — Environment variable guide
8. `docs/audits/clerk-auth-audit-20260807.md` — Full audit report
9. `docs/decisions/clerk-2day-sprint.md` — Sprint plan
10. `docs/decisions/clerk-day1-completion.md` — Day 1 summary
11. `docs/decisions/clerk-batch-update-day2.md` — Day 2 plan

### Files Modified (Day 1)
1. `packages/auth/src/index.ts` — Added exports for new functions
2. `packages/auth/package.json` — Added Clerk dependencies
3. `packages/database/prisma/schema.prisma` — Added clerkUserId, clerkOrgId fields
4. `services/api/src/index.ts` — Registered Clerk webhook routes
5. `apps/web-main/app/layout.tsx` — Added ClerkProvider wrapper

---

## What's Next (Day 2)

### Morning: Batch Update Apps (2-3 hours)

**14 apps to update** (copy from web-main template):
1. portal-owner
2. portal-contractor
3. portal-developer
4. command-center
5. os-admin
6. m-architect
7. m-estimation
8. m-finance-trust
9. m-marketplace
10. m-ops-services
11. m-permits-inspections
12. m-project-owner
13. marketing
14. marketing-os

**Per app: 3 steps**
- Add ClerkProvider to `app/layout.tsx`
- Copy `/sign-in` and `/sign-up` pages from web-main
- Update middleware to use `getUnifiedUser()` (optional — middleware can stay as-is)

**Quick script** (documented in `docs/decisions/clerk-batch-update-day2.md`):
```bash
for APP in portal-owner portal-contractor portal-developer ...; do
  mkdir -p apps/$APP/app/sign-in/\[\[...sign-in\]\]
  cp apps/web-main/app/sign-in/\[\[...sign-in\]\]/page.tsx apps/$APP/app/sign-in/...
  # repeat for sign-up
done
```

### Afternoon: API Protection + Testing (1-2 hours)

**Protect critical API routes:**
- Sample 20 important routes
- Add Clerk JWT verification
- Use `requireAuthenticatedUser()`, `requireProjectAccess()` helpers

**Test:**
- [ ] web-main sign-in works
- [ ] portal-owner sign-in works
- [ ] API /projects requires auth
- [ ] Organization isolation works
- [ ] Webhook syncs users

### End of Day: Deploy to Production

**Steps:**
1. Run `npx prisma migrate deploy` on Railway
2. Set env vars on all 15 Railway services
3. Create Clerk webhook in Clerk Dashboard
4. Test login on production

---

## Quick Reference: Key Functions

### Auth Layer (`@kealee/auth`)

```typescript
import { 
  getUnifiedUser,           // Get Clerk user first, fall back to Supabase
  requireAuthenticatedUser, // Throw if user not found
  requireOrganizationMember,// Throw if not org member
  requireOrganizationRole,  // Throw if role not match
  requireProjectAccess,     // Throw if can't access project
  requirePlatformAdmin,     // Throw if not admin
  canAccessResource,        // Return boolean
  getAuditLog,             // Get audit history
} from '@kealee/auth'
```

### In Middleware

```typescript
const user = await getUnifiedUser(request)
if (!user) {
  return NextResponse.redirect(new URL('/sign-in', request.url))
}
```

### In API Routes

```typescript
const clerkUserId = request.headers['x-clerk-user-id']
try {
  await requireAuthenticatedUser(clerkUserId)
  // User is authenticated
} catch (error) {
  reply.status(401).send({ error: 'Not authenticated' })
}
```

---

## Environment Variables (All 15 Apps)

Set in each app's environment (local `.env.local` or Railway):

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Keep existing Supabase vars for fallback
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

API service (`services/api`) also needs:
```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx
```

---

## Clerk Dashboard Setup

1. Create app at https://clerk.com
2. Go to Configure → API Keys → copy Publishable + Secret keys
3. Go to Configure → Webhooks → Create endpoint
   - URL: `https://api.kealee.com/api/clerk/webhooks`
   - Events: user.created, user.updated, user.deleted
   - Copy signing secret
4. Go to Configure → Email → Customize branding
5. Go to Configure → Paths → set redirect URLs

---

## Testing Checklist

**Local (after app updates):**
- [ ] Start dev server
- [ ] Visit `/sign-in` — Clerk form appears
- [ ] Sign up with test email
- [ ] Check Kealee database — user created
- [ ] Organization routing works
- [ ] Project access controlled

**Staging:**
- [ ] Env vars set on Railway
- [ ] Database migration applied
- [ ] Deploy push to main
- [ ] Test login on staging URL
- [ ] Verify webhook receives events

**Production:**
- [ ] Webhook endpoint created
- [ ] All 15 services deployed
- [ ] Test login on kealee.com
- [ ] Verify user sync to database
- [ ] Check fallback to Supabase (old user can still login)

---

## Key Documents

**For Day 2 reference:**
- `docs/decisions/clerk-batch-update-day2.md` — Complete Day 2 tasks
- `docs/env-variables-clerk.md` — Environment setup
- `docs/decisions/clerk-2day-sprint.md` — Sprint overview
- `docs/audits/clerk-auth-audit-20260807.md` — Full technical audit

---

## Current Blockers / Notes

**None currently.** All Day 1 tasks complete.

**For Day 2:**
- Large monorepo = slow git operations (consider using `git add specific-files` instead of `git add -A`)
- ClerkProvider must wrap entire app (test in layout.tsx)
- Webhook signature validation is critical (copy exact secret from Clerk)
- Supabase fallback ensures zero login downtime during migration

---

## Success Criteria (End of Day 2)

✅ All 15 apps support Clerk authentication  
✅ API routes protected with centralized authorization  
✅ Clerk webhooks sync users to PostgreSQL  
✅ Organization isolation enforced  
✅ Role-based access control working  
✅ Supabase fallback active (graceful degradation)  
✅ Production deployment complete  

**READY FOR PRODUCTION USE**

---

**Next Step**: Follow `docs/decisions/clerk-batch-update-day2.md` for Day 2 tasks.
