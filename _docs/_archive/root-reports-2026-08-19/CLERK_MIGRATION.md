# Clerk Authentication Migration - Kealee Platform

**Status:** Phase 1-2 Implementation In Progress
**Timeline:** Urgent cutover (hours, all users today)
**Target Date:** 2026-08-07

---

## IMPLEMENTATION SUMMARY

### ✅ COMPLETED

1. **Package Installation**
   - Added `@clerk/backend` to `/services/api/package.json`
   - Added `@clerk/nextjs` to `/apps/command-center/package.json`
   - Added `@clerk/nextjs` to `/apps/os-admin/package.json`

2. **Environment Configuration**
   - Updated `.env.example` with Clerk variables:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLERK_WEBHOOK_SIGNING_SECRET`
   - Marked Supabase variables as deprecated but retained for migration window

3. **Backend Infrastructure**
   - ✅ Created `/services/api/src/webhooks/clerk.ts` - Webhook handler for:
     - `user.created` - Syncs new Clerk users to Kealee DB
     - `user.updated` - Syncs profile changes
     - `user.deleted` - Deactivates users (preserves history)
     - `organization.created` - Creates Org records
     - `organizationMembership.created` - Syncs team members
     - `organizationMembership.updated` - Updates roles
     - `organizationMembership.deleted` - Removes members

   - ✅ Created `/services/api/src/middleware/clerk-auth.ts` - Session middleware:
     - JWT token verification from Clerk
     - User + org context extraction
     - Project access validation
     - Reusable middleware functions:
       - `verifyClerkSession()` - Authenticate all requests
       - `requirePlatformAdmin()` - Enforce admin-only routes
       - `requireOrgMembership()` - Org-level access control
       - `requireOrgRole(...roles)` - Role-based access
       - `requireProjectAccess(projectId)` - Project-level access

   - ✅ Created `/services/api/src/lib/clerk-org-auth.ts` - Authorization helpers:
     - `isPlatformAdmin()` - Check platform admin status
     - `canAccessOrganization()` - Verify org membership
     - `canAccessProject()` - Verify project membership
     - `canViewProject()` / `canEditProject()` / `canDeleteProject()`
     - `canViewEstimate()` / `canEditEstimate()` / `canApproveEstimate()`
     - `canViewPayment()` / `canRefundPayment()`
     - `canManageUsers()` / `canChangeUserRole()` / `canDeleteUser()`

4. **Frontend - Command Center**
   - ✅ Updated `/apps/command-center/middleware.ts` - Clerk route protection
   - ✅ Created `/apps/command-center/app/clerk-provider.tsx` - Branded Clerk provider
   - ✅ Created `/apps/command-center/app/sign-in/page.tsx` - Sign-in page (one-column, Nunito, #FF8C22)
   - ✅ Created `/apps/command-center/app/sign-up/page.tsx` - Sign-up page (new password required)
   - ✅ Updated `/apps/command-center/app/layout.tsx` - Added ClerkProvider to root
   - ✅ Created `/apps/command-center/lib/auth-redirect.ts` - Post-login routing based on role

---

## 🚧 REMAINING WORK (CRITICAL PATH)

### Phase 2: API Webhook Endpoint (2-3 hours)

1. **Add Webhook Route Handler**
   - [ ] Create `/services/api/src/routes/webhooks/clerk.ts`
   - [ ] Hook into Fastify server at `POST /api/webhooks/clerk`
   - [ ] Parse Svix signature headers (Clerk uses Svix for webhooks)
   - [ ] Call `handleClerkWebhook()` from webhook handler
   - [ ] Return 200 OK on successful processing
   - [ ] Handle errors and return appropriate status codes

2. **Register Webhook in API Index**
   - [ ] Register route in main API server file
   - [ ] Test locally with curl or Postman
   - [ ] Verify database syncs work

### Phase 3: API Route Protection (2-3 hours)

1. **Apply Clerk Auth to Critical Routes**
   - [ ] Protect all `/api/projects/*` routes with `requireOrgMembership()`
   - [ ] Protect all `/api/estimates/*` routes with `canEditEstimate()`
   - [ ] Protect all `/api/payments/*` routes with `requireOrgRole(['owner', 'finance_admin'])`
   - [ ] Protect all `/api/users/*` routes with admin checks
   - [ ] Protect all `/api/organizations/*` routes
   - [ ] Keep public routes open: `/api/health`, `/api/webhooks/*`, `/api/public/*`

2. **Replace Supabase Auth**
   - [ ] Remove `verifySupabaseToken()` middleware usage
   - [ ] Replace with `verifyClerkSession()` on all protected routes
   - [ ] Test 401/403 responses work correctly

### Phase 4: Additional Portals (2-3 hours)

Apply same pattern to remaining priority apps:

1. **OS-Admin** (`/apps/os-admin/`)
   - [ ] Update middleware.ts
   - [ ] Update app/layout.tsx with ClerkProvider
   - [ ] Create sign-in/sign-up pages
   - [ ] Create admin dashboard redirect

2. **Engineering App** (location TBD)
   - [ ] Same pattern as above

3. **Estimating App** (location TBD)
   - [ ] Same pattern as above

4. **Concept Generation App** (location TBD)
   - [ ] Same pattern as above

5. **Other Portals**
   - [ ] portal-owner, portal-contractor, portal-developer (apply when ready)

### Phase 5: Testing & Deployment (1-2 hours)

1. **Build & Type Check**
   - [ ] Run `pnpm install` to install new dependencies
   - [ ] Run `pnpm build` to verify no TypeScript errors
   - [ ] Run `pnpm lint` to check code style

2. **Clerk Dashboard Configuration**
   - [ ] Create Clerk account at https://clerk.com
   - [ ] Create application in Clerk dashboard
   - [ ] Copy API keys to Railway environment
   - [ ] Configure webhook endpoint: `https://api.kealee.com/api/webhooks/clerk`
   - [ ] Enable webhook events:
     - `user.created`, `user.updated`, `user.deleted`
     - `organization.created`, `organization.updated`, `organization.deleted`
     - `organizationMembership.created`, `organizationMembership.updated`, `organizationMembership.deleted`

3. **Database Schema Verification**
   - [ ] Verify User model has `externalAuthId` and `authProvider` fields (DONE in schema)
   - [ ] Verify Org model has `externalOrgId` field
   - [ ] Verify no migrations needed (schema already supports dual-auth window)

4. **Local Testing** (with test Clerk account)
   - [ ] Start dev server: `pnpm dev` in command-center
   - [ ] Navigate to `/sign-in` → should show branded Clerk sign-in
   - [ ] Sign up with new email → should create user in Kealee DB
   - [ ] Verify webhook receives `user.created` event
   - [ ] Verify user appears in database with correct `externalAuthId`
   - [ ] Attempt login → should redirect to dashboard
   - [ ] Logout and verify session cleared

5. **Deployment to Railway**
   - [ ] Commit all changes to git
   - [ ] Push to `origin/main`
   - [ ] Railway auto-deploy triggers
   - [ ] Verify build succeeds: `pnpm build`
   - [ ] Verify API starts without errors

6. **Production Cutover**
   - [ ] Configure Clerk webhook to production API endpoint
   - [ ] Create test user in production Clerk account
   - [ ] Verify user syncs to production database
   - [ ] Test sign-in flow works end-to-end
   - [ ] Send migration email to existing users:
     - Subject: "Your Kealee Account: Please Sign Up with New Method"
     - Body: "We've upgraded our authentication. Please sign up at: [sign-up link]"
     - Provide link to `/sign-up` page
   - [ ] Monitor login errors and database syncs
   - [ ] Maintain Supabase auth as fallback until 100% migration

---

## ENVIRONMENT VARIABLES REQUIRED

### Railway Deployment

Add these to Railway service environment:

```env
# Clerk Identity (from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx

# Clerk URLs (optional—Clerk provides defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Vercel (if using)

Same as above—add to Vercel Environment Variables.

---

## CLERK DASHBOARD SETUP

1. Go to https://dashboard.clerk.com
2. Create new Application
3. Choose authentication methods:
   - ✅ Email/password
   - ✅ Google OAuth
   - ✅ Microsoft OAuth
   - ✅ Email verification
   - ✅ Password reset
   - ✅ TOTP (2FA)
   - ✅ Passkeys (if on Pro plan)
4. Configure Webhooks:
   - Endpoint: `https://api.kealee.com/api/webhooks/clerk`
   - Events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
     - `organization.created`
     - `organizationMembership.created`
     - `organizationMembership.updated`
     - `organizationMembership.deleted`
5. Customize appearance (optional—we handle this in code):
   - Logo: Use Kealee logo
   - Colors: Primary orange #FF8C22
   - Font: Nunito (handled in code)

---

## DATABASE SCHEMA (ALREADY SUPPORTED)

No migrations needed. The User model already has:

```prisma
User {
  id String @id @default(cuid())
  email String @unique
  externalAuthId String? @unique  // Clerk user ID (user_xxx)
  authProvider String @default("supabase")  // "supabase" | "clerk"
  firstName String?
  lastName String?
  profilePicture String?
  isDeleted Boolean @default(false)
  deletedAt DateTime?
  // ... other fields
}

Org {
  id String @id
  externalOrgId String? @unique  // Clerk org ID (org_xxx)
  isPlatformAdmin Boolean @default(false)
  // ... other fields
}
```

---

## ROLLBACK PLAN

If issues arise during cutover:

1. **Keep Supabase auth active** — it remains functional
2. **Revert Clerk routes** — remove sign-in/sign-up if breaking
3. **Disable Clerk webhook** — stop processing new events
4. **Restore API routing** — go back to Supabase middleware on routes
5. **Communicate to users** — "We've reverted to the previous login method"

No data loss. Clerk webhook processing is idempotent—re-running doesn't cause duplicates.

---

## FILES CREATED/MODIFIED

### Backend
- ✅ `services/api/package.json` - Added @clerk/backend
- ✅ `services/api/src/webhooks/clerk.ts` - NEW Webhook handler
- ✅ `services/api/src/middleware/clerk-auth.ts` - NEW Auth middleware
- ✅ `services/api/src/lib/clerk-org-auth.ts` - NEW Authorization helpers
- 🚧 `services/api/src/routes/webhooks/clerk.ts` - PENDING Webhook route
- 🚧 `services/api/src/index.ts` - PENDING Register webhook route

### Frontend - Command Center
- ✅ `apps/command-center/package.json` - Added @clerk/nextjs
- ✅ `apps/command-center/middleware.ts` - NEW Clerk route protection
- ✅ `apps/command-center/app/layout.tsx` - Updated with ClerkProvider
- ✅ `apps/command-center/app/clerk-provider.tsx` - NEW Branded provider
- ✅ `apps/command-center/app/sign-in/page.tsx` - NEW Sign-in page
- ✅ `apps/command-center/app/sign-up/page.tsx` - NEW Sign-up page
- ✅ `apps/command-center/lib/auth-redirect.ts` - NEW Post-login routing

### Frontend - OS-Admin
- ✅ `apps/os-admin/package.json` - Added @clerk/nextjs
- 🚧 `apps/os-admin/middleware.ts` - PENDING Clerk route protection
- 🚧 `apps/os-admin/app/layout.tsx` - PENDING ClerkProvider
- 🚧 `apps/os-admin/app/sign-in/page.tsx` - PENDING Sign-in page
- 🚧 `apps/os-admin/app/sign-up/page.tsx` - PENDING Sign-up page

### Configuration
- ✅ `.env.example` - Added Clerk variables
- 🚧 `CLERK_MIGRATION.md` - This file

---

## NEXT STEPS (IN ORDER)

1. **Add webhook route** → 30 min
2. **Protect API routes** → 1-2 hours
3. **Apply pattern to os-admin** → 30 min
4. **Build & test locally** → 30 min
5. **Deploy to Railway** → 15 min
6. **Configure Clerk dashboard** → 15 min
7. **Activate & monitor** → ongoing

**Total Estimated Time:** 4-5 hours for full cutover with all priority apps.

---

## KNOWN ISSUES & CONSIDERATIONS

1. **User Migration:** Existing Supabase users must create new passwords in Clerk (no password migration from Supabase to Clerk).
2. **Session Window:** During migration, both Supabase and Clerk auth are active. Users can log in with either until fully migrated.
3. **Email Changes:** If user changes email in Clerk, Kealee user record updates automatically via webhook.
4. **Deleted Users:** When a Clerk user is deleted, Kealee marks them as deleted (soft delete) to preserve project history.
5. **Platform Admin Org:** Create separate Clerk org for platform admins to isolate roles.

---

## SUCCESS CRITERIA

- [ ] Users can sign up with email/password
- [ ] Email verification works
- [ ] Users can reset passwords
- [ ] Google/Microsoft OAuth works (optional)
- [ ] 2FA setup works
- [ ] Users sync to Kealee database
- [ ] Post-login routing works (admin→/admin, owner→/owner-portal, etc.)
- [ ] API routes enforce Clerk auth
- [ ] Cross-org access prevented
- [ ] Existing integrations (webhooks, workers) still function
- [ ] No data loss or corruption
