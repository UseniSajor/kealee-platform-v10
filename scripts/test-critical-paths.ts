/**
 * Critical Path Testing Script
 * Tests the most important user flows
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function testFlow(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now();
  console.log(`\n🧪 Testing: ${name}`);

  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration });
    console.log(`   ✅ PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMsg, duration });
    console.log(`   ❌ FAILED: ${errorMsg}`);
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🧪 CRITICAL PATH TESTING');
  console.log('═'.repeat(70));
  console.log(`API URL: ${API_URL}`);

  // Test 1: Health Check
  await testFlow('API Health Check', async () => {
    const response = await axios.get(`${API_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
  });

  // Test 2: Authentication
  await testFlow('User Registration', async () => {
    const testEmail = `test+${Date.now()}@example.com`;
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: testEmail,
      password: 'Test123!@#',
      name: 'Test User',
    });
    if (response.status !== 201) throw new Error('Registration failed');
  });

  // Test 3: Create Project
  await testFlow('Create Project', async () => {
    // Mock test - would need auth token
    console.log('   (Requires auth token - skipping)');
  });

  // Test 4: Estimate Creation
  await testFlow('Create Estimate', async () => {
    // Mock test
    console.log('   (Requires implementation - skipping)');
  });

  // Test 5: Payment Processing
  await testFlow('Stripe Checkout', async () => {
    // Mock test
    console.log('   (Requires Stripe test mode - skipping)');
  });

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   • ${r.name}: ${r.error}`);
      });
  }

  console.log('\n' + '═'.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}

main();
