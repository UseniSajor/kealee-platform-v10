import { buildRAGContext, isRAGLoaded } from '../retrieval/rag-retriever';

interface DesignInput {
  jurisdiction?: string;
  projectType?: string;
  stage?: string;
}

interface AgentOutput {
  summary: string;
  risks: string[];
  confidence: string;
  next_step: string;
  cta: string;
}

export async function executeDesignAgent(input: DesignInput): Promise<AgentOutput | any> {
  try {
    // FAIL-SAFE: Check if RAG is loaded before proceeding
    if (!isRAGLoaded()) {
      console.error('[DESIGN-AGENT] RAG data not loaded - cannot execute');
      return {
        status: 'RAG_MISSING',
        message: 'RAG dataset not loaded in this environment'
      };
    }

    // Build RAG context from retrieved data
    const ragContext = buildRAGContext({
      jurisdiction: input.jurisdiction,
      projectType: input.projectType || 'adu',
      stage: 'design'
    });

    if (!ragContext) {
      return {
        status: 'INSUFFICIENT_DATA',
        message: 'Not enough data available for design guidance'
      } as any;
    }

    // Extract cost and workflow insights
    const costs = ragContext.costs || [];
    const workflows = ragContext.workflows || [];

    const costInfo = costs.length > 0 ? costs[0] : null;
    const costPerSqft = costInfo?.cost_per_sqft || 'unknown';
    const avgSize = costInfo?.avg_size_sqft || 'unknown';

    const summary = `Design phase guidance for ${input.projectType || 'project'} in ${input.jurisdiction || 'jurisdiction'}.
    Estimated cost: $${costPerSqft}/sqft. Average project size: ${avgSize} sqft.
    Design duration: ${workflows.length > 0 ? workflows[0]?.estimated_days + ' days' : 'unknown'}.
    Focus on code compliance and constructability.`;

    const risks = [
      costInfo?.soft_costs_percent ? `Soft costs ~${costInfo.soft_costs_percent}%` : 'Unknown soft cost allocation',
      costInfo?.contingency_percent ? `Plan contingency of ${costInfo.contingency_percent}%` : 'No contingency data',
      'Coordinate with MEP engineers early',
      'Verify accessibility requirements'
    ].filter(Boolean);

    return {
      summary,
      risks,
      confidence: costs.length > 0 ? 'high' : 'medium',
      next_step: 'Finalize construction documents and prepare for permit submission',
      cta: 'Complete architectural and engineering plans'
    };
  } catch (error) {
    console.error('Design agent error:', error);
    return {
      summary: 'Error analyzing design requirements',
      risks: ['Analysis failed due to system error'],
      confidence: 'low',
      next_step: 'Retry analysis',
      cta: 'Try again or contact support'
    };
  }
}
