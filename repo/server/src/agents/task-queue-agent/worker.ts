
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { TaskManager } from './manager';

const manager = new TaskManager();

export const taskQueueWorker = createWorker(
    QUEUE_NAMES.TASK_QUEUE,
    async (job: Job) => {
        console.log(`Processing task-queue job: ${job.data.type}`);

        switch (job.data.type) {
            case 'CREATE_TASK':
                return await manager.createTask(job.data.definition);

            case 'COMPLETE_TASK':
                return await manager.completeTask(job.data.taskId, job.data.result);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
