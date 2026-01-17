# @kealee/stripe

Complete Stripe product configuration and utilities for Kealee Platform.

## 📦 Installation

```bash
pnpm add @kealee/stripe
```

## 🚀 Quick Start

```typescript
import {
  STRIPE_PRODUCTS,
  getPMStaffingPackages,
  calculateTransactionFee,
  formatPrice,
} from '@kealee/stripe';

// Get all PM Staffing packages
const packages = getPMStaffingPackages();

// Calculate transaction fee
const fee = calculateTransactionFee(10000, 'standard'); // $100.00

// Format price for display
const formatted = formatPrice(1750, 'USD', 'month'); // "$1,750/month"
```

## 📚 Product Categories

### 1. PM Staffing Packages
Professional project management staffing services with 4 tiers:
- **Essential** ($1,750/month) - Timeline & task management
- **Professional** ($3,750/month) - + Contractor coordination
- **Premium** ($9,500/month) - + Permit management ⭐ Most Popular
- **White Glove** ($16,500/month) - Complete hands-off service

### 2. Marketplace Subscriptions
Contractor listing and lead generation:
- **Basic** ($49/month) - 3 leads/month, 5 photos
- **Professional** ($149/month) - 15 leads/month, unlimited photos
- **Premium** ($299/month) - Unlimited leads, verification, custom landing page

### 3. Professional Subscriptions
Specialized tools for professionals:
- **Architect Pro** ($99/month) - Reduced fees, BIM integration
- **Permit Pro** ($299/month) - Unlimited permits, priority processing

### 4. Marketing Package
- **Marketing Pro** ($799/month) - Website, SEO, Google Ads ($500 budget), social media

### 5. Add-On Services
- **Expedited Processing** ($500 one-time) - 24hr rush service
- **White-Label Reporting** ($199/month) - Custom branded reports
- **API Access** ($499/month) - 10k requests/day

### 6. Pay-Per-Permit Services
- **Simple** ($50) - Basic permits (10-15 days)
- **Standard** ($150) - Residential/commercial (15-30 days)
- **Complex** ($500) - Major construction (7-20 days)

## 🔧 Setup

### 1. Create Products in Stripe

Run the automated setup script:

```bash
cd packages/stripe
pnpm setup-products
```

This will:
- Create all products in Stripe
- Create prices for each product
- Generate `.env.generated` file with all price IDs

### 2. Add Environment Variables

Copy the generated price IDs to your `.env` files:

**Backend (Railway):**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_PACKAGE_A=price_...
STRIPE_PRICE_PACKAGE_B=price_...
# ... all other price IDs
```

**Frontend (Vercel):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_A=price_...
NEXT_PUBLIC_STRIPE_PRICE_PACKAGE_B=price_...
# ... all other price IDs
```

## 📖 API Reference

### Products

```typescript
// Get all products by category
import { getPMStaffingPackages, getMarketplaceTiers } from '@kealee/stripe';

const pmPackages = getPMStaffingPackages();
const marketplaceTiers = getMarketplaceTiers();
```

### Helpers

```typescript
import {
  getProductById,
  getProductByPriceId,
  formatPrice,
  formatAmount,
} from '@kealee/stripe';

// Get product by ID
const product = getProductById('package_a');

// Get product by price ID
const product = getProductByPriceId('price_xxx');

// Format prices
formatPrice(1750, 'USD', 'month'); // "$1,750/month"
formatAmount(175000, 'USD'); // "$1,750.00"
```

### Validators

```typescript
import {
  validateProductMetadata,
  checkProductEligibility,
  calculateTransactionFee,
  validateSubscriptionChange,
} from '@kealee/stripe';

// Validate metadata
const validation = validateProductMetadata(metadata);
if (!validation.valid) {
  console.error(validation.errors);
}

// Check eligibility
const eligibility = checkProductEligibility(
  'marketplace_premium',
  userSubscriptions,
  userVerifications
);

// Calculate fees
const fee = calculateTransactionFee(10000, 'standard');
console.log(`Fee: $${fee.feeAmount / 100}`);

// Validate subscription change
const comparison = validateSubscriptionChange(
  'package_a',
  'package_b',
  'pmStaffing'
);
```

### Fee Calculations

```typescript
import { calculateTransactionFee, calculateArchitectFee } from '@kealee/stripe';

// Standard transaction
const standardFee = calculateTransactionFee(10000, 'standard');
// Result: { subtotal: 10000, feeAmount: 380, total: 10380 }

// Architect fee (with Pro discount)
const architectFee = calculateArchitectFee(50000, true);
// 3% for Pro subscribers vs 5% for standard
```

## 🎨 UI Components

### Pricing Table

```typescript
import { PRICING_TABLES } from '@kealee/stripe';

export function PricingPage() {
  return (
    <div>
      {PRICING_TABLES.map((table) => (
        <div key={table.category}>
          <h2>{table.category}</h2>
          {table.products.map((product) => (
            <PricingCard
              key={product.id}
              name={product.name}
              price={product.price}
              interval={product.interval}
              features={product.features}
              popular={product.popular}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### Feature Comparison

```typescript
import { PM_STAFFING_COMPARISON, MARKETPLACE_COMPARISON } from '@kealee/stripe';

export function ComparisonTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          {PM_STAFFING_COMPARISON.packages.map((pkg) => (
            <th key={pkg}>{pkg}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PM_STAFFING_COMPARISON.features.map((feature) => (
          <tr key={feature.name}>
            <td>{feature.name}</td>
            <td>{feature.packageA ? '✓' : '—'}</td>
            <td>{feature.packageB ? '✓' : '—'}</td>
            <td>{feature.packageC ? '✓' : '—'}</td>
            <td>{feature.packageD ? '✓' : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## 🔒 Type Safety

All products are fully typed:

```typescript
import type {
  PMStaffingTier,
  MarketplaceTier,
  ProfessionalSubscription,
  PermitComplexity,
  TransactionFeeType,
} from '@kealee/stripe';

function subscribe(tier: PMStaffingTier) {
  // TypeScript ensures only valid tiers: 'packageA' | 'packageB' | 'packageC' | 'packageD'
}
```

## 📊 Constants

```typescript
import {
  PRODUCT_CATEGORIES,
  INTERVALS,
  FEE_SCHEDULE,
  PERMIT_PROCESSING_TIMES,
} from '@kealee/stripe';

// Product categories
PRODUCT_CATEGORIES.PM_STAFFING; // 'pm_staffing'
PRODUCT_CATEGORIES.MARKETPLACE; // 'marketplace'

// Intervals
INTERVALS.MONTH; // 'month'
INTERVALS.YEAR; // 'year'

// Fee schedule
FEE_SCHEDULE.standard; // { percentage: 3.5, fixed: 0.30 }
FEE_SCHEDULE.architect; // { percentage: 5.0, minimum: 500 }
```

## 🧪 Testing

```bash
pnpm test
```

## 📝 License

MIT

## 🤝 Contributing

1. Update product definitions in `src/stripe-products.ts`
2. Add types to `src/types.ts`
3. Add helpers to `src/helpers.ts`
4. Add validators to `src/validators.ts`
5. Update constants in `src/constants.ts`
6. Export from `src/index.ts`
7. Update this README
8. Run tests
9. Build: `pnpm build`

## 🔗 Related Packages

- `@kealee/database` - Database models and Prisma client
- `@kealee/api-client` - API client for backend communication

## 📞 Support

For issues or questions, contact the Kealee Platform team.
