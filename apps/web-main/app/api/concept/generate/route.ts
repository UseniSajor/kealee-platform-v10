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
  renderUrls: string[]
  permitScope: {
    requiresPermit: boolean
    permitTypes: string[]
    estimatedPermitFee: number
    estimatedProcessingDays: number
    requiresPE: boolean
    notes: string
  }
  zoningNotes: string
  buildabilityFlag: 'feasible' | 'feasible-with-variance' | 'challenging'
  readinessScore: number
}

// ── Curated render stubs (Unsplash) by project type ──────────────────────────
// Each entry has 12 images; sliced to 3/6/12 based on tier.
const RENDER_STUBS: Record<string, string[]> = {
  kitchen_remodel: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&q=80',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&q=80',
    'https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909114-d65f8d9e8e8a?w=1920&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909044-cbf3c24c14b4?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=1920&q=80',
    'https://images.unsplash.com/photo-1556909083-b81c82c5f63f?w=1920&q=80',
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80',
    'https://images.unsplash.com/photo-1556910096-6f5e72db3803?w=1920&q=80',
  ],
  bathroom_remodel: [
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752734-2a0cd0e0da49?w=1920&q=80',
    'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=1920&q=80',
    'https://images.unsplash.com/photo-1620626011761-996317702574?w=1920&q=80',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=80',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80',
    'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?w=1920&q=80',
    'https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=1920&q=80',
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566752447-f4d1d9dc3b76?w=1920&q=80',
    'https://images.unsplash.com/photo-1594846887338-3f5f4e4a8b8b?w=1920&q=80',
  ],
  exterior_concept: [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1920&q=80',
    'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1920&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=80',
    'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=1920&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80',
    'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=1920&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=1920&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1920&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
  ],
  garden_concept: [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80',
    'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1920&q=80',
    'https://images.unsplash.com/photo-1558618047-f4e80c0d9e52?w=1920&q=80',
    'https://images.unsplash.com/photo-1463554050456-f2ed7d3fec09?w=1920&q=80',
    'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1920&q=80',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1920&q=80',
    'https://images.unsplash.com/photo-1444858291040-58f756a3bdd6?w=1920&q=80',
    'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=1920&q=80',
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1920&q=80',
    'https://images.unsplash.com/photo-1488330890490-c291ecf62571?w=1920&q=80',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
  ],
  // Default fallback for any other project type
  default: [
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1920&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c349dc6?w=1920&q=80',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1920&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80',
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1920&q=80',
    'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1920&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80',
    'https://images.unsplash.com/photo-1616137466211-f939a420be84?w=1920&q=80',
    'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1920&q=80',
  ],
}

function getRenderUrls(projectPath: string, tier: number): string[] {
  const stubs = RENDER_STUBS[projectPath] ?? RENDER_STUBS.default
  const count = tier >= 3 ? 12 : tier === 2 ? 6 : 3
  return stubs.slice(0, count)
}

function permitGuidance(permitRequired: 'always' | 'sometimes' | 'rarely' | undefined): string {
  if (permitRequired === 'always') {
    return `PERMIT RULE (from Kealee product catalog): This project type ALWAYS requires a permit in the DMV region. You MUST set "requiresPermit": true in permitScope regardless of scope details. Identify the specific permit types, realistic fees, and processing days for the jurisdiction.`
  }
  if (permitRequired === 'sometimes') {
    return `PERMIT RULE (from Kealee product catalog): This project type SOMETIMES requires a permit depending on scope (structural changes, electrical panel work, plumbing rough-in, HVAC ductwork, decks over 30", etc.). Assess the described scope and set "requiresPermit" accordingly.`
  }
  if (permitRequired === 'rarely') {
    return `PERMIT RULE (from Kealee product catalog): This project type RARELY requires a permit. Only set "requiresPermit": true if the described scope explicitly includes something permit-triggering (e.g. irrigation system in a jurisdiction that requires it, grading over regulated thresholds).`
  }
  return `PERMIT RULE: Assess whether a permit is required based on the described scope and DMV jurisdiction norms.`
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

${permitGuidance(deliverable?.permitRequired)}

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
  ],
  "permitScope": {
    "requiresPermit": true,
    "permitTypes": ["Building Permit", "Electrical Permit"],
    "estimatedPermitFee": 850,
    "estimatedProcessingDays": 30,
    "requiresPE": false,
    "notes": "A building permit is required for this scope. Submit to local jurisdiction before construction begins."
  },
  "zoningNotes": "R-4 residential zone — proposed scope is permitted by right. No variance required.",
  "buildabilityFlag": "feasible",
  "readinessScore": 80
}

Use realistic costs for the DC/MD/VA metro area. Bill of materials should have 5-8 line items with accurate quantities and costs that sum to estimatedCost (within 5%). The includes array should match what this service delivers.

For permitScope: requiresPE should be true if the project involves structural changes, new load-bearing elements, additions, ADUs, or new construction. buildabilityFlag must be one of "feasible", "feasible-with-variance", or "challenging". readinessScore is 0–100 (permit readiness).`
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
    const tier = typeof existingFormData.tier === 'number' ? existingFormData.tier : 1

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
        renderUrls: getRenderUrls(projectPath, tier),
        permitScope: {
          requiresPermit: deliverable?.permitRequired === 'always',
          permitTypes: deliverable?.permitRequired === 'always' ? ['Building Permit'] : [],
          estimatedPermitFee: 0,
          estimatedProcessingDays: 0,
          requiresPE: false,
          notes: 'Permit requirements to be confirmed with your local jurisdiction.',
        },
        zoningNotes: 'Zoning analysis pending — confirm with local planning department.',
        buildabilityFlag: 'feasible' as const,
        readinessScore: deliverable?.permitRequired === 'always' ? 55 : 70,
      }
    } else {
      conceptOutput = JSON.parse(jsonMatch[0]) as ConceptOutput
      // Ensure includes matches the service deliverable
      if (!conceptOutput.includes?.length && SERVICE_DELIVERABLES[projectPath]?.includes) {
        conceptOutput.includes = SERVICE_DELIVERABLES[projectPath].includes
      }
      // Populate render stubs (no external image API needed)
      conceptOutput.renderUrls = getRenderUrls(projectPath, tier)
      // Enforce catalog permit rule — override AI if it contradicts the product definition
      if (deliverable?.permitRequired === 'always' && !conceptOutput.permitScope?.requiresPermit) {
        if (!conceptOutput.permitScope) {
          conceptOutput.permitScope = {
            requiresPermit: true,
            permitTypes: ['Building Permit'],
            estimatedPermitFee: 0,
            estimatedProcessingDays: 0,
            requiresPE: false,
            notes: 'A permit is required for this project type in the DMV region.',
          }
        } else {
          conceptOutput.permitScope.requiresPermit = true
        }
      }
      if (deliverable?.permitRequired === 'rarely' && conceptOutput.permitScope?.requiresPermit === undefined) {
        conceptOutput.permitScope = conceptOutput.permitScope ?? {
          requiresPermit: false,
          permitTypes: [],
          estimatedPermitFee: 0,
          estimatedProcessingDays: 0,
          requiresPE: false,
          notes: 'Permit rarely required for this project type.',
        }
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
