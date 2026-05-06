
import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';

const createRedisConnection = () => new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

export const connection = createRedisConnection();

export const QUEUE_NAMES = {
    BID_ENGINE: 'bid-engine',
    VISIT_SCHEDULER: 'visit-scheduler',
    CHANGE_ORDER: 'change-order',
    REPORT_GENERATOR: 'report-generator',
    PERMIT_TRACKER: 'permit-tracker',
    INSPECTION: 'inspection-coordinator',
    BUDGET_TRACKER: 'budget-tracker',
    COMMUNICATION: 'communication-hub',
    TASK_QUEUE: 'task-queue',
    DOCUMENT_GENERATOR: 'document-generator',
    PREDICTIVE: 'predictive-engine',
    SMART_SCHEDULER: 'smart-scheduler',
    QA_INSPECTOR: 'qa-inspector',
    DECISION_SUPPORT: 'decision-support',
} as const;

export const queues = Object.fromEntries(
    Object.entries(QUEUE_NAMES).map(([key, name]) => [
        key,
        new Queue(name, { connection: createRedisConnection() })
    ])
) as Record<keyof typeof QUEUE_NAMES, Queue>;

export const queueEvents = Object.fromEntries(
    Object.entries(QUEUE_NAMES).map(([key, name]) => [
        key,
        new QueueEvents(name, { connection: createRedisConnection() })
    ])
) as Record<keyof typeof QUEUE_NAMES, QueueEvents>;


export function createWorker<T = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<any>,
    concurrency = 5
): Worker {
    return new Worker(queueName, processor, {
        connection: createRedisConnection(),
        concurrency,
        limiter: { max: 100, duration: 60000 },
    });
}

export const JOB_OPTIONS = {
    DEFAULT: {
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 1000 },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
    },
    HIGH_PRIORITY: {
        priority: 1,
        attempts: 5,
        backoff: { type: 'exponential' as const, delay: 500 },
    },
    SCHEDULED: {
        attempts: 3,
        backoff: { type: 'fixed' as const, delay: 5000 },
    },
};
