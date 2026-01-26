
import { prisma } from '../../core/db';

export class QAInspector {
    async analyzePhoto(request: any): Promise<any> {
        const { projectId, photoUrl, base64Image } = request;

        // Use base64Image if provided (since real vision API needs it), otherwise assume photoUrl is accessible or handle appropriately.
        // For this implementation we'll assume base64Image is passed or extracted.
        // If only URL, we'd need to fetch it.

        let analysis;
        if (base64Image) {
            // Import dynamically to avoid circular dependecy issues if any, but regular import is fine
            const { analyzeImage } = await import('../../core/ai');
            analysis = await analyzeImage(base64Image,
                "Analyze this construction site photo. Identify safety hazards, quality issues, and progress. Return JSON with keys: issues (array of objects with type, severity, description), safetyObservations (string array), labels (string array).");
        } else {
            // Fallback or mock if no image data
            analysis = {
                issues: [],
                safetyObservations: ['No image data provided for analysis'],
                labels: []
            };
        }

        const record = await prisma.photoAnalysis.create({
            data: {
                projectId,
                photoUrl: photoUrl || 'base64-upload',
                type: 'QA',
                analysis: analysis,
            }
        });

        return {
            ...record,
            analyzedAt: record.createdAt
        };
    }
}
