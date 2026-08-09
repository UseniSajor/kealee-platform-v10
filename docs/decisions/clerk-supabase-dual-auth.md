# Clerk + Supabase Dual Auth Implementation

## Strategy: Clerk Primary + Supabase Fallback

**Status**: In Progress  
**Target**: All 15 Next.js apps  
**Timeline**: Phased rollout

### Architecture

```
User Request
    ↓
1. Try Clerk (createClerkClient)
    ├─ If valid → use Clerk session
    └─ If failed → fallback to Supabase
2. Try Supabase (@supabase/ssr)
    ├─ If valid → use Supabase session
    └─ If failed → require auth
```

### Phase 1: Core Infrastructure (CURRENT)

#### 1.1 Create unified auth adapter (`packages/auth/src/clerk-adapter.ts`)
- `getClerkUser(request)` → Clerk user or null
- `getSupabaseUser(request)` → Supabase user or null  
- `unifiedGetUser(request)` → Clerk first, then Supabase
- `getUserFromBoth(request)` → merged user object with source flag

#### 1.2 Update web-main middleware
- Import unified adapter
- Check Clerk first, fall back to Supabase
- Maintain existing public/private/role routes logic

#### 1.3 Add Clerk dependencies to root package.json
- `@clerk/nextjs`
- `@clerk/types`

### Phase 2: Portal Apps (owner, contractor, developer)
- Update middleware using unified adapter
- Add Clerk env vars to Railway services
- Test login flow

### Phase 3: v10 Mini-apps (architect, estimation, finance, etc.)
- Standardize middleware across all 15 apps
- Implement shared middleware module

### Phase 4: Testing & Cleanup
- Test Clerk login paths
- Test Supabase fallback
- Remove old Supabase-only routes if unneeded

## Apps to Update (15 total)

**Tier 1 (Critical)**:
- web-main (homepage/auth hub)
- portal-owner, portal-contractor, portal-developer (user portals)
- command-center, os-admin (admin dashboards)

**Tier 2 (Core v10)**:
- m-marketplace, m-architect, m-estimation, m-finance-trust
- m-ops-services, m-permits-inspections, m-project-owner

**Tier 3 (Marketing)**:
- marketing, marketing-os

## Environment Variables

All 15 apps need:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
CLERK_SECRET_KEY=<from Clerk dashboard>
CLERK_SIGN_IN_URL=/sign-in
CLERK_SIGN_UP_URL=/sign-up
CLERK_AFTER_SIGN_IN_URL=/
CLERK_AFTER_SIGN_UP_URL=/

# Keep existing Supabase vars as fallback
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Implementation Checklist

- [ ] Phase 1: Core infrastructure
  - [ ] Create `packages/auth/src/clerk-adapter.ts`
  - [ ] Update `packages/auth/package.json` (add Clerk deps)
  - [ ] Update web-main middleware
  - [ ] Update web-main layout (add ClerkProvider)
  - [ ] Test login on web-main
  
- [ ] Phase 2: Portal apps
  - [ ] portal-owner middleware + layout
  - [ ] portal-contractor middleware + layout
  - [ ] portal-developer middleware + layout
  - [ ] Test logins
  
- [ ] Phase 3: Remaining 10 apps
  - [ ] Standardize middleware module
  - [ ] Batch update all 10 apps
  
- [ ] Phase 4: Railway deployment
  - [ ] Set env vars on all 15 services
  - [ ] Verify logins in staging
  - [ ] Monitor production

## Notes

- Clerk redirects: `/sign-in`, `/sign-up` (Clerk uses these by default)
- Existing routes: `/auth/login`, `/auth/signup` (keep these for backward compat if needed)
- Session: Clerk uses cookies (like Supabase), so existing cookie logic still works
- Role-based access: Need to map Clerk roles/metadata to existing role checks
