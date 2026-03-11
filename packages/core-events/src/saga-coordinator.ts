/**
 * Saga Coordinator — manages distributed transactions across OS services
 * Implements the Saga pattern with compensating transactions
 */

import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import type { SagaState, SagaStep, SagaStatus } from './types';

export type SagaStepExecutor = (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
export type SagaStepCompensator = (context: Record<string, unknown>) => Promise<void>;

export interface SagaStepDefinition {
  name: string;
  execute: SagaStepExecutor;
  compensate: SagaStepCompensator;
}

export class SagaCoordinator {
  private redis: Redis;

  constructor(redisUrl?: string) {
    const url = redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.redis = new Redis(url, { maxRetriesPerRequest: 3 });
  }

  /**
   * Execute a saga with ordered steps and automatic compensation on failure
   */
  async executeSaga(
    sagaType: string,
    steps: SagaStepDefinition[],
    initialContext: Record<string, unknown> = {},
    correlationId?: string,
  ): Promise<SagaState> {
    const sagaId = `saga_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const saga: SagaState = {
      sagaId,
      sagaType,
      status: 'RUNNING',
      correlationId: correlationId ?? sagaId,
      steps: steps.map(s => ({ name: s.name, status: 'PENDING' })),
      context: { ...initialContext },
      startedAt: new Date().toISOString(),
    };

    await this.saveSaga(saga);

    const completedSteps: SagaStepDefinition[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      saga.steps[i].status = 'RUNNING';
      saga.steps[i].startedAt = new Date().toISOString();
      await this.saveSaga(saga);

      try {
        const result = await step.execute(saga.context);
        saga.context = { ...saga.context, ...result };
        saga.steps[i].status = 'COMPLETED';
        saga.steps[i].completedAt = new Date().toISOString();
        completedSteps.push(step);
        await this.saveSaga(saga);
      } catch (err) {
        saga.steps[i].status = 'FAILED';
        saga.steps[i].error = String(err);
        saga.status = 'COMPENSATING';
        await this.saveSaga(saga);

        // Compensate completed steps in reverse order
        await this.compensate(saga, completedSteps);

        saga.status = 'FAILED';
        saga.completedAt = new Date().toISOString();
        await this.saveSaga(saga);
        return saga;
      }
    }

    saga.status = 'COMPLETED';
    saga.completedAt = new Date().toISOString();
    await this.saveSaga(saga);
    return saga;
  }

  /**
   * Run compensation steps in reverse
   */
  private async compensate(
    saga: SagaState,
    completedSteps: SagaStepDefinition[],
  ): Promise<void> {
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i];
      try {
        await step.compensate(saga.context);
        saga.steps[i].status = 'COMPENSATED';
      } catch (compErr) {
        console.error(
          `[SagaCoordinator] Compensation failed for step "${step.name}" in saga ${saga.sagaId}:`,
          compErr
        );
        // Record compensation failure but continue compensating other steps
        saga.steps[i].error = `Compensation failed: ${String(compErr)}`;
      }
      await this.saveSaga(saga);
    }
  }

  /**
   * Get saga state by ID
   */
  async getSaga(sagaId: string): Promise<SagaState | null> {
    const data = await this.redis.get(`saga:${sagaId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * List recent sagas by type
   */
  async listSagas(sagaType: string, limit = 20): Promise<SagaState[]> {
    const keys = await this.redis.keys(`saga:saga_*`);
    const sagas: SagaState[] = [];

    for (const key of keys.slice(0, limit * 2)) {
      const data = await this.redis.get(key);
      if (data) {
        const saga = JSON.parse(data) as SagaState;
        if (saga.sagaType === sagaType) sagas.push(saga);
      }
    }

    return sagas
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }

  private async saveSaga(saga: SagaState): Promise<void> {
    // Store with TTL of 7 days for completed/failed sagas
    const ttl = saga.status === 'RUNNING' ? 86400 : 604800; // 1 day running, 7 days final
    await this.redis.setex(`saga:${saga.sagaId}`, ttl, JSON.stringify(saga));
  }

  async disconnect(): Promise<void> {
    this.redis.disconnect();
  }
}
