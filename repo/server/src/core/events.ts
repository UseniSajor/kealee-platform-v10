
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface KealeeEvent<T = any> {
    type: string;
    data: T;
    timestamp: string;
    source: string;
    correlationId?: string;
}

export const EVENT_TYPES = {
    // Project events
    PROJECT_CREATED: 'project.created',
    PROJECT_PHASE_CHANGED: 'project.phase.changed',
    PROJECT_MILESTONE_DUE: 'project.milestone.due',
    PROJECT_COMPLETED: 'project.completed',

    // Bid events
    BID_REQUEST_CREATED: 'bid.request.created',
    BID_INVITATION_SENT: 'bid.invitation.sent',
    BID_SUBMITTED: 'bid.submitted',
    BID_DEADLINE_APPROACHING: 'bid.deadline.approaching',
    BID_ANALYSIS_COMPLETE: 'bid.analysis.complete',

    // Visit events
    VISIT_SCHEDULED: 'visit.scheduled',
    VISIT_REMINDER: 'visit.reminder',
    VISIT_COMPLETED: 'visit.completed',
    VISIT_REPORT_GENERATED: 'visit.report.generated',

    // Permit events
    PERMIT_STATUS_CHANGED: 'permit.status.changed',
    PERMIT_COMMENTS_RECEIVED: 'permit.comments.received',
    PERMIT_APPROVED: 'permit.approved',
    PERMIT_EXPIRING: 'permit.expiring',

    // Inspection events
    INSPECTION_SCHEDULED: 'inspection.scheduled',
    INSPECTION_COMPLETED: 'inspection.completed',
    INSPECTION_FAILED: 'inspection.failed',

    // Change order events
    CHANGE_ORDER_CREATED: 'change_order.created',
    CHANGE_ORDER_APPROVED: 'change_order.approved',
    CHANGE_ORDER_REJECTED: 'change_order.rejected',

    // Budget events
    BUDGET_THRESHOLD_EXCEEDED: 'budget.threshold.exceeded',
    BUDGET_VARIANCE_DETECTED: 'budget.variance.detected',

    // Report events
    REPORT_DUE: 'report.due',
    REPORT_GENERATED: 'report.generated',
    REPORT_SENT: 'report.sent',

    // AI events
    PREDICTION_GENERATED: 'prediction.generated',
    RISK_ALERT: 'risk.alert',
    QA_ISSUE_DETECTED: 'qa.issue.detected',

    // Task events
    TASK_CREATED: 'task.created',
    TASK_ASSIGNED: 'task.assigned',
    TASK_COMPLETED: 'task.completed',
    TASK_OVERDUE: 'task.overdue',
} as const;

export class EventBus extends EventEmitter {
    private publisher: Redis;
    private subscriber: Redis;
    private readonly channel = 'kealee:events';

    constructor() {
        super();
        this.publisher = new Redis(process.env.REDIS_URL!);
        this.subscriber = new Redis(process.env.REDIS_URL!);
        this.setupSubscriber();
    }

    private setupSubscriber() {
        this.subscriber.subscribe(this.channel);
        this.subscriber.on('message', (channel, message) => {
            try {
                const event: KealeeEvent = JSON.parse(message);
                this.emit(event.type, event);
                this.emit('*', event);
            } catch (error) {
                console.error('Failed to parse event:', error);
            }
        });
    }

    async publish<T>(type: string, data: T, source: string, correlationId?: string): Promise<void> {
        const event: KealeeEvent<T> = {
            type,
            data,
            timestamp: new Date().toISOString(),
            source,
            correlationId,
        };
        await this.publisher.publish(this.channel, JSON.stringify(event));
    }

    subscribe(eventType: string, handler: (event: KealeeEvent) => void): void {
        this.on(eventType, handler);
    }
}

let eventBus: EventBus | null = null;
export const getEventBus = (): EventBus => {
    if (!eventBus) eventBus = new EventBus();
    return eventBus;
};
