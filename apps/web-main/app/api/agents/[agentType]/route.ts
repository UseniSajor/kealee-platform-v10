/**
 * apps/web-main/app/api/agents/[agentType]/route.ts
 *
 * Proxy to backend RAG agent endpoints:
 *   POST /api/agents/land      → /api/v1/agents/land/execute
 *   POST /api/agents/design    → /api/v1/agents/design/execute
 *   POST /api/agents/permit    → /api/v1/agents/permit/execute
 *   POST /api/agents/contractor → /api/v1/agents/contractor/execute
 *
 * Falls back to OpenAI first, then Claude, when INTERNAL_API_URL is not set.
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@kealee/core-rules'

export const dynamic = 'force-dynamic'

const VALID_AGENTS = new Set(['land', 'design', 'permit', 'contractor'])
const API = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

const AGENT_PROMPTS: Record<string, (body: Record<string, unknown>) => string> = {
  design: (body) => `You are a senior construction design consultant specializing in residential and commercial design projects in the DC/MD/VA area.

Analyze this project and provide an expert insight:
- Project type: ${body.projectType ?? 'design project'}
- Context: ${body.context ?? 'intake funnel'}
${body.description ? `- Description: ${body.description}` : ''}
${body.location ? `- Location: ${body.location}` : ''}
${body.squareFootage ? `- Square footage: ${body.squareFootage}` : ''}

Respond ONLY with valid JSON in this exact shape:
{
  "success": true,
  "summary": "2-3 sentence overview of this type of project and what to expect",
  "confidence": 0.85,
  "risks": ["Risk 1 specific to this project type", "Risk 2", "Risk 3"],
  "recommendation": "1 sentence specific recommendation",
  "nextStep": "Clear action for the homeowner to take next"
}`,

  permit: (body) => `You are a construction permit specialist with deep knowledge of DMV-area (DC, Maryland, Virginia) permit requirements.

Analyze this permit project:
- Project type: ${body.projectType ?? 'permit project'}
- Context: ${body.context ?? 'intake funnel'}
${body.location ? `- Location: ${body.location}` : ''}

Respond ONLY with valid JSON in this exact shape:
{
  "success": true,
  "summary": "2-3 sentence overview of permit complexity and process for this project type",
  "confidence": 0.82,
  "risks": ["Permit risk 1 (e.g. zoning, HOA, setbacks)", "Timeline risk", "Documentation requirement"],
  "recommendation": "Key permit strategy recommendation",
  "nextStep": "Immediate action to start the permit process"
}`,

  land: (body) => `You are a land development consultant specializing in residential and commercial development in the DC/MD/VA metropolitan area.

Analyze this development project:
- Project type: ${body.projectType ?? 'development project'}
- Context: ${body.context ?? 'intake funnel'}
${body.location ? `- Location: ${body.location}` : ''}
${body.description ? `- Description: ${body.description}` : ''}

Respond ONLY with valid JSON in this exact shape:
{
  "success": true,
  "summary": "2-3 sentence overview of development viability and key considerations for this project type",
  "confidence": 0.80,
  "risks": ["Entitlement risk", "Market/timing risk", "Capital/financing risk"],
  "recommendation": "Top development strategy recommendation",
  "nextStep": "First step to validate development feasibility"
}`,

  contractor: (body) => `You are a contractor matching specialist who helps homeowners find qualified contractors in the DC/MD/VA area.

Analyze this contractor matching request:
- Project type: ${body.projectType ?? 'home improvement project'}
- Context: ${body.context ?? 'intake funnel'}
${body.description ? `- Description: ${body.description}` : ''}

Respond ONLY with valid JSON in this exact shape:
{
  "success": true,
  "summary": "2-3 sentence overview of what to look for in a contractor for this specific project type",
  "confidence": 0.88,
  "risks": ["Contractor vetting risk (license/insurance)", "Scope creep risk", "Timeline risk"],
  "recommendation": "Key advice for selecting the right contractor",
  "nextStep": "How to prepare for contractor conversations"
}`,
}

function staticFallback() {
  return {
    success: true,
    summary: 'Our team has reviewed projects like yours and is ready to help. Fill in your details to get started.',
    confidence: 0.75,
    risks: ['Permit requirements vary by jurisdiction', 'Material costs fluctuate with market conditions', 'Timeline depends on contractor availability'],
    recommendation: 'Provide your project details so we can give you a precise analysis.',
    nextStep: 'Complete the intake form to receive your personalized project plan.',
  }
}

function parseAgentJson(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in agent response')
  return JSON.parse(jsonMatch[0])
}

async function callOpenAIPrimary(agentType: string, body: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  const client = new OpenAI({ apiKey })
  const prompt = (AGENT_PROMPTS[agentType] ?? AGENT_PROMPTS.design)(body)
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL ?? 'gpt-5.6-sol',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })
  return parseAgentJson(completion.choices[0]?.message?.content ?? '')
}

async function callClaudeFallback(agentType: string, body: Record<string, unknown>) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return staticFallback()

  const client = new Anthropic({ apiKey })
  const promptFn = AGENT_PROMPTS[agentType] ?? AGENT_PROMPTS.design
  const prompt = promptFn(body)

  const message = await client.messages.create({
    model: AI_MODELS.conceptText,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  return parseAgentJson(raw)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentType: string }> }
) {
  const { agentType } = await params

  if (!VALID_AGENTS.has(agentType)) {
    return NextResponse.json({ error: `Unknown agent type: ${agentType}` }, { status: 400 })
  }

  const rawBody = await req.text()
  if (!rawBody.trim()) {
    return NextResponse.json({ error: 'A JSON request body is required.' }, { status: 400 })
  }
  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(rawBody)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('body must be an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'The request body must be a valid JSON object.' }, { status: 400 })
  }

  // Try backend proxy first
  if (API) {
    try {
      const upstream = await fetch(`${API}/api/v1/agents/${agentType}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      })
      const data = await upstream.json()
      return NextResponse.json(data, { status: upstream.status })
    } catch (err: any) {
      console.error(`[agents/${agentType}] backend proxy failed, using provider fallback:`, err?.message)
    }
  }

  // Provider-neutral fallback: OpenAI is primary; Claude is retained as backup.
  try {
    const result = await callOpenAIPrimary(agentType, body)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error(`[agents/${agentType}] OpenAI primary unavailable; trying Claude backup:`, err?.message)
    try {
      return NextResponse.json(await callClaudeFallback(agentType, body))
    } catch (fallbackError: any) {
      console.error(`[agents/${agentType}] Claude backup error:`, fallbackError?.message)
      return NextResponse.json({ error: 'Project insight is temporarily unavailable.' }, { status: 503 })
    }
  }
}
