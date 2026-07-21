/**
 * Event System Integration Tests
 * Tests createEvent, StreamPublisher, StreamConsumer, SagaCoordinator, DeadLetterQueue
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createEvent } from '../event-factory';
import { StreamPublisher } from '../stream-publisher';
import { StreamConsumer } from '../stream-consumer';
import { SagaCoordinator } from '../saga-coordinator';
import { DeadLetterQueue } from '../dead-letter';
import type { EventEnvelope } from '../types';

// ── Mock ioredis ─────────────────────────────────────────────

vi.mock('ioredis', () => {
  const RedisMock = vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    xadd: vi.fn().mockResolvedValue('1234567890-0'),
    xreadgroup: vi.fn().mockResolvedValue(null),
    xack: vi.fn().mockResolvedValue(1),
    xgroup: vi.fn().mockResolvedValue('OK'),
    xrevrange: vi.fn().mockResolvedValue([]),
    xrange: vi.fn().mockResolvedValue([]),
    xdel: vi.fn().mockResolvedValue(1),
    xlen: vi.fn().mockResolvedValue(0),
    del: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    keys: vi.fn().mockResolvedValue([]),
    pipeline: vi.fn().mockReturnValue({
      xadd: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, '111-0'],
        [null, '222-0'],
      ]),
    }),
  }));
  return { default: RedisMock };
});

// ── createEvent ──────────────────────────────────────────────

describe('createEvent', () => {
  it('generates a proper EventEnvelope with UUID id and timestamp', () => {
    const event = createEvent({
      type: 'twin.phase.changed',
      source: 'core-ddts',
      projectId: 'proj_001',
      orgId: 'org_001',
      payload: { from: 'INTAKE', to: 'FEASIBILITY' },
      severity: 'MEDIUM',
    });

    expect(event.id).toMatch(/^evt_[a-f0-9]{16}$/);
    expect(event.type).toBe('twin.phase.changed');
    expect(event.source).toBe('core-ddts');
    expect(event.projectId).toBe('proj_001');
    expect(event.orgId).toBe('org_001');
    expect(event.severity).toBe('MEDIUM');
    expect(event.payload).toEqual({ from: 'INTAKE', to: 'FEASIBILITY' });
    expect(event.createdAt).toBeDefined();
    expect(new Date(event.createdAt).getTime()).not.toBeNaN();
  });

  it('sets correct metadata fields', () => {
    const event = createEvent({
      type: 'os-land.parcel.created',
      source: 'os-land',
      payload: { parcelId: 'p_001' },
      initiatorType: 'USER',
      initiatorId: 'user_123',
    });

    expect(event.metadata.correlationId).toBe(event.id); // No trigger, so correlationId === id
    expect(event.metadata.initiatorType).toBe('USER');
    expect(event.metadata.initiatorId).toBe('user_123');
    expect(event.metadata.version).toBe('2.0.0');
    expect(event.metadata.hopCount).toBe(0);
    expect(event.metadata.timestamp).toBeDefined();
  });

  it('defaults severity to INFO and initiator to SYSTEM', () => {
    const event = createEvent({
      type: 'test.event',
      source: 'test',
      payload: {},
    });

    expect(event.severity).toBe('INFO');
    expect(event.metadata.initiatorType).toBe('SYSTEM');
    expect(event.metadata.initiatorId).toBe('test'); // defaults to source
  });

  it('sets correlationId and hopCount from trigger', () => {
    const event = createEvent({
      type: 'notification.sent',
      source: 'notifications',
      payload: { channel: 'email' },
      trigger: { eventId: 'evt_parent123', eventType: 'twin.phase.changed' },
    });

    expect(event.metadata.correlationId).toBe('evt_parent123');
    expect(event.metadata.hopCount).toBe(1);
    expect(event.trigger).toEqual({
      eventId: 'evt_parent123',
      eventType: 'twin.phase.changed',
    });
  });

  it('includes entity reference when provided', () => {
    const event = createEvent({
      type: 'twin.kpi.updated',
      source: 'core-ddts',
      payload: { kpiKey: 'budget_variance', value: 5 },
      entity: { type: 'DigitalTwin', id: 'twin_abc' },
    });

    expect(event.entity).toEqual({ type: 'DigitalTwin', id: 'twin_abc' });
  });
});

// ── StreamPublisher ──────────────────────────────────────────

describe('StreamPublisher', () => {
  let publisher: StreamPublisher;

  beforeEach(() => {
    vi.clearAllMocks();
    publisher = new StreamPublisher('redis://localhost:6379');
  });

  it('publishes to the correct domain stream derived from event type', async () => {
    await publisher.connect();

    const event = createEvent({
      type: 'twin.phase.changed',
      source: 'core-ddts',
      payload: { from: 'INTAKE', to: 'FEASIBILITY' },
    });

    const messageId = await publisher.publish(event);

    expect(messageId).toBe('1234567890-0');

    // Access the underlying mock redis
    const redis = (publisher as any).redis;
    expect(redis.xadd).toHaveBeenCalledTimes(2); // domain stream + global stream

    // First call: domain stream "events:twin"
    const firstCall = redis.xadd.mock.calls[0];
    expect(firstCall[0]).toBe('events:twin');
    expect(firstCall[1]).toBe('*');
    expect(firstCall[2]).toBe('event');
    expect(firstCall[4]).toBe('type');
    expect(firstCall[5]).toBe('twin.phase.changed');

    // Second call: global stream
    const secondCall = redis.xadd.mock.calls[1];
    expect(secondCall[0]).toBe('events:global');
  });

  it('derives stream name correctly from different event types', async () => {
    await publisher.connect();

    // Test "os-land.parcel.created" -> "events:os-land"
    const event = createEvent({
      type: 'os-land.parcel.created',
      source: 'os-land',
      payload: {},
    });

    await publisher.publish(event);

    const redis = (publisher as any).redis;
    const firstCall = redis.xadd.mock.calls[0];
    expect(firstCall[0]).toBe('events:os-land');
  });

  it('publishes batch using pipeline', async () => {
    await publisher.connect();

    const events = [
      createEvent({ type: 'twin.created', source: 'core-ddts', payload: {} }),
      createEvent({ type: 'twin.kpi.updated', source: 'core-ddts', payload: {} }),
    ];

    const results = await publisher.publishBatch(events);

    expect(results.length).toBeGreaterThan(0);

    const redis = (publisher as any).redis;
    expect(redis.pipeline).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect if already connected', async () => {
    await publisher.connect();
    await publisher.connect(); // Second call should be a no-op

    const redis = (publisher as any).redis;
    expect(redis.connect).toHaveBeenCalledTimes(1);
  });
});

// ── StreamConsumer ───────────────────────────────────────────

describe('StreamConsumer', () => {
  let consumer: StreamConsumer;

  beforeEach(() => {
    vi.clearAllMocks();
    consumer = new StreamConsumer(
      {
        groupName: 'test-group',
        consumerName: 'test-consumer-1',
        streams: ['events:twin'],
        batchSize: 5,
        blockMs: 1000,
        autoAck: true,
      },
      'redis://localhost:6379',
    );
  });

  it('registers event handlers by pattern', () => {
    const handler = vi.fn();
    consumer.on('twin.*', handler);

    // Access internal handlers map
    const handlers = (consumer as any).handlers;
    expect(handlers.has('twin.*')).toBe(true);
    expect(handlers.get('twin.*')).toContain(handler);
  });

  it('creates consumer group on start', async () => {
    // Start will enter consume loop; stop immediately
    const startPromise = consumer.start();
    // Allow microtask to run then stop
    await new Promise(r => setTimeout(r, 50));
    await consumer.stop();

    const redis = (consumer as any).redis;
    expect(redis.xgroup).toHaveBeenCalledWith(
      'CREATE', 'events:twin', 'test-group', '0', 'MKSTREAM',
    );
  });

  it('processes a message and dispatches to matching handler', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('twin.*', handler);

    const testEvent: EventEnvelope = createEvent({
      type: 'twin.phase.changed',
      source: 'core-ddts',
      payload: { from: 'INTAKE', to: 'FEASIBILITY' },
    });

    // Directly call the private processMessage method for unit testing
    const processMessage = (consumer as any).processMessage.bind(consumer);
    await processMessage(
      'events:twin',
      '1234-0',
      ['event', JSON.stringify(testEvent), 'type', 'twin.phase.changed'],
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'twin.phase.changed' }),
    );
  });

  it('acknowledges messages after successful handler execution', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('twin.*', handler);

    const testEvent = createEvent({
      type: 'twin.created',
      source: 'core-ddts',
      payload: {},
    });

    const processMessage = (consumer as any).processMessage.bind(consumer);
    await processMessage(
      'events:twin',
      '5678-0',
      ['event', JSON.stringify(testEvent), 'type', 'twin.created'],
    );

    const redis = (consumer as any).redis;
    expect(redis.xack).toHaveBeenCalledWith('events:twin', 'test-group', '5678-0');
  });

  it('moves to dead letter on handler failure', async () => {
    const failingHandler = vi.fn().mockRejectedValue(new Error('Handler crashed'));
    consumer.on('twin.*', failingHandler);

    const testEvent = createEvent({
      type: 'twin.kpi.updated',
      source: 'core-ddts',
      payload: {},
    });

    const processMessage = (consumer as any).processMessage.bind(consumer);
    await processMessage(
      'events:twin',
      '9999-0',
      ['event', JSON.stringify(testEvent), 'type', 'twin.kpi.updated'],
    );

    const redis = (consumer as any).redis;
    expect(redis.xadd).toHaveBeenCalledWith(
      'events:dead-letter',
      '*',
      'originalStream', 'events:twin',
      'messageId', '9999-0',
      'event', expect.any(String),
      'error', expect.stringContaining('Handler crashed'),
      'failedAt', expect.any(String),
    );
  });
});

// ── SagaCoordinator ──────────────────────────────────────────

describe('SagaCoordinator', () => {
  let coordinator: SagaCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    coordinator = new SagaCoordinator('redis://localhost:6379');
  });

  it('executes steps in order and returns COMPLETED status', async () => {
    const step1Execute = vi.fn().mockResolvedValue({ step1Result: 'done' });
    const step1Compensate = vi.fn().mockResolvedValue(undefined);
    const step2Execute = vi.fn().mockResolvedValue({ step2Result: 'done' });
    const step2Compensate = vi.fn().mockResolvedValue(undefined);

    const result = await coordinator.executeSaga(
      'create-project',
      [
        { name: 'create-twin', execute: step1Execute, compensate: step1Compensate },
        { name: 'setup-modules', execute: step2Execute, compensate: step2Compensate },
      ],
      { projectId: 'proj_001' },
    );

    expect(result.status).toBe('COMPLETED');
    expect(result.sagaType).toBe('create-project');
    expect(result.sagaId).toMatch(/^saga_/);
    expect(result.completedAt).toBeDefined();

    // Steps executed in order
    expect(step1Execute).toHaveBeenCalledBefore(step2Execute);
    expect(step1Execute).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'proj_001' }));
    // Step 2 receives context with step1's result merged
    expect(step2Execute).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'proj_001', step1Result: 'done' }),
    );

    // All steps should be COMPLETED
    expect(result.steps[0].status).toBe('COMPLETED');
    expect(result.steps[1].status).toBe('COMPLETED');

    // No compensation should have run
    expect(step1Compensate).not.toHaveBeenCalled();
    expect(step2Compensate).not.toHaveBeenCalled();
  });

  it('runs compensation in reverse order on step failure', async () => {
    const compensationOrder: string[] = [];

    const step1Execute = vi.fn().mockResolvedValue({ twinId: 'twin_001' });
    const step1Compensate = vi.fn().mockImplementation(async () => {
      compensationOrder.push('step1');
    });

    const step2Execute = vi.fn().mockResolvedValue({ moduleId: 'mod_001' });
    const step2Compensate = vi.fn().mockImplementation(async () => {
      compensationOrder.push('step2');
    });

    const step3Execute = vi.fn().mockRejectedValue(new Error('Payment failed'));
    const step3Compensate = vi.fn().mockResolvedValue(undefined);

    const result = await coordinator.executeSaga(
      'onboard-project',
      [
        { name: 'create-twin', execute: step1Execute, compensate: step1Compensate },
        { name: 'setup-modules', execute: step2Execute, compensate: step2Compensate },
        { name: 'charge-payment', execute: step3Execute, compensate: step3Compensate },
      ],
      {},
    );

    expect(result.status).toBe('FAILED');
    expect(result.steps[0].status).toBe('COMPENSATED');
    expect(result.steps[1].status).toBe('COMPENSATED');
    expect(result.steps[2].status).toBe('FAILED');
    expect(result.steps[2].error).toContain('Payment failed');

    // Compensation runs in reverse: step2 first, then step1
    expect(compensationOrder).toEqual(['step2', 'step1']);

    // Step3 compensate should NOT run (it never completed)
    expect(step3Compensate).not.toHaveBeenCalled();
  });

  it('merges step context across the saga', async () => {
    const step1Execute = vi.fn().mockResolvedValue({ twinId: 'twin_abc' });
    const step2Execute = vi.fn().mockResolvedValue({ snapshotId: 'snap_xyz' });

    const result = await coordinator.executeSaga(
      'test-saga',
      [
        { name: 'step1', execute: step1Execute, compensate: vi.fn() },
        { name: 'step2', execute: step2Execute, compensate: vi.fn() },
      ],
      { orgId: 'org_001' },
    );

    expect(result.context).toEqual(
      expect.objectContaining({
        orgId: 'org_001',
        twinId: 'twin_abc',
        snapshotId: 'snap_xyz',
      }),
    );
  });

  it('persists saga state to Redis on each step', async () => {
    const step1Execute = vi.fn().mockResolvedValue({});

    await coordinator.executeSaga(
      'persist-test',
      [{ name: 'only-step', execute: step1Execute, compensate: vi.fn() }],
    );

    const redis = (coordinator as any).redis;
    // saveSaga is called: initial + step RUNNING + step COMPLETED + saga COMPLETED = 4 times
    expect(redis.setex).toHaveBeenCalled();
    const calls = redis.setex.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(3);
    // All calls use saga key prefix
    for (const call of calls) {
      expect(call[0]).toMatch(/^saga:saga_/);
    }
  });

  it('uses custom correlationId when provided', async () => {
    const step1Execute = vi.fn().mockResolvedValue({});

    const result = await coordinator.executeSaga(
      'corr-test',
      [{ name: 'step', execute: step1Execute, compensate: vi.fn() }],
      {},
      'custom_corr_id_123',
    );

    expect(result.correlationId).toBe('custom_corr_id_123');
  });
});

// ── DeadLetterQueue ──────────────────────────────────────────

describe('DeadLetterQueue', () => {
  let dlq: DeadLetterQueue;

  beforeEach(() => {
    vi.clearAllMocks();
    dlq = new DeadLetterQueue('redis://localhost:6379');
  });

  it('adds a failed event to the dead letter stream', async () => {
    const event = createEvent({
      type: 'twin.phase.changed',
      source: 'core-ddts',
      payload: {},
    });

    const messageId = await dlq.add({
      originalStream: 'events:twin',
      messageId: '1234-0',
      event,
      error: 'Handler timeout',
      failedAt: '2026-03-09T12:00:00Z',
    });

    expect(messageId).toBe('1234567890-0');

    const redis = (dlq as any).redis;
    expect(redis.xadd).toHaveBeenCalledWith(
      'events:dead-letter',
      '*',
      'originalStream', 'events:twin',
      'messageId', '1234-0',
      'event', JSON.stringify(event),
      'error', 'Handler timeout',
      'failedAt', '2026-03-09T12:00:00Z',
      'retryCount', '0',
    );
  });

  it('lists dead letter entries via xrevrange', async () => {
    const mockEvent = createEvent({ type: 'test.event', source: 'test', payload: {} });

    const redis = (dlq as any).redis;
    redis.xrevrange.mockResolvedValue([
      [
        '1111-0',
        [
          'originalStream', 'events:twin',
          'messageId', 'msg-001',
          'event', JSON.stringify(mockEvent),
          'error', 'Handler error',
          'failedAt', '2026-03-09T10:00:00Z',
          'retryCount', '1',
        ],
      ],
    ]);

    const entries = await dlq.list(10);

    expect(entries).toHaveLength(1);
    expect(entries[0].originalStream).toBe('events:twin');
    expect(entries[0].messageId).toBe('msg-001');
    expect(entries[0].error).toBe('Handler error');
    expect(entries[0].retryCount).toBe(1);
    expect(entries[0].event.type).toBe('test.event');
  });

  it('retries a failed event by republishing to original stream', async () => {
    const mockEvent = createEvent({
      type: 'twin.created',
      source: 'core-ddts',
      payload: { twinId: 'twin_abc' },
      severity: 'INFO',
    });

    const redis = (dlq as any).redis;
    redis.xrange.mockResolvedValue([
      [
        'retry-msg-001',
        [
          'originalStream', 'events:twin',
          'messageId', 'orig-001',
          'event', JSON.stringify(mockEvent),
          'error', 'Transient error',
          'failedAt', '2026-03-09T08:00:00Z',
          'retryCount', '1',
        ],
      ],
    ]);

    const result = await dlq.retry('retry-msg-001');

    expect(result).toBe(true);

    // Republished to original stream
    expect(redis.xadd).toHaveBeenCalledWith(
      'events:twin',
      '*',
      'event', JSON.stringify(mockEvent),
      'type', 'twin.created',
      'source', 'core-ddts',
      'severity', 'INFO',
    );

    // Deleted from dead letter
    expect(redis.xdel).toHaveBeenCalledWith('events:dead-letter', 'retry-msg-001');
  });

  it('returns false when retry count exceeds MAX_RETRIES', async () => {
    const redis = (dlq as any).redis;
    redis.xrange.mockResolvedValue([
      [
        'max-retry-msg',
        [
          'originalStream', 'events:twin',
          'messageId', 'orig-002',
          'event', JSON.stringify(createEvent({ type: 'test', source: 'test', payload: {} })),
          'error', 'Persistent error',
          'failedAt', '2026-03-09T06:00:00Z',
          'retryCount', '3', // MAX_RETRIES is 3
        ],
      ],
    ]);

    const result = await dlq.retry('max-retry-msg');

    expect(result).toBe(false);
    expect(redis.xadd).not.toHaveBeenCalled();
    expect(redis.xdel).not.toHaveBeenCalled();
  });

  it('returns false when message not found in dead letter queue', async () => {
    const redis = (dlq as any).redis;
    redis.xrange.mockResolvedValue([]);

    const result = await dlq.retry('nonexistent-msg');
    expect(result).toBe(false);
  });

  it('reports count of dead letter entries', async () => {
    const redis = (dlq as any).redis;
    redis.xlen.mockResolvedValue(42);

    const count = await dlq.count();
    expect(count).toBe(42);
    expect(redis.xlen).toHaveBeenCalledWith('events:dead-letter');
  });

  it('purges all dead letter entries', async () => {
    await dlq.purge();

    const redis = (dlq as any).redis;
    expect(redis.del).toHaveBeenCalledWith('events:dead-letter');
  });
});
