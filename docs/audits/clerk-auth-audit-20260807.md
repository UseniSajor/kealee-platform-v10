# Clerk Authentication Audit & Implementation Plan
**Date**: 2026-08-07  
**Status**: AUDIT IN PROGRESS

## Executive Summary

The Kealee Platform currently uses Supabase for authentication with a custom PostgreSQL-backed user and organization system. This audit evaluates the path to integrate Clerk as a primary auth provider while preserving the existing Kealee database for business logic.

**Key Finding**: The codebase is ready for Clerk integration. Existing User/Org/Role/Permission models provide the foundation for organization-aware access control.

---

## 1. Current Authentication Provider & Login Flow

### Current System: Supabase
- **Provider**: Supabase Auth (hosted PostgreSQL auth backend)
- **Session**: JWT tokens + cookies (via `@supabase/ssr`)
- **Login pages**: 
  - `/auth/login` (web-main, Supabase form)
  - `/auth/signup` (web-main, Supabase form)
  - `/auth/callback` (Supabase OAuth callback)
  - `/auth/forgot-password` (custom form)
  - `/auth/reset-password` (custom form)

### Supabase Integration Files
- `packages/auth/src/supabase-auth.ts` — server-side auth helpers
- `packages/auth/src/supabase-client.ts` — browser client
- `packages/auth/src/middleware.ts` — session management
- `apps/web-main/middleware.ts` — route protection + role-based access

### Session Handling
- Cookies: `sb-*` (Supabase session cookies)
- JWT in browser localStorage (Supabase client)
- Email verification via magic link
- Password reset via email link

### Issues with Current System
1. **Tight coupling**: Supabase auth directly tied to DB
2. **Limited features**: No built-in MFA, organizations, or invitations
3. **Custom implementation**: Role-based access manually coded
4. **No webhook system**: User changes not synchronized externally

---

## 2. Existing Middleware, Session Handling, JWT Logic

### Middleware Stack
- **web-main**: `apps/web-main/middleware.ts`
  - Public routes (marketing, checkout, intake funnels)
  - Protected routes (dashboards, settings)
  - Role-based access (admin, marketing, intelligence)
  - Email verification checks
  - Concept deliverable redirects

### Session Management
- Supabase SSR cookie refresh
- Token expiration: 1 hour (Supabase default)
- Refresh token rotation
- No explicit revocation (relies on JWT expiry)

### Password Reset & Verification
- `@supabase/auth-helpers-nextjs` handles email flows
- Magic links sent via Supabase email service
- No custom password policy

### JWT Logic
- Supabase JWT in `session.access_token`
- Decoded claims: `user.id`, `user.email`, `user.app_metadata`
- No custom JWT middleware on API

---

## 3. Existing Prisma/PostgreSQL User & Organization Models

### User Model
```prisma
model User {
  id              String  @id @default(uuid())
  email           String? @unique
  name            String?
  firstName       String?
  lastName        String?
  password        String?  // Currently null (Supabase managed)
  phone           String?
  role            String?  @default("USER")
  status          String?  @default("ACTIVE")
  stripeCustomerId String?
  twoFactorEnabled Boolean @default(false)
  passwordChangedAt DateTime?
  // ... address fields
  
  orgMembers OrgMember[]
  sessions   UserSession[]
}
```

### Organization Model
```prisma
model Org {
  id          String @id @default(uuid())
  name        String
  slug        String @unique
  description String?
  logo        String?
  status      String @default("ACTIVE")
  
  members     OrgMember[]
  projects    Project[]
  properties  Property[]
}
```

### Membership Model
```prisma
model OrgMember {
  id      String @id @default(uuid())
  userId  String
  orgId   String
  roleKey String  // OWNER, MANAGER, MEMBER, etc.
  joinedAt DateTime
  
  user User @relation(...)
  org  Org  @relation(...)
}
```

### Role & Permission Models
```prisma
model Role {
  id   String @id @default(uuid())
  name String @unique
  // permissions via RolePermission
}

model Permission {
  id   String @id @default(uuid())
  name String @unique
}

model RolePermission {
  roleId       String
  permissionId String
  // maps roles to permissions
}
```

### Session Model
```prisma
model UserSession {
  id           String @id @default(uuid())
  userId       String
  sessionToken String @unique
  refreshToken String?
  ipAddress    String?
  expiresAt    DateTime
  lastActivity DateTime
  isActive     Boolean
  isRevoked    Boolean
}
```

**Status**: ✅ Ready for Clerk integration. User/Org/Role/Permission models exist and can be linked to Clerk user IDs via a new `clerkUserId` field.

---

## 4. All Protected Routes & Portals

### web-main
- Public: `/`, `/pricing`, `/blog`, `/contact`, `/concept*`, `/permits*`, `/estimation*`, `/checkout*`, `/intake*`, `/pre-design*`, `/get-concept`, `/get-started`
- Protected: `/dashboard`, `/settings`, `/billing`, `/admin/*`, `/marketing/workspace/*`
- **Roles**: admin, marketing_agency, zem_marketing, marketing_admin, intelligence, super_admin

### Portal Apps (Customer Portals)
1. **portal-owner** — Project owner dashboard
   - Public: `/login`, `/signup`, `/forgot-password`
   - Protected: `/projects/*`, `/dashboard`, `/settings`, `/team`
   - **Roles**: OWNER, MANAGER, VIEWER

2. **portal-contractor** — Contractor/builder dashboard
   - Public: `/login`, `/signup`
   - Protected: `/projects/*`, `/bids/*`, `/estimates/*`
   - **Roles**: CONTRACTOR, PROJECT_MANAGER

3. **portal-developer** — Developer/investor dashboard
   - Public: `/login`, `/signup`
   - Protected: `/projects/*`, `/portfolio/*`
   - **Roles**: DEVELOPER, INVESTOR

### Admin Portal
- **os-admin** — Platform admin dashboard
  - Protected: `/admin/*`, `/users/*`, `/organizations/*`
  - **Roles**: super_admin, operations_admin, finance_admin, permit_admin

### Mini-apps (v10)
- m-architect, m-estimation, m-permits-inspections, m-finance-trust, m-marketplace, m-ops-services, m-project-owner, m-inspector, m-engineer
- **Pattern**: Public landing → protected dashboard → role-gated features
- **Role**: Require authenticated user + project access

---

## 5. Existing API Authorization Middleware

### API Routes Structure
- **Location**: `services/api/src/` (Fastify server)
- **Auth pattern**: Bearer token (JWT from Supabase)

### Protected API Endpoints (Examples)
- `POST /api/v1/projects` — requires auth + org membership
- `GET /api/v1/organizations/:id/members` — requires org admin
- `POST /api/v1/estimates` — requires auth + project access
- `PUT /api/v1/projects/:id` — requires owner or manager role

### Current Auth Middleware
- Supabase JWT verification (no custom middleware yet)
- Some routes have `requireOrgMember(orgId)` helper
- Some routes check user roles directly from JWT

**Issue**: Not all routes have authorization checks. Need full audit of API endpoints.

---

## 6. Existing Agents, Workers, Queues, Billing & Webhooks

### Background Jobs (BullMQ)
- **Service**: `services/worker`
- **Queues**: 
  - `concept-generation` — AI design concepts
  - `permit-processing` — permit intake processing
  - `marketing-jobs` — scheduled marketing tasks
  - `vision-processing` — capture image analysis
  - `voice-transcription` — voice-to-text

### Webhooks
- **Stripe**: `/api/stripe/webhooks` — payment events
- **No Clerk webhooks yet** — need to add for user sync

### Billing & Payments
- **Stripe integration**: Handles estimates, permits, design concepts
- **Models**: `StripeCheckout`, `StripeEvent`, `ConceptPackageOrder`
- **Tied to**: User email (Supabase) and organization

### AI Agents & Services
- **services/os-ai-orch** — Orchestration for AI workflow
- **services/keacore** — Core decision engine
- **13 Bots**: KeaBots for various domains

**Note**: Workers use `SUPABASE_SERVICE_ROLE_KEY` to read user/org data. Need to update auth logic to work with Clerk.

---

## 7. Environment Variable Conventions

### Current Supabase Vars
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (API only)
```

### Current Auth Vars
```
NEXT_PUBLIC_AUTH_HUB_URL=https://kealee.com/auth
NEXTAUTH_SECRET=... (if using NextAuth, but currently using Supabase)
```

### Naming Pattern
- `NEXT_PUBLIC_*` — client-side accessible
- Service-specific prefix (e.g., `SUPABASE_`, `STRIPE_`, `ANTHROPIC_`)
- Descriptive suffix (e.g., `_URL`, `_KEY`, `_SECRET`)

---

## 8. Duplicate Authentication/Authorization Implementations

### Current Duplication Issues
1. **Role logic scattered**:
   - `packages/auth/ops-api-auth.ts` — ops/admin roles
   - `apps/web-main/middleware.ts` — marketing/intelligence roles
   - `apps/portal-owner/lib/*` — project-level roles
   - **No centralized role resolver**

2. **Org membership checks**:
   - Some routes check `user.org_id` from JWT
   - Some routes query `OrgMember` table
   - **No consistent pattern**

3. **Permission enforcement**:
   - Some routes use role names directly
   - Some use permission IDs
   - **No unified permission system**

### Consolidation Opportunity
Replace all ad-hoc checks with a centralized `AuthorizationService` that:
- Takes (userId, orgId, required role/permission)
- Queries `OrgMember` + `Role` + `Permission` models
- Returns true/false with audit logging

---

## Current State: AUDIT COMPLETE ✅

### What's Working
✅ User/Org/Role/Permission models exist  
✅ Route protection in place (Supabase)  
✅ Session management (Supabase SSR)  
✅ Email verification flow  
✅ Password reset flow  
✅ Stripe webhook integration  

### What Needs Work
❌ Clerk integration not started  
❌ No centralized authorization layer  
❌ API endpoints not fully audited  
❌ No organization webhook handling  
❌ Role duplication across files  
❌ No MFA system  
❌ No user invitation system  
❌ No audit logging  

---

## Implementation Plan (Next Phase)

### Phase 1: Foundation (Week 1)
1. Install Clerk packages
2. Add environment variables (placeholder docs)
3. Create unified auth adapter (`getClerkUser`, `getSupabaseUser`, fallback logic)
4. Create `AuthorizationService` for centralized permission checks
5. Add Clerk webhook handler (user sync)

### Phase 2: Frontend Integration (Week 2)
1. Add ClerkProvider to all 15 Next.js apps
2. Replace auth pages with Clerk components (sign-in, sign-up)
3. Update web-main middleware to use unified adapter
4. Test login flow (Clerk primary, Supabase fallback)

### Phase 3: Portal Apps (Week 3)
1. Update portal-owner middleware
2. Update portal-contractor middleware
3. Update portal-developer middleware
4. Test organization routing

### Phase 4: API Protection (Week 4)
1. Audit all API routes
2. Add Clerk JWT verification to Fastify API
3. Implement authorization middleware
4. Add Clerk webhook signature validation

### Phase 5: Migration & Testing (Week 5)
1. User data sync via Clerk webhooks
2. Existing user migration (optional)
3. Full integration testing
4. Production deployment

---

## Remaining Audit Items

- [ ] Full API route enumeration
- [ ] All webhook event types
- [ ] Current middleware matchers
- [ ] Existing test coverage
- [ ] Stripe customer linking
- [ ] Payment history dependencies on user email
- [ ] Cache/session invalidation patterns
- [ ] Rate limiting implementation
- [ ] CSRF protection strategy

---

**Next**: Await approval to proceed with Phase 1 implementation.
