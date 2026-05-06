
import { prisma } from '../../core/db';
import { getEventBus, EVENT_TYPES } from '../../core/events';
import { generateText } from '../../core/ai';
import { formatCurrency } from '../../core/utils';

export class BidRequestBuilder {
    async createBidRequest(params: {
        projectId: string;
        trades: string[];
        scope: {
            description: string;
            lineItems: Array<{ item: string; quantity?: number; unit?: string }>;
            inclusions: string[];
            exclusions: string[];
        };
        requirements: {
            insuranceMinimum: number;
            bondRequired: boolean;
            prevailingWage?: boolean;
            certifications?: string[];
        };
        deadline: Date;
        responseDeadline: Date;
    }): Promise<string> {
        const project = await prisma.project.findUniqueOrThrow({
            where: { id: params.projectId },
        });

        const bidRequest = await prisma.bidRequest.create({
            data: {
                projectId: params.projectId,
                trade: params.trades,
                scope: params.scope as any,
                requirements: params.requirements as any,
                deadline: params.responseDeadline,
                status: 'OPEN',
            },
        });

        await getEventBus().publish(
            EVENT_TYPES.BID_REQUEST_CREATED,
            {
                bidRequestId: bidRequest.id,
                projectId: params.projectId,
                projectName: project.name,
                trades: params.trades,
                deadline: params.responseDeadline,
            },
            'bid-engine'
        );

        return bidRequest.id;
    }

    async generateScopeDocument(bidRequestId: string): Promise<string> {
        const bidRequest = await prisma.bidRequest.findUniqueOrThrow({
            where: { id: bidRequestId },
            include: { project: true },
        });

        const scope = bidRequest.scope as any;
        const requirements = bidRequest.requirements as any;

        const prompt = `Generate a professional bid scope document for a construction project.

PROJECT: ${bidRequest.project.name}
ADDRESS: ${bidRequest.project.address}
CLIENT: ${bidRequest.project.clientName}

SCOPE OF WORK:
${scope.description}

LINE ITEMS:
${scope.lineItems.map((li: any) => `- ${li.item}${li.quantity ? ` (${li.quantity} ${li.unit || 'units'})` : ''}`).join('\n')}

INCLUSIONS:
${scope.inclusions.map((i: string) => `- ${i}`).join('\n')}

EXCLUSIONS:
${scope.exclusions.map((e: string) => `- ${e}`).join('\n')}

REQUIREMENTS:
- Minimum Insurance: ${formatCurrency(requirements.insuranceMinimum)}
- Bond Required: ${requirements.bondRequired ? 'Yes' : 'No'}
${requirements.prevailingWage ? '- Prevailing Wage Project' : ''}
${requirements.certifications?.length ? `- Required Certifications: ${requirements.certifications.join(', ')}` : ''}

BID DEADLINE: ${bidRequest.deadline.toLocaleDateString()}

Generate a professional, detailed scope document that contractors can use to prepare accurate bids.`;

        return generateText(prompt, 'You are a construction project manager creating detailed bid documents.');
    }
}
