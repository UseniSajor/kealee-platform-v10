import { randomUUID } from 'crypto';
import type { KealeeEventEnvelope } from './envelope';

/**
 * Create a properly formed KealeeEventEnvelope.
 * Auto-generates evt_ prefixed ID, sets correlationId from trigger if present.
 */
export function createEvent<T = Record<string, unknown>>(params: {
  type: string;
  source: string;
  projectId: string;
  organizationId: string;
  payload: T;
  entity?: { type: string; id: string };
  severity?: KealeeEventEnvelope['severity'];
  trigger?: { eventId: string; eventType: string };
  initiatorType?: 'USER' | 'SYSTEM' | 'AI';
  initiatorId?: string;
}): KealeeEventEnvelope<T> {
  const eventId = `evt_${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

  // Derive correlationId from trigger chain, or use this event's own ID
  const correlationId = params.trigger?.eventId ?? eventId;

  // Calculate hop count from trigger
  const hopCount = params.trigger ? 1 : 0;

  return {
    id: eventId,
    type: params.type,
    source: params.source,
    projectId: params.projectId,
    organizationId: params.organizationId,
    entity: params.entity,
    severity: params.severity ?? 'INFO',
    payload: params.payload,
    trigger: params.trigger,
    metadata: {
      correlationId,
      initiatorType: params.initiatorType ?? 'SYSTEM',
      initiatorId: params.initiatorId ?? params.source,
      version: '1.0.0',
      hopCount,
    },
    createdAt: new Date().toISOString(),
  };
}
