
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { PermitTracker } from './tracker';

const tracker = new PermitTracker();

export const permitTrackerWorker = createWorker(
    QUEUE_NAMES.PERMIT_TRACKER,
    async (job: Job) => {
        console.log(`Processing permit-tracker job: ${job.data.type}`);

        switch (job.data.type) {
            case 'CHECK_STATUS':
                return await tracker.checkPermitStatus(job.data.permitId);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
