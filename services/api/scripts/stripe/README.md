# Stripe Product Import Scripts

This directory contains scripts for managing Stripe products and prices.

## Scripts

### `stripe-import.ts`
Import products from CSV file into Stripe.

**Usage:**
```bash
# Normal import (creates products)
pnpm stripe:import

# Dry run (test without creating products)
pnpm stripe:import:dry-run
```

**CSV Format:**
The CSV file (`products.csv`) should have the following columns:
- `Product Name` - Name of the product
- `Description` - Product description
- `Price (USD)` - Price in US dollars (e.g., "1750" or "$1,750.00")
- `Type` - Either "recurring" or "one_time"
- `Interval` - For recurring products: "month", "year", "week", or "day"
- `Features` - Pipe-separated list of features (e.g., "Feature 1|Feature 2|Feature 3")
- `Tax Code` - Stripe tax code (e.g., "txcd_10301000")
- `Statement Descriptor` - Credit card statement descriptor (max 22 chars)
- `Unit Label` - Unit label for the product (optional)
- `Category` - Product category (optional)
- `Metadata` - Semicolon-separated key-value pairs (e.g., "key1:value1;key2:value2")

**Features:**
- ✅ Parses CSV with proper handling of quoted fields
- ✅ Creates Stripe products and prices
- ✅ Updates existing products if found by name
- ✅ Handles both recurring and one-time products
- ✅ Stores features in product metadata
- ✅ Generates environment variables for price IDs
- ✅ Comprehensive error handling and logging
- ✅ Dry-run mode for testing
- ✅ Rate limiting to avoid API limits

**Output:**
- Console output with progress and summary
- Environment variables for all created price IDs
- JSON log file with detailed import results

### `setup-ops-products.ts`
Set up Ops Services products (package-based and a la carte).

**Usage:**
```bash
pnpm stripe:setup-ops-products
```

### `setup-gc-products.ts`
Set up GC (General Contractor) products.

**Usage:**
```bash
pnpm stripe:setup-gc-products
```

### `setup-complete-catalog.ts`
Set up complete product catalog (all packages and services).

**Usage:**
```bash
pnpm stripe:setup-catalog
```

## Environment Setup

1. Create `.env.local` in `services/api/` directory:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. For production, use live keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   ```

## CSV Import Example

Example CSV row:
```csv
Package A - Starter PM,"5-10 hours/week of professional project management.",1750,recurring,month,"5-10 hours/week PM time|Single project focus|Email support",txcd_10301000,KEALEE PKG A,,packages,package_tier:A;hours_per_week:5-10
```

This creates:
- Product: "Package A - Starter PM"
- Price: $1,750.00/month (recurring)
- Features stored in metadata
- Metadata: package_tier=A, hours_per_week=5-10

## Error Handling

The import script:
- ✅ Validates CSV format before processing
- ✅ Handles Stripe API errors gracefully
- ✅ Continues processing other products on error
- ✅ Logs detailed error messages
- ✅ Generates summary report

## Log Files

Each import generates a JSON log file:
- Location: `scripts/stripe/import-log-{timestamp}.json`
- Contains: Full import results, errors, and statistics

## Best Practices

1. **Always test with dry-run first:**
   ```bash
   pnpm stripe:import:dry-run
   ```

2. **Use test mode for development:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_... pnpm stripe:import
   ```

3. **Backup existing products** before importing (if updating)

4. **Review the generated environment variables** before adding to production

5. **Check the log file** for detailed results and any errors




