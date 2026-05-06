
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { DecisionSupport } from './decision';

const support = new DecisionSupport();

export const decisionSupportWorker = createWorker(
    QUEUE_NAMES.DECISION_SUPPORT,
    async (job: Job) => {
        switch (job.data.type) {
            case 'GET_RECOMMENDATION':
                return await support.getRecommendation(job.data.context);
            case 'CHAT':
                return { response: await support.chat(job.data.projectId, job.data.message) };
            default:
                return null;
        }
    },
    3
);
