/**
 * Kealee Event Envelope — ALL events use this standard format.
 * See: _docs/kealee-architecture.md §4
 */

export interface KealeeEventEnvelope<T = Record<string, unknown>> {
  /** Unique event ID, prefixed with evt_ */
  id: string;

  /** Event type in domain.subdomain.action format */
  type: string;

  /** Which claw emitted this event */
  source: string;

  /** Project this event belongs to */
  projectId: string;

  /** Organization scope */
  organizationId: string;

  /** Optional entity reference */
  entity?: {
    type: string;
    id: string;
  };

  /** Event severity level */
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  /** Event-specific payload */
  payload: T;

  /** Causal chain — which event triggered this one */
  trigger?: {
    eventId: string;
    eventType: string;
  };

  /** Metadata for tracing and auditing */
  metadata: {
    correlationId: string;
    initiatorType: 'USER' | 'SYSTEM' | 'AI';
    initiatorId: string;
    version: string;
    hopCount?: number;
  };

  /** ISO timestamp of event creation */
  createdAt: string;
}

export type EventHandler<T = Record<string, unknown>> = (
  event: KealeeEventEnvelope<T>
) => Promise<void>;
