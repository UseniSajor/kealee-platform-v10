
import { prisma } from '../../core/db';
import { generateText } from '../../core/ai';
import { format } from 'date-fns';

export class DocumentGenerator {
    async generateDocument(request: any): Promise<any> {
        // Mock AI generation
        const content = await this.renderTemplate(request.type, {
            projectName: 'Demo Project', // would fetch from DB
            clientName: 'Acme Corp',
            date: format(new Date(), 'MMMM d, yyyy'),
            ...request.variables,
        });

        const documentId = `doc-${Date.now()}`;

        return { documentId, content };
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
