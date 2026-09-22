import { NextRequest, NextResponse } from 'next/server'
import {
  analyzeV30IntakeWithLlm,
  calculateFloorplanAddon,
  mergeV30PackageFeatures,
  isV30Enabled,
  shouldResolveLotGis,
  type V30IntakeFormAnswers,
} from '@kealee/kealee-agent-stack'
import { computeQuote, getProductPricing, type QuoteFacts } from '@kealee/core-rules'
import { fetchActiveV30PricingFormula } from '@/lib/v30-pricing-formula'
import { quoteFactsFromIntake } from '@/lib/quote-facts'
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
      tier?: 1 | 2 | 3
      answers: V30IntakeFormAnswers
      selectedFeatures?: string[]
      /** Optional add-on ids from the quoting engine's ADD_ONS catalogue. */
      addOns?: string[]
      rush?: boolean
    }

    if (!body.answers?.location || !body.answers?.squareFeet) {
      return NextResponse.json({ error: 'Incomplete intake answers' }, { status: 400 })
    }

    const formula = await fetchActiveV30PricingFormula()
    const lotContext = shouldResolveLotGis(body.projectPath ?? undefined, body.answers.primaryScope)
      ? await resolveLotContext(body.answers.location)
      : null
    const analysis = await analyzeV30IntakeWithLlm(body.answers, formula, body.projectPath ?? undefined)
    const tier = body.tier && body.tier >= 1 && body.tier <= 3 ? body.tier : undefined
    const features = mergeV30PackageFeatures(
      body.selectedFeatures?.length ? body.selectedFeatures : analysis.suggestedFeatures,
      { tier, projectPath: body.projectPath ?? undefined, answers: body.answers },
    )
    const floorplanAddon = features.some(f => /^floorplan$/i.test(f))
      ? calculateFloorplanAddon(body.answers, formula, body.projectPath ?? undefined)
      : null
    // The payable amount is computed here, deterministically, from the intake
    // facts and the product table. The model's analysis classifies scope; it
    // never sets a price. `analysis.estimatedCost` is the model's guess at the
    // customer's CONSTRUCTION budget and is recorded as context only.
    const facts: QuoteFacts = quoteFactsFromIntake({
      answers: body.answers,
      projectPath: body.projectPath,
      scopeComplexity: analysis.scopeComplexity,
      lotContext: lotContext as unknown as Record<string, unknown> | null,
      selectedAddOns: body.addOns,
      rush: body.rush,
    })
    const product = getProductPricing(body.projectPath ?? '')
    const computed = product ? computeQuote(product.key, facts) : null

    if (!computed) {
      // No published price for this product — a scoping request, not a charge.
      return NextResponse.json({
        scopingRequired: true,
        reason: 'This project is quoted by our team after review.',
        analysis: { scopeComplexity: analysis.scopeComplexity, riskLevel: analysis.riskLevel },
      })
    }

    const quote = {
      version: '3.0',
      quoteVersion: computed.version,
      projectPath: body.projectPath ?? null,
      analysis,
      features,
      pricingSource: 'kealee_quote_engine',
      lotContext,
      floorplanScope: floorplanAddon?.scope ?? null,
      tier: tier ?? null,
      permitNote: features.includes('Permits')
        ? 'Permit scope included for this project type.'
        : 'No permit package — typical for landscape without irrigation.',
      // The customer-facing breakdown, shown in full before Stripe.
      quote: computed,
      totalPriceCents: computed.totalCents,
      totalPrice: computed.totalCents / 100,
      customQuoteRequired: computed.customQuoteRequired,
      customQuoteReasons: computed.customQuoteReasons,
      expiresAt: computed.expiresAt,
      quotedAt: computed.quotedAt,
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
      // `estimatedCost` is the model's read of the CONSTRUCTION budget, shown as
      // context. The package price is `quote.totalPriceCents`, computed here.
      package: {
        features,
        packageCents: computed.packageCents,
        addOnsCents: computed.addOnsCents,
        totalCents: computed.totalCents,
        lines: computed.lines,
        expiresAt: computed.expiresAt,
      },
      quote,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'v30 intake failed'
    console.error('[api/v30/intake]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
