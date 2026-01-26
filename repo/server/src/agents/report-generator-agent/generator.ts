
import { prisma } from '../../core/db';
import { generateReportNarrative } from '../../core/ai';

export class ReportGenerator {
    async generateReport(config: any): Promise<any> {
        const project = await prisma.project.findUniqueOrThrow({
            where: { id: config.projectId },
            include: { pm: true, milestones: true, changeOrders: true },
        });

        const narrative = await generateReportNarrative({
            projectName: project.name,
            periodStart: new Date(config.periodStart),
            periodEnd: new Date(config.periodEnd),
            progress: { phase: project.phase || 'Construction', percentComplete: project.percentComplete || 0 },
            schedule: { status: project.status, variance: 0 },
            budget: { spent: 0, remaining: Number(project.budget), variance: 0 },
            highlights: ['Work progressing as planned'], // TODO: Generate from milestones
            issues: [],
            nextSteps: [],
        });

        const report = await prisma.report.create({
            data: {
                projectId: config.projectId,
                type: config.type || 'WEEKLY',
                periodStart: new Date(config.periodStart),
                periodEnd: new Date(config.periodEnd),
                content: narrative,
            }
        });

        return {
            reportId: report.id,
            projectId: config.projectId,
            narrative,
            generatedAt: report.generatedAt
        };
    }
}
