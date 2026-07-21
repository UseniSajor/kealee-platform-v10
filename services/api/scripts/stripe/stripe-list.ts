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

interface ProductWithPrices {
  id: string
  name: string
  description: string
  active: boolean
  metadata: Record<string, string>
  category?: string
  created: number
  prices: Array<{
    id: string
    unit_amount: number | null
    currency: string
    type: 'one_time' | 'recurring'
    interval?: string | null
    active: boolean
    lookup_key: string | null
    created: number
  }>
}

// Escape CSV field (handles quotes and commas)
function escapeCSVField(field: string | null | undefined): string {
  if (!field) return ''
  const str = String(field)
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Format currency amount
function formatAmount(amount: number | null, currency: string): string {
  if (amount === null) return ''
  return `$${(amount / 100).toFixed(2)}`
}

// Format interval for recurring prices
function formatInterval(interval: string | null | undefined): string {
  if (!interval) return 'one-time'
  return interval
}

// Extract features from metadata
function extractFeatures(metadata: Record<string, string>): string {
  if (metadata.features_json) {
    try {
      const features = JSON.parse(metadata.features_json)
      if (Array.isArray(features)) {
        return features.join(' | ')
      }
    } catch (e) {
      // If parsing fails, return as-is
      return metadata.features_json
    }
  }
  return ''
}

// Format metadata for CSV (exclude internal fields)
function formatMetadata(metadata: Record<string, string>): string {
  const excludeKeys = ['features_json', 'features_count', 'slug']
  const entries = Object.entries(metadata)
    .filter(([key]) => !excludeKeys.includes(key))
    .map(([key, value]) => `${key}:${value}`)
  
  return entries.join(';')
}

// Format date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

// Main list function
async function listStripeProducts(outputFormat: 'csv' | 'json' = 'csv') {
  console.log('📋 Listing Stripe Products...\n')

  try {
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-12-15.clover' as any
    })

    // Fetch all products
    console.log('📦 Fetching products from Stripe...')
    const products: Stripe.Product[] = []
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const response = await stripe.products.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.default_price']
      })

      products.push(...response.data)
      hasMore = response.has_more

      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id
      }
    }

    console.log(`✅ Found ${products.length} products\n`)

    // Fetch prices for each product
    console.log('💰 Fetching prices for each product...')
    const productsWithPrices: ProductWithPrices[] = []

    for (const product of products) {
      const prices = await stripe.prices.list({
        product: product.id,
        limit: 100
      })

      productsWithPrices.push({
        id: product.id,
        name: product.name,
        description: product.description || '',
        active: product.active,
        metadata: product.metadata,
        category: product.metadata.category || product.metadata.Category || '',
        created: product.created,
        prices: prices.data.map((price: Stripe.Price) => ({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          type: price.type === 'recurring' ? 'recurring' : 'one_time',
          interval: price.recurring?.interval || null,
          active: price.active,
          lookup_key: price.lookup_key,
          created: price.created
        }))
      })
    }

    console.log(`✅ Fetched prices for all products\n`)

    if (outputFormat === 'json') {
      // Output as JSON
      const outputPath = path.resolve(__dirname, 'stripe-products-export.json')
      const jsonOutput = {
        exportDate: new Date().toISOString(),
        totalProducts: productsWithPrices.length,
        products: productsWithPrices.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          active: p.active,
          category: p.category,
          metadata: p.metadata,
          created: formatDate(p.created),
          prices: p.prices.map((pr) => ({
            id: pr.id,
            amount: pr.unit_amount ? pr.unit_amount / 100 : null,
            currency: pr.currency,
            type: pr.type,
            interval: pr.interval,
            active: pr.active,
            lookup_key: pr.lookup_key,
            created: formatDate(pr.created)
          }))
        }))
      }

      fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2))
      console.log(`✅ JSON export saved to: ${outputPath}`)
      return
    }

    // Output as CSV (Rainbow CSV format)
    const outputPath = path.resolve(__dirname, 'stripe-products-export.csv')
    
    // CSV Headers (Rainbow CSV will colorize these)
    const headers = [
      'Product ID',
      'Product Name',
      'Description',
      'Category',
      'Active',
      'Price ID',
      'Lookup Key',
      'Amount',
      'Currency',
      'Type',
      'Interval',
      'Price Active',
      'Created Date',
      'Features',
      'Metadata'
    ]

    const rows: string[] = []

    // Add header row
    rows.push(headers.map(escapeCSVField).join(','))

    // Add data rows
    for (const product of productsWithPrices) {
      const features = extractFeatures(product.metadata)
      const metadata = formatMetadata(product.metadata)
      const createdDate = formatDate(product.created)

      if (product.prices.length === 0) {
        // Product with no prices
        const row = [
          product.id,
          product.name,
          product.description,
          product.category || '',
          product.active.toString(),
          '', // No price ID
          '', // No lookup key
          '', // No amount
          '', // No currency
          '', // No type
          '', // No interval
          '', // No price active
          createdDate,
          features,
          metadata
        ]
        rows.push(row.map(escapeCSVField).join(','))
      } else {
        // Add row for each price
        for (const price of product.prices) {
          const row = [
            product.id,
            product.name,
            product.description,
            product.category || '',
            product.active.toString(),
            price.id,
            price.lookup_key || '',
            price.unit_amount ? formatAmount(price.unit_amount, price.currency) : '',
            price.currency,
            price.type,
            formatInterval(price.interval),
            price.active.toString(),
            createdDate,
            features,
            metadata
          ]
          rows.push(row.map(escapeCSVField).join(','))
        }
      }
    }

    // Write CSV file
    const csvContent = rows.join('\n')
    fs.writeFileSync(outputPath, csvContent, 'utf-8')

    console.log(`✅ CSV export saved to: ${outputPath}`)
    console.log(`\n📊 Summary:`)
    console.log(`   Total Products: ${productsWithPrices.length}`)
    console.log(`   Total Prices: ${productsWithPrices.reduce((sum, p) => sum + p.prices.length, 0)}`)
    console.log(`   Active Products: ${productsWithPrices.filter((p) => p.active).length}`)
    console.log(`   Inactive Products: ${productsWithPrices.filter((p) => !p.active).length}`)
    console.log(`\n💡 Tip: Open ${outputPath} in VS Code with Rainbow CSV extension for colorized view!`)
    console.log('')

    // Also print a summary table
    console.log('\n' + '='.repeat(100))
    console.log('📋 PRODUCT SUMMARY')
    console.log('='.repeat(100))
    console.log('')

    // Group by category
    const byCategory = productsWithPrices.reduce((acc, product) => {
      const category = product.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(product)
      return acc
    }, {} as Record<string, ProductWithPrices[]>)

    for (const [category, products] of Object.entries(byCategory)) {
      console.log(`\n📁 ${category.toUpperCase()} (${products.length} products)`)
      console.log('-'.repeat(100))

      for (const product of products) {
        console.log(`\n  ${product.name}`)
        console.log(`    Product ID: ${product.id}`)
        console.log(`    Active: ${product.active ? '✅' : '❌'}`)
        
        if (product.prices.length > 0) {
          console.log(`    Prices:`)
          for (const price of product.prices) {
            const amount = price.unit_amount ? formatAmount(price.unit_amount, price.currency) : 'N/A'
            const interval = price.interval ? `/${price.interval}` : ''
            const active = price.active ? '✅' : '❌'
            const lookupKey = price.lookup_key ? ` (${price.lookup_key})` : ''
            console.log(`      • ${amount}${interval} ${active} - ${price.id}${lookupKey}`)
          }
        } else {
          console.log(`    Prices: No prices found`)
        }
      }
    }

    console.log('\n' + '='.repeat(100))
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error')
    if (error instanceof Error && error.message.includes('Missing env var')) {
      console.error('   Make sure STRIPE_SECRET_KEY is set in .env.local')
    }
    process.exit(1)
  }
}

// Run script
const args = process.argv.slice(2)
const format = args.includes('--json') || args.includes('-j') ? 'json' : 'csv'

listStripeProducts(format).catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})

