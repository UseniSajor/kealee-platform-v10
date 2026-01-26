
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { CommunicationRouter } from './router';

const router = new CommunicationRouter();

export const communicationHubWorker = createWorker(
    QUEUE_NAMES.COMMUNICATION,
    async (job: Job) => {
        console.log(`Processing communication-hub job: ${job.data.type}`);

        switch (job.data.type) {
            case 'SEND_MESSAGE':
                return await router.send(job.data.request);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
