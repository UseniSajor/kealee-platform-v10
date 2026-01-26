
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { ReportGenerator } from './generator';

const generator = new ReportGenerator();

export const reportGeneratorWorker = createWorker(
    QUEUE_NAMES.REPORT_GENERATOR,
    async (job: Job) => {
        console.log(`Processing report-generator job: ${job.data.type}`);

        switch (job.data.type) {
            case 'GENERATE_REPORT':
                return await generator.generateReport(job.data.config);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
