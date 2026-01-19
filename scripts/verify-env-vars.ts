#!/usr/bin/env tsx
/**
 * Environment Variables Verification Script
 * Verifies all required environment variables are set
 */

const requiredRailwayVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CORS_ORIGINS',
  'NODE_ENV',
]

const requiredVercelVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const optionalVars = [
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'REDIS_URL',
  'RESEND_API_KEY',
  'CSRF_SECRET',
]

function checkEnvVars(required: string[], optional: string[] = []) {
  const missing: string[] = []
  const present: string[] = []
  const optionalPresent: string[] = []

  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName)
    } else {
      missing.push(varName)
    }
  }

  for (const varName of optional) {
    if (process.env[varName]) {
      optionalPresent.push(varName)
    }
  }

  return { missing, present, optionalPresent }
}

console.log('🔍 Verifying Environment Variables...\n')

// Check Railway vars (API service)
console.log('📦 Railway (API Service):')
const railway = checkEnvVars(requiredRailwayVars, optionalVars)
console.log(`   ✅ Present: ${railway.present.length}/${requiredRailwayVars.length}`)
if (railway.missing.length > 0) {
  console.log(`   ❌ Missing: ${railway.missing.join(', ')}`)
}
if (railway.optionalPresent.length > 0) {
  console.log(`   ℹ️  Optional: ${railway.optionalPresent.join(', ')}`)
}

console.log('\n🌐 Vercel (Frontend Apps):')
const vercel = checkEnvVars(requiredVercelVars, optionalVars)
console.log(`   ✅ Present: ${vercel.present.length}/${requiredVercelVars.length}`)
if (vercel.missing.length > 0) {
  console.log(`   ❌ Missing: ${vercel.missing.join(', ')}`)
}
if (vercel.optionalPresent.length > 0) {
  console.log(`   ℹ️  Optional: ${vercel.optionalPresent.join(', ')}`)
}

// Summary
const totalMissing = railway.missing.length + vercel.missing.length
if (totalMissing === 0) {
  console.log('\n✅ All required environment variables are set!')
  process.exit(0)
} else {
  console.log(`\n❌ ${totalMissing} required environment variable(s) are missing.`)
  console.log('\n📝 Next Steps:')
  console.log('   1. Set missing variables in Railway/Vercel dashboards')
  console.log('   2. Redeploy services')
  console.log('   3. Run this script again to verify')
  process.exit(1)
}
