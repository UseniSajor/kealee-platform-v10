/**
 * Environment Variable Verification Script
 * Checks all required environment variables across services
 */

interface EnvCheck {
  name: string;
  required: boolean;
  services: string[];
  description: string;
}

const requiredEnvVars: EnvCheck[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    services: ['all-frontend'],
    description: 'Supabase project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    services: ['all-frontend'],
    description: 'Supabase anonymous key',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    services: ['api'],
    description: 'Supabase service role key (backend only)',
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    services: ['api', 'worker'],
    description: 'PostgreSQL connection string',
  },

  // Redis
  {
    name: 'REDIS_URL',
    required: true,
    services: ['api', 'worker'],
    description: 'Redis connection string',
  },

  // Stripe
  {
    name: 'STRIPE_SECRET_KEY',
    required: true,
    services: ['api'],
    description: 'Stripe secret key',
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    services: ['m-finance-trust', 'm-ops-services', 'm-marketplace'],
    description: 'Stripe publishable key',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    services: ['api'],
    description: 'Stripe webhook signing secret',
  },

  // API URLs
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: true,
    services: ['all-frontend'],
    description: 'API gateway URL',
  },
  {
    name: 'API_URL',
    required: false,
    services: ['all-frontend'],
    description: 'Server-side API URL',
  },

  // Authentication
  {
    name: 'JWT_SECRET',
    required: true,
    services: ['api'],
    description: 'JWT signing secret',
  },
  {
    name: 'AUDIT_SIGNING_KEY',
    required: true,
    services: ['api'],
    description: 'Audit log signing key',
  },

  // External Services
  {
    name: 'SENDGRID_API_KEY',
    required: false,
    services: ['api'],
    description: 'SendGrid for emails',
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    services: ['api', 'worker'],
    description: 'Claude AI API key',
  },

  // Package Price IDs
  {
    name: 'STRIPE_PRICE_PACKAGE_A',
    required: false,
    services: ['api'],
    description: 'Package A price ID',
  },
  {
    name: 'STRIPE_PRICE_PACKAGE_B',
    required: false,
    services: ['api'],
    description: 'Package B price ID',
  },
  {
    name: 'STRIPE_PRICE_PACKAGE_C',
    required: false,
    services: ['api'],
    description: 'Package C price ID',
  },
  {
    name: 'STRIPE_PRICE_PACKAGE_D',
    required: false,
    services: ['api'],
    description: 'Package D price ID',
  },
];

async function verifyEnvironment(service: string = 'api') {
  console.log('═'.repeat(70));
  console.log(`🔍 ENVIRONMENT VARIABLE VERIFICATION - ${service.toUpperCase()}`);
  console.log('═'.repeat(70));
  console.log();

  const filteredVars =
    service === 'all'
      ? requiredEnvVars
      : requiredEnvVars.filter(
          (v) =>
            v.services.includes(service) || v.services.includes('all-frontend')
        );

  let missingRequired = 0;
  let missingOptional = 0;
  let present = 0;

  for (const envVar of filteredVars) {
    const value = process.env[envVar.name];
    const isSet = !!value;

    if (isSet) {
      console.log(`✅ ${envVar.name}`);
      console.log(`   ${envVar.description}`);
      present++;
    } else if (envVar.required) {
      console.log(`❌ ${envVar.name} - MISSING (REQUIRED)`);
      console.log(`   ${envVar.description}`);
      missingRequired++;
    } else {
      console.log(`⚠️  ${envVar.name} - Not set (optional)`);
      console.log(`   ${envVar.description}`);
      missingOptional++;
    }
    console.log();
  }

  console.log('═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`✅ Present: ${present}`);
  console.log(`❌ Missing Required: ${missingRequired}`);
  console.log(`⚠️  Missing Optional: ${missingOptional}`);
  console.log();

  if (missingRequired > 0) {
    console.log('❌ CRITICAL: Missing required environment variables!');
    console.log('   The service will not function correctly.');
    console.log();
    console.log('Action required:');
    console.log('  - Set missing variables in your deployment platform');
    console.log('  - Railway: Dashboard → Service → Variables');
    console.log('  - Vercel: Dashboard → Project → Settings → Environment Variables');
    console.log();
    process.exit(1);
  }

  if (missingOptional > 0) {
    console.log('⚠️  WARNING: Some optional features may not work');
    console.log('   Set optional variables to enable full functionality');
    console.log();
  }

  console.log('✅ Environment verification passed!');
  console.log();
}

// Run verification
const service = process.argv[2] || 'api';
verifyEnvironment(service);
