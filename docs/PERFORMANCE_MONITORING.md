# Performance Monitoring & Cost Tracking

**Status:** Phase 2 implementation (July 8, 2026)  
**Components:** Load test suite, cost tracker service, monitoring dashboards  
**Objective:** Validate 500/day capacity, track API cost savings from cache layer

## Architecture

```
Bot Execution
    ↓
callModelCached() [with cache layer]
    ├─ Cache hit → recordBotExecution (cached)
    └─ Cache miss → recordBotExecution (api call)
        ↓
getCostTracker().recordBotExecution()
    ├─ Buffer in memory (10s flush interval)
    └─ Redis aggregation (daily, hourly, by bot type)
        ↓
Query via getCostTracker().getStats()
    ├─ Daily cost report
    ├─ Cache hit rate trending
    ├─ Bot-specific breakdown
    └─ 7-day forecast
```

## Load Testing

### Running Load Tests

```bash
# Small scenario (50 orders, ~30s)
pnpm exec ts-node packages/automation/src/infrastructure/load-test.ts --scenario small

# Medium scenario (250 orders, ~60s)
pnpm exec ts-node packages/automation/src/infrastructure/load-test.ts --scenario medium

# Production scenario (500 orders, ~120s)
pnpm exec ts-node packages/automation/src/infrastructure/load-test.ts --scenario production

# Custom duration
pnpm exec ts-node packages/automation/src/infrastructure/load-test.ts --scenario production --duration 300
```

### Load Test Metrics

Each test produces:

```json
{
  "ordersProcessed": 500,
  "cacheHits": 300,
  "cacheMisses": 200,
  "avgLatencyMs": 125.45,
  "p50LatencyMs": 89.23,
  "p95LatencyMs": 412.18,
  "p99LatencyMs": 587.45,
  "throughputOrdersPerSecond": 4.17,
  "redisMemoryMb": 24.5,
  "apiCostUsd": 45.23,
  "cacheHitPercentage": 60.00,
  "durationSeconds": 120
}
```

### Success Criteria for Production

| Metric | Target | Threshold |
|--------|--------|-----------|
| Throughput | 4-5 orders/sec | >2 orders/sec |
| P95 Latency | <500ms | <2000ms |
| Cache Hit Rate | 60% | >50% |
| Redis Memory | <100MB | <500MB |
| Cost per order | <$0.10 | <$0.50 |

## Cost Tracking Integration

### Recording Bot Execution

```typescript
import { getCostTracker } from '@kealee/automation'

const tracker = getCostTracker()

// In bot execution handler:
tracker.recordBotExecution({
  botType: 'design',
  model: 'claude-opus-4-6',
  inputTokens: 1250,
  outputTokens: 480,
  cacheCreationTokens: 1250,   // First time
  cacheReadTokens: 0,
  cacheHit: false,
  savedTokens: 0,
  estimatedCostUsd: 0.025,
  timestamp: new Date(),
  projectId: 'proj_123',
  durationMs: 3245,
})
```

### Querying Cost Stats

```typescript
// Daily statistics
const dailyStats = await tracker.getStats('daily')
console.log(`Today's cost: $${dailyStats.totalCostUsd.toFixed(2)}`)
console.log(`Cache hit rate: ${(dailyStats.cacheHitRate * 100).toFixed(1)}%`)
console.log(`Savings: $${dailyStats.costSavedUsd.toFixed(2)}`)

// Weekly forecast
const forecast = await tracker.forecast(7)
forecast.forEach(day => {
  console.log(`${day.date}: $${day.projectedCostUsd.toFixed(2)}`)
})

// Cleanup old records (90+ days)
const cleaned = await tracker.cleanup()
console.log(`Cleaned ${cleaned} old records`)
```

### Cost Stats Output

```json
{
  "period": "daily",
  "totalExecutions": 500,
  "cacheHitRate": 0.60,
  "totalInputTokens": 1250000,
  "totalOutputTokens": 480000,
  "totalTokensSaved": 750000,
  "totalCostUsd": 23.45,
  "costSavedUsd": 7.04,
  "costPerExecution": 0.047,
  "avgCacheHitRate": 0.60,
  "botBreakdown": {
    "design": {
      "executions": 125,
      "cacheHits": 75,
      "totalCost": 6.25,
      "costSaved": 1.88
    },
    "estimate": {
      "executions": 125,
      "cacheHits": 75,
      "totalCost": 5.50,
      "costSaved": 1.65
    },
    "permit": {
      "executions": 125,
      "cacheHits": 80,
      "totalCost": 5.45,
      "costSaved": 1.64
    },
    "contractor": {
      "executions": 125,
      "cacheHits": 70,
      "totalCost": 6.25,
      "costSaved": 1.88
    }
  }
}
```

## Monitoring Dashboard

### Recommended Setup (Grafana/Prometheus)

**Metrics to export:**

```
# Cache Performance
cache_hits_total{bot_type="design"}
cache_misses_total{bot_type="design"}
cache_hit_rate_percent{bot_type="design"}

# Latency
bot_execution_latency_ms{bot_type="design", percentile="p50"}
bot_execution_latency_ms{bot_type="design", percentile="p95"}
bot_execution_latency_ms{bot_type="design", percentile="p99"}

# Costs
api_cost_usd{bot_type="design", period="daily"}
cost_saved_usd{bot_type="design", period="daily"}

# Throughput
orders_processed_per_second
redis_memory_usage_bytes
```

### Dashboard Panels

1. **Cache Hit Rate Trend** (last 30 days)
   - Target: 60% sustained
   - Alert: <50% for 1 hour

2. **Daily API Cost** (last 30 days)
   - Target: $10-15/day at 500 orders
   - Alert: >$20/day

3. **Cost Savings** (vs. baseline)
   - Baseline: All API calls, no cache
   - Savings: $(baseline) - $(actual)
   - Target: $5-7/day at 500 orders

4. **P95 Latency Trend** (last 7 days)
   - Target: <500ms
   - Alert: >1000ms for 10 min

5. **Throughput** (orders/sec, last 24h)
   - Target: 4-5 orders/sec
   - Alert: <2 orders/sec for 5 min

6. **Redis Memory** (last 30 days)
   - Target: <100MB
   - Alert: >200MB (needs scaling)

## Performance Validation Checklist

### Pre-Production Validation

- [ ] Load test: small scenario passes with >2 orders/sec
- [ ] Load test: medium scenario shows 50%+ cache hit rate
- [ ] Load test: production scenario uses <100MB Redis memory
- [ ] Cost tracking: daily cost <$20 with 500 orders
- [ ] Cost tracking: cache savings >$5/day
- [ ] Latency: P95 <500ms, P99 <1000ms

### Production Monitoring (First Week)

- [ ] Monitor actual cache hit rate vs. projected 60%
- [ ] Verify cost savings match load test forecast
- [ ] Check Redis memory growth (should plateau)
- [ ] Validate no unusual latency spikes
- [ ] Confirm all bots are hitting cache appropriately

### Post-Launch Tuning

- [ ] If cache hit rate <50%: review input canonicalization
- [ ] If cost >$25/day: adjust TTLs or increase cache aggressiveness
- [ ] If P95 latency >700ms: scale Redis (read replicas)
- [ ] If Redis memory >150MB: investigate retention policy

## Deployment Steps

1. **Deploy response cache layer** (✓ done in Phase 1)
2. **Deploy load test suite** → Run against staging
3. **Deploy cost tracker** → Validate metrics collection
4. **Integrate into bot chains** → Start recording executions
5. **Set up monitoring dashboards** → Enable alerting
6. **Run production load test** → Validate 500/day capacity
7. **Monitor first week** → Tune as needed
8. **Archive baseline metrics** → Reference for future comparison

## Cost Model Reference

### Anthropic Pricing (July 2026)

```
Claude Opus 4.6:
  Input: $15/1M tokens
  Output: $80/1M tokens
  Cache creation: $3.75/1M tokens (25% of input)
  Cache read: $3/1M tokens (20% of input)

Claude Sonnet 4.6:
  Input: $3/1M tokens
  Output: $15/1M tokens
  Cache creation: $0.75/1M tokens
  Cache read: $0.60/1M tokens
```

### Cost Breakdown (500/day with 60% cache hit)

```
Daily volume:     500 orders × 4 bots = 2000 LLM calls
Cache hits:       1200 calls (60%)
API calls:        800 calls (40%)

Per call average: 2000 tokens input, 500 tokens output
Cost per call:    (2000/1M) × $0.015 + (500/1M) × $0.080 = $0.00005

Baseline cost:    2000 × $0.00005 = $0.10/day (no cache)
With cache:       800 × $0.00005 = $0.04/day + prompt cache overhead
Savings:          ~60% reduction ($0.06/day per order category)

At 500/day:       ~$30/month savings (or $360/year)
```

## Rollback & Troubleshooting

### Load Test Shows Low Hit Rate

1. Check cache key generation: `generateCacheKey()` must be deterministic
2. Verify input canonicalization (JSON.stringify order)
3. Check Redis is accessible and not full
4. Review TTL settings (may be expiring too soon)

### Cost Tracker Metrics Wrong

1. Verify Anthropic pricing constants match current rates
2. Check Redis key format: `cost:daily:YYYY-MM-DD`
3. Ensure buffer flush is running (10s interval)
4. Confirm token counts from Anthropic API are being recorded

### Redis Memory Growing Unbounded

1. Check cleanup task is running (90-day retention)
2. Verify TTL is set on keys (default 90 days)
3. May need to adjust retention policy if storage constrained
4. Consider Redis Cluster for larger volumes

---

**Next Steps:**  
1. Run load tests against staging environment
2. Collect baseline metrics (1 week minimum)
3. Validate cost tracking accuracy
4. Deploy to production monitoring
5. Monitor first 30 days for anomalies
