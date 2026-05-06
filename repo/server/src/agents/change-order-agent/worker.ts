
import { Job } from 'bullmq';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../core/queue';
import { prisma } from '../../core/db';
import { ImpactAnalyzer } from './analyzer';

const impactAnalyzer = new ImpactAnalyzer();

export const changeOrderWorker = createWorker(
    QUEUE_NAMES.CHANGE_ORDER,
    async (job: Job) => {
        console.log(`Processing change-order job: ${job.data.type}`);

        switch (job.data.type) {
            case 'CREATE_CHANGE_ORDER': {
                const { request } = job.data;
                const co = await prisma.changeOrder.create({
                    data: {
                        projectId: request.projectId,
                        amount: request.amount,
                        description: request.description,
                        reason: request.reason,
                        scheduleImpact: request.scheduleImpact,
                        status: 'DRAFT',
                        number: 'CO-' + Date.now().toString().slice(-4), // Simple numbering
                    },
                });

                // Auto-trigger analysis
                await queues.CHANGE_ORDER.add('analyze', {
                    type: 'ANALYZE_IMPACT',
                    changeOrderId: co.id,
                }, JOB_OPTIONS.DEFAULT);

                return { changeOrderId: co.id, status: 'created' };
            }

            case 'ANALYZE_IMPACT': {
                const { changeOrderId } = job.data;
                const analysis = await impactAnalyzer.analyzeChangeOrder(changeOrderId);

                await prisma.changeOrder.update({
                    where: { id: changeOrderId },
                    data: {
                        impactAnalysis: analysis as any,
                    },
                });

                return analysis;
            }

            case 'INITIATE_APPROVAL': {
                const { changeOrderId } = job.data;
                await prisma.changeOrder.update({
                    where: { id: changeOrderId },
                    data: { status: 'PENDING_APPROVAL' },
                });
                return { status: 'submitted' };
            }

            default:
                console.warn(`Unknown job type: ${job.data.type}`);
                return null;
        }
    },
    3
);
