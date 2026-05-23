import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeV30IntakeWithLlm,
  calculateV30PackagePrice,
  mergeV30PackageFeatures,
  isV30Enabled,
  shouldResolveLotGis,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'
import { fetchActiveV30PricingFormula } from '@/lib/v30-pricing-formula'
import { resolveLotContext } from '@/lib/v30-lot-gis'
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

    const formula = await fetchActiveV30PricingFormula()
    const lotContext = shouldResolveLotGis(body.projectPath ?? undefined, body.answers.primaryScope)
      ? await resolveLotContext(body.answers.location)
      : null
    const analysis = await analyzeV30IntakeWithLlm(body.answers, formula, body.projectPath ?? undefined)
    const features = mergeV30PackageFeatures(
      body.selectedFeatures?.length ? body.selectedFeatures : analysis.suggestedFeatures,
      { projectPath: body.projectPath ?? undefined, answers: body.answers },
    )
    const { featureAddons, totalPrice, featureBreakdown } = calculateV30PackagePrice(
      analysis.estimatedCost,
      features,
      formula,
      { answers: body.answers, projectPath: body.projectPath },
    )

    const quote = {
      version: '3.0',
      projectPath: body.projectPath ?? null,
      analysis,
      features,
      basePrice: analysis.estimatedCost,
      featureAddons,
      featureBreakdown,
      pricingSource: 'v30_pricing_formulas',
      lotContext,
      permitNote: features.includes('Permits')
        ? 'Permit scope included for this project type.'
        : 'No permit package — typical for landscape without irrigation.',
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
        v30LotContext: lotContext,
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
