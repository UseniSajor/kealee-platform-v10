#!/usr/bin/env node

/**
 * Test GHL API connection with provided key
 * 
 * Usage:
 *   node scripts/test-ghl-connection.mjs
 * 
 * Requires:
 *   GHL_API_KEY
 *   GHL_LOCATION_ID
 */

const GHL_API_KEY = process.env.GHL_API_KEY
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID
const GHL_BASE = 'https://services.leadconnectorhq.com'

if (!GHL_API_KEY || !GHL_LOCATION_ID) {
  console.error('❌ Missing environment variables:')
  if (!GHL_API_KEY) console.error('  - GHL_API_KEY')
  if (!GHL_LOCATION_ID) console.error('  - GHL_LOCATION_ID')
  process.exit(1)
}

async function ghlFetch(method, path, body) {
  const res = await fetch(`${GHL_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`GHL ${method} ${path} → ${res.status}: ${text}`)
  }

  return res.json()
}

async function testConnection() {
  try {
    console.log('🔍 Testing GHL connection...\n')
    console.log(`  GHL_API_KEY: ${GHL_API_KEY.substring(0, 10)}...`)
    console.log(`  GHL_LOCATION_ID: ${GHL_LOCATION_ID}\n`)

    // Test 1: Get location details
    console.log('Test 1: Fetching location details...')
    const location = await ghlFetch('GET', `/locations/${GHL_LOCATION_ID}`)
    console.log(`  ✅ Location found: "${location.location?.name || 'N/A'}"`)
    console.log(`     Business type: ${location.location?.businessType || 'N/A'}`)
    console.log()

    // Test 2: Search contacts (empty search)
    console.log('Test 2: Searching contacts...')
    const contacts = await ghlFetch('GET', `/contacts/search?limit=1&locationId=${GHL_LOCATION_ID}`)
    const contactCount = contacts.contacts?.length || 0
    console.log(`  ✅ Found ${contactCount} contact(s)`)
    if (contactCount > 0) {
      console.log(`     First contact: ${contacts.contacts[0].firstName} ${contacts.contacts[0].lastName} (${contacts.contacts[0].email})`)
    }
    console.log()

    // Test 3: Describe pipelines (for Phase 2 opportunity creation)
    console.log('Test 3: Listing pipelines...')
    const pipelines = await ghlFetch('GET', `/pipelines?locationId=${GHL_LOCATION_ID}`)
    const pipelineCount = pipelines.pipelines?.length || 0
    console.log(`  ✅ Found ${pipelineCount} pipeline(s)`)
    if (pipelineCount > 0) {
      pipelines.pipelines.slice(0, 3).forEach((p) => {
        console.log(`     - ${p.name} (ID: ${p.id})`)
      })
    }
    console.log()

    console.log('✅ All tests passed! GHL is properly configured.')
    console.log()
    console.log('Next steps:')
    console.log('  1. Copy GHL_API_KEY and GHL_LOCATION_ID to .env.local')
    console.log('  2. If pipelines exist, note the pipeline IDs for Phase 2 config')
    console.log('  3. Run: pnpm run build && pnpm run dev')
    process.exit(0)
  } catch (err) {
    console.error(`\n❌ Connection failed:\n  ${err.message}\n`)
    process.exit(1)
  }
}

testConnection()
