
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { BudgetTracker } from './tracker';

const tracker = new BudgetTracker();

export const budgetTrackerWorker = createWorker(
    QUEUE_NAMES.BUDGET_TRACKER,
    async (job: Job) => {
        console.log(`Processing budget-tracker job: ${job.data.type}`);

        switch (job.data.type) {
            case 'GET_SUMMARY':
                return await tracker.getBudgetSummary(job.data.projectId);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
