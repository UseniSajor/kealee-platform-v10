import { buildRAGContext, isRAGLoaded } from '../retrieval/rag-retriever';

interface ContractorInput {
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

export async function executeContractorAgent(input: ContractorInput): Promise<AgentOutput | any> {
  try {
    // FAIL-SAFE: Check if RAG is loaded before proceeding
    if (!isRAGLoaded()) {
      console.error('[CONTRACTOR-AGENT] RAG data not loaded - cannot execute');
      return {
        status: 'RAG_MISSING',
        message: 'RAG dataset not loaded in this environment'
      };
    }

    // Build RAG context from retrieved data
    const ragContext = buildRAGContext({
      jurisdiction: input.jurisdiction,
      projectType: input.projectType,
      stage: 'construction'
    });

    if (!ragContext) {
      return {
        status: 'INSUFFICIENT_DATA',
        message: 'Not enough data available for contractor guidance'
      } as any;
    }

    // Extract cost and workflow insights
    const costs = ragContext.costs || [];
    const zoning = ragContext.zoning || [];

    const costInfo = costs.length > 0 ? costs[0] : null;
    const duration = costInfo?.typical_duration_months || 'unknown';
    const expenses = costInfo?.primary_expense_categories || [];
    const maxCoverage = zoning.length > 0 ? zoning[0]?.max_lot_coverage : 'unknown';

    const summary = `Construction guidance for ${input.projectType || 'project'} in ${input.jurisdiction || 'jurisdiction'}.
    Typical duration: ${duration} months.
    Primary cost categories: ${expenses.slice(0, 3).join(', ')}.
    Zoning compliance: Maximum lot coverage ${maxCoverage}%.`;

    const risks = [
      expenses.length > 0 ? `Monitor these cost categories: ${expenses.slice(0, 2).join(', ')}` : 'Unknown cost breakdown',
      `Timeline: Expect ${duration} month(s) of construction`,
      'Weather delays may impact schedule',
      'Conduct regular quality inspections',
      'Maintain permit compliance throughout construction'
    ].slice(0, 5);

    return {
      summary,
      risks,
      confidence: costs.length > 0 ? 'high' : 'medium',
      next_step: 'Begin construction phase with approved contractor',
      cta: 'Finalize contractor selection and mobilization plan'
    };
  } catch (error) {
    console.error('Contractor agent error:', error);
    return {
      summary: 'Error analyzing construction requirements',
      risks: ['Analysis failed due to system error'],
      confidence: 'low',
      next_step: 'Retry analysis',
      cta: 'Try again or contact support'
    };
  }
}
