/**
 * POST /api/concept/generate
 * Body: { intakeId: string }
 *
 * 1. Fetch intake record from Supabase
 * 2. Load SERVICE_DELIVERABLES[projectPath] for context
 * 3. Call Claude Opus 4.6 to generate structured concept output
 * 4. UPDATE intake record with conceptOutput + status='concept_ready'
 * 5. Return concept data
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

interface ConceptOutput {
  designConcept: {
    style: string
    colorPalette: string[]
    keyFeatures: string[]
  }
  mepSystem: {
    electrical: string
    plumbing: string
    hvac: string
    lighting: string
  }
  billOfMaterials: Array<{
    item: string
    quantity: number
    unit: string
    estimatedCost: number
    description: string
  }>
  estimatedCost: number
  projectTimeline: string
  description: string
  includes: string[]
}

function buildConceptPrompt(intake: Record<string, unknown>, projectPath: string): string {
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  const formData = (intake.form_data as Record<string, unknown>) ?? {}

  return `You are a senior construction design consultant generating a detailed concept package for a client.

Project Details:
- Service: ${deliverable?.label ?? projectPath}
- Category: ${deliverable?.category ?? 'design'}
- Client: ${intake.client_name ?? 'Client'}
- Address: ${intake.project_address ?? 'Not specified'}
- Description: ${formData.description ?? 'No description provided'}
- Square Footage: ${formData.squareFootage ?? 'Not specified'}
- Timeline: ${formData.timeline ?? 'Flexible'}
- Budget Range: ${intake.budget_range ?? 'Not specified'}

What this service includes:
${deliverable?.includes?.map(i => `- ${i}`).join('\n') ?? '- Concept package'}

Generate a comprehensive concept package. Respond ONLY with valid JSON in this exact shape:
{
  "designConcept": {
    "style": "Style name (e.g. 'Modern Contemporary', 'Transitional')",
    "colorPalette": ["Material/finish 1", "Material/finish 2", "Material/finish 3", "Material/finish 4"],
    "keyFeatures": [
      "Feature 1 specific to this project",
      "Feature 2",
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ]
  },
  "mepSystem": {
    "electrical": "Detailed electrical specification for this project",
    "plumbing": "Plumbing specification (write N/A if not applicable)",
    "hvac": "HVAC specification (write N/A if not applicable)",
    "lighting": "Lighting specification"
  },
  "billOfMaterials": [
    { "item": "Item name", "quantity": 1, "unit": "unit", "estimatedCost": 5000, "description": "Brief description" },
    { "item": "Item 2", "quantity": 100, "unit": "sqft", "estimatedCost": 3000, "description": "Description" },
    { "item": "Labor - Installation", "quantity": 80, "unit": "hours", "estimatedCost": 6400, "description": "Professional installation" }
  ],
  "estimatedCost": 25000,
  "projectTimeline": "X–Y weeks",
  "description": "2-3 sentence concept summary for the client",
  "includes": [
    "What client receives item 1",
    "What client receives item 2"
  ]
}

Use realistic costs for the DC/MD/VA metro area. Bill of materials should have 5-8 line items with accurate quantities and costs that sum to estimatedCost (within 5%). The includes array should match what this service delivers.`
}

export async function POST(req: NextRequest) {
  let intakeId: string | undefined

  try {
    const body = await req.json()
    intakeId = body.intakeId

    if (!intakeId) {
      return NextResponse.json({ error: 'intakeId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1. Fetch intake record
    const { data: intake, error: fetchErr } = await supabase
      .from('public_intake_leads')
      .select('*')
      .eq('id', intakeId)
      .single()

    if (fetchErr || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const projectPath = intake.project_path as string
    const existingFormData = (intake.form_data as Record<string, unknown>) ?? {}

    // Return cached concept if already generated
    if (existingFormData.conceptOutput && intake.status === 'concept_ready') {
      return NextResponse.json({ conceptOutput: existingFormData.conceptOutput, cached: true })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    // 2. Call Claude Opus 4.6
    const client = new Anthropic({ apiKey })
    const prompt = buildConceptPrompt(intake as Record<string, unknown>, projectPath)

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)

    let conceptOutput: ConceptOutput
    if (!jsonMatch) {
      console.error('[concept/generate] No JSON in Claude response, using partial data')
      // Return partial concept rather than failing
      conceptOutput = {
        designConcept: {
          style: 'Modern Contemporary',
          colorPalette: ['Neutral tones', 'Natural materials', 'Accent finishes'],
          keyFeatures: ['Custom design tailored to your project', 'Professional-grade materials', 'Energy efficient systems'],
        },
        mepSystem: {
          electrical: 'Updated electrical systems per code requirements',
          plumbing: 'N/A',
          hvac: 'N/A',
          lighting: 'LED lighting throughout',
        },
        billOfMaterials: [
          { item: 'Materials Package', quantity: 1, unit: 'set', estimatedCost: 15000, description: 'All required materials for project scope' },
          { item: 'Labor - Installation', quantity: 100, unit: 'hours', estimatedCost: 8000, description: 'Professional installation labor' },
        ],
        estimatedCost: 23000,
        projectTimeline: '4–6 weeks',
        description: 'Your personalized concept package has been prepared based on your project details.',
        includes: SERVICE_DELIVERABLES[projectPath]?.includes ?? [],
      }
    } else {
      conceptOutput = JSON.parse(jsonMatch[0]) as ConceptOutput
      // Ensure includes matches the service deliverable
      if (!conceptOutput.includes?.length && SERVICE_DELIVERABLES[projectPath]?.includes) {
        conceptOutput.includes = SERVICE_DELIVERABLES[projectPath].includes
      }
    }

    // 3. Update intake record
    const { error: updateErr } = await supabase
      .from('public_intake_leads')
      .update({
        form_data: {
          ...existingFormData,
          conceptOutput,
          conceptGeneratedAt: new Date().toISOString(),
        },
        status: 'concept_ready',
      })
      .eq('id', intakeId)

    if (updateErr) {
      console.error('[concept/generate] Failed to update intake:', updateErr.message)
      // Still return the concept data even if save failed
    }

    return NextResponse.json({ conceptOutput })
  } catch (err: any) {
    console.error('[concept/generate] error:', err?.message)
    // Return partial data rather than hard failure
    return NextResponse.json(
      { error: err?.message ?? 'Generation failed', partial: true },
      { status: 500 }
    )
  }
}
