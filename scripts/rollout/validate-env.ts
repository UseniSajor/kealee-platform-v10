#!/usr/bin/env tsx
/**
 * scripts/rollout/validate-env.ts
 *
 * Production environment validation for the contractor acquisition engine.
 * Run before deploying — fail-fast on missing or invalid env vars.
 *
 * Usage:
 *   SERVICE=api       tsx scripts/rollout/validate-env.ts
 *   SERVICE=command-center tsx scripts/rollout/validate-env.ts
 *   SERVICE=all       tsx scripts/rollout/validate-env.ts
 *
 * Exit code 0 = all required vars present and valid
 * Exit code 1 = missing or invalid vars (with details)
 */

import { z } from 'zod';

// ─── Schema definitions per service ──────────────────────────────────────────

const apiSchema = z.object({
  // Zoho CRM
  ZOHO_CLIENT_ID:     z.string().min(1, 'Zoho Client ID required'),
  ZOHO_CLIENT_SECRET: z.string().min(1, 'Zoho Client Secret required'),
  ZOHO_REFRESH_TOKEN: z.string().min(1, 'Zoho Refresh Token required'),
  ZOHO_DOMAIN:        z.enum(['com', 'eu', 'in', 'au', 'jp']).default('com'),
  ZOHO_WEBHOOK_TOKEN: z.string().min(16, 'Webhook token must be at least 16 chars'),

  // Internal service auth
  INTERNAL_API_KEY:   z.string().min(32, 'Internal API key must be at least 32 chars'),

  // Core
  DATABASE_URL:       z.string().url('DATABASE_URL must be a valid URL'),
  SUPABASE_URL:       z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY:  z.string().min(1),

  // Optional but recommended
  NODE_ENV:           z.enum(['development', 'staging', 'production']).default('production'),
  PORT:               z.string().regex(/^\d+$/).default('3000'),
});

const commandCenterSchema = z.object({
  // SendGrid
  SENDGRID_API_KEY:    z.string().startsWith('SG.', 'SendGrid API key must start with SG.'),
  SENDGRID_FROM_EMAIL: z.string().email('SENDGRID_FROM_EMAIL must be a valid email'),
  SENDGRID_FROM_NAME:  z.string().default('Kealee Platform'),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC', 'Twilio SID must start with AC'),
  TWILIO_AUTH_TOKEN:  z.string().min(32, 'Twilio auth token must be at least 32 chars'),
  TWILIO_PHONE_NUMBER: z.string().regex(
    /^\+[1-9]\d{1,14}$/,
    'Twilio phone must be E.164 format (+1XXXXXXXXXX)',
  ).or(z.string().min(1).optional()),

  // Internal
  INTERNAL_API_URL:   z.string().url('INTERNAL_API_URL must be a valid URL'),
  INTERNAL_API_KEY:   z.string().min(32, 'Internal API key must be at least 32 chars'),

  // Redis + BullMQ
  REDIS_URL:          z.string().min(1, 'REDIS_URL required for BullMQ'),

  // App URLs
  WEB_MAIN_URL:           z.string().url().default('https://kealee.com'),
  PORTAL_CONTRACTOR_URL:  z.string().url().default('https://contractor.kealee.com'),

  // Core
  DATABASE_URL:           z.string().url(),
  ANTHROPIC_API_KEY:      z.string().startsWith('sk-ant-', 'Anthropic key must start with sk-ant-'),
});

// ─── Optional warnings (not blocking) ────────────────────────────────────────

const optionalWarnings = {
  api: [
    'SENDGRID_API_KEY', // api doesn't use it directly but may log about it
  ],
  'command-center': [
    'TWILIO_MESSAGING_SERVICE_SID',
    'SENDGRID_TEMPLATE_RECRUIT_1',
    'SENDGRID_TEMPLATE_RECRUIT_2',
    'SENDGRID_TEMPLATE_RECRUIT_3',
    'SENDGRID_TEMPLATE_ONBOARDING_WELCOME',
    'SENDGRID_TEMPLATE_VERIFICATION_REMINDER',
    'SENDGRID_TEMPLATE_ACTIVATION_WELCOME',
    'SLACK_OPS_WEBHOOK_URL',
  ],
};

// ─── Validation runner ────────────────────────────────────────────────────────

interface ValidationResult {
  service:  string;
  passed:   boolean;
  errors:   string[];
  warnings: string[];
}

function validate(service: 'api' | 'command-center'): ValidationResult {
  const schema = service === 'api' ? apiSchema : commandCenterSchema;
  const result = schema.safeParse(process.env);
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      errors.push(`  ✗ ${field}: ${issue.message}`);
    }
  }

  // Warn about missing optional vars
  for (const varName of (optionalWarnings[service] ?? [])) {
    if (!process.env[varName]) {
      warnings.push(`  ⚠  ${varName}: not set (optional — some features will be degraded)`);
    }
  }

  // Cross-service check: INTERNAL_API_KEY must be consistent
  if (process.env.INTERNAL_API_KEY && process.env.INTERNAL_API_KEY.length < 32) {
    errors.push('  ✗ INTERNAL_API_KEY: must be at least 32 chars for security');
  }

  return {
    service,
    passed:   errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Pretty printer ───────────────────────────────────────────────────────────

function printResult(r: ValidationResult): void {
  const icon = r.passed ? '✅' : '❌';
  console.log(`\n${icon} Service: ${r.service.toUpperCase()}`);
  console.log('─'.repeat(50));

  if (r.errors.length === 0) {
    console.log('  All required environment variables are valid.');
  } else {
    console.log(`  ERRORS (${r.errors.length}):`);
    for (const e of r.errors) console.log(e);
  }

  if (r.warnings.length > 0) {
    console.log(`\n  WARNINGS (${r.warnings.length}):`);
    for (const w of r.warnings) console.log(w);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const target = (process.env.SERVICE ?? 'all') as string;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  KEALEE PRODUCTION ENV VALIDATION');
  console.log('  Contractor Acquisition Automation Engine');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const services: Array<'api' | 'command-center'> =
    target === 'api' ? ['api'] :
    target === 'command-center' ? ['command-center'] :
    ['api', 'command-center'];

  const results = services.map(validate);
  for (const r of results) printResult(r);

  const allPassed = results.every(r => r.passed);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅  All validations passed. Safe to deploy.\n');
    process.exit(0);
  } else {
    console.log('❌  Validation FAILED. Fix errors above before deploying.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Validation script error:', err);
  process.exit(1);
});
