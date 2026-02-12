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
