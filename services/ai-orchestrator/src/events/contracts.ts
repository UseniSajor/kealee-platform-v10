/**
 * events/contracts.ts
 *
 * Structured event contracts for all orchestrator-emitted events.
 *
 * Events are emitted to the Kealee event bus (Redis pub/sub or BullMQ events).
 * Consumers: worker jobs, analytics, CRM, portal state, notification service.
 */

// ─── Event types ──────────────────────────────────────────────────────────────

export type KealeeEventType =
  // Routing
  | "orchestrator.route.decided"
  | "orchestrator.subgraph.started"
  | "orchestrator.subgraph.completed"
  // Agent execution
  | "orchestrator.agent.started"
  | "orchestrator.agent.completed"
  | "orchestrator.agent.failed"
  // Tools
  | "orchestrator.tool.invoked"
  | "orchestrator.tool.completed"
  | "orchestrator.tool.failed"
  // Escalation
  | "orchestrator.escalation.architect"
  | "orchestrator.escalation.human_review"
  | "orchestrator.escalation.support"
  // SLA
  | "orchestrator.sla.started"
  | "orchestrator.sla.completed"
  | "orchestrator.sla.breached"
  // Purchase
  | "orchestrator.checkout.created"
  | "orchestrator.purchase.completed"
  | "orchestrator.purchase.failed"
  // Delivery
  | "orchestrator.deliverable.generated"
  | "orchestrator.deliverable.sent"
  // Handoff
  | "orchestrator.handoff.triggered"
  | "orchestrator.handoff.accepted"
  // Readiness
  | "orchestrator.readiness.updated"
  | "orchestrator.readiness.gate_passed"
  | "orchestrator.readiness.gate_blocked";

// ─── Base event envelope ──────────────────────────────────────────────────────

export interface KealeeEvent<T extends Record<string, unknown> = Record<string, unknown>> {
  type: KealeeEventType;
  threadId: string;
  userId?: string;
  projectId?: string;
  orgId?: string;
  timestamp: string;
  payload: T;
  meta?: {
    subgraph?: string;
    agentRole?: string;
    toolName?: string;
    durationMs?: number;
    confidence?: number;
  };
}

// ─── Typed payloads ───────────────────────────────────────────────────────────

export interface RouteDecidedPayload {
  fromPhase: string;
  toSubgraph: string;
  reason: string;
}

export interface AgentEventPayload {
  agentRole: string;
  taskId?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface ToolEventPayload {
  toolName: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

export interface CheckoutCreatedPayload {
  productSku: string;
  checkoutUrl: string;
  sessionId?: string;
  userId?: string;
}

export interface PurchaseCompletedPayload {
  productSku: string;
  stripeSessionId?: string;
  amount?: number;
  currency?: string;
}

export interface DeliverableGeneratedPayload {
  type: string;
  productSku: string;
  deliverableId?: string;
  url?: string;
  summary?: string;
}

export interface ReadinessUpdatedPayload {
  before: Record<string, boolean>;
  after: Record<string, boolean>;
  changedFlags: string[];
}

// ─── Event emitter ────────────────────────────────────────────────────────────

type Listener<T extends Record<string, unknown>> = (event: KealeeEvent<T>) => void | Promise<void>;

const listeners: Map<KealeeEventType, Listener<Record<string, unknown>>[]> = new Map();

export function onEvent<T extends Record<string, unknown>>(
  type: KealeeEventType,
  listener: Listener<T>
): void {
  const existing = listeners.get(type) ?? [];
  existing.push(listener as Listener<Record<string, unknown>>);
  listeners.set(type, existing);
}

export async function emitEvent<T extends Record<string, unknown>>(
  event: KealeeEvent<T>
): Promise<void> {
  const handlers = listeners.get(event.type) ?? [];
  await Promise.allSettled(handlers.map((h) => h(event as KealeeEvent<Record<string, unknown>>)));
}

export function buildEvent<T extends Record<string, unknown>>(
  type: KealeeEventType,
  threadId: string,
  payload: T,
  opts?: Partial<Omit<KealeeEvent<T>, "type" | "threadId" | "payload" | "timestamp">>
): KealeeEvent<T> {
  return {
    type,
    threadId,
    timestamp: new Date().toISOString(),
    payload,
    ...opts,
  };
}
