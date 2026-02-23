import type { PrismaClient } from '@prisma/client';
import type { ToolDefinition, ToolResult } from '../types';

export const definition: ToolDefinition = {
  name: 'analyze_bid',
  description:
    'Trigger AI analysis of a specific bid opportunity. Returns go/no-go recommendation, win probability, strengths, and risks. Use when the user asks to analyze a bid or wants a recommendation on whether to bid.',
  input_schema: {
    type: 'object',
    properties: {
      bidId: {
        type: 'string',
        description: 'The bid ID to analyze',
      },
    },
    required: ['bidId'],
  },
};

export async function execute(
  prisma: PrismaClient,
  _userId: string,
  input: Record<string, unknown>,
): Promise<ToolResult> {
  const p = prisma as any;
  const bidId = input.bidId as string;

  // First check if bid exists and has existing analysis
  const bid = await p.bidOpportunity.findUnique({
    where: { id: bidId },
    select: {
      id: true,
      projectName: true,
      aiAnalysis: true,
      aiAnalyzedAt: true,
      overallScore: true,
      status: true,
    },
  });

  if (!bid) {
    return { content: `Bid ${bidId} not found.` };
  }

  // Try to trigger AI analysis via the API
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(
      `${apiBaseUrl}/bids/${bidId}/analyze`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' } },
    );

    if (response.ok) {
      const result = await response.json();
      const analysis = result.analysis;

      const lines: string[] = [
        `**AI Analysis: ${bid.projectName}**`,
        '',
        `**Recommendation: ${analysis.goNoGo}**`,
        `Win Probability: ${analysis.winProbability}%`,
        `Scope Match: ${analysis.scopeMatchScore}/100`,
        `Assessment: ${analysis.competitiveAssessment}`,
        '',
        `**Reasoning:** ${analysis.reasoning}`,
      ];

      if (analysis.strengths?.length > 0) {
        lines.push('', '**Strengths:**');
        for (const s of analysis.strengths) {
          lines.push(`- ${s}`);
        }
      }

      if (analysis.risks?.length > 0) {
        lines.push('', '**Risks:**');
        for (const r of analysis.risks) {
          lines.push(`- ${r}`);
        }
      }

      if (analysis.keyFactors?.length > 0) {
        lines.push('', '**Key Factors:**');
        for (const f of analysis.keyFactors) {
          lines.push(`- ${f}`);
        }
      }

      return {
        content: lines.join('\n'),
        sources: [{ type: 'bid', id: bidId, label: bid.projectName }],
      };
    }
  } catch (err: any) {
    console.error('Failed to call analyze API:', err.message);
  }

  // Fallback: show existing analysis if available
  if (bid.aiAnalysis) {
    const analysis = bid.aiAnalysis as any;
    const lines: string[] = [
      `**Existing Analysis: ${bid.projectName}** (from ${bid.aiAnalyzedAt ? new Date(bid.aiAnalyzedAt).toLocaleDateString() : 'earlier'})`,
      '',
      `**Recommendation: ${analysis.goNoGo || 'N/A'}**`,
      `Win Probability: ${analysis.winProbability || 'N/A'}%`,
      `Assessment: ${analysis.competitiveAssessment || 'N/A'}`,
    ];

    if (analysis.strengths?.length > 0) {
      lines.push('', '**Strengths:**');
      for (const s of analysis.strengths) lines.push(`- ${s}`);
    }

    if (analysis.risks?.length > 0) {
      lines.push('', '**Risks:**');
      for (const r of analysis.risks) lines.push(`- ${r}`);
    }

    return {
      content: lines.join('\n'),
      sources: [{ type: 'bid', id: bidId, label: bid.projectName }],
    };
  }

  return {
    content: `**${bid.projectName}** — No AI analysis available yet. The analysis API may be unavailable.${bid.overallScore ? ` Rule-based score: ${bid.overallScore}/100.` : ''}`,
    sources: [{ type: 'bid', id: bidId, label: bid.projectName }],
  };
}
