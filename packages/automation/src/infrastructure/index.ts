/**
 * @kealee/automation — Infrastructure Package
 *
 * Centralized error handling, dead letter queues, circuit breakers,
 * and alerting for all Command Center workers and automation apps.
 *
 * Usage:
 *   import {
 *     CommandCenterErrorHandler,
 *     alertService, AlertLevel,
 *     CircuitBreaker, anthropicCircuit, stripeCircuit,
 *     moveToDeadLetter, getDeadLetterJobs,
 *     createManagedWorker, createManagedQueue,
 *   } from '@kealee/automation';
 */

// ── Error Handler ────────────────────────────────────────────
export {
  CommandCenterErrorHandler,
  mapQueueToAppId,
  type ErrorClassification,
} from './error-handler';

// ── Dead Letter Queue ────────────────────────────────────────
export {
  moveToDeadLetter,
  getDeadLetterJobs,
  getDeadLetterStats,
  retryDeadLetter,
  discardDeadLetter,
  retryAllForApp,
  type DeadLetterEntry,
  type DeadLetterQuery,
  type DeadLetterStats,
} from './dead-letter';

// ── Circuit Breaker ──────────────────────────────────────────
export {
  CircuitBreaker,
  CircuitOpenError,
  CircuitState,
  getAllCircuitStatuses,
  anthropicCircuit,
  stripeCircuit,
  resendCircuit,
  twilioCircuit,
  type CircuitBreakerOptions,
  type CircuitBreakerStatus,
} from './circuit-breaker';

// ── Alerting ─────────────────────────────────────────────────
export {
  alertService,
  AlertLevel,
  type CreateAlertOptions,
  type AlertQuery,
  type AlertStats,
} from './alerting';

// ── Queue Factory (Managed Workers) ──────────────────────────
export {
  createManagedWorker,
  createManagedQueue,
  type ManagedWorkerOptions,
} from './queue-factory';

// ── Response Cache ───────────────────────────────────────────
export {
  getResponseCache,
  withCache,
  type CacheMetrics,
  type BotType,
} from './response-cache';

// ── Cost Tracking ────────────────────────────────────────────
export {
  getCostTracker,
  type BotExecutionRecord,
  type CostStats,
} from './cost-tracker';

// ── Load Testing ─────────────────────────────────────────────
export {
  runLoadTest,
  SCENARIOS,
  type LoadTestMetrics,
  type LoadTestConfig,
} from './load-test';

// ── Tier Integration Testing ─────────────────────────────────
// REMOVED: `tier-integration-test.ts` was deleted in 9adeabc0 and this export
// was left pointing at it, which made @kealee/automation — and therefore the
// whole `pnpm --filter @kealee/api...` build that the kealee-platform-v10
// service runs — fail to compile with TS2307.
//
// Deleted rather than restored: nothing imports `runTierTest`, `TEST_CASES` or
// `TestResult` anywhere in the repo, so the export had no consumers and the
// deletion of the harness was evidently deliberate. Recovering the file to
// satisfy a barrel nobody reads would be the wrong repair.
