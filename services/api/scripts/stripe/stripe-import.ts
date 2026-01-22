import Stripe from 'stripe'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local file if it exists
config({ path: resolve(process.cwd(), '.env.local') })

// Environment variable helper
function env(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var ${key}`)
  return v
}

interface ProductRow {
  'Product Name': string
  Description: string
  'Price (USD)': string
  Type: string
  Interval: string
  Features: string
  'Tax Code': string
  'Statement Descriptor': string
  'Unit Label': string
  Category: string
  Metadata: string
}

interface ImportResult {
  success: boolean
  productId?: string
  priceId?: string
  error?: string
}

interface ImportStats {
  total: number
  successful: number
  failed: number
  skipped: number
  errors: Array<{ product: string; error: string }>
}

// CSV Parser - handles quoted fields and pipes
function parseCSV(csvContent: string): ProductRow[] {
  const lines = csvContent.split('\n').filter((line) => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row')
  }

  const headers = parseCSVLine(lines[0])
  const rows: ProductRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0 || (values.length === 1 && values[0].trim() === '')) {
      continue // Skip empty lines
    }

    const row: Partial<ProductRow> = {}
    headers.forEach((header, index) => {
      row[header as keyof ProductRow] = (values[index] || '').trim()
    })
    rows.push(row as ProductRow)
  }

  return rows
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add last field
  values.push(current)
  return values
}

// Parse metadata string (format: key1:value1;key2:value2)
function parseMetadata(metadataString: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  if (!metadataString || metadataString.trim() === '') {
    return metadata
  }

  const pairs = metadataString.split(';')
  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim())
    if (key && value) {
      metadata[key] = value
    }
  }

  return metadata
}

// Parse features string (pipe-separated)
function parseFeatures(featuresString: string): string[] {
  if (!featuresString || featuresString.trim() === '') {
    return []
  }
  return featuresString.split('|').map((f) => f.trim()).filter((f) => f !== '')
}

// Convert price string to cents
function parsePrice(priceString: string): number {
  const price = parseFloat(priceString.replace(/[^0-9.]/g, ''))
  if (isNaN(price) || price < 0) {
    throw new Error(`Invalid price format: ${priceString}`)
  }
  return Math.round(price * 100) // Convert to cents
}

// Create Stripe product and price
async function createStripeProduct(
  stripe: Stripe,
  row: ProductRow,
  dryRun: boolean
): Promise<ImportResult> {
  try {
    const productName = row['Product Name'].trim()
    if (!productName) {
      throw new Error('Product name is required')
    }

    const description = row.Description?.trim() || ''
    const priceString = row['Price (USD)']?.trim()
    const type = row.Type?.trim().toLowerCase() || 'one_time'
    const interval = row.Interval?.trim().toLowerCase() || ''
    const taxCode = row['Tax Code']?.trim() || ''
    const statementDescriptor = row['Statement Descriptor']?.trim() || ''
    const unitLabel = row['Unit Label']?.trim() || ''
    const category = row.Category?.trim() || ''
    const metadataString = row.Metadata?.trim() || ''
    const featuresString = row.Features?.trim() || ''

    // Parse metadata and features
    const metadata = parseMetadata(metadataString)
    const features = parseFeatures(featuresString)

    // Add category and features to metadata
    if (category) {
      metadata.category = category
    }
    if (features.length > 0) {
      metadata.features_count = features.length.toString()
      // Store features as JSON string (Stripe metadata values must be strings)
      metadata.features_json = JSON.stringify(features)
    }
    if (unitLabel) {
      metadata.unit_label = unitLabel
    }

    // Validate price
    let unitAmount: number
    try {
      unitAmount = parsePrice(priceString)
    } catch (error) {
      throw new Error(`Invalid price: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Build full description with features
    let fullDescription = description
    if (features.length > 0) {
      fullDescription += `\n\nFeatures:\n${features.map((f) => `• ${f}`).join('\n')}`
    }

    if (dryRun) {
      console.log(`  [DRY RUN] Would create product: ${productName}`)
      console.log(`  [DRY RUN]   Price: $${unitAmount / 100} (${unitAmount} cents)`)
      console.log(`  [DRY RUN]   Type: ${type}, Interval: ${interval || 'N/A'}`)
      return { success: true }
    }

    // Check if product already exists
    const existingProducts = await stripe.products.list({ limit: 100 })
    const existing = existingProducts.data.find((p) => p.name === productName)

    if (existing) {
      console.log(`  ⚠️  Product already exists: ${existing.id} (${productName})`)
      // Update existing product
      const updatedProduct = await stripe.products.update(existing.id, {
        description: fullDescription,
        metadata: metadata
      })

      // Create or update price
      const existingPrices = await stripe.prices.list({
        product: existing.id,
        limit: 100
      })

      let price: Stripe.Price
      const priceParams: Stripe.PriceCreateParams = {
        product: existing.id,
        unit_amount: unitAmount,
        currency: 'usd',
        active: true
      }

      if (type === 'recurring' && interval) {
        if (!['month', 'year', 'week', 'day'].includes(interval)) {
          throw new Error(`Invalid recurring interval: ${interval}. Must be: month, year, week, or day`)
        }
        priceParams.recurring = {
          interval: interval as Stripe.Price.Recurring.Interval
        }
      }

      if (taxCode) {
        priceParams.tax_behavior = 'exclusive'
      }

      if (statementDescriptor) {
        // Statement descriptor max 22 chars
        priceParams.metadata = {
          statement_descriptor: statementDescriptor.substring(0, 22)
        }
      }

      // Check if price already exists
      const existingPrice = existingPrices.data.find((p) => {
        const sameAmount = p.unit_amount === unitAmount
        const sameCurrency = p.currency === 'usd'
        if (type === 'recurring' && interval) {
          return (
            sameAmount &&
            sameCurrency &&
            p.recurring?.interval === interval &&
            p.active
          )
        }
        return sameAmount && sameCurrency && !p.recurring && p.active
      })

      if (existingPrice) {
        console.log(`  ⚠️  Price already exists: ${existingPrice.id}`)
        price = existingPrice
      } else {
        price = await stripe.prices.create(priceParams as Stripe.PriceCreateParams)
        console.log(`  ✅ Created/Updated price: ${price.id}`)
      }

      // Update product tax code if specified
      if (taxCode && updatedProduct.tax_code !== taxCode) {
        await stripe.products.update(existing.id, {
          tax_code: taxCode
        })
      }

      return {
        success: true,
        productId: existing.id,
        priceId: price.id
      }
    }

    // Create new product
    const productParams: Stripe.ProductCreateParams = {
      name: productName,
      description: fullDescription,
      metadata: metadata,
      active: true
    }

    if (taxCode) {
      productParams.tax_code = taxCode
    }

    const product = await stripe.products.create(productParams)
    console.log(`  ✅ Created product: ${product.id}`)

    // Create price
    const priceParams: Stripe.PriceCreateParams = {
      product: product.id,
      unit_amount: unitAmount,
      currency: 'usd',
      active: true
    }

    if (type === 'recurring' && interval) {
      if (!['month', 'year', 'week', 'day'].includes(interval)) {
        throw new Error(`Invalid recurring interval: ${interval}. Must be: month, year, week, or day`)
      }
      priceParams.recurring = {
        interval: interval as Stripe.Price.Recurring.Interval
      }
    }

    if (taxCode) {
      priceParams.tax_behavior = 'exclusive'
    }

    if (statementDescriptor) {
      // Statement descriptor on price metadata
      priceParams.metadata = {
        statement_descriptor: statementDescriptor.substring(0, 22)
      }
    }

    const price = await stripe.prices.create(priceParams)
    console.log(`  ✅ Created price: ${price.id} ($${unitAmount / 100})`)

    return {
      success: true,
      productId: product.id,
      priceId: price.id
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMessage
    }
  }
}

// Main import function
async function importProducts(dryRun: boolean = false) {
  console.log('🚀 Starting Stripe Product Import...\n')

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No products will be created\n')
  }

  const csvPath = path.resolve(__dirname, 'products.csv')

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`)
    console.error('   Please create products.csv in the same directory as this script')
    process.exit(1)
  }

  console.log(`📄 Reading CSV file: ${csvPath}`)
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parse CSV
  let rows: ProductRow[]
  try {
    rows = parseCSV(csvContent)
    console.log(`✅ Found ${rows.length} products to import\n`)
  } catch (error) {
    console.error(`❌ Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
    process.exit(1)
  }

  if (rows.length === 0) {
    console.error('❌ No products found in CSV file')
    process.exit(1)
  }

  // Initialize Stripe
  let stripe: Stripe
  try {
    stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16'
    })
  } catch (error) {
    console.error(`❌ Error initializing Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('   Make sure STRIPE_SECRET_KEY is set in .env.local')
    process.exit(1)
  }

  // Process products
  const stats: ImportStats = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  }

  const results: Array<{ row: ProductRow; result: ImportResult }> = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const productName = row['Product Name']?.trim() || `Row ${i + 1}`

    console.log(`\n[${i + 1}/${rows.length}] Processing: ${productName}...`)

    try {
      const result = await createStripeProduct(stripe, row, dryRun)

      if (result.success) {
        stats.successful++
        console.log(`  ✅ Success`)
      } else {
        stats.failed++
        stats.errors.push({
          product: productName,
          error: result.error || 'Unknown error'
        })
        console.log(`  ❌ Failed: ${result.error}`)
      }

      results.push({ row, result })

      // Rate limiting - wait between requests
      if (!dryRun && i < rows.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    } catch (error) {
      stats.failed++
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      stats.errors.push({
        product: productName,
        error: errorMessage
      })
      console.log(`  ❌ Error: ${errorMessage}`)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total products processed: ${stats.total}`)
  console.log(`✅ Successfully imported: ${stats.successful}`)
  console.log(`❌ Failed: ${stats.failed}`)
  if (dryRun) {
    console.log(`⚠️  Dry run mode - no products were actually created`)
  }

  if (stats.errors.length > 0) {
    console.log('\n❌ ERRORS:')
    stats.errors.forEach((err) => {
      console.log(`  • ${err.product}: ${err.error}`)
    })
  }

  // Generate environment variables output
  if (!dryRun && stats.successful > 0) {
    console.log('\n' + '='.repeat(80))
    console.log('📋 ENVIRONMENT VARIABLES')
    console.log('='.repeat(80))
    console.log('\n// Generated Stripe Price IDs:\n')

    const priceOutput: Record<string, string> = {}

    results.forEach(({ row, result }) => {
      if (result.success && result.priceId) {
        const productName = row['Product Name'].trim()
        const envKey = productName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')

        if (row.Type?.trim().toLowerCase() === 'recurring' && row.Interval?.trim().toLowerCase()) {
          const interval = row.Interval.trim().toLowerCase()
          priceOutput[`STRIPE_PRICE_${envKey}_${interval.toUpperCase()}`] = result.priceId
        } else {
          priceOutput[`STRIPE_PRICE_${envKey}`] = result.priceId
        }
      }
    })

    // Sort and output
    Object.entries(priceOutput)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, value]) => {
        console.log(`${key}=${value}`)
      })

    console.log('\n' + '='.repeat(80))
  }

  if (!dryRun) {
    console.log('\n🌐 View products in Stripe Dashboard:')
    console.log('   https://dashboard.stripe.com/products')
  }

  console.log('')

  // Write log file
  const logPath = path.resolve(__dirname, `import-log-${Date.now()}.json`)
  const logData = {
    timestamp: new Date().toISOString(),
    dryRun,
    stats,
    results: results.map(({ row, result }) => ({
      product: row['Product Name'],
      success: result.success,
      productId: result.productId,
      priceId: result.priceId,
      error: result.error
    }))
  }

  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2))
  console.log(`📝 Detailed log saved to: ${logPath}`)

  // Exit with error code if any failed
  if (stats.failed > 0) {
    process.exit(1)
  }
}

// Run script
const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d')

importProducts(dryRun).catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})




