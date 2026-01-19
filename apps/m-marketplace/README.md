# Marketplace App (m-marketplace)

## Current Status: Landing Page / Homepage

**What it currently is:**
- ✅ **Marketing Landing Page** for `kealee.com`
- ✅ Promotes all Kealee platform services
- ✅ Entry point to the platform
- ✅ Links to other services (ops.kealee.com, architect.kealee.com, etc.)

**What it should become (Stage 6 MVP - Weeks 15-17):**
- 🔄 **Actual Marketplace** with contractor directory
- 🔄 Contractor profiles and listings
- 🔄 Search and filtering
- 🔄 Lead distribution system
- 🔄 Quote workflows
- 🔄 Subscription tiers for contractors ($49-$399/month)

---

## Current Components

The current implementation includes:

1. **Hero Section** - Main value proposition
2. **Stats Section** - Social proof (500+ projects, $50M+ managed, etc.)
3. **Services Section** - Links to:
   - Ops Services (ops.kealee.com)
   - Project Owner Portal (app.kealee.com)
   - Architect Services (architect.kealee.com)
   - Permits & Inspections (permits.kealee.com)
4. **How It Works** - 4-step process
5. **Testimonials** - Customer reviews
6. **CTA Section** - Call-to-action for signup
7. **Footer** - Links and information

---

## Intended Purpose

### Phase 1: Landing Page (Current)
- Marketing site at `kealee.com`
- Promotes the platform
- Drives traffic to other services
- Collects signups

### Phase 2: Marketplace (Future - Stage 6)
According to the build plan, the marketplace should include:

**Features:**
- Public contractor directory
- Verified contractor profiles
- Search by specialty, location, rating
- Lead management system
- Quote request workflows
- Contractor subscriptions ($49-$399/month)
- Lead fees ($15-$50 per lead)

**Revenue Model:**
- Subscription fees: $49-$399/month per contractor
- Lead fees: $15-$50 per qualified lead
- Year 1 Target: $400K-$1.1M

---

## Domain Structure

```
kealee.com (this app) → Landing page / future marketplace
├─ ops.kealee.com → Ops Services app
├─ app.kealee.com → Project Owner Portal
├─ architect.kealee.com → Architect Services
├─ permits.kealee.com → Permits & Inspections
└─ ... (other services)
```

---

## Next Steps for Full Marketplace

To transform this into the actual marketplace (Stage 6), you would need to add:

1. **Contractor Directory Pages**
   - Browse contractors
   - Search and filters
   - Contractor profile pages

2. **Contractor Onboarding**
   - Registration flow
   - Profile creation
   - Verification process
   - Subscription selection

3. **Lead Management**
   - Lead capture forms
   - Lead distribution system
   - Quote request workflows

4. **Backend Integration**
   - API endpoints for contractor data
   - Lead management system
   - Subscription management

---

## Summary

**Right now:** This is the **landing page/homepage** for kealee.com that promotes all services.

**Eventually:** This should become the **actual marketplace** with contractor listings, search, profiles, and lead distribution (Stage 6 MVP).

The current deployment is correct - it's the main landing page for the platform. The marketplace functionality will be added in Stage 6 of the build plan.
