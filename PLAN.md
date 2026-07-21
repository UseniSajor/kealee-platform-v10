# Implementation Plan

## Overview
This plan covers 5 areas: (1) audit/fix m-marketplace endpoints, (2) remove "transparent" from user-facing text, (3) update platform subscription pricing with performance names, (4) add project limits where "unlimited" exists, (5) change permit B/C/D billing and rename "a la carte" to "individual".

---

## 1. Audit & Fix m-marketplace Endpoints

**File:** `apps/m-marketplace/app/api/contact/route.ts`

**Issues Found:**
- The contact form calls 3 backend endpoints but **none include authentication headers**, while all backend routes require `authenticateUser` middleware
- POST `/notifications` endpoint **doesn't exist** in the backend (only GET routes)
- POST `/communication/logs` endpoint **doesn't exist** in the backend (only GET routes)
- `NEXT_PUBLIC_API_URL` in `.env.local` is missing `https://` protocol

**Fix Plan:**
- The contact API is a **public-facing form** - it should not need auth tokens. Since this is a Next.js API route acting as a BFF (backend-for-frontend), we should simplify it to just return success and handle the lead storage/notification internally without calling authenticated backend APIs. We'll make the contact route self-contained: validate input, return success, and log the attempt. The actual lead creation and notification can be handled server-side when the backend APIs are properly set up with service-to-service auth.
- For now: simplify the contact route to validate and return success, removing the broken backend calls that will always fail.

---

## 2. Remove "Transparent" from User-Facing Text

Replace "Transparent" with appropriate alternatives across all apps:

| File | Current Text | New Text |
|------|-------------|----------|
| `apps/m-marketplace/app/pricing/page.tsx` (line 374) | "Transparent Pricing, Real Results" | "Clear Pricing, Real Results" |
| `apps/m-marketplace/app/pricing/page.tsx` (line 360) | "fees are transparently displayed" | "fees are clearly displayed" |
| `apps/m-marketplace/app/pricing/page.tsx` (line 827) | "fees are transparently displayed" | "fees are clearly displayed" |
| `apps/m-marketplace/components/Pricing.tsx` (line 214) | "Transparent Pricing, Real Results" | "Clear Pricing, Real Results" |
| `apps/m-marketplace/components/Pricing.tsx` (line 370) | "fees are transparently displayed" | "fees are clearly displayed" |
| `apps/m-finance-trust/app/pricing/page.tsx` (line 11) | "Transparent, Fair Pricing" | "Simple, Fair Pricing" |
| `apps/m-finance-trust/app/page.tsx` (line 820) | "Simple, Transparent Pricing" | "Simple, Clear Pricing" |
| `apps/m-permits-inspections/.../pricing/page.tsx` (line 104) | "Transparent Permit Pricing" | "Clear Permit Pricing" |
| `apps/m-permits-inspections/.../pricing/page.tsx` (line 176) | "Transparent pricing for individual permits" | "Clear pricing for individual permits" |
| `apps/m-permits-inspections/.../pricing/page.tsx` metadata | "Transparent permit service pricing" | "Clear permit service pricing" |
| `apps/m-project-owner/app/dashboard/page.tsx` (line 261) | "Transparent Pricing" | "Clear Pricing" |
| `apps/m-ops-services/.../precon/page.tsx` | "Transparent Pricing" heading/comments | "Clear Pricing" |
| `apps/m-ops-services/.../marketplace/page.tsx` | "'Transparent Pricing'" | "'Clear Pricing'" |
| `apps/m-ops-services/.../gc-services/pricing/page.tsx` | "Transparent Pricing for Operations Support" | "Clear Pricing for Operations Support" |
| `apps/m-ops-services/.../finance/page.tsx` | "Transparent Fees", "transparent financial..." | "Clear Fees", "clear financial..." |
| `apps/m-ops-services/.../engineer/page.tsx` | "Transparent pricing based on..." | "Clear pricing based on..." |
| `apps/m-ops-services/.../development/*.tsx` | "transparent scope", "transparent reporting" | "clear scope", "clear reporting" |
| `apps/m-marketplace/app/network/[slug]/page.tsx` | "transparent communication" | "clear communication" |
| `apps/m-engineer/app/page.tsx` | "Transparent Pricing" heading/comment | "Clear Pricing" |

**Note:** CSS `bg-transparent` and similar styling classes will NOT be changed - only user-facing text.

---

## 3. Update Platform Subscription Pricing & Names

**Current → New (Performance-themed names):**

| Current Name | New Name | Current Price | New Price | Current Projects | New Projects |
|-------------|----------|--------------|-----------|-----------------|-------------|
| Starter | **Essentials** | $99/user/mo ($79 annual) | **$289/user/mo ($231 annual)** | Up to 3 | Up to 5 |
| Professional | **Performance** | $199/user/mo ($159 annual) | **$399/user/mo ($319 annual)** | Up to 15 | **Up to 10** |
| Business | **Scale** | $349/user/mo ($279 annual) | **$549/user/mo ($439 annual)** | Unlimited → **Up to 20** | Up to 20 |
| Enterprise | **Enterprise** | Custom | Custom | Unlimited → **Unlimited** | Unlimited (stays) |

**Premium (Package C PM) projects:** Change "Unlimited" → "Up to 20"

**Files to update:**
- `apps/m-marketplace/app/pricing/page.tsx` - main pricing page (platform plans data + comment block)
- `apps/m-marketplace/app/HomePageClient.tsx` - homepage pricing summary ($99 → $289, names)
- `apps/m-marketplace/components/Pricing.tsx` - Pricing component (PM packages, project limits)
- `apps/m-project-owner/app/ProjectOwnerLandingClient.tsx` - Enterprise "Unlimited projects" → "Up to 20 projects"
- `apps/m-ops-services/app/pricing/page.tsx` - Package C "Unlimited projects" → "Up to 20 projects"
- `apps/m-ops-services/app/checkout/[packageId]/page.tsx` - Package C "Unlimited projects" → "Up to 20 projects"
- `apps/m-project-owner/HELP.md` - "unlimited projects" mention

---

## 4. Change Permit B, C, D to Monthly Billing

**Current → New:**

| Permit Pkg | Current | New |
|-----------|---------|-----|
| Permit A (Basic) | $495 one-time | $495 one-time (no change) |
| Permit B (Full Service) | $1,295 one-time | **$1,295/month** (up to 10 permits/month) |
| Permit C (Premium) | $2,995 one-time | **$2,995/month** (up to 50 permits/month) |
| Permit D (Enterprise) | $7,500/month | **$7,500/month** (custom permits/month) - already monthly |

**Files:**
- `apps/m-marketplace/app/pricing/page.tsx` - permit packages data
- `apps/m-marketplace/components/Pricing.tsx` - permit packages data
- Update descriptions to include permit counts per month

---

## 5. Rename "A La Carte" → "Individual"

**Files:**
- `apps/m-marketplace/app/pricing/page.tsx` (lines 303, 404, 455, 758) - all "A la carte" references
- Various m-ops-services files (documentation/markdown files will be left as-is since they're internal docs)

---

## Execution Order
1. Fix m-marketplace contact endpoint
2. Remove "transparent" from all apps
3. Update subscription pricing, names, and project limits
4. Change permit B/C/D billing to monthly with permit counts
5. Rename "a la carte" to "individual"
