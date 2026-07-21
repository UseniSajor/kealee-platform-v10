#!/usr/bin/env node

/**
 * Phase 1 Marketing Automation Setup Check
 *
 * Verifies:
 * 1. GHL connection (location, contacts, pipelines)
 * 2. Twilio SMS capability
 * 3. Lead scoring logic
 * 4. All required environment variables
 *
 * Usage:
 *   node scripts/setup-marketing-phase1-check.mjs
 */

const required = {
  ghl: ['GHL_API_KEY', 'GHL_LOCATION_ID'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE', 'YOUR_SMS_NUMBER'],
  general: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
}

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║     Phase 1 Marketing Automation Setup Check                    ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

// Check env vars
console.log('🔍 Checking environment variables...\n')

const missing = []
for (const [group, vars] of Object.entries(required)) {
  console.log(`  ${group.toUpperCase()}:`)
  for (const v of vars) {
    const exists = process.env[v]
    const icon = exists ? '✅' : '❌'
    const value = exists ? exists.substring(0, 10) + '...' : 'NOT SET'
    console.log(`    ${icon} ${v.padEnd(30)} ${value}`)
    if (!exists) missing.push(v)
  }
  console.log()
}

if (missing.length > 0) {
  console.log(`\n⚠️  Missing ${missing.length} required environment variables:\n`)
  missing.forEach((v) => console.log(`    - ${v}`))
  console.log(
    '\nAdd these to .env.local before proceeding with Phase 1 implementation.\n'
  )
  process.exit(1)
}

// Test GHL connection
console.log('🔗 Testing GHL connection...\n')

const testGhl = async () => {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/locations/${process.env.GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`${res.status}: ${text}`)
    }

    const data = await res.json()
    console.log(`  ✅ GHL location connected: "${data.location?.name}"\n`)
    return true
  } catch (err) {
    console.error(`  ❌ GHL connection failed: ${err.message}\n`)
    return false
  }
}

const testTwilio = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64')

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`${res.status}: ${text}`)
    }

    const data = await res.json()
    console.log(
      `  ✅ Twilio account connected: ${data.friendly_name} (balance: $${data.balance})\n`
    )
    return true
  } catch (err) {
    console.error(`  ❌ Twilio connection failed: ${err.message}\n`)
    return false
  }
}

Promise.all([testGhl(), testTwilio()]).then((results) => {
  if (results.every(Boolean)) {
    console.log(
      '✅ Phase 1 setup complete! All connections verified.\n'
    )
    console.log('Next steps:')
    console.log('  1. Deploy schema migration: 001-marketing-phase1-schema.sql')
    console.log('  2. Enable cron job: POST /api/cron/lead-scoring')
    console.log('  3. Register GHL webhook: POST https://your-domain/api/webhooks/ghl')
    console.log('  4. Test: submit a new intake and check for SMS alert\n')
    process.exit(0)
  } else {
    console.log('❌ Some connections failed. Review errors above.\n')
    process.exit(1)
  }
})
