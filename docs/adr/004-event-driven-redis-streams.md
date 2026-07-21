# ADR-004: Event-Driven Architecture with Redis Streams

**Status:** Accepted
**Date:** 2026-03-09
**Context:** v10 used Redis Pub/Sub for events, which has no durability or replay capability

## Decision

Migrate from Redis Pub/Sub to Redis Streams with:
- Consumer groups for load balancing
- Event store for replay and debugging
- Saga coordinator for distributed workflows
- Dead letter queue for failed event handling (max 3 retries)

## Event Envelope Format (v2.0.0)

```typescript
{
  id: string;          // UUID
  type: string;        // e.g., 'twin.phase.transitioned'
  source: string;      // e.g., 'os-land'
  timestamp: string;   // ISO 8601
  version: '2.0.0';
  correlationId: string;
  causationId?: string;
  data: unknown;
  metadata: { userId, orgId, projectId, twinId, environment }
}
```

## Rationale

- Durable: events persist in Redis and survive consumer crashes
- Replayable: dead letter queue enables retry of failed events
- Scalable: consumer groups distribute load across multiple workers
- Saga support: enables multi-step workflows with compensation on failure

## Consequences

- Redis must be configured with appropriate memory limits and eviction policies
- Event types must be versioned to handle schema evolution
- All services must use the event factory for consistent envelope format
