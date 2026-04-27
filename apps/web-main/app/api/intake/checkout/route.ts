import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PATH_NAMES: Record<string, string> = {
  exterior_concept:          'Exterior Concept AI Package',
  garden_concept:            'Garden Concept AI Package',
  whole_home_concept:        'Whole Home Concept AI Package',
  interior_reno_concept:     'Interior Reno Concept AI Package',
  developer_concept:         'Developer Concept AI Package',
  interior_renovation:       'Interior Renovation AI Package',
  kitchen_remodel:           'Kitchen Remodel AI Package',
  bathroom_remodel:          'Bathroom Remodel AI Package',
  whole_home_remodel:        'Whole-Home Remodel AI Package',
  addition_expansion:        'Addition / Expansion AI Package',
  design_build:              'Design + Build AI Package',
  permit_path_only:          'Permit Path Intake',
  contractor_match:          'Contractor Match Service',
  multi_unit_residential:    'Multi-Unit Residential Concept',
  mixed_use:                 'Mixed-Use Development Concept',
  commercial_office:         'Commercial Office Concept',
  development_feasibility:   'Development Feasibility Package',
  townhome_subdivision:      'Townhome Subdivision Package',
  single_family_subdivision: 'Single-Family Subdivision Package',
  single_lot_development:    'Single-Lot Development Package',
  capture_site_concept:      'Site Capture + Concept Package',
}

const SITE_VISIT_FEE = 12500 // $125

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      intakeId: string
      projectPath: string
      amount: number
      successUrl: string
      cancelUrl: string
      siteVisitRequested?: boolean
    }

    const { intakeId, projectPath, amount, successUrl, cancelUrl, siteVisitRequested } = body

    if (!intakeId || !projectPath || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any })

    const productName = PATH_NAMES[projectPath] ?? 'Project Intake'
    const baseAmount = siteVisitRequested ? amount - SITE_VISIT_FEE : amount

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          unit_amount: baseAmount,
          product_data: { name: productName },
        },
        quantity: 1,
      },
    ]

    if (siteVisitRequested) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          unit_amount: SITE_VISIT_FEE,
          product_data: { name: 'Kealee Site Visit Scan' },
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        source: 'public_intake',
        intakeId,
        projectPath,
        siteVisitRequested: siteVisitRequested ? 'true' : 'false',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[intake/checkout]', err?.message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
