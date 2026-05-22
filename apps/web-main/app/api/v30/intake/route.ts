import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeV30Intake,
  calculateV30PackagePrice,
  isV30Enabled,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v30/intake — IntakeBot analysis before payment (v30 flow).
 * Persists quote on public_intake_leads.form_data.v30Quote when intakeId is provided.
 */
export async function POST(req: NextRequest) {
  if (!isV30Enabled()) {
    return NextResponse.json({ error: 'v30 disabled' }, { status: 503 })
  }

  try {
    const body = await req.json() as {
      intakeId?: string
      projectPath?: string
      answers: V30IntakeFormAnswers
      selectedFeatures?: string[]
    }

    if (!body.answers?.location || !body.answers?.squareFeet) {
      return NextResponse.json({ error: 'Incomplete intake answers' }, { status: 400 })
    }

    const analysis = analyzeV30Intake(body.answers)
    const features = body.selectedFeatures?.length
      ? body.selectedFeatures
      : analysis.suggestedFeatures
    const { featureAddons, totalPrice } = calculateV30PackagePrice(analysis.estimatedCost, features)

    const quote = {
      version: '3.0',
      projectPath: body.projectPath ?? null,
      analysis,
      features,
      basePrice: analysis.estimatedCost,
      featureAddons,
      totalPriceCents: Math.round(totalPrice * 100),
      totalPrice,
      quotedAt: new Date().toISOString(),
    }

    if (body.intakeId) {
      const supabase = getSupabaseAdmin()
      const { data: existing } = await supabase
        .from('public_intake_leads')
        .select('form_data')
        .eq('id', body.intakeId)
        .single()

      const formData = {
        ...((existing?.form_data as Record<string, unknown>) ?? {}),
        v30: true,
        v30Quote: quote,
        v30Answers: body.answers,
        v30Features: features,
        squareFootage: body.answers.squareFeet,
        description: `${body.answers.primaryScope} — ${body.answers.propertyType}`,
      }

      await supabase
        .from('public_intake_leads')
        .update({ form_data: formData, metadata: formData })
        .eq('id', body.intakeId)
    }

    const pricingBreakdown = (analysis.analysisJson as { pricingBreakdown?: Record<string, number> })
      ?.pricingBreakdown

    return NextResponse.json({
      analysis: {
        scopeComplexity: analysis.scopeComplexity,
        riskLevel: analysis.riskLevel,
        estimatedCost: analysis.estimatedCost,
        estimatedDays: analysis.estimatedDays,
        suggestedFeatures: analysis.suggestedFeatures,
        pricingBreakdown,
      },
      package: { features, basePrice: analysis.estimatedCost, featureAddons, totalPrice },
      quote,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'v30 intake failed'
    console.error('[api/v30/intake]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
