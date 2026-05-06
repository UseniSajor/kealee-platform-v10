
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';

export class InspectionCoordinator {
    async scheduleInspection(request: any): Promise<string> {
        const inspection = await prisma.inspection.create({
            data: {
                permitId: request.permitId,
                projectId: request.projectId,
                type: request.type || 'FINAL',
                status: 'SCHEDULED',
                scheduledAt: new Date(request.date || Date.now() + 86400000), // Default to tomorrow if not provided
            }
        });

        await getEventBus().publish(
            EVENT_TYPES.INSPECTION_SCHEDULED,
            { inspectionId: inspection.id, permitId: request.permitId, projectId: request.projectId },
            'inspection-coordinator'
        );

        return inspection.id;
    }

    async generatePrepChecklist(type: string): Promise<string[]> {
        const checklists: Record<string, string[]> = {
            FOUNDATION: ['Forms properly braced', 'Rebar placement per plans', 'Anchor bolt locations verified'],
            FRAMING: ['All framing complete per plans', 'Fire blocking in place', 'Headers per schedule'],
            FINAL: ['All finishes complete', 'Fixtures operational', 'Safety devices tested'],
        };
        return checklists[type] || checklists['FINAL'];
    }
}
