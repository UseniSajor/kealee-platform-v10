
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';

export class TaskManager {
    async createTask(definition: any): Promise<string> {
        const task = await prisma.automationTask.create({
            data: {
                projectId: definition.projectId || 'demo-project', // Fallback or assume provided
                type: definition.type,
                status: 'PENDING',
                priority: definition.priority || 3,
                payload: definition.payload || {},
            }
        });

        await getEventBus().publish(EVENT_TYPES.TASK_CREATED, { taskId: task.id }, 'task-queue');

        return task.id;
    }

    async completeTask(taskId: string, result?: any): Promise<void> {
        await prisma.automationTask.update({
            where: { id: taskId },
            data: {
                status: 'COMPLETED',
                result: result || {},
                completedAt: new Date(),
            }
        });
        await getEventBus().publish(EVENT_TYPES.TASK_COMPLETED, { taskId, result }, 'task-queue');
    }
}
