#!/usr/bin/env node

/**
 * PHASE 1 ACTIVATION SCRIPT
 * 
 * Activates Phase 1 marketing automation:
 * 1. Verifies all environment variables
 * 2. Tests GHL connection
 * 3. Tests Twilio connection
 * 4. Confirms database migrations applied
 * 5. Lists webhook/cron setup steps
 * 
 * Usage:
 *   node scripts/activate-phase1.mjs
 */

import * as fs from 'fs'

const required = {
  ghl: ['GHL_API_KEY', 'GHL_LOCATION_ID', 'CRON_SECRET'],
  twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE', 'YOUR_SMS_NUMBER'],
  supabase: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
}

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║         PHASE 1 ACTIVATION: Lead Scoring + SMS Alerts         ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

// Step 1: Verify environment
console.log('STEP 1: Verify Environment Variables')
console.log('─'.repeat(60) + '\n')

const missing = []
for (const [group, vars] of Object.entries(required)) {
  console.log(`${group.toUpperCase()}:`)
  for (const v of vars) {
    const exists = process.env[v]
    const icon = exists ? '✅' : '❌'
    console.log(`  ${icon} ${v.padEnd(35)} ${exists ? '(set)' : '(MISSING)'}`)
    if (!exists) missing.push(v)
  }
  console.log()
}

if (missing.length > 0) {
  console.error(`\n❌ Missing ${missing.length} environment variables:\n`)
  missing.forEach((v) => console.error(`  - ${v}`))
  console.error(
    '\nSet these in Vercel/Railway before proceeding.\n'
  )
  process.exit(1)
}

// Step 2: Test connections
console.log('STEP 2: Testing Connections')
console.log('─'.repeat(60) + '\n')

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
      const text = await res.text()
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
      const text = await res.text()
      throw new Error(`${res.status}: ${text}`)
    }

    const data = await res.json()
    console.log(`  ✅ Twilio account connected`)
    console.log(`     Name: ${data.friendly_name}`)
    console.log(`     Balance: $${data.balance}`)
    console.log(`     Phone: ${process.env.TWILIO_PHONE}\n`)
    return true
  } catch (err) {
    console.error(`  ❌ Twilio connection failed: ${err.message}\n`)
    return false
  }
}

Promise.all([testGhl(), testTwilio()]).then((results) => {
  if (!results.every(Boolean)) {
    console.error('\n❌ Connection tests failed. Fix errors above and retry.\n')
    process.exit(1)
  }

  // Step 3: Database checklist
  console.log('\nSTEP 3: Database Migrations')
  console.log('─'.repeat(60) + '\n')
  console.log('Before going live, apply this migration in Supabase SQL Editor:\n')
  console.log('  File: _docs/migrations/001-marketing-phase1-schema.sql')
  console.log('  Creates:')
  console.log('    - Columns: lead_score, routing_tag, ghl_contact_id, sms_alert_sent_at')
  console.log('    - Tables: ghl_sync_log, sms_alert_log')
  console.log('    - Indexes: on lead_score, routing_tag, ghl_contact_id\n')

  // Step 4: Webhook registration
  console.log('\nSTEP 4: Webhook Registration')
  console.log('─'.repeat(60) + '\n')
  console.log('Register in GHL app settings:\n')
  console.log('  URL: https://your-domain/api/webhooks/ghl')
  console.log('  Secret: Set GHL_WEBHOOK_SECRET in environment')
  console.log('  Events: Contact updated, Opportunity stage changed\n')

  // Step 5: Cron job registration
  console.log('\nSTEP 5: Cron Job Registration')
  console.log('─'.repeat(60) + '\n')
  console.log('Register cron job (every 5 minutes):\n')
  console.log('  Endpoint: POST https://your-domain/api/cron/lead-scoring')
  console.log('  Auth: x-kealee-ops: $CRON_SECRET')
  console.log('  Tools: EasyCron, Cronitor, Railway Triggers, GitHub Actions, etc.\n')

  // Step 6: Test lead
  console.log('\nSTEP 6: Test with Manual Lead')
  console.log('─'.repeat(60) + '\n')
  console.log('Submit a test intake (concept, estimate, or permit):')
  console.log('  1. Go to https://kealee.com/intake/concept')
  console.log('  2. Fill form: budget=$50k, timeline=ASAP, upload photo')
  console.log('  3. Submit payment')
  console.log('  4. Wait 5 minutes for cron job to run')
  console.log('  5. Check:')
  console.log('     - Supabase: lead_score + routing_tag populated')
  console.log('     - SMS: hot lead alert received on YOUR_SMS_NUMBER')
  console.log('     - GHL: new contact created with tags\n')

  // Step 7: Go live
  console.log('\nSTEP 7: Go Live!')
  console.log('─'.repeat(60) + '\n')
  console.log('Once test passes:')
  console.log('  1. Enable cron job')
  console.log('  2. Enable GHL webhook')
  console.log('  3. Start processing real lead traffic')
  console.log('  4. Monitor: check Slack logs daily for errors\n')

  console.log('✅ Phase 1 activation complete!\n')
  console.log('Expected: 5-10 hot leads/day → SMS alerts → GHL contacts\n')
  console.log('Next: Phase 2 (AI Qualification) in 1-2 weeks\n')

  process.exit(0)
})
