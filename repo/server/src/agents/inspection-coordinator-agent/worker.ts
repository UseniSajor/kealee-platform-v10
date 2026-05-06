
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { InspectionCoordinator } from './coordinator';

const coordinator = new InspectionCoordinator();

export const inspectionCoordinatorWorker = createWorker(
    QUEUE_NAMES.INSPECTION, // Ensure this matches QUEUE_NAMES definition in queue.ts
    async (job: Job) => {
        console.log(`Processing inspection-coordinator job: ${job.data.type}`);

        switch (job.data.type) {
            case 'SCHEDULE_INSPECTION':
                return await coordinator.scheduleInspection(job.data.request);

            case 'GET_CHECKLIST':
                return await coordinator.generatePrepChecklist(job.data.inspectionType);

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
