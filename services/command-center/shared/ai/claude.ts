/**
 * KEALEE COMMAND CENTER - CLAUDE AI UTILITIES
 * AI-powered text generation and analysis using Anthropic Claude
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model configurations
export const MODELS = {
  FAST: 'claude-haiku-4-5-20251001',
  BALANCED: 'claude-sonnet-4-20250514',
  POWERFUL: 'claude-sonnet-4-20250514',
} as const;

export type ModelType = keyof typeof MODELS;

interface GenerateOptions {
  model?: ModelType;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate text using Claude
 */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const {
    model = 'BALANCED',
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const response = await claude.messages.create({
    model: MODELS[model],
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return (textBlock as Anthropic.TextBlock)?.text || '';
}

/**
 * Generate structured JSON using Claude
 */
export async function generateJSON<T>(
  prompt: string,
  options: GenerateOptions = {}
): Promise<T> {
  const response = await generateText(
    `${prompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown code blocks, no explanations, just the raw JSON object or array.`,
    { ...options, temperature: 0.3 }
  );

  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Analyze content and return structured assessment
 */
export async function analyzeContent<T extends Record<string, unknown>>(
  content: string,
  analysisPrompt: string,
  expectedFields: (keyof T)[]
): Promise<T> {
  const prompt = `Analyze the following content and provide a structured assessment.

CONTENT TO ANALYZE:
${content}

ANALYSIS REQUIREMENTS:
${analysisPrompt}

Respond with a JSON object containing these fields: ${expectedFields.join(', ')}`;

  return generateJSON<T>(prompt, { model: 'BALANCED' });
}

/**
 * Generate a professional report narrative
 */
export async function generateReportNarrative(data: {
  projectName: string;
  periodStart: Date;
  periodEnd: Date;
  reportType: 'daily' | 'weekly' | 'monthly' | 'final';
  progress: { phase: string; percentComplete: number };
  schedule: { status: string; varianceDays: number };
  budget: { spent: number; remaining: number; variancePercent: number };
  highlights: string[];
  issues: string[];
  nextSteps: string[];
}): Promise<string> {
  const prompt = `Generate a professional construction project status report narrative.

PROJECT: ${data.projectName}
REPORT TYPE: ${data.reportType.toUpperCase()}
PERIOD: ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}

PROGRESS:
- Phase: ${data.progress.phase}
- Completion: ${data.progress.percentComplete}%

SCHEDULE:
- Status: ${data.schedule.status}
- Variance: ${data.schedule.varianceDays > 0 ? '+' : ''}${data.schedule.varianceDays} days

BUDGET:
- Spent: $${data.budget.spent.toLocaleString()}
- Remaining: $${data.budget.remaining.toLocaleString()}
- Variance: ${data.budget.variancePercent > 0 ? '+' : ''}${data.budget.variancePercent}%

HIGHLIGHTS:
${data.highlights.map(h => `- ${h}`).join('\n') || '- None reported'}

ISSUES:
${data.issues.map(i => `- ${i}`).join('\n') || '- None reported'}

NEXT STEPS:
${data.nextSteps.map(n => `- ${n}`).join('\n') || '- To be determined'}

Write a clear, professional narrative summary (3-4 paragraphs) suitable for client communication.
Be factual and concise. Highlight key achievements and address any concerns directly.`;

  return generateText(prompt, {
    model: 'BALANCED',
    systemPrompt: 'You are a professional construction project manager writing status reports for clients. Be clear, professional, and factual.',
  });
}

/**
 * Analyze construction photo for quality issues
 */
export async function analyzeConstructionPhoto(
  imageBase64: string,
  context: {
    projectPhase: string;
    expectedWork: string;
    inspectionType?: string;
  }
): Promise<{
  description: string;
  qualityScore: number;
  issues: Array<{ type: string; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }>;
  recommendations: string[];
  passesInspection: boolean;
}> {
  const response = await claude.messages.create({
    model: MODELS.BALANCED,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Analyze this construction site photo for quality assurance.

CONTEXT:
- Project Phase: ${context.projectPhase}
- Expected Work: ${context.expectedWork}
${context.inspectionType ? `- Inspection Type: ${context.inspectionType}` : ''}

Provide analysis in JSON format with these fields:
- description: Brief description of what's shown
- qualityScore: Score from 0-100
- issues: Array of {type, severity, description} for any problems found
- recommendations: Array of suggested improvements
- passesInspection: Boolean indicating if work meets standards

Common issues to look for:
- Safety hazards (missing railings, exposed wiring, etc.)
- Code violations
- Poor workmanship
- Missing fire blocking
- Water intrusion signs
- Structural concerns
- Incomplete work

Respond with JSON only.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  const text = (textBlock as Anthropic.TextBlock)?.text || '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  return JSON.parse(jsonMatch?.[0] || '{}');
}

/**
 * Generate risk prediction for a project
 */
export async function predictProjectRisks(data: {
  projectName: string;
  currentPhase: string;
  percentComplete: number;
  daysRemaining: number;
  budgetUtilization: number;
  recentIssues: string[];
  weatherForecast?: string;
  upcomingMilestones: string[];
  historicalData?: {
    averageDelayDays: number;
    commonIssues: string[];
  };
}): Promise<{
  overallRiskScore: number;
  delayProbability: number;
  costOverrunProbability: number;
  qualityRiskScore: number;
  risks: Array<{
    category: string;
    description: string;
    probability: number;
    impact: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
  recommendations: string[];
}> {
  const prompt = `Analyze the following construction project data and predict potential risks.

PROJECT: ${data.projectName}
PHASE: ${data.currentPhase}
PROGRESS: ${data.percentComplete}% complete
DAYS REMAINING: ${data.daysRemaining}
BUDGET UTILIZATION: ${data.budgetUtilization}%

RECENT ISSUES:
${data.recentIssues.map(i => `- ${i}`).join('\n') || '- None reported'}

${data.weatherForecast ? `WEATHER FORECAST:\n${data.weatherForecast}\n` : ''}

UPCOMING MILESTONES:
${data.upcomingMilestones.map(m => `- ${m}`).join('\n')}

${data.historicalData ? `
HISTORICAL DATA:
- Average Delay: ${data.historicalData.averageDelayDays} days
- Common Issues: ${data.historicalData.commonIssues.join(', ')}
` : ''}

Provide a comprehensive risk assessment in JSON format with:
- overallRiskScore: 0-100
- delayProbability: 0-1
- costOverrunProbability: 0-1
- qualityRiskScore: 0-100
- risks: Array of identified risks with category, description, probability (0-1), impact, and mitigation
- recommendations: Top 3-5 actionable recommendations

Be realistic and base predictions on construction industry norms.`;

  return generateJSON(prompt, {
    model: 'BALANCED',
    systemPrompt: 'You are an expert construction risk analyst. Provide accurate, data-driven risk assessments.',
  });
}

/**
 * Generate bid comparison narrative
 */
export async function generateBidComparisonNarrative(
  projectName: string,
  analyses: Array<{
    rank: number;
    contractorName: string;
    amount: number;
    overallScore: number;
    recommendation: string;
    strengths: string[];
    concerns: string[];
  }>
): Promise<string> {
  const prompt = `Generate a brief executive summary (2-3 paragraphs) comparing these contractor bids for "${projectName}":

${analyses.map(a => `
#${a.rank} ${a.contractorName}
- Amount: $${a.amount.toLocaleString()}
- Overall Score: ${a.overallScore.toFixed(1)}/100
- Recommendation: ${a.recommendation}
- Strengths: ${a.strengths.join(', ') || 'None noted'}
- Concerns: ${a.concerns.join(', ') || 'None noted'}
`).join('\n')}

Provide an objective analysis highlighting:
1. Key differences between top bidders
2. Value considerations beyond just price
3. Clear rationale for the top recommendation
4. Any red flags or considerations for the decision maker`;

  return generateText(prompt, {
    model: 'BALANCED',
    systemPrompt: 'You are a construction consultant providing objective bid analysis. Be factual and balanced.',
  });
}

/**
 * Generate change order impact analysis
 */
export async function analyzeChangeOrderImpact(data: {
  projectName: string;
  changeOrderNumber: number;
  description: string;
  requestedBy: string;
  estimatedCost: number;
  currentBudget: number;
  currentSpend: number;
  scheduleDaysAffected: number;
  currentScheduleVariance: number;
  projectPhase: string;
}): Promise<{
  costImpact: {
    amount: number;
    percentOfBudget: number;
    newBudgetTotal: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  scheduleImpact: {
    additionalDays: number;
    newVariance: number;
    criticalPathAffected: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendation: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'NEEDS_REVIEW' | 'REJECT';
  conditions: string[];
  narrative: string;
}> {
  const prompt = `Analyze this construction change order request:

PROJECT: ${data.projectName}
CHANGE ORDER: #${data.changeOrderNumber}
DESCRIPTION: ${data.description}
REQUESTED BY: ${data.requestedBy}

COST ANALYSIS:
- Estimated Cost: $${data.estimatedCost.toLocaleString()}
- Current Budget: $${data.currentBudget.toLocaleString()}
- Current Spend: $${data.currentSpend.toLocaleString()}
- Remaining Budget: $${(data.currentBudget - data.currentSpend).toLocaleString()}

SCHEDULE ANALYSIS:
- Days Affected: ${data.scheduleDaysAffected}
- Current Schedule Variance: ${data.currentScheduleVariance > 0 ? '+' : ''}${data.currentScheduleVariance} days
- Project Phase: ${data.projectPhase}

Provide a detailed impact analysis in JSON format including:
- costImpact: {amount, percentOfBudget, newBudgetTotal, riskLevel}
- scheduleImpact: {additionalDays, newVariance, criticalPathAffected, riskLevel}
- recommendation: APPROVE, APPROVE_WITH_CONDITIONS, NEEDS_REVIEW, or REJECT
- conditions: Array of conditions if recommending conditional approval
- narrative: 2-3 paragraph professional assessment

Be thorough but practical in your analysis.`;

  return generateJSON(prompt, {
    model: 'BALANCED',
    systemPrompt: 'You are a construction project controller analyzing change order impacts. Be thorough and objective.',
  });
}
