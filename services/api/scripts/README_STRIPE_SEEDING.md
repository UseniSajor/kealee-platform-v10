# Stripe Product Seeding

## Overview

Idempotent script to seed Stripe products and prices from JSON configuration.

## Usage

```bash
# From services/api directory
cd services/api

# Set your Stripe key (test or live)
export STRIPE_SECRET_KEY=sk_test_xxx

# Run the seeder
pnpm tsx scripts/seedStripeProducts.ts
```

## Configuration

Products are defined in `data/stripe-products.json`.

### Product Schema

```typescript
{
  "name": string,              // Product display name
  "description": string,       // Customer-facing description
  "amount": number,           // Price in cents (e.g., 175000 = $1,750)
  "currency": string,         // "usd"
  "billingType": "recurring" | "one_time",
  "interval": "month" | "year", // Required for recurring
  "category": string,         // Grouping (pm-packages, on-demand, etc.)
  "code": string,             // Unique lookup key (e.g., PKG_A)
  "metadata": object          // Custom key-value pairs
}
```

## Features

- **Idempotent:** Safe to run multiple times
- **Lookup Keys:** Uses `code` field for price lookup
- **Validation:** Ensures billing type matches interval
- **Updates:** Updates product details if changed
- **Logging:** Clear console output showing created vs existing

## Output

```
═══════════════════════════════════════════════════════════════
💳 STRIPE PRODUCT & PRICE SEEDING
═══════════════════════════════════════════════════════════════

Total products to process: 36
Stripe mode: 🟡 TEST

📦 Processing: Package A - Solo GC (PKG_A)
   ✅ Product created: prod_abc123
   ✅ Price created: price_xyz789
   💰 Amount: $1,750
   🔄 Billing: monthly

... (continues for all products)

═══════════════════════════════════════════════════════════════
📊 SEEDING SUMMARY
═══════════════════════════════════════════════════════════════

✅ Products created: 36
✅ Prices created: 36
✓  Products already existed: 0
✓  Prices already existed: 0

✅ Seeding completed successfully
```

## Error Handling

- Invalid billing type/interval combinations throw errors
- Non-integer amounts throw errors
- Missing required fields throw errors
- Network errors are caught and logged

## Testing

```bash
# Test mode (safe)
STRIPE_SECRET_KEY=sk_test_xxx pnpm tsx scripts/seedStripeProducts.ts

# Live mode (when ready)
STRIPE_SECRET_KEY=sk_live_xxx pnpm tsx scripts/seedStripeProducts.ts
```

## After Seeding

1. Check Stripe Dashboard to verify products
2. Copy price IDs from console output
3. Add to environment variables
4. Test checkout flows
