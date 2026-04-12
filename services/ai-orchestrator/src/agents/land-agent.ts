import { buildRAGContext } from '../retrieval/rag-retriever';

interface LandInput {
  jurisdiction?: string;
  projectType?: string;
  address?: string;
  stage?: string;
}

interface AgentOutput {
  summary: string;
  risks: string[];
  confidence: string;
  next_step: string;
  cta: string;
}

export async function executeLandAgent(input: LandInput): Promise<AgentOutput> {
  try {
    // Build RAG context from retrieved data
    const ragContext = buildRAGContext({
      jurisdiction: input.jurisdiction,
      projectType: input.projectType,
      stage: 'land-analysis'
    });

    if (!ragContext) {
      return {
        status: 'INSUFFICIENT_DATA',
        message: 'Not enough jurisdiction data available'
      } as any;
    }

    // Extract insights from RAG data
    const workflows = ragContext.workflows || [];
    const zoning = ragContext.zoning || [];

    const summary = `Land analysis for ${input.address || 'property'} in ${input.jurisdiction || 'unknown jurisdiction'}.
    Found ${zoning.length} zoning records and ${workflows.length} workflow guidelines.
    Key finding: Property must comply with local zoning regulations and undergo environmental assessment.`;

    const risks = [
      zoning.length === 0 ? 'No zoning data found for this jurisdiction' : '',
      workflows.length === 0 ? 'No workflow guidelines available' : '',
      'Pending survey completion',
      'Environmental assessment required'
    ].filter(Boolean);

    return {
      summary,
      risks,
      confidence: ragContext.workflows.length > 0 ? 'high' : 'medium',
      next_step: 'Proceed to design phase after survey and environmental clearance',
      cta: 'Upload site survey and order environmental assessment'
    };
  } catch (error) {
    console.error('Land agent error:', error);
    return {
      summary: 'Error analyzing land',
      risks: ['Analysis failed due to system error'],
      confidence: 'low',
      next_step: 'Retry analysis',
      cta: 'Try again or contact support'
    };
  }
}
