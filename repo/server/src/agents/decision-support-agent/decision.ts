
import { generateText, generateJSON } from '../../core/ai';
import { prisma } from '../../core/db';

export class DecisionSupport {
    async getRecommendation(context: any): Promise<any> {
        // Fetch real project context if needed
        const project = await prisma.project.findUnique({
            where: { id: context.projectId },
            include: { changeOrders: true }
        });

        const prompt = `Given the project context: ${JSON.stringify(context)}, provide a recommendation on how to proceed. 
        Current project status: ${project?.status || 'Unknown'}.
        Respond with JSON: { recommendation, confidence, reasoning[], risks[], nextSteps[] }`;

        const analysis = await generateJSON(prompt, "You are a senior construction project manager advisor.");

        return { ...analysis as any, context };
    }

    async chat(projectId: string, message: string): Promise<string> {
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        const prompt = `Project: ${project?.name} (Budget: ${project?.budget}).
        User Question: ${message}
        
        Answer as a helpful project manager assistant.`;

        return generateText(prompt);
    }
}
