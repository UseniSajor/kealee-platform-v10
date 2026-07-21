# 🛍️ Complete Kealee Platform Product Catalog

## Overview

This script sets up the complete product catalog in Stripe, including all packages and a la carte services across all Kealee Platform modules.

## Product Categories

### 1. PM Packages (4 tiers)
- **Package A - Starter**: $1,750/month (5-10 hours/week)
- **Package B - Professional**: $4,500/month (15-20 hours/week) ⭐ Popular
- **Package C - Premium**: $8,500/month (30-40 hours/week)
- **Package D - Enterprise**: $16,500/month (40+ hours/week)

Each package includes monthly and annual pricing (15% discount on annual).

### 2. Architecture Packages (4 tiers)
- **Package A - Design Consultation**: $2,500 (one-time)
- **Package B - Residential Design**: $7,500 (one-time) ⭐ Popular
- **Package C - Full Service Design**: $15,000 (one-time)
- **Package D - Premium Custom Design**: $35,000 (one-time)

### 3. Project Owner Packages (4 tiers)
- **Package A - Essential**: $299/month
- **Package B - Professional**: $699/month ⭐ Popular
- **Package C - Premium**: $1,499/month
- **Package D - Enterprise**: $2,999/month

Each package includes monthly and annual pricing (15% discount on annual).

### 4. Permit & Inspection Packages (4 tiers)
- **Package A - Basic**: $499/month (up to 2 permits/month)
- **Package B - Standard**: $1,299/month (up to 5 permits/month) ⭐ Popular
- **Package C - Professional**: $2,499/month (unlimited permits)
- **Package D - Enterprise**: $4,999/month (unlimited everything)

Each package includes monthly and annual pricing (15% discount on annual).

### 5. Ops Services A La Carte (8 services)
- Permit Application Help: $300 (range: $150-$500)
- Inspection Scheduling: $200 (range: $100-$300)
- Document Organization: $400 (range: $200-$600)
- Contractor Coordination: $500 (range: $300-$800)
- Site Visits: $350 (range: $200-$500)
- Budget Analysis: $450 (range: $250-$700)
- Progress Reporting: $250 (range: $150-$400)
- Quality Control Inspection: $400 (range: $250-$600)

### 6. Estimation Services (4 tiers)
- **Basic Project Estimation**: $299 (one-time)
- **Standard Project Estimation**: $799 (one-time) ⭐ Popular
- **Premium Project Estimation**: $1,999 (one-time)
- **Enterprise Project Estimation**: $4,999 (one-time)

## Usage

### Run the Script

```bash
cd services/api
pnpm stripe:setup-catalog
```

### Prerequisites

1. Ensure `STRIPE_SECRET_KEY` is set in `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
   ```

2. The script will:
   - Create or update all products in Stripe
   - Create or update all prices
   - Output environment variables for all price IDs

## Environment Variables Output

The script generates environment variables for all price IDs in the following format:

```bash
# PM Packages
STRIPE_PRICE_PM_PACKAGE_A_MONTHLY=price_xxxxx
STRIPE_PRICE_PM_PACKAGE_A_ANNUAL=price_xxxxx
STRIPE_PRICE_PM_PACKAGE_B_MONTHLY=price_xxxxx
STRIPE_PRICE_PM_PACKAGE_B_ANNUAL=price_xxxxx
# ... etc

# Architecture Packages
STRIPE_PRICE_ARCH_PACKAGE_A=price_xxxxx
STRIPE_PRICE_ARCH_PACKAGE_B=price_xxxxx
# ... etc

# Project Owner Packages
STRIPE_PRICE_PO_PACKAGE_A_MONTHLY=price_xxxxx
STRIPE_PRICE_PO_PACKAGE_A_ANNUAL=price_xxxxx
# ... etc

# Permit Packages
STRIPE_PRICE_PERMIT_PACKAGE_A_MONTHLY=price_xxxxx
STRIPE_PRICE_PERMIT_PACKAGE_A_ANNUAL=price_xxxxx
# ... etc

# Ops A La Carte
STRIPE_PRICE_PERMIT_APPLICATION_HELP=price_xxxxx
STRIPE_PRICE_INSPECTION_SCHEDULING=price_xxxxx
# ... etc

# Estimation Services
STRIPE_PRICE_ESTIMATION_BASIC=price_xxxxx
STRIPE_PRICE_ESTIMATION_STANDARD=price_xxxxx
# ... etc
```

## Next Steps

1. **Copy Environment Variables**
   - Copy all output environment variables to `services/api/.env.local`
   - Add them to Vercel (all relevant apps)
   - Add them to Railway (API service)

2. **Update Database Seed**
   - Update `services/api/prisma/seed.ts` with the new price IDs
   - Ensure product lookups use the correct price IDs

3. **Update Frontend Applications**
   - Update pricing pages in each app to use the new price IDs
   - Update checkout flows to reference correct prices

4. **Test in Stripe**
   - Verify all products appear in Stripe dashboard
   - Test checkout flows with test mode
   - Verify webhooks are configured correctly

## Features

- ✅ **Upsert Logic**: Products and prices are created or updated (won't duplicate)
- ✅ **Lookup Keys**: All prices have lookup keys for easy retrieval
- ✅ **Metadata**: Rich metadata for filtering and organization
- ✅ **Statement Descriptors**: Custom statement descriptors for credit card statements
- ✅ **Tax Codes**: Pre-configured tax codes for services
- ✅ **Annual Discounts**: 15% discount on annual subscriptions
- ✅ **Price Ranges**: A la carte products show price ranges when applicable

## Script Location

`services/api/scripts/stripe/setup-complete-catalog.ts`

## Package.json Script

Added new script:
```json
"stripe:setup-catalog": "tsx scripts/stripe/setup-complete-catalog.ts"
```

Run with:
```bash
pnpm stripe:setup-catalog
```




