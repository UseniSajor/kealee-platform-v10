/**
 * Startup Environment Variable Validation
 *
 * Validates that required environment variables are present before the server
 * initializes.  Missing *required* vars cause a fatal error (process.exit).
 * Missing *optional* vars produce console warnings so operators know which
 * integrations are inactive.
 *
 * Call `validateEnv()` as early as possible in the startup sequence -- after
 * dotenv has loaded but before Fastify or Prisma are touched.
 */

// ============================================================================
// Required env vars -- the server CANNOT operate without these
// ============================================================================
const REQUIRED_ENV_VARS: { name: string; description: string }[] = [
  { name: 'DATABASE_URL',              description: 'PostgreSQL connection string (Prisma)' },
  { name: 'SUPABASE_URL',              description: 'Supabase project URL' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service-role key (server-side)' },
  { name: 'STRIPE_SECRET_KEY',         description: 'Stripe API secret key' },
  { name: 'STRIPE_WEBHOOK_SECRET',     description: 'Stripe webhook signing secret' },
]

// ============================================================================
// Optional env vars -- warn if missing so operators can enable integrations
// ============================================================================
const OPTIONAL_ENV_VARS: { name: string; description: string }[] = [
  // DocuSign
  { name: 'DOCUSIGN_INTEGRATION_KEY',  description: 'DocuSign integration key' },
  { name: 'DOCUSIGN_USER_ID',          description: 'DocuSign user / impersonation ID' },
  { name: 'DOCUSIGN_ACCOUNT_ID',       description: 'DocuSign account ID' },
  { name: 'DOCUSIGN_RSA_PRIVATE_KEY',  description: 'DocuSign JWT RSA private key' },
  { name: 'DOCUSIGN_BASE_PATH',        description: 'DocuSign REST API base path' },

  // SendGrid / Email
  { name: 'SENDGRID_API_KEY',          description: 'SendGrid API key for transactional email' },

  // Resend (alternative email provider)
  { name: 'RESEND_API_KEY',            description: 'Resend email API key' },

  // Redis
  { name: 'REDIS_URL',                 description: 'Redis connection URL (caching, queues, rate-limiting)' },

  // Sentry
  { name: 'SENTRY_DSN',                description: 'Sentry error-reporting DSN' },

  // Twilio
  { name: 'TWILIO_ACCOUNT_SID',        description: 'Twilio account SID (SMS)' },

  // AI
  { name: 'ANTHROPIC_API_KEY',         description: 'Anthropic Claude API key' },

  // Web Push
  { name: 'VAPID_PUBLIC_KEY',          description: 'VAPID public key for web push notifications' },
  { name: 'VAPID_PRIVATE_KEY',         description: 'VAPID private key for web push notifications' },
]

// ============================================================================
// Public API
// ============================================================================

/**
 * Validates environment variables at startup.
 *
 * - Throws (and exits) if any **required** var is missing.
 * - Logs warnings for **optional** vars that are absent.
 */
export function validateEnv(): void {
  console.log('')
  console.log('='.repeat(60))
  console.log('  Environment Variable Validation')
  console.log('='.repeat(60))

  // ── Check required vars ─────────────────────────────────────────────────
  const missingRequired = REQUIRED_ENV_VARS.filter(
    (v) => !process.env[v.name] || process.env[v.name]!.trim() === '',
  )

  if (missingRequired.length > 0) {
    console.error('')
    console.error('FATAL: Missing required environment variables:')
    console.error('')
    for (const v of missingRequired) {
      console.error(`   - ${v.name}  (${v.description})`)
    }
    console.error('')
    console.error('The server cannot start without these variables.')
    console.error('Set them in your .env.local (local dev) or deployment dashboard (Railway / Vercel).')
    console.error('='.repeat(60))
    console.error('')
    throw new Error(
      `Missing required environment variables: ${missingRequired.map((v) => v.name).join(', ')}`,
    )
  }

  console.log(`  Required variables: ${REQUIRED_ENV_VARS.length}/${REQUIRED_ENV_VARS.length} present`)

  // ── Check optional vars ─────────────────────────────────────────────────
  const missingOptional = OPTIONAL_ENV_VARS.filter(
    (v) => !process.env[v.name] || process.env[v.name]!.trim() === '',
  )

  if (missingOptional.length > 0) {
    console.log('')
    console.log('  Optional variables not set (related integrations will be inactive):')
    for (const v of missingOptional) {
      console.log(`   - ${v.name}  (${v.description})`)
    }
  }

  const presentOptional = OPTIONAL_ENV_VARS.length - missingOptional.length
  console.log('')
  console.log(`  Optional variables: ${presentOptional}/${OPTIONAL_ENV_VARS.length} present`)
  console.log('='.repeat(60))
  console.log('')
}
