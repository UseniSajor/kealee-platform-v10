
import Anthropic from '@anthropic-ai/sdk';

export const claude = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateText(
    prompt: string,
    systemPrompt?: string,
    maxTokens = 4096
): Promise<string> {
    const response = await claude.messages.create({
        model: 'claude-sonnet-3.5-20240620', // Use latest model
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find(block => block.type === 'text');
    return (textBlock as any)?.text || '';
}

export async function analyzeImage(
    imageUrl: string,
    prompt: string
): Promise<any> {
    const response = await claude.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: imageUrl, // Expecting base64 string without prefix
                        },
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ],
            },
        ],
    });
    const textBlock = response.content.find(block => block.type === 'text');
    const text = (textBlock as any)?.text || '';
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'No JSON found', raw: text };
    } catch (e) {
        return { error: 'Parse Error', raw: text };
    }
}

export async function generateJSON<T>(
    prompt: string,
    systemPrompt?: string
): Promise<T> {
    const response = await generateText(
        prompt + '\n\nRespond with valid JSON only, no markdown or explanation.',
        systemPrompt
    );
    const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
}

export async function generateReportNarrative(data: {
    projectName: string;
    periodStart: Date;
    periodEnd: Date;
    progress: { phase: string; percentComplete: number };
    schedule: { status: string; variance: number };
    budget: { spent: number; remaining: number; variance: number };
    highlights: string[];
    issues: string[];
    nextSteps: string[];
}): Promise<string> {
    const prompt = `Generate a professional construction project status report narrative.

PROJECT: ${data.projectName}
PERIOD: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}

PROGRESS:
- Phase: ${data.progress.phase}
- Completion: ${data.progress.percentComplete}%

SCHEDULE:
- Status: ${data.schedule.status}
- Variance: ${data.schedule.variance} days

BUDGET:
- Spent: $${data.budget.spent.toLocaleString()}
- Remaining: $${data.budget.remaining.toLocaleString()}
- Variance: ${data.budget.variance > 0 ? '+' : ''}${data.budget.variance}%

HIGHLIGHTS:
${data.highlights.map(h => `- ${h}`).join('\n')}

ISSUES:
${data.issues.map(i => `- ${i}`).join('\n')}

NEXT STEPS:
${data.nextSteps.map(n => `- ${n}`).join('\n')}

Write a clear, professional narrative summary (3-4 paragraphs) suitable for client communication.`;

    return generateText(prompt, 'You are a professional construction project manager writing status reports.');
}
