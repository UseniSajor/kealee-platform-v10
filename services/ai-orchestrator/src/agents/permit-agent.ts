import { buildRAGContext, isRAGLoaded } from '../retrieval/rag-retriever';

interface PermitInput {
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

export async function executePermitAgent(input: PermitInput): Promise<AgentOutput | any> {
  try {
    // FAIL-SAFE: Check if RAG is loaded before proceeding
    if (!isRAGLoaded()) {
      console.error('[PERMIT-AGENT] RAG data not loaded - cannot execute');
      return {
        status: 'RAG_MISSING',
        message: 'RAG dataset not loaded in this environment'
      };
    }

    // Build RAG context from retrieved data
    const ragContext = buildRAGContext({
      jurisdiction: input.jurisdiction,
      projectType: input.projectType,
      stage: 'permitting'
    });

    if (!ragContext) {
      return {
        status: 'INSUFFICIENT_DATA',
        message: 'Not enough jurisdiction data available'
      } as any;
    }

    // Extract permit and workflow insights
    const permits = ragContext.permits || [];
    const workflows = ragContext.workflows || [];

    const permitInfo = permits.length > 0 ? permits[0] : null;
    const processingDays = permitInfo?.processing_days || 45;
    const requirements = permitInfo?.requirements || [];
    const commonIssues = permitInfo?.common_issues || [];

    const summary = `Permit application guidance for ${input.projectType || 'project'} in ${input.jurisdiction || 'jurisdiction'}.
    Expected processing time: ${processingDays} days.
    Key requirements: ${requirements.slice(0, 2).join(', ')}.
    Common issues to avoid: ${commonIssues.slice(0, 2).join(', ')}.`;

    const risks = [
      ...commonIssues.map(issue => `Avoid: ${issue}`),
      permitInfo?.fee_base ? `Estimated permit fee: $${permitInfo.fee_base}` : 'Fee amount unknown',
      'Plan review may require multiple resubmissions',
      'Missing seals or signatures can delay approval'
    ].slice(0, 5);

    return {
      summary,
      risks,
      confidence: permits.length > 0 ? 'high' : 'medium',
      next_step: 'Submit complete permit application to jurisdiction',
      cta: 'Submit all required documents with professional seals'
    };
  } catch (error) {
    console.error('Permit agent error:', error);
    return {
      summary: 'Error analyzing permit requirements',
      risks: ['Analysis failed due to system error'],
      confidence: 'low',
      next_step: 'Retry analysis',
      cta: 'Try again or contact support'
    };
  }
}
