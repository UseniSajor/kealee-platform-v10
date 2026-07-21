/**
 * Load Testing Script for Kealee API Endpoints
 *
 * Tests API performance under various load conditions:
 * - Concurrent requests
 * - Sustained load
 * - Spike testing
 * - Stress testing
 *
 * Usage:
 *   npx ts-node scripts/load-test.ts [endpoint] [rps] [duration]
 *
 * Examples:
 *   npx ts-node scripts/load-test.ts /health 100 30
 *   npx ts-node scripts/load-test.ts /precon/projects 50 60
 */

import http from 'http';
import https from 'https';

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const DEFAULT_RPS = 50; // requests per second
const DEFAULT_DURATION = 30; // seconds

// Endpoints to test
const ENDPOINTS = {
  // Health & Status
  health: { path: '/health', method: 'GET', auth: false },
  status: { path: '/status', method: 'GET', auth: false },

  // Pre-Con Module
  preconDashboard: { path: '/precon/dashboard', method: 'GET', auth: true },
  preconProjects: { path: '/precon/projects', method: 'GET', auth: true },
  preconFeeInfo: { path: '/precon/fee-info', method: 'GET', auth: false },

  // Estimation Module
  estimationPricing: { path: '/estimation/pricing', method: 'GET', auth: false },
  estimationQuote: { path: '/estimation/quote', method: 'POST', auth: true },

  // Engineering Module
  engineerServices: { path: '/engineer/services', method: 'GET', auth: false },
  engineerPricing: { path: '/engineer/pricing', method: 'GET', auth: false },
  engineerProjects: { path: '/engineer/projects', method: 'GET', auth: true },

  // Billing Module
  billingPlans: { path: '/billing/plans', method: 'GET', auth: false },
  billingSubscription: { path: '/billing/subscription', method: 'GET', auth: true },

  // Payments Module
  paymentMethods: { path: '/payments/methods', method: 'GET', auth: true },

  // Escrow Module
  escrowDashboard: { path: '/escrow/dashboard', method: 'GET', auth: true },
};

// Test result interface
interface TestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  requestsPerSecond: number;
  errorRate: number;
  errors: { [code: string]: number };
}

// Request latencies
const latencies: number[] = [];
const errors: { [code: string]: number } = {};
let successCount = 0;
let failCount = 0;

/**
 * Make a single HTTP request
 */
async function makeRequest(
  endpoint: string,
  method: string,
  authToken?: string
): Promise<{ status: number; latency: number }> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const url = new URL(endpoint, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latency = Date.now() - start;
        resolve({ status: res.statusCode || 0, latency });
      });
    });

    req.on('error', (error) => {
      const latency = Date.now() - start;
      resolve({ status: 0, latency });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, latency: 10000 });
    });

    req.end();
  });
}

/**
 * Calculate percentile
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Run load test
 */
async function runLoadTest(
  endpoint: string,
  rps: number,
  durationSeconds: number,
  authToken?: string
): Promise<TestResult> {
  console.log(`\nStarting load test for ${endpoint}`);
  console.log(`Target: ${rps} RPS for ${durationSeconds} seconds`);
  console.log(`Expected total requests: ${rps * durationSeconds}`);
  console.log('---');

  latencies.length = 0;
  Object.keys(errors).forEach((key) => delete errors[key]);
  successCount = 0;
  failCount = 0;

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  const intervalMs = 1000 / rps;

  let requestsSent = 0;
  const pendingRequests: Promise<void>[] = [];

  // Progress reporter
  const progressInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const currentRps = requestsSent / elapsed;
    console.log(
      `Progress: ${requestsSent} requests, ${currentRps.toFixed(1)} RPS, ` +
        `${successCount} success, ${failCount} failed`
    );
  }, 5000);

  // Send requests at target rate
  while (Date.now() < endTime) {
    const request = makeRequest(endpoint, 'GET', authToken).then(({ status, latency }) => {
      latencies.push(latency);
      if (status >= 200 && status < 400) {
        successCount++;
      } else {
        failCount++;
        const errorKey = status === 0 ? 'timeout' : `http_${status}`;
        errors[errorKey] = (errors[errorKey] || 0) + 1;
      }
    });

    pendingRequests.push(request);
    requestsSent++;

    // Wait for next request interval
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Wait for all pending requests
  await Promise.all(pendingRequests);
  clearInterval(progressInterval);

  const totalDuration = (Date.now() - startTime) / 1000;

  // Calculate results
  const result: TestResult = {
    endpoint,
    totalRequests: requestsSent,
    successfulRequests: successCount,
    failedRequests: failCount,
    averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    minLatency: Math.min(...latencies),
    maxLatency: Math.max(...latencies),
    p50Latency: percentile(latencies, 50),
    p95Latency: percentile(latencies, 95),
    p99Latency: percentile(latencies, 99),
    requestsPerSecond: requestsSent / totalDuration,
    errorRate: (failCount / requestsSent) * 100,
    errors,
  };

  return result;
}

/**
 * Print test results
 */
function printResults(result: TestResult): void {
  console.log('\n========== LOAD TEST RESULTS ==========');
  console.log(`Endpoint: ${result.endpoint}`);
  console.log('---');
  console.log(`Total Requests:     ${result.totalRequests}`);
  console.log(`Successful:         ${result.successfulRequests}`);
  console.log(`Failed:             ${result.failedRequests}`);
  console.log(`Error Rate:         ${result.errorRate.toFixed(2)}%`);
  console.log(`Actual RPS:         ${result.requestsPerSecond.toFixed(2)}`);
  console.log('---');
  console.log(`Latency (avg):      ${result.averageLatency.toFixed(2)}ms`);
  console.log(`Latency (min):      ${result.minLatency}ms`);
  console.log(`Latency (max):      ${result.maxLatency}ms`);
  console.log(`Latency (p50):      ${result.p50Latency}ms`);
  console.log(`Latency (p95):      ${result.p95Latency}ms`);
  console.log(`Latency (p99):      ${result.p99Latency}ms`);
  console.log('---');

  if (Object.keys(result.errors).length > 0) {
    console.log('Errors:');
    Object.entries(result.errors).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });
  }

  console.log('========================================\n');

  // Performance assessment
  if (result.errorRate > 5) {
    console.log('⚠️  WARNING: Error rate exceeds 5%');
  }
  if (result.p95Latency > 1000) {
    console.log('⚠️  WARNING: p95 latency exceeds 1 second');
  }
  if (result.p99Latency > 2000) {
    console.log('⚠️  WARNING: p99 latency exceeds 2 seconds');
  }
  if (result.errorRate < 1 && result.p95Latency < 500) {
    console.log('✅ PASS: Endpoint meets performance requirements');
  }
}

/**
 * Run all endpoint tests
 */
async function runAllTests(rps: number, duration: number): Promise<void> {
  console.log('Running load tests for all endpoints...\n');

  const results: TestResult[] = [];

  for (const [name, config] of Object.entries(ENDPOINTS)) {
    if (config.auth) {
      console.log(`Skipping ${name} (requires auth)`);
      continue;
    }

    const result = await runLoadTest(config.path, rps, duration);
    results.push(result);
    printResults(result);

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n========== SUMMARY ==========');
  console.log('Endpoint                    | RPS    | p95    | Errors');
  console.log('-----------------------------------------------------------');
  results.forEach((r) => {
    const name = r.endpoint.padEnd(27);
    const rps = r.requestsPerSecond.toFixed(1).padStart(6);
    const p95 = `${r.p95Latency}ms`.padStart(6);
    const err = `${r.errorRate.toFixed(1)}%`.padStart(6);
    console.log(`${name} | ${rps} | ${p95} | ${err}`);
  });
  console.log('=============================\n');
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === 'all') {
    const rps = parseInt(args[1]) || DEFAULT_RPS;
    const duration = parseInt(args[2]) || DEFAULT_DURATION;
    await runAllTests(rps, duration);
  } else {
    const endpoint = args[0] || '/health';
    const rps = parseInt(args[1]) || DEFAULT_RPS;
    const duration = parseInt(args[2]) || DEFAULT_DURATION;

    const result = await runLoadTest(endpoint, rps, duration);
    printResults(result);
  }
}

main().catch(console.error);

export { runLoadTest, runAllTests, ENDPOINTS };
