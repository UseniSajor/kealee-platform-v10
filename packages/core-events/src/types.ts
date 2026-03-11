/**
 * Core Events Types — evolved from @kealee/events
 */

export interface EventEnvelope<T = Record<string, unknown>> {
  id: string;
  type: string;
  source: string;
  projectId?: string;
  orgId?: string;
  entity?: { type: string; id: string };
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  payload: T;
  trigger?: { eventId: string; eventType: string };
  metadata: {
    correlationId: string;
    initiatorType: 'USER' | 'SYSTEM' | 'AI' | 'BOT';
    initiatorId: string;
    version: string;
    hopCount: number;
    timestamp: string;
  };
  createdAt: string;
}

export type EventHandler<T = Record<string, unknown>> = (
  event: EventEnvelope<T>
) => Promise<void>;

export interface StreamConsumerConfig {
  groupName: string;
  consumerName: string;
  streams: string[];
  batchSize?: number;
  blockMs?: number;
  /** If true, auto-acknowledge messages after handler runs */
  autoAck?: boolean;
}

export interface DeadLetterEntry {
  originalStream: string;
  messageId: string;
  event: EventEnvelope;
  error: string;
  failedAt: string;
  retryCount: number;
}

export type SagaStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATING';

export interface SagaStep {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATED';
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface SagaState {
  sagaId: string;
  sagaType: string;
  status: SagaStatus;
  correlationId: string;
  steps: SagaStep[];
  context: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}
