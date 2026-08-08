# Day 2 — Batch Update All 15 Apps (Clerk Integration)

**Timeline**: 1 day to complete  
**Automation**: Shell script + manual verification  

---

## Overview

### Apps to Update (14 remaining)
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

### What Each App Needs

**3 Changes per app:**
1. Add ClerkProvider to `app/layout.tsx`
2. Create `/sign-in/[[...sign-in]]/page.tsx`
3. Create `/sign-up/[[...sign-up]]/page.tsx`
4. Update `package.json` with `@clerk/nextjs`, `@clerk/types` (if not already present from shared deps)

---

## Template: Middleware (Universal)

Keep existing middleware but ensure it supports Clerk:

```typescript
// apps/[app]/middleware.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUnifiedUser } from '@kealee/auth' // NEW

const PUBLIC_ROUTES = [
  '/login',
  '/sign-in', // NEW (Clerk route)
  '/sign-up', // NEW (Clerk route)
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/',
  '/pricing',
  '/contact',
  // ... existing routes
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Get user from Clerk or Supabase (NEW)
  let response = NextResponse.next({ request: { headers: request.headers } })
  const user = await getUnifiedUser(request) // NEW - unified auth

  // Protect other routes
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api/|_next/|favicon.ico|.*\\..*).*)'],
}
```

---

## Batch Update Script

```bash
#!/bin/bash
# apply-clerk-to-all-apps.sh

APPS=(
  "portal-owner"
  "portal-contractor"
  "portal-developer"
  "command-center"
  "os-admin"
  "m-architect"
  "m-estimation"
  "m-finance-trust"
  "m-marketplace"
  "m-ops-services"
  "m-permits-inspections"
  "m-project-owner"
  "marketing"
  "marketing-os"
)

TEMPLATE_DIR="apps/web-main"
SIGN_IN_PAGE="$TEMPLATE_DIR/app/sign-in/\[\[...sign-in\]\]/page.tsx"
SIGN_UP_PAGE="$TEMPLATE_DIR/app/sign-up/\[\[...sign-up\]\]/page.tsx"

for APP in "${APPS[@]}"; do
  echo "Updating $APP..."
  
  # Create sign-in page
  mkdir -p "apps/$APP/app/sign-in/\[\[...sign-in\]\]"
  cp "$SIGN_IN_PAGE" "apps/$APP/app/sign-in/\[\[...sign-in\]\]/page.tsx"
  
  # Create sign-up page
  mkdir -p "apps/$APP/app/sign-up/\[\[...sign-up\]\]"
  cp "$SIGN_UP_PAGE" "apps/$APP/app/sign-up/\[\[...sign-up\]\]/page.tsx"
  
  # Update layout (add ClerkProvider if not already present)
  if ! grep -q "ClerkProvider" "apps/$APP/app/layout.tsx"; then
    echo "⚠️  Manual update needed for apps/$APP/app/layout.tsx — add ClerkProvider"
  fi
  
  echo "✓ $APP done"
done

echo "All apps updated. Manual steps:"
echo "1. Add ClerkProvider to each app's layout.tsx"
echo "2. Update middleware.ts in each app to use getUnifiedUser()"
echo "3. Add Clerk env vars to Railway services"
```

---

## Manual Checklist per App

For each of 14 apps, do these 3 steps:

### Step 1: Update `app/layout.tsx`

**Add import at top:**
```typescript
import { ClerkProvider } from '@clerk/nextjs'
```

**Wrap body with ClerkProvider:**
```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html>
        <body>
          {/* existing content */}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### Step 2: Sign-in/Sign-up Pages (Copy from web-main)

```bash
# For each app:
mkdir -p apps/[APP_NAME]/app/sign-in/\[\[...sign-in\]\]
mkdir -p apps/[APP_NAME]/app/sign-up/\[\[...sign-up\]\]

# Copy pages from web-main
cp apps/web-main/app/sign-in/\[\[...sign-in\]\]/page.tsx \
   apps/[APP_NAME]/app/sign-in/\[\[...sign-in\]\]/page.tsx

cp apps/web-main/app/sign-up/\[\[...sign-up\]\]/page.tsx \
   apps/[APP_NAME]/app/sign-up/\[\[...sign-up\]\]/page.tsx
```

### Step 3: Update `middleware.ts` (if exists)

**Add import:**
```typescript
import { getUnifiedUser } from '@kealee/auth'
```

**Update authentication check:**
```typescript
// OLD:
const { data: { session } } = await supabase.auth.getSession()
const user = session?.user

// NEW:
const user = await getUnifiedUser(request)
```

---

## API Route Protection (Day 2 Afternoon)

### Update Critical Routes (sample 20 routes)

**Pattern:**
```typescript
// services/api/src/modules/[module]/[endpoint].routes.ts

import { requireAuthenticatedUser, requireProjectAccess } from '@kealee/auth'

export async function [endpoint]Routes(fastify: FastifyInstance) {
  fastify.get<{ Params: { projectId: string } }>(
    '/projects/:projectId',
    {
      onRequest: async (request) => {
        const clerkUserId = request.headers['x-clerk-user-id'] as string
        if (!clerkUserId) {
          throw fastify.httpErrors.unauthorized()
        }
        await requireProjectAccess(clerkUserId, request.params.projectId)
      },
    },
    async (request, reply) => {
      // Handler code
    }
  )
}
```

### Routes to Audit & Protect

**Projects**:
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PUT /api/v1/projects/:id`

**Estimates**:
- `GET /api/v1/estimates`
- `POST /api/v1/estimates`
- `GET /api/v1/estimates/:id`

**Permits**:
- `GET /api/v1/permits`
- `POST /api/v1/permits`
- `GET /api/v1/permits/:id`

**Organizations**:
- `GET /api/v1/organizations/:id`
- `GET /api/v1/organizations/:id/members`
- `POST /api/v1/organizations/:id/members`

**Admin**:
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users`
- `PUT /api/v1/admin/users/:id/role`

---

## Testing Checklist (End of Day 2)

- [ ] web-main sign-in/sign-up works
- [ ] portal-owner sign-in/sign-up works
- [ ] portal-contractor can see only their orgs
- [ ] portal-developer routing works
- [ ] os-admin sign-in works
- [ ] Webhook receives user.created event
- [ ] New Clerk users appear in Kealee DB
- [ ] API /projects route returns 401 without auth
- [ ] API /projects/:id returns 403 without org access
- [ ] Supabase fallback works (test with old user)

---

## Deployment (End of Day 2)

### 1. Database Migration
```bash
cd packages/database
npx prisma migrate deploy
```

### 2. Set Environment Variables on Railway

For each of 15 services:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

For API service add:
```
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

### 3. Push to Main & Deploy
```bash
git push origin main
# Railway auto-deploys
```

### 4. Verify in Production
- Visit https://kealee.com/sign-in
- Sign up with test email
- Verify Clerk webhook syncs user to DB

---

## Troubleshooting

### "ClerkProvider is not defined"
- Check that `@clerk/nextjs` is installed in package.json
- Run `npm install` or `pnpm install`

### "Sign-in page not found"
- Verify route exists: `apps/[app]/app/sign-in/[[...sign-in]]/page.tsx`
- Check that ClerkProvider is in layout.tsx

### "Webhook signature invalid"
- Verify `CLERK_WEBHOOK_SIGNING_SECRET` is set correctly
- Check Clerk Dashboard → Webhooks → copy exact secret

### "User not appearing in database"
- Check API logs: `railway logs api`
- Verify webhook endpoint is reachable: curl `https://api.kealee.com/api/clerk/webhooks`
- Test webhook with Clerk Dashboard webhook tester

---

## Success Metrics (End of Day 2)

✅ All 15 apps support Clerk login  
✅ Middleware checks Clerk first, falls back to Supabase  
✅ API routes protected with requireAuthenticatedUser()  
✅ Webhook syncs users to database  
✅ Organizations can't access other orgs' projects  
✅ Contractors can only see their assigned projects  
✅ Production deploy successful  

**RESULT: Clerk authentication fully operational across all apps**
