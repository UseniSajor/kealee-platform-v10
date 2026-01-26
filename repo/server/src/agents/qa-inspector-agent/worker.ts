
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { QAInspector } from './inspector';

const inspector = new QAInspector();

export const qaInspectorWorker = createWorker(
    QUEUE_NAMES.QA_INSPECTOR,
    async (job: Job) => {
        switch (job.data.type) {
            case 'ANALYZE_PHOTO':
                return await inspector.analyzePhoto(job.data.request);
            default:
                return null;
        }
    },
    2
);
