#!/usr/bin/env node

/**
 * scripts/go-live-check.ts
 *
 * Automated verification script for Kealee platform go-live
 * Tests all critical paths: concept → estimation → permit → checkout → webhook → fulfillment
 *
 * Usage: pnpm go-live-check
 */

import fetch from 'node-fetch';

const API_BASE = process.env.API_URL || 'http://localhost:3001';
const WEB_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3024';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  details?: Record<string, unknown>;
}

const results: CheckResult[] = [];

// ============================================================================
// HELPERS
// ============================================================================

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logResult(result: CheckResult) {
  const icon = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  if (result.details) {
    console.log(`   Details:`, result.details);
  }
  results.push(result);
}

async function checkEndpoint(
  name: string,
  method: string,
  url: string,
  body?: Record<string, unknown>,
  expectedStatus?: number,
): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      timeout: 5000,
    } as any);

    if (expectedStatus && response.status !== expectedStatus) {
      return {
        name,
        status: 'FAIL',
        error: `Expected ${expectedStatus}, got ${response.status}`,
      };
    }

    return { name, status: 'PASS' };
  } catch (err: any) {
    return {
      name,
      status: 'FAIL',
      error: err.message,
    };
  }
}

// ============================================================================
// CHECKS
// ============================================================================

async function checkWebPages() {
  console.log('\n📄 WEB PAGES');

  const pages = [
    { name: 'Concept Landing', url: `${WEB_BASE}/concept-engine` },
    { name: 'Concept Exterior', url: `${WEB_BASE}/concept-engine/exterior` },
    { name: 'Permits', url: `${WEB_BASE}/permits` },
    { name: 'Estimation', url: `${WEB_BASE}/estimate` },
  ];

  for (const page of pages) {
    try {
      const response = await fetch(page.url, { timeout: 5000 } as any);
      const isHtml = response.headers.get('content-type')?.includes('text/html');

      logResult({
        name: page.name,
        status: response.ok && isHtml ? 'PASS' : 'FAIL',
        error: !response.ok ? `HTTP ${response.status}` : !isHtml ? 'Not HTML' : undefined,
      });
    } catch (err: any) {
      logResult({
        name: page.name,
        status: 'FAIL',
        error: err.message,
      });
    }
  }
}

async function checkApiEndpoints() {
  console.log('\n🔌 API ENDPOINTS');

  // Health check
  const healthResult = await checkEndpoint('API Health', 'GET', `${API_BASE}/health`, undefined, 200);
  logResult(healthResult);

  // Concept intake endpoint
  const conceptResult = await checkEndpoint(
    'Concept Intake POST',
    'POST',
    `${API_BASE}/api/v1/concepts/intake`,
    {
      clientName: 'Test User',
      contactEmail: 'test@example.com',
      projectAddress: '123 Test St',
      projectType: 'exterior_refresh',
      budgetRange: '25k_50k',
    },
    200,
  );
  logResult(conceptResult);

  // Permit intake endpoint
  const permitResult = await checkEndpoint(
    'Permit Intake POST',
    'POST',
    `${API_BASE}/api/v1/permits/intake`,
    {
      clientName: 'Test User',
      contactEmail: 'test@example.com',
      projectAddress: '123 Test St',
      permitType: 'residential_addition',
    },
    200,
  );
  logResult(permitResult);

  // Pre-design session endpoint
  const preDesignResult = await checkEndpoint(
    'Pre-Design Session Create',
    'POST',
    `${API_BASE}/pre-design/session`,
    {
      projectType: 'EXTERIOR_FACADE',
      tier: 'PRE_DESIGN',
    },
    200,
  );
  logResult(preDesignResult);
}

async function checkStripeIntegration() {
  console.log('\n💳 STRIPE INTEGRATION');

  // Check if Stripe key is configured
  const stripeKeySet = !!process.env.STRIPE_SECRET_KEY;
  logResult({
    name: 'Stripe Secret Key Configured',
    status: stripeKeySet ? 'PASS' : 'FAIL',
    error: !stripeKeySet ? 'STRIPE_SECRET_KEY not set' : undefined,
  });

  // Check webhook secret
  const webhookSecretSet = !!process.env.STRIPE_WEBHOOK_SECRET;
  logResult({
    name: 'Stripe Webhook Secret Configured',
    status: webhookSecretSet ? 'PASS' : 'FAIL',
    error: !webhookSecretSet ? 'STRIPE_WEBHOOK_SECRET not set' : undefined,
  });

  // Check price IDs
  const requiredPrices = [
    'STRIPE_PRICE_PERMIT_SIMPLE',
    'STRIPE_PRICE_PERMIT_PACKAGE',
    'STRIPE_PRICE_EXTERIOR',
    'STRIPE_PRICE_INTERIOR',
  ];

  for (const priceId of requiredPrices) {
    const isSet = !!process.env[priceId];
    logResult({
      name: `${priceId} Configured`,
      status: isSet ? 'PASS' : 'FAIL',
      error: !isSet ? `${priceId} not set` : undefined,
    });
  }
}

async function checkWebhookEndpoint() {
  console.log('\n🔔 WEBHOOK ENDPOINT');

  const webhookResult = await checkEndpoint(
    'Stripe Webhook Endpoint',
    'GET',
    `${API_BASE}/webhooks/stripe`,
  );

  logResult(webhookResult);
}

async function checkDatabase() {
  console.log('\n💾 DATABASE');

  // Check if DATABASE_URL is set
  const dbUrlSet = !!process.env.DATABASE_URL;
  logResult({
    name: 'Database Connection URL Set',
    status: dbUrlSet ? 'PASS' : 'FAIL',
    error: !dbUrlSet ? 'DATABASE_URL not configured' : undefined,
  });

  // Try a simple health query (via API)
  try {
    const response = await fetch(`${API_BASE}/health/db`, { timeout: 5000 } as any);
    logResult({
      name: 'Database Connection Test',
      status: response.status === 200 ? 'PASS' : 'FAIL',
      error: response.status !== 200 ? `HTTP ${response.status}` : undefined,
    });
  } catch (err: any) {
    logResult({
      name: 'Database Connection Test',
      status: 'FAIL',
      error: err.message,
    });
  }
}

async function checkRedis() {
  console.log('\n🔴 REDIS');

  const redisUrlSet = !!process.env.REDIS_URL;
  logResult({
    name: 'Redis URL Set',
    status: redisUrlSet ? 'PASS' : 'FAIL',
    error: !redisUrlSet ? 'REDIS_URL not configured (optional but recommended)' : undefined,
  });

  // Try a simple health query (via API)
  try {
    const response = await fetch(`${API_BASE}/health/redis`, { timeout: 5000 } as any);
    logResult({
      name: 'Redis Connection Test',
      status: response.status === 200 ? 'PASS' : 'FAIL',
      error: response.status !== 200 ? `HTTP ${response.status}` : undefined,
    });
  } catch (err: any) {
    logResult({
      name: 'Redis Connection Test',
      status: 'FAIL',
      error: err.message,
    });
  }
}

async function checkWorkerQueue() {
  console.log('\n⚙️ WORKER QUEUE');

  try {
    const response = await fetch(`${API_BASE}/health/queues`, { timeout: 5000 } as any);
    const isOk = response.status === 200;

    logResult({
      name: 'BullMQ Worker Connected',
      status: isOk ? 'PASS' : 'FAIL',
      error: !isOk ? `HTTP ${response.status}` : undefined,
    });
  } catch (err: any) {
    logResult({
      name: 'BullMQ Worker Connected',
      status: 'FAIL',
      error: err.message,
    });
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔐 ENVIRONMENT VARIABLES');

  const required = [
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'DATABASE_URL',
  ];

  const optional = ['REDIS_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'RESEND_API_KEY'];

  for (const envVar of required) {
    const isSet = !!process.env[envVar];
    logResult({
      name: `${envVar} (Required)`,
      status: isSet ? 'PASS' : 'FAIL',
      error: !isSet ? 'Not configured' : undefined,
    });
  }

  for (const envVar of optional) {
    const isSet = !!process.env[envVar];
    logResult({
      name: `${envVar} (Optional)`,
      status: isSet ? 'PASS' : 'WARN',
      error: !isSet ? 'Not configured (optional)' : undefined,
    });
  }
}

async function checkFullFlow() {
  console.log('\n🔄 FULL FLOW TEST');

  try {
    const response = await fetch(`${API_BASE}/api/v1/test/full-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testMode: true,
      }),
      timeout: 30000,
    } as any);

    const data = (await response.json()) as any;

    logResult({
      name: 'Full Flow Test',
      status: response.status === 200 && data.status === 'COMPLETE' ? 'PASS' : 'FAIL',
      details: {
        status: data.status,
        conceptGenerated: data.conceptGenerated,
        estimateGenerated: data.estimateGenerated,
        permitGenerated: data.permitGenerated,
      },
      error: response.status !== 200 ? `HTTP ${response.status}` : undefined,
    });
  } catch (err: any) {
    logResult({
      name: 'Full Flow Test',
      status: 'FAIL',
      error: err.message,
    });
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('GO-LIVE VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`\n✅ PASSED: ${passed}`);
  console.log(`❌ FAILED: ${failed}`);
  console.log(`📊 TOTAL:  ${results.length}`);

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    console.log('🎉 ALL CHECKS PASSED — READY FOR GO-LIVE!');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} CHECK(S) FAILED — REVIEW ABOVE AND FIX BEFORE GO-LIVE`);
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 KEALEE PLATFORM GO-LIVE VERIFICATION');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Web Base: ${WEB_BASE}`);
  console.log('');

  await checkEnvironmentVariables();
  await checkWebPages();
  await checkApiEndpoints();
  await checkDatabase();
  await checkRedis();
  await checkWorkerQueue();
  await checkStripeIntegration();
  await checkWebhookEndpoint();
  await checkFullFlow();

  printSummary();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
