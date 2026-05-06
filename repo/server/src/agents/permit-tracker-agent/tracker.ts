
import { prisma } from '../../core/db';

export class PermitTracker {
    async checkPermitStatus(permitId: string): Promise<any> {
        const permit = await prisma.permit.findUnique({
            where: { id: permitId },
        });

        if (!permit) {
            // For demo purposes, we might fallback or throw. Let's return a "Not Found" structure or throw.
            // But for now, let's assume we want to gracefully handle it if we are still filling DB.
            // Actually, the instruction is to "un-mock", so let's check real DB.
            return { status: 'NOT_FOUND', permitId };
        }

        return {
            permitId: permit.id,
            applicationNo: permit.applicationNo,
            type: permit.type,
            status: permit.status,
            submittedAt: permit.submittedAt,
            nextAction: this.determineNextAction(permit.status),
        };
    }

    private determineNextAction(status: string): string {
        const actions: Record<string, string> = {
            'PREPARING': 'Complete application documents',
            'SUBMITTED': 'Await initial review',
            'IN_REVIEW': 'Monitor for comments',
            'REVISIONS_REQUIRED': 'Address review comments and resubmit',
            'APPROVED': 'Pay fees and obtain permit',
        };
        return actions[status] || 'Contact jurisdiction';
    }
}
