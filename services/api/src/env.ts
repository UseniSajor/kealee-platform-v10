/**
 * Environment variable validation
 * Validates required env vars on startup and exports typed constants.
 * Called from index.ts immediately after startup guards.
 */

const REQUIRED_VARS: string[] = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ Missing required environment variables:')
    missing.forEach((k) => console.error(`   • ${k}`))
    console.error('\nSet these in Railway dashboard → Service → Variables')
    console.error('='.repeat(60) + '\n')
    process.exit(1)
  }
}

/** Typed, non-null env constants (safe to use after validateEnv() passes) */
export const env = {
  databaseUrl:         process.env.DATABASE_URL!,
  supabaseUrl:         process.env.SUPABASE_URL!,
  supabaseAnonKey:     process.env.SUPABASE_ANON_KEY ?? '',
  supabaseServiceKey:  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  jwtSecret:           process.env.JWT_SECRET!,
  stripeSecretKey:     process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  redisUrl:            process.env.REDIS_URL ?? 'redis://localhost:6379',
  resendApiKey:        process.env.RESEND_API_KEY ?? '',
  appEnv:              process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development',
  port:                parseInt(process.env.PORT ?? '3000', 10),
} as const
