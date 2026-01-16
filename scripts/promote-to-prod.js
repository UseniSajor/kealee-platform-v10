#!/usr/bin/env node

/**
 * One-Click Promote to Production Script
 * Promotes the latest staging deployment to production on Railway
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function promote() {
  console.log('🚀 Kealee Platform - Promote to Production\n');
  console.log('This will promote the latest staging deployment to production.\n');

  // Check Railway CLI
  try {
    execSync('railway --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Railway CLI not found. Installing...');
    execSync('npm install -g @railway/cli', { stdio: 'inherit' });
  }

  // Check login
  try {
    execSync('railway whoami', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not logged into Railway. Please login:');
    execSync('railway login', { stdio: 'inherit' });
  }

  // Confirm
  const confirm = await question('⚠️  Are you sure you want to promote to production? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Promotion cancelled');
    process.exit(1);
  }

  console.log('\n⬆️  Promoting staging to production...\n');

  try {
    execSync('railway promote --service api-production --from api-staging', {
      stdio: 'inherit',
    });
    console.log('\n✅ Successfully promoted to production!');
  } catch (error) {
    console.error('\n❌ Promotion failed:', error.message);
    process.exit(1);
  }

  rl.close();
}

promote();
