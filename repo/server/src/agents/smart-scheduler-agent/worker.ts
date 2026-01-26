
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { SmartScheduler } from './scheduler';

const scheduler = new SmartScheduler();

export const smartSchedulerWorker = createWorker(
    QUEUE_NAMES.SMART_SCHEDULER,
    async (job: Job) => {
        switch (job.data.type) {
            case 'OPTIMIZE_SCHEDULE':
                return await scheduler.optimizeSchedule(job.data.request);
            default:
                return null;
        }
    },
    2
);
