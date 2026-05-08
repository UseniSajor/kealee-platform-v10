/**
 * AI Lead Qualification
 *
 * Uses Claude API to score SMS replies and determine if a lead should be qualified,
 * nurtured, or rejected for Phase 2 auto-scheduling.
 */

import { ClaudeCachedClient } from '@/lib/anthropic/claude-cached-client'

export interface AiQualificationInput {
  leadName: string
  leadService: string      // 'concept' | 'estimate' | 'permit'
  leadBudget: string       // "$5k-$10k" or similar
  leadTimeline: string     // "ASAP" or similar
  smsReply: string         // User's response to SMS
}

export interface AiQualificationResult {
  confidence: number                           // 0–100
  recommendation: 'qualify' | 'nurture' | 'reject'
  reasoning: string
  followUpMessage?: string
  suggestedAction?: string
}

const systemPrompt = `You are a lead qualification expert for a construction services platform (Kealee).

Your role: Score user SMS replies to determine if they are genuine, qualified leads ready for a call.

Evaluate replies based on:
1. Intent clarity: Do they explicitly want to proceed? (qualify > nurture > reject)
2. Urgency: Do they want to move fast? (ASAP = qualify)
3. Budget alignment: Do they have realistic expectations?
4. Service fit: Does the inquiry match their service type (permit > estimate > concept)?
5. Professional tone: Serious inquiry vs. spam/inquiry from curious person?

Output JSON:
{
  "confidence": 0-100,
  "recommendation": "qualify|nurture|reject",
  "reasoning": "Brief explanation",
  "followUpMessage": "Suggested SMS to send if qualified",
  "suggestedAction": "What sales should do next"
}

Confidence bands:
- 75+: Qualify immediately (hot lead)
- 50-74: Nurture (strong interest but needs more context)
- <50: Reject (not qualified, move to cold list)`

export async function qualifyLead(input: AiQualificationInput): Promise<AiQualificationResult> {
  const client = new ClaudeCachedClient()

  const userPrompt = `Qualify this lead based on their SMS reply:

Lead Details:
- Name: ${input.leadName}
- Service: ${input.leadService}
- Budget: ${input.leadBudget}
- Timeline: ${input.leadTimeline}

Their SMS Reply:
"${input.smsReply}"

Provide JSON response with confidence (0-100), recommendation, reasoning, and suggested follow-up.`

  try {
    const response = await client.message({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON from Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const result = JSON.parse(jsonMatch[0]) as AiQualificationResult
    return result
  } catch (err) {
    console.error('AI qualification error:', err)
    // Fallback to neutral nurture score
    return {
      confidence: 50,
      recommendation: 'nurture',
      reasoning: 'AI qualification failed, defaulting to nurture',
    }
  }
}

/**
 * Format qualification result for display/logging
 */
export function formatQualificationResult(result: AiQualificationResult): string {
  const icon =
    result.recommendation === 'qualify' ? '🟢' :
    result.recommendation === 'nurture' ? '🟡' :
    '🔴'

  return `${icon} ${result.recommendation.toUpperCase()} (${result.confidence}% confident)\n${result.reasoning}`
}
