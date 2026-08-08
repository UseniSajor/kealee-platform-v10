# Clerk Implementation — 2-Day Sprint Plan

## Day 1 (TODAY) — Core Infrastructure

### 1.1 Finish auth adapter & exports (IN PROGRESS)
- [x] Create `packages/auth/src/clerk-adapter.ts` — Clerk/Supabase fallback logic
- [x] Update `packages/auth/src/index.ts` — export unified auth functions
- [x] Update `packages/auth/package.json` — add Clerk deps
- [ ] Create `packages/auth/src/authorization-service.ts` — centralized permission checks

### 1.2 Authorization Service (KEY — 30 min)
Create `packages/auth/src/authorization-service.ts`:
- `requireAuthenticatedUser(clerkId)` → verify Clerk user exists
- `requireOrganizationMember(clerkId, orgId)` → check OrgMember
- `requireOrganizationRole(clerkId, orgId, roleKey)` → check role
- `requireProjectAccess(clerkId, projectId)` → check project membership
- `canAccessResource(clerkId, resourceId, resourceType)` → generic permission check
- `auditLog(action, userId, orgId, details)` → security logging

### 1.3 Clerk webhook handler (KEY — 45 min)
Create `services/api/src/modules/clerk/clerk-webhook.routes.ts`:
- POST `/api/clerk/webhooks` — handle user.created, user.updated, user.deleted
- Verify webhook signature (`CLERK_WEBHOOK_SIGNING_SECRET`)
- Upsert User in Kealee DB with `clerkUserId` mapping
- Handle org creation/deletion events
- Never delete project/payment history

### 1.4 Environment variables (15 min)
Create `docs/env-variables-clerk.md`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 1.5 Update web-main (KEY — 1 hour)
- Update `apps/web-main/middleware.ts` — use `getUnifiedUser()` (Clerk → Supabase)
- Update `apps/web-main/app/layout.tsx` — wrap with ClerkProvider
- Create `/sign-in` and `/sign-up` pages (Clerk components)
- Update `/auth/login`, `/auth/signup` → redirect to `/sign-in`, `/sign-up`
- Test login flow locally

### 1.6 Update root package.json (10 min)
- Add `@clerk/nextjs`, `@clerk/types` to root (if monorepo supports)
- Or ensure all 15 apps have these in their package.json

**Day 1 Exit Criteria**:
- ✅ web-main deploys with Clerk
- ✅ Login works (Clerk primary, Supabase fallback)
- ✅ Authorization service functions
- ✅ Webhook handler receives events

---

## Day 2 (TOMORROW) — Portal Apps + API Protection

### 2.1 Template & Batch Portal Apps (1 hour)
- Create `apps/portal-owner/middleware.ts.template` (copy from web-main pattern)
- Apply to: portal-owner, portal-contractor, portal-developer, command-center, os-admin
- Update 5 apps' `app/layout.tsx` with ClerkProvider
- Update 5 apps' sign-in pages

### 2.2 Batch Mini-apps (30 min)
- Copy middleware template to: m-architect, m-estimation, m-permits-inspections, m-finance-trust, m-ops-services, m-marketplace, m-project-owner, m-inspector, m-engineer, marketing, marketing-os
- Total: 15 apps updated (automated script if possible)

### 2.3 API Protection (1 hour)
- Update `services/api/src/index.ts` — add Clerk JWT middleware
- Verify Clerk JWT on protected routes:
  - `POST /api/v1/projects` → requireAuthenticatedUser
  - `GET /api/v1/organizations/:id` → requireOrganizationMember
  - `POST /api/v1/estimates` → requireProjectAccess
  - Sample: audit 20 critical routes, protect remaining via generic middleware

### 2.4 Webhook Integration in API (30 min)
- Register Clerk webhook route in Fastify
- Validate signature using `CLERK_WEBHOOK_SIGNING_SECRET`
- Test with Clerk dashboard webhook tester

### 2.5 Deploy & Test (30 min)
- Push all changes to main
- Deploy to Railway (15 services auto-deploy)
- Test Clerk login on 3 portals (web-main, portal-owner, os-admin)
- Verify fallback to Supabase if needed

**Day 2 Exit Criteria**:
- ✅ All 15 apps support Clerk login
- ✅ API routes protected
- ✅ Webhook syncing users
- ✅ Production deployment successful

---

## Compressed Scope (What We DON'T Do)

To fit 2 days:
- ❌ Full API endpoint audit (too big) — sample 20 critical routes instead
- ❌ Comprehensive test suite — manual testing only
- ❌ MFA setup (can add post-launch)
- ❌ Passkeys (can add post-launch)
- ❌ Existing user migration script (Clerk can handle this via API)
- ❌ Advanced org invite workflow (simple role assignment first)
- ❌ Custom branded Clerk pages (use Clerk defaults for now)
- ❌ Audit logging to dedicated table (log to console first)

---

## Success Metrics

By end of Day 2:
1. Users can sign up via Clerk on any app
2. Clerk JWT verified on API
3. Organization access working (can't access other orgs' projects)
4. Role-based access enforced (contractor can't edit estimates)
5. Webhook syncs new Clerk users to Kealee DB
6. All 15 apps deployed and functional
7. No breaking changes to existing workflows

---

**STARTING NOW** — Phase 1.2 (Authorization Service)
