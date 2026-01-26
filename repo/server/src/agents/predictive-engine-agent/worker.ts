
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { DelayPredictor } from './predictor';

const predictor = new DelayPredictor();

export const predictiveEngineWorker = createWorker(
    QUEUE_NAMES.PREDICTIVE,
    async (job: Job) => {
        switch (job.data.type) {
            case 'PREDICT_DELAY':
                return await predictor.predictDelay(job.data.projectId);
            default:
                return null;
        }
    },
    2
);
