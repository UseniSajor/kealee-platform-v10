/**
 * @kealee/core-events — Event System v2.0
 *
 * Evolution of @kealee/events with:
 * - Redis Streams (durable, replayable) replacing Pub/Sub
 * - Consumer groups for parallel processing
 * - Dead letter queue for failed events
 * - Saga coordinator for distributed transactions
 * - Backward-compatible event envelope format
 */

export { StreamPublisher } from './stream-publisher';
export { StreamConsumer } from './stream-consumer';
export { SagaCoordinator } from './saga-coordinator';
export { DeadLetterQueue } from './dead-letter';
export { createEvent } from './event-factory';
export { EVENT_TYPES_V20 } from './event-types';

export type {
  EventEnvelope,
  EventHandler,
  StreamConsumerConfig,
  DeadLetterEntry,
  SagaStatus,
  SagaStep,
  SagaState,
} from './types';

export type {
  SagaStepDefinition,
  SagaStepExecutor,
  SagaStepCompensator,
} from './saga-coordinator';
