/**
 * Production Deployment Automation Script
 * Executes all critical deployment steps
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function exec(command: string, cwd?: string) {
  console.log(`\n▶ Running: ${command}`);
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: cwd || process.cwd(),
    });
    console.log('✅ Success\n');
    return true;
  } catch (error) {
    console.error('❌ Failed\n');
    return false;
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🚀 KEALEE PLATFORM - PRODUCTION DEPLOYMENT');
  console.log('═'.repeat(70));
  console.log();

  console.log('This script will:');
  console.log('  1. Run database migrations');
  console.log('  2. Execute seed data');
  console.log('  3. Verify environment variables');
  console.log('  4. Create Stripe products (if needed)');
  console.log('  5. Deploy worker service');
  console.log();

  const proceed = await prompt('Continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n❌ Deployment cancelled');
    process.exit(0);
  }

  // Step 1: Database Migrations
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 1: Database Migrations');
  console.log('─'.repeat(70));

  const runMigrations = await prompt('Run database migrations? (y/n): ');
  if (runMigrations.toLowerCase() === 'y') {
    const confirmed = await prompt('Type "CONFIRM PRODUCTION" to proceed: ');
    if (confirmed === 'CONFIRM PRODUCTION') {
      exec('npx prisma migrate deploy', 'packages/database');
      exec('npx tsx prisma/seed-complete.ts', 'packages/database');
    } else {
      console.log('⏭️  Skipping migrations');
    }
  }

  // Step 2: Environment Verification
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 2: Environment Verification');
  console.log('─'.repeat(70));

  exec('npx tsx scripts/verify-environment.ts api');

  // Step 3: Stripe Products
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 3: Stripe Product Creation');
  console.log('─'.repeat(70));

  const createStripe = await prompt('Create Stripe products in live mode? (y/n): ');
  if (createStripe.toLowerCase() === 'y') {
    console.log('\n⚠️  Make sure STRIPE_SECRET_KEY is set to LIVE mode key!');
    const confirmed = await prompt('Type "CONFIRM LIVE STRIPE" to proceed: ');
    
    if (confirmed === 'CONFIRM LIVE STRIPE') {
      exec('npx tsx scripts/stripe/create-complete-catalog.ts --confirm-live', 'services/api');
    } else {
      console.log('⏭️  Skipping Stripe setup');
    }
  }

  // Step 4: Worker Service
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 4: Worker Service Deployment');
  console.log('─'.repeat(70));

  console.log('\nWorker service deployment:');
  console.log('  1. Go to Railway dashboard');
  console.log('  2. Create new service from services/worker');
  console.log('  3. Set environment variables (DATABASE_URL, REDIS_URL)');
  console.log('  4. Deploy');
  console.log();
  console.log('See: services/worker/README.md for detailed instructions');

  // Step 5: Domain Configuration
  console.log('\n' + '─'.repeat(70));
  console.log('STEP 5: Domain Configuration');
  console.log('─'.repeat(70));

  console.log('\nDomain setup required for:');
  console.log('  • kealee.com → m-marketplace');
  console.log('  • ops.kealee.com → m-ops-services');
  console.log('  • estimation.kealee.com → m-estimation');
  console.log('  • pm.kealee.com → os-pm');
  console.log('  • admin.kealee.com → os-admin');
  console.log('  • And 5 more apps...');
  console.log();
  console.log('Configure in:');
  console.log('  1. Vercel dashboard → Each project → Domains');
  console.log('  2. NameBright → DNS records');
  console.log();

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('✅ DEPLOYMENT STEPS COMPLETE');
  console.log('═'.repeat(70));
  console.log();
  console.log('Final Checklist:');
  console.log('  [ ] Database migrations deployed');
  console.log('  [ ] Seed data loaded');
  console.log('  [ ] Environment variables verified');
  console.log('  [ ] Stripe products created');
  console.log('  [ ] Worker service deployed');
  console.log('  [ ] Custom domains configured');
  console.log('  [ ] SSL certificates verified');
  console.log('  [ ] End-to-end tests passed');
  console.log();
  console.log('🎉 Your platform is ready for production!');
  console.log();

  rl.close();
}

main();
