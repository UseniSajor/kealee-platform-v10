/**
 * Load Test Suite for Response Cache
 * Simulates 500 orders/day with 60% cache hit rate
 * Measures: throughput, latency, cache hit rate, Redis memory usage
 *
 * Usage:
 *   pnpm exec ts-node load-test.ts --scenario production --duration 300
 */

import { getResponseCache, type BotType } from './response-cache'
import { getQueueConnection } from './redis'

interface LoadTestConfig {
  totalOrders: number        // Total orders to simulate
  concurrentWorkers: number  // Parallel requests
  cacheHitRate: number       // Expected hit rate (0-1)
  scenario: 'small' | 'medium' | 'production'
  durationSeconds: number    // Run for X seconds
  verbose: boolean
}

interface LoadTestMetrics {
  ordersProcessed: number
  cacheHits: number
  cacheMisses: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  throughputOrdersPerSecond: number
  redisMemoryMb: number
  apiCostUsd: number
  cacheHitPercentage: number
  startTime: Date
  endTime: Date
  durationSeconds: number
}

/**
 * Simulate a project intake with typical characteristics
 */
function generateTestProject(id: number): Record<string, any> {
  const projectTypes = ['kitchen_remodel', 'addition_expansion', 'bathroom_remodel', 'whole_home_renovation', 'deck_patio']
  const locations = ['Washington DC', 'Arlington VA', 'Silver Spring MD', 'Alexandria VA', 'Bethesda MD']
  const sqfts = [500, 800, 1200, 1500, 2000, 3000]

  return {
    projectType: projectTypes[id % projectTypes.length],
    location: locations[id % locations.length],
    scope: 'Full renovation with structural changes',
    sqft: sqfts[Math.floor(Math.random() * sqfts.length)],
    budgetUsd: Math.random() > 0.5 ? undefined : Math.floor(Math.random() * 500000 + 50000),
    jurisdiction: locations[id % locations.length],
    zipCode: '20001',
    structuralChanges: Math.random() > 0.3,
    electricalChanges: Math.random() > 0.2,
    plumbingChanges: Math.random() > 0.2,
    hvacChanges: Math.random() > 0.3,
  }
}

/**
 * Simulate a cache lookup + optional store
 */
async function simulateBotExecution(
  botType: BotType,
  projectData: Record<string, any>,
  shouldHitCache: boolean,
  cache: ReturnType<typeof getResponseCache>,
): Promise<{ latencyMs: number; cacheHit: boolean }> {
  const startTime = performance.now()

  try {
    const key = `llm-response:${botType}:${JSON.stringify(projectData)}`
    const redis = (cache as any).redis

    if (shouldHitCache) {
      // Simulate cache hit
      const mockResult = { content: 'cached response', model: 'claude-opus-4-6' }
      await redis?.setex(key, 86400, JSON.stringify(mockResult))
    }

    // Check cache
    const cached = await redis?.get(key)
    const cacheHit = cached !== null && cached !== undefined

    const latencyMs = performance.now() - startTime
    return { latencyMs, cacheHit }
  } catch (err) {
    console.error(`Simulation error for ${botType}:`, err)
    return { latencyMs: performance.now() - startTime, cacheHit: false }
  }
}

/**
 * Run load test scenario
 */
async function runLoadTest(config: LoadTestConfig): Promise<LoadTestMetrics> {
  const cache = getResponseCache()
  const startTime = new Date()
  let ordersProcessed = 0
  let cacheHits = 0
  let cacheMisses = 0
  const latencies: number[] = []

  console.log(`\n[LoadTest] Starting ${config.scenario} scenario`)
  console.log(`  Orders: ${config.totalOrders}`)
  console.log(`  Workers: ${config.concurrentWorkers}`)
  console.log(`  Expected cache hit rate: ${(config.cacheHitRate * 100).toFixed(1)}%`)
  console.log(`  Duration: ${config.durationSeconds}s\n`)

  // Batch processing
  const batchSize = Math.ceil(config.totalOrders / (config.durationSeconds / 10))
  const batchInterval = (config.durationSeconds * 1000) / Math.ceil(config.totalOrders / batchSize)

  for (let batch = 0; batch < Math.ceil(config.totalOrders / batchSize); batch++) {
    const batchStart = Date.now()
    const ordersInBatch = Math.min(batchSize, config.totalOrders - ordersProcessed)

    // Process orders concurrently
    const promises: Promise<{ latencyMs: number; cacheHit: boolean }>[] = []

    for (let i = 0; i < ordersInBatch; i++) {
      const orderId = ordersProcessed + i
      const projectData = generateTestProject(orderId)
      const shouldHitCache = Math.random() < config.cacheHitRate
      const botType: BotType = ['design', 'estimate', 'permit', 'contractor'][orderId % 4] as BotType

      promises.push(simulateBotExecution(botType, projectData, shouldHitCache, cache))
    }

    const results = await Promise.all(promises)

    results.forEach(result => {
      latencies.push(result.latencyMs)
      if (result.cacheHit) {
        cacheHits++
      } else {
        cacheMisses++
      }
      ordersProcessed++
    })

    // Progress logging
    if (config.verbose || batch % 5 === 0) {
      const hitRate = cacheHits / (cacheHits + cacheMisses) * 100
      console.log(
        `[Batch ${batch + 1}] Orders: ${ordersProcessed}/${config.totalOrders} | ` +
        `Cache hit rate: ${hitRate.toFixed(1)}% | ` +
        `Avg latency: ${(latencies.slice(-10).reduce((a, b) => a + b, 0) / latencies.slice(-10).length).toFixed(1)}ms`
      )
    }

    // Rate limiting to simulate realistic load
    const elapsedMs = Date.now() - batchStart
    if (elapsedMs < batchInterval) {
      await new Promise(resolve => setTimeout(resolve, batchInterval - elapsedMs))
    }

    if (Date.now() - startTime.getTime() > config.durationSeconds * 1000) {
      break
    }
  }

  const endTime = new Date()
  const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000
  const throughput = ordersProcessed / durationSeconds

  // Sort latencies for percentiles
  latencies.sort((a, b) => a - b)
  const p50 = latencies[Math.floor(latencies.length * 0.5)]
  const p95 = latencies[Math.floor(latencies.length * 0.95)]
  const p99 = latencies[Math.floor(latencies.length * 0.99)]
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length

  // Get Redis memory usage
  let redisMemoryMb = 0
  try {
    const redis = (cache as any).redis
    const info = await redis?.info('memory')
    const memMatch = info?.match(/used_memory_human:(.+?)\r/)
    if (memMatch) {
      redisMemoryMb = parseFloat(memMatch[1])
    }
  } catch {
    redisMemoryMb = 0
  }

  // Cost calculation
  // Assume: 2000 tokens per API call, $0.015 per 1M input tokens, $0.080 per 1M output tokens
  const avgTokensPerCall = 2000
  const inputCostPer1M = 0.015
  const outputCostPer1M = 0.080
  const apiCallsSaved = cacheHits * 0.5 // Assume cache hits save 50% of the call
  const costSaved = (apiCallsSaved * avgTokensPerCall / 1_000_000) * (inputCostPer1M + outputCostPer1M)

  const metrics: LoadTestMetrics = {
    ordersProcessed,
    cacheHits,
    cacheMisses,
    avgLatencyMs: Math.round(avgLatency * 100) / 100,
    p50LatencyMs: Math.round(p50 * 100) / 100,
    p95LatencyMs: Math.round(p95 * 100) / 100,
    p99LatencyMs: Math.round(p99 * 100) / 100,
    throughputOrdersPerSecond: Math.round(throughput * 100) / 100,
    redisMemoryMb,
    apiCostUsd: Math.round(costSaved * 100) / 100,
    cacheHitPercentage: Math.round((cacheHits / (cacheHits + cacheMisses)) * 10000) / 100,
    startTime,
    endTime,
    durationSeconds,
  }

  return metrics
}

/**
 * Scenario configurations
 */
const SCENARIOS: Record<string, LoadTestConfig> = {
  small: {
    totalOrders: 50,
    concurrentWorkers: 5,
    cacheHitRate: 0.6,
    scenario: 'small',
    durationSeconds: 30,
    verbose: false,
  },
  medium: {
    totalOrders: 250,
    concurrentWorkers: 10,
    cacheHitRate: 0.6,
    scenario: 'medium',
    durationSeconds: 60,
    verbose: false,
  },
  production: {
    totalOrders: 500,
    concurrentWorkers: 20,
    cacheHitRate: 0.6,
    scenario: 'production',
    durationSeconds: 120,
    verbose: false,
  },
}

/**
 * Print results in formatted table
 */
function printResults(metrics: LoadTestMetrics): void {
  console.log('\n' + '='.repeat(70))
  console.log('LOAD TEST RESULTS')
  console.log('='.repeat(70))
  console.log(
    `\nScenario: ${metrics.ordersProcessed} orders in ${metrics.durationSeconds}s\n` +
    `Start:    ${metrics.startTime.toISOString()}\n` +
    `End:      ${metrics.endTime.toISOString()}\n`
  )

  console.log('THROUGHPUT')
  console.log(`  Orders/sec:            ${metrics.throughputOrdersPerSecond.toFixed(2)}`)
  console.log(`  Total processed:       ${metrics.ordersProcessed}`)

  console.log('\nLATENCY')
  console.log(`  Avg:                   ${metrics.avgLatencyMs.toFixed(2)}ms`)
  console.log(`  P50:                   ${metrics.p50LatencyMs.toFixed(2)}ms`)
  console.log(`  P95:                   ${metrics.p95LatencyMs.toFixed(2)}ms`)
  console.log(`  P99:                   ${metrics.p99LatencyMs.toFixed(2)}ms`)

  console.log('\nCACHE PERFORMANCE')
  console.log(`  Cache hits:            ${metrics.cacheHits}`)
  console.log(`  Cache misses:          ${metrics.cacheMisses}`)
  console.log(`  Hit rate:              ${metrics.cacheHitPercentage.toFixed(2)}%`)

  console.log('\nRESOURCES')
  console.log(`  Redis memory:          ${metrics.redisMemoryMb > 0 ? `${metrics.redisMemoryMb}` : 'N/A'}`)

  console.log('\nCOST SAVINGS')
  console.log(`  API cost saved:        $${metrics.apiCostUsd.toFixed(4)}`)
  console.log(`  Annualized (500/day):  $${(metrics.apiCostUsd * 365 * 500 / metrics.ordersProcessed).toFixed(2)}`)

  console.log('\n' + '='.repeat(70) + '\n')
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  let scenarioName = 'small'
  let durationOverride: number | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scenario' && args[i + 1]) {
      scenarioName = args[i + 1]
      i++
    }
    if (args[i] === '--duration' && args[i + 1]) {
      durationOverride = parseInt(args[i + 1], 10)
      i++
    }
  }

  const config = SCENARIOS[scenarioName] || SCENARIOS.small
  if (durationOverride) {
    config.durationSeconds = durationOverride
  }

  try {
    const metrics = await runLoadTest(config)
    printResults(metrics)

    // Export metrics for monitoring
    console.log('Metrics JSON:')
    console.log(JSON.stringify(metrics, null, 2))

    process.exit(0)
  } catch (err) {
    console.error('Load test failed:', err)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { runLoadTest, SCENARIOS, type LoadTestMetrics, type LoadTestConfig }
