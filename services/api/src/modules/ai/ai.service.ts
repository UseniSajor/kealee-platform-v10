/**
 * AI Service
 * Handles AI-powered document review and analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
});

interface PermitReviewResult {
  score: number; // 0-100
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
  }>;
  suggestions: string[];
}

/**
 * Review permit application with AI
 */
export async function reviewPermitWithAI(permit: any): Promise<PermitReviewResult> {
  try {
    // If no API key, return simulated review for development
    if (!config.anthropicApiKey) {
      console.warn('⚠️  No Anthropic API key found. Using simulated AI review.');
      return simulateAIReview(permit);
    }

    // Prepare document summary for AI
    const documentSummary = permit.documents?.map((doc: any) => ({
      type: doc.type,
      name: doc.fileName,
      uploaded: doc.uploadedAt,
    })) || [];

    const prompt = `You are an expert construction permit reviewer. Review the following permit application and provide a structured assessment.

Permit Application Details:
- Address: ${permit.projectData?.address || 'N/A'}
- Jurisdiction: ${permit.jurisdiction?.name || permit.jurisdictionId}
- Permit Types: ${permit.permitTypes?.join(', ') || 'N/A'}
- Valuation: ${permit.projectData?.valuation || 'N/A'}

Documents Submitted:
${documentSummary.map((doc: any) => `- ${doc.type}: ${doc.name}`).join('\n')}

Please provide:
1. A compliance score (0-100) based on completeness and accuracy
2. A list of issues found (errors, warnings, info)
3. Suggestions for improvement

Return your response as JSON with this structure:
{
  "score": 85,
  "issues": [
    {"severity": "error", "message": "Missing required document: Site Plan", "field": "documents"},
    {"severity": "warning", "message": "Valuation seems low for project scope", "field": "valuation"}
  ],
  "suggestions": [
    "Include detailed site plan with property lines",
    "Verify valuation matches actual project cost"
  ]
}`;

    // Use latest Claude Sonnet 4.5 for best performance
    // Fallback to Sonnet 4 if 4.5 not available
    // Note: claude-3-5-sonnet-20241022 is deprecated (retired Oct 2025)
    const model = config.anthropicModel || 'claude-sonnet-4-20250514';
    
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const content = message.content[0];
    if (content.type === 'text') {
      try {
        // Extract JSON from response
        const jsonMatch = (content.text ?? '').match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return {
            score: result.score || 75,
            issues: result.issues || [],
            suggestions: result.suggestions || [],
          };
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }

    // Fallback to simulated review
    return simulateAIReview(permit);
  } catch (error: any) {
    console.error('AI review error:', error);
    // Fallback to simulated review on error
    return simulateAIReview(permit);
  }
}

/**
 * Simulate AI review for development/testing
 */
function simulateAIReview(permit: any): PermitReviewResult {
  const documentCount = permit.documents?.length || 0;
  const requiredDocs = ['Site Plan', 'Floor Plan', 'Structural Drawings'];
  const hasRequiredDocs = documentCount >= 3;

  const score = hasRequiredDocs ? 85 : 60;

  const issues: PermitReviewResult['issues'] = [];
  
  if (documentCount < 2) {
    issues.push({
      severity: 'error',
      message: 'Insufficient documents. At least 2 documents required.',
      field: 'documents',
    });
  }

  if (!permit.projectData?.valuation || permit.projectData.valuation < 10000) {
    issues.push({
      severity: 'warning',
      message: 'Project valuation seems low. Verify accuracy.',
      field: 'valuation',
    });
  }

  const suggestions = [
    'Ensure all required documents are uploaded',
    'Double-check project valuation matches actual costs',
    'Verify jurisdiction-specific requirements',
  ];

  return {
    score,
    issues,
    suggestions,
  };
}

/**
 * Generate report summary with AI
 */
export async function generateReportSummary(data: any): Promise<string> {
  try {
    // If no API key, return basic summary
    if (!config.anthropicApiKey) {
      console.warn('⚠️  No Anthropic API key found. Using basic report summary.');
      return generateBasicSummary(data);
    }

    const prompt = `Generate a professional executive summary for this PM report:

Tasks Completed: ${data.tasksCompleted || 0}
Hours Logged: ${data.hoursLogged || 0}
Clients Served: ${data.clientsServed || 0}
Period: ${data.period || 'N/A'}

Write a 2-3 paragraph executive summary highlighting:
1. Key achievements and metrics
2. Notable accomplishments
3. Areas of focus for the next period

Make it professional, concise, and suitable for executive review.`;

    // Use latest Claude Sonnet 4.5 for best performance
    const model = config.anthropicModel || 'claude-sonnet-4-20250514';
    
    const message = await anthropic.messages.create({
      model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text ?? '';
    }

    return generateBasicSummary(data);
  } catch (error: any) {
    console.error('Report generation error:', error);
    return generateBasicSummary(data);
  }
}

/**
 * Generate basic summary without AI
 */
function generateBasicSummary(data: any): string {
  return `This report covers the period ${data.period || 'N/A'}.

Key Metrics:
- Tasks Completed: ${data.tasksCompleted || 0}
- Hours Logged: ${data.hoursLogged || 0}
- Clients Served: ${data.clientsServed || 0}

The team has made significant progress during this period. Focus areas for the next period include maintaining high service quality and expanding client relationships.`;
}

