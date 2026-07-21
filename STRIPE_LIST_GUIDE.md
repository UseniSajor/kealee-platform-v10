# 📋 Stripe Product List Script (Rainbow CSV Compatible)

Complete guide for listing and exporting Stripe products to CSV format, optimized for Rainbow CSV visualization.

## 🚀 Quick Start

### List Products as CSV (Rainbow CSV Format)

```bash
cd services/api
pnpm stripe:list
```

### Export as JSON

```bash
pnpm stripe:list:json
```

## 📁 Files Created

1. **`services/api/scripts/stripe/stripe-list.ts`** - Main list/export script
2. **`services/api/scripts/stripe/stripe-products-export.csv`** - Generated CSV export
3. **`services/api/scripts/stripe/stripe-products-export.json`** - Generated JSON export (optional)

## 📊 CSV Format (Rainbow CSV Compatible)

The CSV file is formatted with these columns for easy visualization in Rainbow CSV:

| Column | Description | Example |
|--------|-------------|---------|
| `Product ID` | Stripe product ID | `prod_xxxxx` |
| `Product Name` | Product name | `Package A - Starter PM` |
| `Description` | Product description | `5-10 hours/week...` |
| `Category` | Product category | `packages`, `ops`, `architecture` |
| `Active` | Product active status | `true`, `false` |
| `Price ID` | Stripe price ID | `price_xxxxx` |
| `Lookup Key` | Price lookup key | `pm-pm-package-a-month` |
| `Amount` | Price amount | `$1,750.00` |
| `Currency` | Price currency | `usd` |
| `Type` | Price type | `recurring`, `one_time` |
| `Interval` | Billing interval | `month`, `year`, `one-time` |
| `Price Active` | Price active status | `true`, `false` |
| `Created Date` | Creation date | `2024-01-17` |
| `Features` | Features list (pipe-separated) | `Feature 1 \| Feature 2` |
| `Metadata` | Product metadata (semicolon-separated) | `key1:value1;key2:value2` |

## 🎨 Rainbow CSV Features

The CSV is optimized for the Rainbow CSV VS Code extension:

- ✅ **Proper CSV escaping** - Handles commas, quotes, and newlines
- ✅ **Quoted fields** - Fields with special characters are properly quoted
- ✅ **Consistent formatting** - Clean column alignment
- ✅ **Metadata included** - All product metadata is preserved
- ✅ **Features extracted** - Features are parsed from JSON metadata

## 💻 Usage

### View CSV in VS Code

1. Install Rainbow CSV extension in VS Code
2. Open `services/api/scripts/stripe/stripe-products-export.csv`
3. Rainbow CSV will automatically:
   - Colorize columns
   - Highlight header row
   - Enable column-based operations
   - Show column statistics

### Filter and Sort

With Rainbow CSV, you can:
- **Filter by column** - Click column header to filter
- **Sort by column** - Click header to sort ascending/descending
- **Search** - Use VS Code search with regex support
- **Edit** - Direct CSV editing with validation

## 📋 Package.json Scripts

```json
{
  "scripts": {
    "stripe:list": "tsx scripts/stripe/stripe-list.ts",
    "stripe:list:json": "tsx scripts/stripe/stripe-list.ts --json"
  }
}
```

## 📊 Output Format

### Console Output

```
📋 Listing Stripe Products...
📦 Fetching products from Stripe...
✅ Found 40 products
💰 Fetching prices for each product...
✅ Fetched prices for all products

✅ CSV export saved to: .../stripe-products-export.csv

📊 Summary:
   Total Products: 40
   Total Prices: 54
   Active Products: 40
   Inactive Products: 0

💡 Tip: Open CSV in VS Code with Rainbow CSV extension!
```

### Summary Report

The script also prints a categorized summary:
- Products grouped by category
- All prices for each product
- Active/inactive status
- Lookup keys for easy reference

## 🔍 Features

### ✅ Complete Export
- Fetches all products (handles pagination)
- Fetches all prices for each product
- Includes all metadata and features
- Preserves product relationships

### ✅ CSV Formatting
- Proper CSV escaping
- Handles quotes and commas
- Preserves newlines in descriptions
- Format metadata as key-value pairs

### ✅ Feature Extraction
- Parses features from JSON metadata
- Formats as pipe-separated list
- Handles missing features gracefully

### ✅ Error Handling
- Validates Stripe API key
- Handles API errors gracefully
- Continues on individual errors
- Detailed error messages

### ✅ Multiple Output Formats
- CSV (default) - For Rainbow CSV
- JSON (optional) - For programmatic use

## 📝 Example CSV Row

```csv
Product ID,Product Name,Description,Category,Active,Price ID,Lookup Key,Amount,Currency,Type,Interval,Price Active,Created Date,Features,Metadata
prod_xxxxx,Package A - Starter PM,"5-10 hours/week of professional project management.",packages,true,price_xxxxx,pm-pm-package-a-month,$1,750.00,usd,recurring,month,true,2024-01-17,"5-10 hours/week PM time | Single project focus | Email support",package_tier:A;hours_per_week:5-10
```

## 🎯 Use Cases

### 1. Product Inventory
- View all products in one place
- Check active/inactive status
- Verify pricing consistency

### 2. Price Management
- Compare prices across products
- Identify missing prices
- Verify lookup keys

### 3. Metadata Review
- Review product metadata
- Check feature lists
- Verify categorization

### 4. Reporting
- Export for reporting tools
- Share with stakeholders
- Archive product catalog

### 5. Auditing
- Track product changes
- Verify pricing accuracy
- Document product catalog

## 🔄 Updates

The script:
- ✅ Fetches latest data from Stripe
- ✅ Includes all active and inactive products
- ✅ Updates CSV file on each run
- ✅ Preserves all product details

## 📊 Statistics

After export, you'll see:
- Total products
- Total prices
- Active products count
- Inactive products count
- Products by category

## 🎨 Rainbow CSV Tips

### Column Navigation
- Click column header to select entire column
- Use `Ctrl+Shift+Left/Right` to navigate columns
- Use `Alt+Shift+Click` to select multiple columns

### Filtering
- Click filter icon on column header
- Enter filter criteria
- Apply regex patterns for advanced filtering

### Sorting
- Click column header to sort
- Click again to reverse sort
- Multiple column sort with `Shift+Click`

### Editing
- Direct cell editing
- Paste CSV data
- Validate on save

## ✅ Ready to Use!

The CSV export is complete and ready for Rainbow CSV visualization!

**File Location:** `services/api/scripts/stripe/stripe-products-export.csv`

Open it in VS Code with Rainbow CSV extension installed for the best experience! 🎨




