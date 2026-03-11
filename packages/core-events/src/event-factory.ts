/**
 * Event Factory — creates properly formed event envelopes
 */

import { randomUUID } from 'crypto';
import type { EventEnvelope } from './types';

export function createEvent<T = Record<string, unknown>>(params: {
  type: string;
  source: string;
  projectId?: string;
  orgId?: string;
  payload: T;
  entity?: { type: string; id: string };
  severity?: EventEnvelope['severity'];
  trigger?: { eventId: string; eventType: string };
  initiatorType?: 'USER' | 'SYSTEM' | 'AI' | 'BOT';
  initiatorId?: string;
}): EventEnvelope<T> {
  const eventId = `evt_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const correlationId = params.trigger?.eventId ?? eventId;
  const now = new Date().toISOString();

  return {
    id: eventId,
    type: params.type,
    source: params.source,
    projectId: params.projectId,
    orgId: params.orgId,
    entity: params.entity,
    severity: params.severity ?? 'INFO',
    payload: params.payload,
    trigger: params.trigger,
    metadata: {
      correlationId,
      initiatorType: params.initiatorType ?? 'SYSTEM',
      initiatorId: params.initiatorId ?? params.source,
      version: '2.0.0',
      hopCount: params.trigger ? 1 : 0,
      timestamp: now,
    },
    createdAt: now,
  };
}
