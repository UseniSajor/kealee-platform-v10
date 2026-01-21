# 🛍️ Stripe CSV Product Import System

Complete guide for importing products from CSV into Stripe.

## 📁 Files Created

1. **`services/api/scripts/stripe/stripe-import.ts`** - Main import script
2. **`services/api/scripts/stripe/products.csv`** - CSV template with sample products
3. **`services/api/scripts/stripe/README.md`** - Script documentation

## 🚀 Quick Start

### 1. Set Up Environment

Create `services/api/.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
```

### 2. Prepare CSV File

Edit `services/api/scripts/stripe/products.csv` with your product data.

### 3. Test Import (Dry Run)

```bash
cd services/api
pnpm stripe:import:dry-run
```

### 4. Import Products

```bash
pnpm stripe:import
```

## 📋 CSV Format

### Required Columns

| Column | Description | Example |
|--------|-------------|---------|
| `Product Name` | Product name | `Package A - Starter PM` |
| `Description` | Product description | `5-10 hours/week of professional project management.` |
| `Price (USD)` | Price in US dollars | `1750` or `$1,750.00` |
| `Type` | Product type | `recurring` or `one_time` |
| `Interval` | Billing interval (if recurring) | `month`, `year`, `week`, `day` |
| `Features` | Pipe-separated features | `Feature 1\|Feature 2\|Feature 3` |
| `Tax Code` | Stripe tax code | `txcd_10301000` |
| `Statement Descriptor` | Credit card descriptor (max 22 chars) | `KEALEE PKG A` |
| `Unit Label` | Unit label (optional) | `application` |
| `Category` | Product category (optional) | `packages` |
| `Metadata` | Semicolon-separated key-value pairs | `key1:value1;key2:value2` |

### CSV Example

```csv
Product Name,Description,Price (USD),Type,Interval,Features,Tax Code,Statement Descriptor,Unit Label,Category,Metadata
Package A - Starter PM,"5-10 hours/week of professional project management.",1750,recurring,month,"5-10 hours/week PM time|Single project focus|Email support",txcd_10301000,KEALEE PKG A,,packages,package_tier:A;hours_per_week:5-10
Permit Application Assistance,"Professional help with permit applications.",495,one_time,,"Application review|Document compilation",txcd_10301000,KEALEE PERMIT,application,permits,turnaround:2-3_days
```

## 🔧 Features

### ✅ CSV Parsing
- Handles quoted fields correctly
- Supports comma-separated values
- Handles empty fields

### ✅ Product Creation
- Creates Stripe products with names, descriptions
- Sets tax codes on products
- Stores metadata from CSV

### ✅ Price Creation
- Converts USD to cents automatically
- Creates recurring or one-time prices
- Sets statement descriptors on prices
- Handles different billing intervals

### ✅ Features Handling
- Parses pipe-separated features
- Stores features in product metadata as JSON
- Appends features to product description

### ✅ Metadata Handling
- Parses semicolon-separated key-value pairs
- Stores all metadata on Stripe product
- Preserves category and other custom fields

### ✅ Error Handling
- Validates CSV format before processing
- Handles Stripe API errors gracefully
- Continues processing on individual errors
- Logs detailed error messages

### ✅ Duplicate Detection
- Checks if product already exists by name
- Updates existing products instead of creating duplicates
- Updates prices for existing products

### ✅ Rate Limiting
- Adds 200ms delay between API calls
- Prevents hitting Stripe rate limits

### ✅ Dry Run Mode
- Test imports without creating products
- Validates CSV format
- Shows what would be created

### ✅ Logging
- Console output with progress
- Summary report at the end
- JSON log file with detailed results
- Environment variables output

## 📊 Output

### Console Output

```
🚀 Starting Stripe Product Import...
📄 Reading CSV file: .../products.csv
✅ Found 9 products to import

[1/9] Processing: Package A - Starter PM...
  ✅ Created product: prod_xxxxx
  ✅ Created price: price_xxxxx ($1750)

...

========================================================
📊 IMPORT SUMMARY
========================================================
Total products processed: 9
✅ Successfully imported: 9
❌ Failed: 0

========================================================
📋 ENVIRONMENT VARIABLES
========================================================

// Generated Stripe Price IDs:

STRIPE_PRICE_PACKAGE_A_STARTER_PM_MONTH=price_xxxxx
STRIPE_PRICE_PERMIT_APPLICATION_ASSISTANCE=price_xxxxx
...
```

### JSON Log File

Location: `services/api/scripts/stripe/import-log-{timestamp}.json`

```json
{
  "timestamp": "2024-01-17T12:00:00.000Z",
  "dryRun": false,
  "stats": {
    "total": 9,
    "successful": 9,
    "failed": 0,
    "skipped": 0,
    "errors": []
  },
  "results": [
    {
      "product": "Package A - Starter PM",
      "success": true,
      "productId": "prod_xxxxx",
      "priceId": "price_xxxxx",
      "error": null
    }
  ]
}
```

## 🎯 Usage Examples

### Dry Run (Test Without Creating)

```bash
pnpm stripe:import:dry-run
```

### Import All Products

```bash
pnpm stripe:import
```

### Import with Test Key

```bash
STRIPE_SECRET_KEY=sk_test_... pnpm stripe:import
```

### Import with Production Key

```bash
STRIPE_SECRET_KEY=sk_live_... pnpm stripe:import
```

## 📝 CSV Template

Use this template for new products:

```csv
Product Name,Description,Price (USD),Type,Interval,Features,Tax Code,Statement Descriptor,Unit Label,Category,Metadata
Your Product Name,"Your product description.",100,recurring,month,"Feature 1|Feature 2|Feature 3",txcd_10301000,KEALEE PROD,,category,key1:value1;key2:value2
```

## ⚙️ Script Commands

Added to `services/api/package.json`:

```json
{
  "scripts": {
    "stripe:import": "tsx scripts/stripe/stripe-import.ts",
    "stripe:import:dry-run": "tsx scripts/stripe/stripe-import.ts --dry-run"
  }
}
```

## 🔍 Troubleshooting

### CSV File Not Found

**Error:** `❌ CSV file not found: .../products.csv`

**Solution:** 
- Ensure `products.csv` exists in `services/api/scripts/stripe/`
- Check file path is correct

### Invalid Price Format

**Error:** `❌ Failed: Invalid price format`

**Solution:**
- Ensure price is a valid number
- Remove currency symbols or format as decimal
- Examples: `1750`, `1750.00`, `$1750` (script will parse)

### Stripe API Error

**Error:** `❌ Error initializing Stripe: Missing env var STRIPE_SECRET_KEY`

**Solution:**
- Create `services/api/.env.local`
- Add `STRIPE_SECRET_KEY=sk_test_...`
- Or set as environment variable

### Duplicate Products

The script automatically handles duplicates:
- Checks for existing products by name
- Updates existing products instead of creating new ones
- Creates new prices for existing products

### Rate Limiting

The script includes built-in rate limiting:
- 200ms delay between API calls
- If you hit limits, wait a few minutes and rerun
- Failed products will be logged in the error report

## 📚 Best Practices

1. **Always test with dry-run first:**
   ```bash
   pnpm stripe:import:dry-run
   ```

2. **Use test mode for development:**
   ```bash
   STRIPE_SECRET_KEY=sk_test_... pnpm stripe:import
   ```

3. **Backup existing products** before importing (export from Stripe dashboard)

4. **Review the generated environment variables** before adding to production

5. **Check the log file** for detailed results and any errors

6. **Test in Stripe test mode** before using live keys

7. **Validate CSV format** before importing (use dry-run)

## 🔄 Updating Products

The script will:
- ✅ Update existing products if found by name
- ✅ Create new prices for updated products
- ✅ Preserve existing product IDs
- ✅ Update metadata and descriptions

## 📊 Environment Variables Output

After import, the script outputs environment variables for all created price IDs:

```
STRIPE_PRICE_PACKAGE_A_STARTER_PM_MONTH=price_xxxxx
STRIPE_PRICE_PACKAGE_B_PROFESSIONAL_PM_MONTH=price_xxxxx
STRIPE_PRICE_PERMIT_APPLICATION_ASSISTANCE=price_xxxxx
```

Add these to:
- `services/api/.env.local`
- Vercel environment variables
- Railway environment variables

## ✅ Complete Implementation

The import system includes:
- ✅ Robust CSV parsing with quoted field support
- ✅ Stripe product and price creation
- ✅ Duplicate detection and updates
- ✅ Comprehensive error handling
- ✅ Dry-run mode for testing
- ✅ Rate limiting to avoid API limits
- ✅ Detailed logging and reporting
- ✅ Environment variable generation
- ✅ JSON log file output

## 🎉 Ready to Use!

The system is complete and ready to import your product catalog from CSV into Stripe!


