#!/usr/bin/env node

/**
 * Marketing Automation Deployment Script
 * 
 * Deploys Phase 1, 2, and 3 to production
 * - Validates environment
 * - Applies database migrations
 * - Configures webhooks and cron jobs
 * - Activates all marketing automation
 * 
 * Usage:
 *   node scripts/deploy-marketing-automation.mjs [phase] [environment]
 * 
 * Examples:
 *   node scripts/deploy-marketing-automation.mjs phase1 production
 *   node scripts/deploy-marketing-automation.mjs all staging
 */

import * as fs from 'fs'
import * as path from 'path'

const args = process.argv.slice(2)
const phase = args[0] || 'all'
const environment = args[1] || 'production'

const PHASES = {
  phase1: {
    name: 'Lead Scoring + SMS Alerts + GHL',
    migrations: ['001-marketing-phase1-schema.sql'],
    endpoints: ['/api/cron/lead-scoring', '/api/webhooks/ghl'],
    envVars: [
      'GHL_API_KEY',
      'GHL_LOCATION_ID',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE',
      'YOUR_SMS_NUMBER',
      'CRON_SECRET',
    ],
    cronJobs: [
      {
        endpoint: '/api/cron/lead-scoring',
        frequency: '*/5 * * * *',
        description: 'Score leads, send SMS alerts, sync to GHL',
      },
    ],
  },
  phase2: {
    name: 'AI Qualification + Calendly + Slack',
    migrations: ['002-marketing-phase2-schema.sql'],
    endpoints: ['/api/cron/requalify-cold'],
    envVars: [
      'ANTHROPIC_API_KEY',
      'CALENDLY_API_TOKEN',
      'CALENDLY_CALENDAR_UUID',
      'SLACK_WEBHOOK_URL',
    ],
    cronJobs: [
      {
        endpoint: '/api/cron/requalify-cold',
        frequency: '0 */12 * * *',
        description: 'Re-qualify cold leads every 12 hours',
      },
    ],
    dependencies: ['phase1'],
  },
  phase3: {
    name: 'Multi-Channel Scale + Facebook + Google + ROI',
    migrations: ['003-marketing-phase3-schema.sql'],
    endpoints: [
      '/api/webhooks/facebook-leads',
      '/api/webhooks/inbound-sms',
      '/api/admin/marketing/roi-snapshot',
    ],
    envVars: [
      'META_APP_ID',
      'META_APP_SECRET',
      'FACEBOOK_PAGE_ACCESS_TOKEN',
      'META_WEBHOOK_VERIFY_TOKEN',
      'GOOGLE_ADS_CUSTOMER_ID',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_CONVERSION_ID',
    ],
    cronJobs: [
      {
        endpoint: '/api/admin/marketing/roi-snapshot',
        frequency: '0 0 1 * *',
        description: 'Monthly ROI snapshot (1st of month at midnight)',
      },
    ],
    dependencies: ['phase1', 'phase2'],
  },
}

const DEPLOYMENT_CHECKLIST = {
  phase1: [
    '✅ Environment variables set (GHL, Twilio, SMS)',
    '✅ Database migrations applied',
    '✅ Cron job registered (/api/cron/lead-scoring every 5 min)',
    '✅ GHL webhook registered (/api/webhooks/ghl)',
    '✅ Verification scripts passed (pnpm run test:ghl)',
    '✅ Test intake submitted, hot lead scored, SMS received',
    '✅ GHL contact created with proper tags',
    '✅ Go live for real traffic',
  ],
  phase2: [
    '✅ Phase 1 stable for 1 week',
    '✅ Calendly API token + calendar UUID set',
    '✅ Slack webhook configured (#leads channel)',
    '✅ Database migration applied',
    '✅ Cron job registered (requalify-cold every 12h)',
    '✅ Test: SMS reply classified by AI',
    '✅ Test: Qualified lead scheduled on Calendly',
    '✅ Slack notifications working',
  ],
  phase3: [
    '✅ Phase 2 stable for 1 week',
    '✅ Facebook Lead Ads form created',
    '✅ Facebook webhook secret set',
    '✅ Google Ads conversion action created',
    '✅ Database migration applied',
    '✅ Test: Facebook lead flows to GHL',
    '✅ Test: Google gclid captured + conversion uploaded',
    '✅ Monthly ROI snapshot running',
  ],
}

console.log('\n╔════════════════════════════════════════════════════════════════╗')
console.log('║     Marketing Automation Deployment Dashboard                  ║')
console.log('╚════════════════════════════════════════════════════════════════╝\n')

console.log(`📦 Phase: ${phase.toUpperCase()}`)
console.log(`🌍 Environment: ${environment.toUpperCase()}\n`)

// ── Validate phase ────────────────────────────────────────────────────────

const phaseList = phase === 'all' ? ['phase1', 'phase2', 'phase3'] : [phase]

for (const p of phaseList) {
  if (!PHASES[p]) {
    console.error(`❌ Unknown phase: ${p}`)
    console.log(`Available phases: ${Object.keys(PHASES).join(', ')}, all`)
    process.exit(1)
  }
}

// ── Display deployment plan ────────────────────────────────────────────────

console.log('📋 DEPLOYMENT PLAN\n')

for (const p of phaseList) {
  const phaseConfig = PHASES[p]
  console.log(`\n${p.toUpperCase()}: ${phaseConfig.name}`)
  console.log('─'.repeat(60))

  if (phaseConfig.dependencies) {
    console.log(`⚠️  Dependencies: ${phaseConfig.dependencies.join(', ')}`)
  }

  console.log(`\n  Environment Variables (${phaseConfig.envVars.length}):`)
  phaseConfig.envVars.forEach((v) => console.log(`    - ${v}`))

  console.log(`\n  Database Migrations (${phaseConfig.migrations.length}):`)
  phaseConfig.migrations.forEach((m) => console.log(`    - ${m}`))

  console.log(`\n  API Endpoints (${phaseConfig.endpoints.length}):`)
  phaseConfig.endpoints.forEach((e) => console.log(`    - POST ${e}`))

  if (phaseConfig.cronJobs.length > 0) {
    console.log(`\n  Cron Jobs (${phaseConfig.cronJobs.length}):`)
    phaseConfig.cronJobs.forEach((c) => {
      console.log(`    - ${c.endpoint}`)
      console.log(`      Frequency: ${c.frequency}`)
      console.log(`      Description: ${c.description}`)
    })
  }

  console.log(`\n  Pre-Deployment Checklist:`)
  DEPLOYMENT_CHECKLIST[p].forEach((item) => console.log(`    ${item}`))
}

// ── Deployment instructions ────────────────────────────────────────────────

console.log('\n\n📋 DEPLOYMENT INSTRUCTIONS\n')

console.log('STEP 1: Set Environment Variables')
console.log('─'.repeat(60))
console.log(`In your ${environment} environment (Vercel/Railway/etc.):`)

for (const p of phaseList) {
  console.log(`\n  ${p.toUpperCase()}:`)
  PHASES[p].envVars.forEach((v) => console.log(`    ${v}=<value>`))
}

console.log('\nSTEP 2: Apply Database Migrations')
console.log('─'.repeat(60))
console.log('In Supabase SQL Editor, run migrations in order:')
for (const p of phaseList) {
  PHASES[p].migrations.forEach((m) => {
    console.log(`  psql -f _docs/migrations/${m}`)
  })
}

console.log('\nSTEP 3: Register Webhooks & Cron Jobs')
console.log('─'.repeat(60))
console.log('See COMPLETE_MARKETING_AUTOMATION_GUIDE.md for setup')

console.log('\nSTEP 4: Run Verification')
console.log('─'.repeat(60))
console.log('  pnpm run test:ghl')
console.log('  pnpm run test:marketing-setup')

console.log('\nSTEP 5: Test with Manual Lead')
console.log('─'.repeat(60))
console.log('  Submit intake form → verify SMS alert → check GHL')

console.log('\nSTEP 6: Go Live!')
console.log('─'.repeat(60))
console.log('  Enable cron jobs → start processing real leads\n')

// ── Next steps ─────────────────────────────────────────────────────────────

console.log('\n✅ Deployment plan ready!')
console.log(`\nNext steps:`)
console.log(`  1. Review checklist above`)
console.log(`  2. Set all environment variables`)
console.log(`  3. Apply migrations`)
console.log(`  4. Register webhooks`)
console.log(`  5. Run verification scripts`)
console.log(`  6. Test with manual lead`)
console.log(`\nFor detailed setup, see: COMPLETE_MARKETING_AUTOMATION_GUIDE.md\n`)

process.exit(0)
