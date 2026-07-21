/**
 * KEALEE COMMAND CENTER - EVENT BUS
 * Redis Pub/Sub Event System for Inter-App Communication
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { randomUUID as uuid } from 'crypto';
import { getTraceId, createLogger } from '@kealee/observability';

const logger = createLogger('event-bus');

// Event type definitions
export const EVENT_TYPES = {
  // Project lifecycle events
  PROJECT_CREATED: 'kealee.project.created',
  PROJECT_PHASE_CHANGED: 'kealee.project.phase_changed',
  PROJECT_MILESTONE_DUE: 'kealee.project.milestone_due',
  PROJECT_COMPLETED: 'kealee.project.completed',

  // Bid events (APP-01)
  BID_REQUEST_CREATED: 'kealee.bid.request_created',
  BID_INVITATION_SENT: 'kealee.bid.invitation_sent',
  BID_SUBMITTED: 'kealee.bid.submitted',
  BID_DEADLINE_APPROACHING: 'kealee.bid.deadline_approaching',
  BID_ANALYSIS_COMPLETE: 'kealee.bid.analysis_complete',
  BID_AWARDED: 'kealee.bid.awarded',

  // Visit events (APP-02)
  VISIT_SCHEDULED: 'kealee.visit.scheduled',
  VISIT_REMINDER: 'kealee.visit.reminder',
  VISIT_STARTED: 'kealee.visit.started',
  VISIT_COMPLETED: 'kealee.visit.completed',
  VISIT_CANCELLED: 'kealee.visit.cancelled',
  VISIT_REPORT_GENERATED: 'kealee.visit.report_generated',

  // Change order events (APP-03)
  CHANGE_ORDER_CREATED: 'kealee.change_order.created',
  CHANGE_ORDER_ANALYZED: 'kealee.change_order.analyzed',
  CHANGE_ORDER_SUBMITTED: 'kealee.change_order.submitted',
  CHANGE_ORDER_APPROVED: 'kealee.change_order.approved',
  CHANGE_ORDER_REJECTED: 'kealee.change_order.rejected',

  // Report events (APP-04)
  REPORT_DUE: 'kealee.report.due',
  REPORT_GENERATED: 'kealee.report.generated',
  REPORT_SENT: 'kealee.report.sent',

  // Permit events (APP-05)
  PERMIT_CREATED: 'kealee.permit.created',
  PERMIT_SUBMITTED: 'kealee.permit.submitted',
  PERMIT_STATUS_CHANGED: 'kealee.permit.status_changed',
  PERMIT_COMMENTS_RECEIVED: 'kealee.permit.comments_received',
  PERMIT_APPROVED: 'kealee.permit.approved',
  PERMIT_EXPIRING: 'kealee.permit.expiring',

  // Inspection events (APP-06)
  INSPECTION_SCHEDULED: 'kealee.inspection.scheduled',
  INSPECTION_CONFIRMED: 'kealee.inspection.confirmed',
  INSPECTION_REMINDER: 'kealee.inspection.reminder',
  INSPECTION_COMPLETED: 'kealee.inspection.completed',
  INSPECTION_PASSED: 'kealee.inspection.passed',
  INSPECTION_FAILED: 'kealee.inspection.failed',

  // Budget events (APP-07)
  BUDGET_UPDATED: 'kealee.budget.updated',
  BUDGET_ALERT: 'kealee.budget.alert',
  BUDGET_THRESHOLD_EXCEEDED: 'kealee.budget.threshold_exceeded',
  BUDGET_VARIANCE_DETECTED: 'kealee.budget.variance_detected',
  INVOICE_CREATED: 'kealee.budget.invoice_created',
  PAYMENT_RECEIVED: 'kealee.budget.payment_received',

  // Communication events (APP-08)
  MESSAGE_SENT: 'kealee.comm.message_sent',
  MESSAGE_DELIVERED: 'kealee.comm.message_delivered',
  MESSAGE_FAILED: 'kealee.comm.message_failed',
  COMMUNICATION_BROADCAST: 'kealee.comm.broadcast',

  // Task events (APP-09)
  TASK_CREATED: 'kealee.task.created',
  TASK_ASSIGNED: 'kealee.task.assigned',
  TASK_STARTED: 'kealee.task.started',
  TASK_COMPLETED: 'kealee.task.completed',
  TASK_OVERDUE: 'kealee.task.overdue',
  TASK_ESCALATED: 'kealee.task.escalated',

  // Document events (APP-10)
  DOCUMENT_GENERATED: 'kealee.document.generated',
  DOCUMENT_APPROVED: 'kealee.document.approved',
  DOCUMENT_SIGNED: 'kealee.document.signed',
  DOCUMENT_REJECTED: 'kealee.document.rejected',

  // AI/Predictive events (APP-11-14)
  PREDICTION_GENERATED: 'kealee.ai.prediction_generated',
  RISK_ALERT: 'kealee.ai.risk_alert',
  QA_ISSUE_DETECTED: 'kealee.ai.qa_issue_detected',
  RECOMMENDATION_GENERATED: 'kealee.ai.recommendation_generated',
  INSIGHT_GENERATED: 'kealee.ai.insight_generated',

  // Autonomous Action events
  AUTONOMOUS_ACTION_EXECUTED: 'kealee.autonomy.action_executed',
  AUTONOMOUS_ACTION_ESCALATED: 'kealee.autonomy.action_escalated',
  AUTONOMOUS_ACTION_REVERTED: 'kealee.autonomy.action_reverted',
  AUTONOMOUS_ACTION_REVIEWED: 'kealee.autonomy.action_reviewed',

  // Schedule Weather events (APP-12)
  SCHEDULE_WEATHER_RESCHEDULED: 'kealee.schedule.weather_rescheduled',
  SCHEDULE_WEATHER_ALERT: 'kealee.schedule.weather_alert',

  // Crew Tracking events (APP-12)
  CREW_ARRIVED: 'kealee.crew.arrived',
  CREW_DEPARTED: 'kealee.crew.departed',

  // Contractor Scoring events
  CONTRACTOR_SCORE_UPDATED: 'kealee.scoring.contractor_updated',
  CONTRACTOR_SCORE_RECALCULATED: 'kealee.scoring.contractor_recalculated',

  // GrowthBot marketplace liquidity events
  GROWTH_ANALYSIS_COMPLETE:       'growth.analysis.complete',
  GROWTH_TRADE_SHORTAGE_DETECTED: 'growth.trade.shortage_detected',
  GROWTH_TRADE_SURPLUS_DETECTED:  'growth.trade.surplus_detected',
  GROWTH_GEO_SHORTAGE_DETECTED:   'growth.geo.shortage_detected',
  GROWTH_BACKLOG_RISK_DETECTED:   'growth.backlog.risk_detected',
  GROWTH_CONTRACTOR_CHURN_RISK:   'growth.contractor.churn_risk',
  GROWTH_RECRUITMENT_RECOMMENDED: 'growth.recruitment.recommended',
  GROWTH_DEMAND_GEN_RECOMMENDED:  'growth.demand_gen.recommended',
  GROWTH_OPS_ALERT:               'growth.ops.alert',
  GROWTH_METRICS_REFRESHED:       'growth.metrics.refreshed',

  // Marketplace platform events (inbound triggers for GrowthBot)
  MARKETPLACE_CONTRACTOR_REGISTERED: 'marketplace.contractor.registered',
  MARKETPLACE_CONTRACTOR_VERIFIED:   'marketplace.contractor.verified',
  MARKETPLACE_CONTRACTOR_INACTIVE:   'marketplace.contractor.inactive',
  MARKETPLACE_ASSIGNMENT_EXPIRED:    'marketplace.assignment.expired',
  GROWTH_ANALYSIS_SCHEDULED:         'growth.analysis.scheduled',

  // Contractor Acquisition Pipeline events
  CONTRACTOR_ACQUISITION_LEAD_CAPTURED:          'contractor.acquisition.lead_captured',
  CONTRACTOR_ACQUISITION_REGISTRATION_STARTED:   'contractor.acquisition.registration_started',
  CONTRACTOR_ACQUISITION_DOCUMENTS_UPLOADED:     'contractor.acquisition.documents_uploaded',
  CONTRACTOR_ACQUISITION_VERIFICATION_PENDING:   'contractor.acquisition.verification_pending',
  CONTRACTOR_ACQUISITION_ACTIVATED:              'contractor.acquisition.activated',
  CONTRACTOR_ACQUISITION_REENGAGEMENT_TRIGGERED: 'contractor.acquisition.reengagement_triggered',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

// Event payload interface
export interface KealeeEvent<T = unknown> {
  id: string;
  type: EventType;
  source: string;
  timestamp: string;
  correlationId?: string;
  data: T;
  metadata?: Record<string, unknown>;
}

// Event handler type
export type EventHandler<T = unknown> = (event: KealeeEvent<T>) => void | Promise<void>;

/**
 * Kealee Event Bus - Redis Pub/Sub implementation
 */
export class EventBus extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private readonly channel = 'kealee:events';
  private readonly eventLogPrefix = 'kealee:event_log:';
  private source: string;
  private isConnected = false;

  constructor(source: string) {
    super();
    this.source = source;
    this.publisher = new Redis(process.env.REDIS_URL!);
    this.subscriber = new Redis(process.env.REDIS_URL!);
    this.setupSubscriber();
    this.setupErrorHandlers();
  }

  private setupSubscriber() {
    const busLogger = logger.child({ source: this.source });

    this.subscriber.subscribe(this.channel, (err) => {
      if (err) {
        busLogger.error({ err }, 'Subscribe error');
        return;
      }
      this.isConnected = true;
      busLogger.info('Connected to event bus');
    });

    this.subscriber.on('message', async (channel, message) => {
      try {
        const event: KealeeEvent = JSON.parse(message);

        // Emit to type-specific listeners
        this.emit(event.type, event);

        // Emit to wildcard listeners
        this.emit('*', event);

      } catch (error) {
        busLogger.error({ err: error }, 'Event parse error');
      }
    });
  }

  private setupErrorHandlers() {
    const busLogger = logger.child({ source: this.source });
    this.publisher.on('error', (err) => busLogger.error({ err }, 'Publisher error'));
    this.subscriber.on('error', (err) => busLogger.error({ err }, 'Subscriber error'));
  }

  /**
   * Publish an event to the bus
   */
  async publish<T>(
    type: EventType,
    data: T,
    options: { correlationId?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<string> {
    // Auto-populate correlationId from active OTel trace if not explicitly provided
    const correlationId = options.correlationId || getTraceId();

    const event: KealeeEvent<T> = {
      id: uuid(),
      type,
      source: this.source,
      timestamp: new Date().toISOString(),
      correlationId,
      data,
      metadata: options.metadata,
    };

    // Publish to channel
    await this.publisher.publish(this.channel, JSON.stringify(event));

    // Store in event log for auditing (keep last 1000 events per type)
    const logKey = `${this.eventLogPrefix}${type}`;
    await this.publisher.lpush(logKey, JSON.stringify(event));
    await this.publisher.ltrim(logKey, 0, 999);

    // Set TTL on log (30 days)
    await this.publisher.expire(logKey, 30 * 24 * 60 * 60);

    return event.id;
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T>(type: EventType | '*', handler: EventHandler<T>): void {
    this.on(type, handler);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe<T>(type: EventType | '*', handler: EventHandler<T>): void {
    this.off(type, handler);
  }

  /**
   * Get recent events from log
   */
  async getEventLog(type: EventType, limit = 100): Promise<KealeeEvent[]> {
    const logKey = `${this.eventLogPrefix}${type}`;
    const events = await this.publisher.lrange(logKey, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  /**
   * Get events by correlation ID
   */
  async getCorrelatedEvents(correlationId: string): Promise<KealeeEvent[]> {
    const events: KealeeEvent[] = [];

    for (const type of Object.values(EVENT_TYPES)) {
      const logKey = `${this.eventLogPrefix}${type}`;
      const typeEvents = await this.publisher.lrange(logKey, 0, 999);

      for (const eventStr of typeEvents) {
        const event: KealeeEvent = JSON.parse(eventStr);
        if (event.correlationId === correlationId) {
          events.push(event);
        }
      }
    }

    return events.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.subscriber.unsubscribe(this.channel);
    await this.publisher.quit();
    await this.subscriber.quit();
    this.isConnected = false;
    logger.info({ source: this.source }, 'Disconnected from event bus');
  }
}

// Singleton instances per source
const eventBusInstances = new Map<string, EventBus>();

export function getEventBus(source: string = 'unknown'): EventBus {
  if (!eventBusInstances.has(source)) {
    eventBusInstances.set(source, new EventBus(source));
  }
  return eventBusInstances.get(source)!;
}

// Cleanup all event buses
export async function closeAllEventBuses(): Promise<void> {
  for (const [source, bus] of eventBusInstances) {
    await bus.close();
  }
  eventBusInstances.clear();
}
