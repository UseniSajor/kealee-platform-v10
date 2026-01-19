#!/usr/bin/env tsx
/**
 * Comprehensive Environment Variables Verification Script
 * Verifies all required environment variables for Railway and Vercel
 */

interface VarCheck {
  name: string
  value: string | undefined
  status: 'present' | 'missing' | 'invalid'
  issues: string[]
}

interface VerificationResult {
  service: string
  vars: VarCheck[]
  total: number
  present: number
  missing: number
  invalid: number
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

/**
 * Validate environment variable value
 */
function validateVar(name: string, value: string | undefined, rules: {
  required?: boolean
  pattern?: RegExp
  notPattern?: RegExp
  notContains?: string[]
  mustStartWith?: string
  mustNotStartWith?: string[]
  mustBeUrl?: boolean
  minLength?: number
}): VarCheck {
  const issues: string[] = []
  let status: 'present' | 'missing' | 'invalid' = 'present'

  if (!value) {
    if (rules.required) {
      status = 'missing'
      issues.push('Variable is required but not set')
    }
    return { name, value, status, issues }
  }

  // Check minimum length
  if (rules.minLength && value.length < rules.minLength) {
    status = 'invalid'
    issues.push(`Value too short (minimum ${rules.minLength} characters)`)
  }

  // Check must start with
  if (rules.mustStartWith && !value.startsWith(rules.mustStartWith)) {
    status = 'invalid'
    issues.push(`Must start with: ${rules.mustStartWith}`)
  }

  // Check must not start with
  if (rules.mustNotStartWith) {
    for (const prefix of rules.mustNotStartWith) {
      if (value.startsWith(prefix)) {
        status = 'invalid'
        issues.push(`Must NOT start with: ${prefix}`)
      }
    }
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    status = 'invalid'
    issues.push(`Does not match required pattern`)
  }

  // Check not pattern
  if (rules.notPattern && rules.notPattern.test(value)) {
    status = 'invalid'
    issues.push(`Matches forbidden pattern`)
  }

  // Check not contains
  if (rules.notContains) {
    for (const forbidden of rules.notContains) {
      if (value.includes(forbidden)) {
        status = 'invalid'
        issues.push(`Contains forbidden value: ${forbidden}`)
      }
    }
  }

  // Check URL format
  if (rules.mustBeUrl) {
    try {
      new URL(value)
    } catch {
      status = 'invalid'
      issues.push('Invalid URL format')
    }
  }

  return { name, value, status, issues }
}

/**
 * Verify Railway environment variables
 */
function verifyRailway(): VerificationResult {
  const vars: VarCheck[] = []

  // Required Railway variables
  vars.push(validateVar('DATABASE_URL', process.env.DATABASE_URL, {
    required: true,
    mustStartWith: 'postgresql://',
    notContains: ['localhost', '127.0.0.1'],
  }))

  vars.push(validateVar('SUPABASE_URL', process.env.SUPABASE_URL, {
    required: true,
    mustBeUrl: true,
    mustStartWith: 'https://',
    notContains: ['localhost', '127.0.0.1'],
  }))

  vars.push(validateVar('SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY, {
    required: true,
    mustStartWith: 'eyJ',
    minLength: 100,
  }))

  vars.push(validateVar('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY, {
    required: true,
    mustStartWith: 'sk_live_',
    mustNotStartWith: ['sk_test_'],
  }))

  vars.push(validateVar('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET, {
    required: true,
    mustStartWith: 'whsec_',
  }))

  vars.push(validateVar('STRIPE_PUBLISHABLE_KEY', process.env.STRIPE_PUBLISHABLE_KEY, {
    required: true,
    mustStartWith: 'pk_live_',
    mustNotStartWith: ['pk_test_'],
  }))

  vars.push(validateVar('CORS_ORIGINS', process.env.CORS_ORIGINS, {
    required: true,
    notContains: ['localhost', '127.0.0.1'],
  }))

  vars.push(validateVar('NODE_ENV', process.env.NODE_ENV, {
    required: true,
    pattern: /^(production|preview)$/,
  }))

  vars.push(validateVar('JWT_SECRET', process.env.JWT_SECRET, {
    required: true,
    minLength: 32,
  }))

  // Optional Railway variables
  vars.push(validateVar('SENTRY_DSN', process.env.SENTRY_DSN, {
    required: false,
    mustBeUrl: true,
  }))

  vars.push(validateVar('REDIS_URL', process.env.REDIS_URL, {
    required: false,
    mustStartWith: 'redis://',
  }))

  vars.push(validateVar('RESEND_API_KEY', process.env.RESEND_API_KEY, {
    required: false,
    mustStartWith: 're_',
  }))

  vars.push(validateVar('CSRF_SECRET', process.env.CSRF_SECRET, {
    required: false,
    minLength: 32,
  }))

  vars.push(validateVar('PORT', process.env.PORT, {
    required: false,
    pattern: /^\d+$/,
  }))

  // Stripe Product/Price IDs
  for (const pkg of ['A', 'B', 'C', 'D']) {
    vars.push(validateVar(`STRIPE_PRODUCT_PACKAGE_${pkg}`, process.env[`STRIPE_PRODUCT_PACKAGE_${pkg}`], {
      required: true,
      mustStartWith: 'prod_',
    }))

    vars.push(validateVar(`STRIPE_PRICE_PACKAGE_${pkg}_MONTHLY`, process.env[`STRIPE_PRICE_PACKAGE_${pkg}_MONTHLY`], {
      required: true,
      mustStartWith: 'price_',
    }))
  }

  const present = vars.filter(v => v.status === 'present' && v.value).length
  const missing = vars.filter(v => v.status === 'missing').length
  const invalid = vars.filter(v => v.status === 'invalid').length

  return {
    service: 'Railway (API)',
    vars,
    total: vars.length,
    present,
    missing,
    invalid,
  }
}

/**
 * Verify Vercel app environment variables
 */
function verifyVercelApp(appName: string, additionalVars: string[] = []): VerificationResult {
  const vars: VarCheck[] = []

  // Common Vercel variables
  vars.push(validateVar('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL, {
    required: true,
    mustBeUrl: true,
    mustStartWith: 'https://',
    notContains: ['localhost', '127.0.0.1'],
  }))

  vars.push(validateVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL, {
    required: true,
    mustBeUrl: true,
    mustStartWith: 'https://',
    notContains: ['localhost', '127.0.0.1'],
  }))

  vars.push(validateVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    required: true,
    mustStartWith: 'eyJ',
    minLength: 100,
  }))

  // Optional common variables
  vars.push(validateVar('NEXT_PUBLIC_SENTRY_DSN', process.env.NEXT_PUBLIC_SENTRY_DSN, {
    required: false,
    mustBeUrl: true,
  }))

  vars.push(validateVar('NEXT_PUBLIC_POSTHOG_KEY', process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    required: false,
    pattern: /^phc_/,
  }))

  // App-specific variables
  for (const varName of additionalVars) {
    const value = process.env[varName]
    if (varName.includes('STRIPE')) {
      vars.push(validateVar(varName, value, {
        required: true,
        mustStartWith: 'pk_live_',
        mustNotStartWith: ['pk_test_'],
      }))
    } else if (varName.includes('WS_URL')) {
      vars.push(validateVar(varName, value, {
        required: true,
        mustStartWith: 'wss://',
        notContains: ['localhost', 'ws://'],
      }))
    } else {
      vars.push(validateVar(varName, value, {
        required: true,
      }))
    }
  }

  const present = vars.filter(v => v.status === 'present' && v.value).length
  const missing = vars.filter(v => v.status === 'missing').length
  const invalid = vars.filter(v => v.status === 'invalid').length

  return {
    service: `Vercel (${appName})`,
    vars,
    total: vars.length,
    present,
    missing,
    invalid,
  }
}

/**
 * Main verification function
 */
function main() {
  log('\n==========================================', 'cyan')
  log('Environment Variables Verification', 'cyan')
  log('==========================================\n', 'cyan')

  const results: VerificationResult[] = []

  // Verify Railway
  log('📦 Verifying Railway (API Service)...', 'blue')
  const railway = verifyRailway()
  results.push(railway)

  // Verify Vercel Apps
  const vercelApps = [
    { name: 'os-admin', additional: [] },
    { name: 'os-pm', additional: ['NEXT_PUBLIC_PM_WS_URL'] },
    { name: 'm-ops-services', additional: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'] },
    { name: 'm-project-owner', additional: [] },
    { name: 'm-architect', additional: [] },
    { name: 'm-permits-inspections', additional: [] },
  ]

  log('\n🌐 Verifying Vercel Apps...', 'blue')
  for (const app of vercelApps) {
    const result = verifyVercelApp(app.name, app.additional)
    results.push(result)
  }

  // Print results
  log('\n==========================================', 'cyan')
  log('VERIFICATION RESULTS', 'cyan')
  log('==========================================\n', 'cyan')

  let totalIssues = 0

  for (const result of results) {
    log(`\n${result.service}:`, 'yellow')
    log(`  Total Variables: ${result.total}`, 'reset')
    log(`  ✅ Present: ${result.present}`, 'green')
    
    if (result.missing > 0) {
      log(`  ❌ Missing: ${result.missing}`, 'red')
      totalIssues += result.missing
    }
    
    if (result.invalid > 0) {
      log(`  ⚠️  Invalid: ${result.invalid}`, 'yellow')
      totalIssues += result.invalid
    }

    // Show details for missing/invalid
    for (const v of result.vars) {
      if (v.status === 'missing') {
        log(`    ❌ ${v.name}: MISSING`, 'red')
      } else if (v.status === 'invalid') {
        log(`    ⚠️  ${v.name}: INVALID`, 'yellow')
        for (const issue of v.issues) {
          log(`       - ${issue}`, 'yellow')
        }
        if (v.value) {
          const masked = v.value.length > 20 ? `${v.value.substring(0, 20)}...` : v.value
          log(`       Current value: ${masked}`, 'yellow')
        }
      }
    }
  }

  // Summary
  log('\n==========================================', 'cyan')
  if (totalIssues === 0) {
    log('✅ ALL ENVIRONMENT VARIABLES VERIFIED!', 'green')
    log('\nAll required variables are set and valid.', 'green')
  } else {
    log(`❌ ${totalIssues} ISSUE(S) FOUND`, 'red')
    log('\nPlease fix the issues above before deploying to production.', 'red')
  }
  log('==========================================\n', 'cyan')

  // Generate report file
  const report = {
    timestamp: new Date().toISOString(),
    results: results.map(r => ({
      service: r.service,
      summary: {
        total: r.total,
        present: r.present,
        missing: r.missing,
        invalid: r.invalid,
      },
      issues: r.vars
        .filter(v => v.status !== 'present' || !v.value)
        .map(v => ({
          name: v.name,
          status: v.status,
          issues: v.issues,
        })),
    })),
  }

  const fs = require('fs')
  fs.writeFileSync('env-verification-report.json', JSON.stringify(report, null, 2))
  log('📄 Detailed report saved to: env-verification-report.json', 'cyan')

  process.exit(totalIssues === 0 ? 0 : 1)
}

main()
