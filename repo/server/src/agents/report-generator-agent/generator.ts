
import { prisma } from '../../core/db';
import { generateReportNarrative } from '../../core/ai';

export class ReportGenerator {
    async generateReport(config: any): Promise<any> {
        // Mock project fetch if DB empty
        const project = await prisma.project.findUnique({
            where: { id: config.projectId },
            include: { client: true, assignedPm: true, milestones: true },
        }) || {
            name: 'Demo Project',
            phase: 'Construction',
            percentComplete: 45,
            budget: 500000
        };

        const narrative = await generateReportNarrative({
            projectName: project.name,
            periodStart: new Date(config.periodStart),
            periodEnd: new Date(config.periodEnd),
            progress: { phase: project.phase || 'Construction', percentComplete: project.percentComplete || 0 },
            schedule: { status: 'on-track', variance: 0 },
            budget: { spent: 0, remaining: Number(project.budget), variance: 0 },
            highlights: ['Work progressing as planned'],
            issues: [],
            nextSteps: ['Continue scheduled activities'],
        });

        // In real app, save to DB
        // const report = await prisma.report.create(...)

        return {
            reportId: `rpt-${Date.now()}`,
            projectId: config.projectId,
            narrative,
            generatedAt: new Date()
        };
    }
}
