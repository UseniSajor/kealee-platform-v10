/**
 * Bid Analysis Service
 * AI-powered bid analysis and strategy generation using Claude
 */

import Anthropic from '@anthropic-ai/sdk'
import { config } from '../../config'
import { prismaAny } from '../../utils/prisma-helper'
import { bidService } from './bid.service'

const anthropic = new Anthropic({
  apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || '',
})

// ── Types ──────────────────────────────────────────────────────────────────

export interface BidAnalysisResult {
  scopeMatchScore: number
  winProbability: number
  competitiveAssessment: string
  goNoGo: 'GO' | 'NO_GO' | 'CONDITIONAL'
  reasoning: string
  strengths: string[]
  risks: string[]
  keyFactors: string[]
}

export interface BidStrategyResult {
  summary: string
  strengthsToHighlight: string[]
  risksAndMitigations: string[]
  pricingApproach: string
  mbeDbePlan: string
  differentiators: string[]
  submissionChecklist: string[]
}

// ── Company Profile (for AI context) ───────────────────────────────────────

const COMPANY_CONTEXT = `
Kealee Construction LLC is a Maryland-based MBE/DBE certified construction firm.
Core capabilities: HVAC Installation & Service, Mechanical Contracting, Plumbing, General Construction, Tenant Fit-Out, Government Contracting.
Certifications: MBE Certified, DBE Certified.
Primary market: Maryland, DC, Virginia.
Sweet spot: $100K - $5M projects.
Strengths: MBE/DBE certifications give competitive advantage on government and set-aside projects. Strong HVAC/Mechanical expertise. Maryland-based with local knowledge.
`

// ── AI Analysis ────────────────────────────────────────────────────────────

export async function analyzeBid(bidId: string): Promise<{ bid: any; analysis: BidAnalysisResult }> {
  const bid = await prismaAny.bidOpportunity.findUnique({
    where: { id: bidId },
    include: {
      documents: true,
      checklist: { orderBy: { step: 'asc' } },
    },
  })
  if (!bid) throw new Error('Bid not found')

  // Run rule-based evaluation first
  const evaluation = await bidService.evaluateBid(bidId)
  const scores = evaluation.scores

  // If no API key, fall back to rule-based analysis
  if (!config.anthropicApiKey) {
    console.warn('No Anthropic API key found. Using rule-based bid analysis.')
    const analysis = mapRuleBasedToAnalysis(bid, scores)
    await persistAnalysis(bidId, analysis)
    return { bid, analysis }
  }

  try {
    const prompt = buildAnalysisPrompt(bid, scores)
    const model = config.anthropicModel || 'claude-sonnet-4-20250514'

    const message = await anthropic.messages.create({
      model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const analysis: BidAnalysisResult = {
          scopeMatchScore: Number(parsed.scopeMatchScore) || scores.scopeScore,
          winProbability: Number(parsed.winProbability) || scores.overallScore,
          competitiveAssessment: String(parsed.competitiveAssessment || ''),
          goNoGo: ['GO', 'NO_GO', 'CONDITIONAL'].includes(parsed.goNoGo) ? parsed.goNoGo : 'CONDITIONAL',
          reasoning: String(parsed.reasoning || ''),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
          keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors.map(String) : [],
        }
        await persistAnalysis(bidId, analysis)
        return { bid, analysis }
      }
    }

    // Parse failed — fall back
    const analysis = mapRuleBasedToAnalysis(bid, scores)
    await persistAnalysis(bidId, analysis)
    return { bid, analysis }
  } catch (error: any) {
    console.error('AI bid analysis error:', error)
    const analysis = mapRuleBasedToAnalysis(bid, scores)
    await persistAnalysis(bidId, analysis)
    return { bid, analysis }
  }
}

// ── AI Strategy Generation ─────────────────────────────────────────────────

export async function generateBidStrategy(bidId: string): Promise<{ bid: any; strategy: BidStrategyResult }> {
  const bid = await prismaAny.bidOpportunity.findUnique({
    where: { id: bidId },
    include: { documents: true },
  })
  if (!bid) throw new Error('Bid not found')

  // If no API key, fall back to template strategy
  if (!config.anthropicApiKey) {
    console.warn('No Anthropic API key found. Using template bid strategy.')
    const strategy = buildTemplateStrategy(bid)
    await persistStrategy(bidId, strategy)
    return { bid, strategy }
  }

  try {
    const prompt = buildStrategyPrompt(bid)
    const model = config.anthropicModel || 'claude-sonnet-4-20250514'

    const message = await anthropic.messages.create({
      model,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const strategy: BidStrategyResult = {
          summary: String(parsed.summary || ''),
          strengthsToHighlight: Array.isArray(parsed.strengthsToHighlight) ? parsed.strengthsToHighlight.map(String) : [],
          risksAndMitigations: Array.isArray(parsed.risksAndMitigations) ? parsed.risksAndMitigations.map(String) : [],
          pricingApproach: String(parsed.pricingApproach || ''),
          mbeDbePlan: String(parsed.mbeDbePlan || ''),
          differentiators: Array.isArray(parsed.differentiators) ? parsed.differentiators.map(String) : [],
          submissionChecklist: Array.isArray(parsed.submissionChecklist) ? parsed.submissionChecklist.map(String) : [],
        }
        await persistStrategy(bidId, strategy)
        return { bid, strategy }
      }
    }

    const strategy = buildTemplateStrategy(bid)
    await persistStrategy(bidId, strategy)
    return { bid, strategy }
  } catch (error: any) {
    console.error('AI bid strategy error:', error)
    const strategy = buildTemplateStrategy(bid)
    await persistStrategy(bidId, strategy)
    return { bid, strategy }
  }
}

// ── Prompt Builders ────────────────────────────────────────────────────────

function buildAnalysisPrompt(bid: any, scores: any): string {
  return `You are a bid analysis expert for a construction company. Analyze this bid opportunity and provide a structured assessment.

${COMPANY_CONTEXT}

Bid Opportunity:
- Project: ${bid.projectName}
- Scope: ${bid.scope || 'Not specified'}
- Location: ${bid.location || 'N/A'}, ${bid.state || 'N/A'}
- Estimated Value: ${bid.estimatedValue ? `$${Number(bid.estimatedValue).toLocaleString()}` : 'Not specified'}
- Due Date: ${bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : 'N/A'}
- Owner: ${bid.ownerName || 'N/A'}
- GC: ${bid.gcName || 'N/A'}
- Government: ${bid.isGovernment ? 'Yes' : 'No'}
- MBE Required: ${bid.requiresMBE ? `Yes (${bid.mbeGoalPercent || 'N/A'}%)` : 'No'}
- DBE Required: ${bid.requiresDBE ? `Yes (${bid.dbeGoalPercent || 'N/A'}%)` : 'No'}
- Bond Required: ${bid.bondRequired ? 'Yes' : 'No'}
- Prevailing Wage: ${bid.prevailingWage ? 'Yes' : 'No'}
- Description: ${bid.description || 'None provided'}

Rule-Based Scores (0-100):
- Scope Match: ${scores.scopeScore}
- Location: ${scores.locationScore}
- MBE Advantage: ${scores.mbeScore}
- Value Fit: ${scores.valueScore}
- Overall: ${scores.overallScore}

Provide your analysis as JSON with this exact structure:
{
  "scopeMatchScore": 85,
  "winProbability": 70,
  "competitiveAssessment": "Strong position due to MBE certification...",
  "goNoGo": "GO",
  "reasoning": "This project aligns well with Kealee's capabilities...",
  "strengths": ["MBE certification matches requirement", "..."],
  "risks": ["Tight timeline", "..."],
  "keyFactors": ["MBE/DBE certification advantage", "..."]
}`
}

function buildStrategyPrompt(bid: any): string {
  return `You are a bid strategy consultant for a construction company. Create a winning strategy for this bid.

${COMPANY_CONTEXT}

Bid Opportunity:
- Project: ${bid.projectName}
- Scope: ${bid.scope || 'Not specified'}
- Location: ${bid.location || 'N/A'}, ${bid.state || 'N/A'}
- Estimated Value: ${bid.estimatedValue ? `$${Number(bid.estimatedValue).toLocaleString()}` : 'Not specified'}
- Due Date: ${bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : 'N/A'}
- Owner: ${bid.ownerName || 'N/A'}
- GC: ${bid.gcName || 'N/A'}
- Government: ${bid.isGovernment ? 'Yes' : 'No'}
- MBE Required: ${bid.requiresMBE ? 'Yes' : 'No'}
- DBE Required: ${bid.requiresDBE ? 'Yes' : 'No'}
- Description: ${bid.description || 'None provided'}
${bid.aiAnalysis ? `\nExisting AI Analysis: ${JSON.stringify(bid.aiAnalysis)}` : ''}

Provide your strategy as JSON with this exact structure:
{
  "summary": "Executive summary of recommended bid strategy...",
  "strengthsToHighlight": ["MBE/DBE certification", "..."],
  "risksAndMitigations": ["Risk: tight timeline — Mitigation: assign dedicated PM", "..."],
  "pricingApproach": "Competitive pricing strategy...",
  "mbeDbePlan": "Plan for meeting MBE/DBE requirements...",
  "differentiators": ["Local Maryland presence", "..."],
  "submissionChecklist": ["Prepare bid bond", "..."]
}`
}

// ── Fallback Helpers ───────────────────────────────────────────────────────

function mapRuleBasedToAnalysis(bid: any, scores: any): BidAnalysisResult {
  const overall = scores.overallScore || 50
  let goNoGo: 'GO' | 'NO_GO' | 'CONDITIONAL' = 'CONDITIONAL'
  if (overall >= 80) goNoGo = 'GO'
  else if (overall < 50) goNoGo = 'NO_GO'

  const strengths: string[] = []
  const risks: string[] = []

  if (scores.scopeScore >= 80) strengths.push('Scope aligns with Kealee core capabilities')
  if (scores.mbeScore >= 80) strengths.push('MBE/DBE certification provides competitive advantage')
  if (scores.locationScore >= 80) strengths.push('Located in primary market area')
  if (scores.valueScore >= 80) strengths.push('Project value within sweet spot range')

  if (scores.scopeScore < 60) risks.push('Scope may be outside core capabilities')
  if (scores.locationScore < 60) risks.push('Location outside primary market')
  if (scores.valueScore < 50) risks.push('Project value outside ideal range')
  if (bid.bondRequired) risks.push('Bid bond required')

  return {
    scopeMatchScore: scores.scopeScore,
    winProbability: overall,
    competitiveAssessment: overall >= 80 ? 'Strong competitive position' : overall >= 60 ? 'Moderate competitive position' : 'Weak competitive position',
    goNoGo,
    reasoning: `Rule-based analysis: Overall score ${overall}/100. ${goNoGo === 'GO' ? 'Recommended to bid.' : goNoGo === 'NO_GO' ? 'Not recommended.' : 'Review further before deciding.'}`,
    strengths,
    risks,
    keyFactors: [
      `Scope match: ${scores.scopeScore}/100`,
      `Location fit: ${scores.locationScore}/100`,
      `MBE advantage: ${scores.mbeScore}/100`,
      `Value fit: ${scores.valueScore}/100`,
    ],
  }
}

function buildTemplateStrategy(bid: any): BidStrategyResult {
  const strengths: string[] = ['MBE/DBE certified firm', 'Local Maryland presence']
  const differentiators: string[] = ['Minority Business Enterprise certification', 'Strong HVAC/Mechanical expertise']

  if (bid.requiresMBE || bid.requiresDBE) {
    strengths.push('Direct MBE/DBE participation as prime or sub')
    differentiators.push('Can fulfill MBE/DBE participation requirements directly')
  }
  if (bid.scope) strengths.push(`Experience in ${bid.scope} scope`)

  return {
    summary: `Strategy for ${bid.projectName}: Leverage Kealee's MBE/DBE certifications and ${bid.scope || 'construction'} expertise to present a competitive bid.`,
    strengthsToHighlight: strengths,
    risksAndMitigations: [
      'Risk: competitive pricing — Mitigation: optimize labor and material costs',
      'Risk: timeline constraints — Mitigation: assign experienced project team',
    ],
    pricingApproach: 'Competitive pricing with focus on value-added services and quality workmanship.',
    mbeDbePlan: bid.requiresMBE || bid.requiresDBE
      ? 'Kealee can self-perform as MBE/DBE prime contractor, meeting participation goals directly.'
      : 'Highlight MBE/DBE certification as added value even when not required.',
    differentiators,
    submissionChecklist: [
      'Complete bid form with all required signatures',
      'Attach bid bond if required',
      'Include MBE/DBE certification documentation',
      'Prepare company qualifications and references',
      'Review and respond to all addenda',
      'Submit before deadline',
    ],
  }
}

// ── Persistence ────────────────────────────────────────────────────────────

async function persistAnalysis(bidId: string, analysis: BidAnalysisResult) {
  await prismaAny.bidOpportunity.update({
    where: { id: bidId },
    data: {
      aiAnalysis: analysis as any,
      aiAnalyzedAt: new Date(),
      confidence: analysis.winProbability,
    },
  })

  await bidService.logActivity(bidId, 'AI_ANALYZED', 'system', {
    goNoGo: analysis.goNoGo,
    winProbability: analysis.winProbability,
    scopeMatchScore: analysis.scopeMatchScore,
  })
}

async function persistStrategy(bidId: string, strategy: BidStrategyResult) {
  await prismaAny.bidOpportunity.update({
    where: { id: bidId },
    data: { aiStrategy: strategy as any },
  })

  await bidService.logActivity(bidId, 'STRATEGY_GENERATED', 'system', {
    summary: strategy.summary.substring(0, 200),
  })
}
