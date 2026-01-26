
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { DocumentGenerator } from './generator';

const generator = new DocumentGenerator();

export const documentGeneratorWorker = createWorker(
    QUEUE_NAMES.DOCUMENT_GENERATOR,
    async (job: Job) => {
        console.log(`Processing document-generator job: ${job.data.type}`);

        switch (job.data.type) {
            case 'GENERATE':
                return await generator.generateDocument(job.data.request);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
