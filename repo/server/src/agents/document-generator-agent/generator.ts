
import { prisma } from '../../core/db';
import { generateText } from '../../core/ai';
import { format } from 'date-fns';

export class DocumentGenerator {
    async generateDocument(request: any): Promise<any> {
        const project = await prisma.project.findUnique({
            where: { id: request.projectId }
        }) || { name: 'Demo Project', clientName: 'Valued Client' }; // Fallback for robustness during transiton

        const content = await this.renderTemplate(request.type, {
            projectName: project.name,
            clientName: project.clientName || 'Valued Client',
            date: format(new Date(), 'MMMM d, yyyy'),
            ...request.variables,
        });

        const document = await prisma.document.create({
            data: {
                projectId: request.projectId,
                name: `${request.type} - ${project.name}`,
                type: request.type,
                format: 'MARKDOWN',
                content: content,
                status: 'DRAFT'
            }
        });

        return { documentId: document.id, content };
    }

    private async renderTemplate(type: string, variables: Record<string, any>): Promise<string> {
        const prompt = `Generate a professional ${type} document for a construction project.
Project: ${variables.projectName}
Client: ${variables.clientName}
Date: ${variables.date}

Create a complete, professional document.`;

        return generateText(prompt, 'You are a construction professional creating formal documents.');
    }
}
