
import { Job } from 'bullmq';
import { createWorker, queues, QUEUE_NAMES } from '../../core/queue';
import { SmartVisitScheduler } from './scheduler';

const scheduler = new SmartVisitScheduler();

export const visitSchedulerWorker = createWorker(
    QUEUE_NAMES.VISIT_SCHEDULER,
    async (job: Job) => {
        console.log(`Processing visit-scheduler job: ${job.data.type}`);

        switch (job.data.type) {
            case 'SCHEDULE_VISIT':
                return await scheduler.scheduleVisit(job.data.request);

            default:
                // For now just log unknown types
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
