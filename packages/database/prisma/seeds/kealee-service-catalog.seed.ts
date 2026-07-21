/**
 * kealee-service-catalog.seed.ts
 *
 * Seeds the KealeeService catalog with every product Kealee offers,
 * priced against 2026 DMV CTC benchmarks.
 *
 * Pricing methodology:
 *   - Base costs sourced from RAG dataset (2023 DMV unit costs)
 *   - Inflated ×1.13 to reach 2026 DMV rates
 *     (cumulative: +7% 2023→24, +4.5% 24→25, +3.5% 25→26)
 *   - Service price = MAX(market_floor, cost_to_deliver / (1 - target_margin))
 *   - Staff rates 2026: designer $165/hr, estimator $175/hr, PM $155/hr, coordinator $165/hr
 *
 * Usage:
 *   npx tsx packages/database/prisma/seeds/kealee-service-catalog.seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── 2026 CTC Benchmarks ($ USD, inflation-adjusted) ───────────────────────────

interface CTCBenchmark {
  projectType: string
  sqft: number
  hardCostBase: number     // 2023 RAG $/sqft × sqft
  hardCost2026: number     // × 1.13 inflation
  softCost: number
  riskCost: number
  executionCost: number
  totalCTC: number
  ctcRangeLow: number
  ctcRangeHigh: number
  costPerSqft2026: number
}

const CTC_BENCHMARKS: Record<string, CTCBenchmark> = {
  'kitchen-remodel': {
    projectType: 'kitchen-remodel', sqft: 200,
    hardCostBase: 43_000, hardCost2026: 48_590, costPerSqft2026: 243,
    softCost: 6_250, riskCost: 8_900, executionCost: 13_660,
    totalCTC: 77_400, ctcRangeLow: 65_790, ctcRangeHigh: 92_880,
  },
  'bath-remodel': {
    projectType: 'bath-remodel', sqft: 100,
    hardCostBase: 21_000, hardCost2026: 23_730, costPerSqft2026: 237,
    softCost: 3_100, riskCost: 4_340, executionCost: 6_640,
    totalCTC: 37_810, ctcRangeLow: 32_140, ctcRangeHigh: 45_370,
  },
  'exterior': {
    projectType: 'exterior', sqft: 600,
    hardCostBase: 93_000, hardCost2026: 105_090, costPerSqft2026: 175,
    softCost: 13_500, riskCost: 18_980, executionCost: 29_040,
    totalCTC: 166_610, ctcRangeLow: 141_620, ctcRangeHigh: 199_930,
  },
  'interior-reno': {
    projectType: 'interior-reno', sqft: 500,
    hardCostBase: 115_000, hardCost2026: 129_950, costPerSqft2026: 260,
    softCost: 16_680, riskCost: 23_460, executionCost: 35_900,
    totalCTC: 205_990, ctcRangeLow: 175_090, ctcRangeHigh: 247_190,
  },
  'whole-home': {
    projectType: 'whole-home', sqft: 2000,
    hardCostBase: 450_000, hardCost2026: 508_500, costPerSqft2026: 254,
    softCost: 65_290, riskCost: 91_870, executionCost: 140_550,
    totalCTC: 806_210, ctcRangeLow: 685_280, ctcRangeHigh: 967_450,
  },
  'basement': {
    projectType: 'basement', sqft: 1000,
    hardCostBase: 180_000, hardCost2026: 203_400, costPerSqft2026: 203,
    softCost: 26_100, riskCost: 36_720, executionCost: 56_180,
    totalCTC: 322_400, ctcRangeLow: 274_040, ctcRangeHigh: 386_880,
  },
  'adu': {
    projectType: 'adu', sqft: 750,
    hardCostBase: 165_000, hardCost2026: 186_450, costPerSqft2026: 249,
    softCost: 23_940, riskCost: 33_670, executionCost: 51_510,
    totalCTC: 295_570, ctcRangeLow: 251_230, ctcRangeHigh: 354_680,
  },
  'tiny-home': {
    projectType: 'tiny-home', sqft: 400,
    hardCostBase: 92_000, hardCost2026: 103_960, costPerSqft2026: 260,
    softCost: 13_350, riskCost: 18_770, executionCost: 28_710,
    totalCTC: 164_790, ctcRangeLow: 140_070, ctcRangeHigh: 197_750,
  },
  'new-build': {
    projectType: 'new-build', sqft: 1500,
    hardCostBase: 330_000, hardCost2026: 372_900, costPerSqft2026: 249,
    softCost: 47_860, riskCost: 67_340, executionCost: 103_010,
    totalCTC: 591_110, ctcRangeLow: 502_440, ctcRangeHigh: 709_330,
  },
  'historic-renovation': {
    projectType: 'historic-renovation', sqft: 1500,
    hardCostBase: 592_500, hardCost2026: 669_525, costPerSqft2026: 446,
    softCost: 85_960, riskCost: 128_860, executionCost: 197_100,
    totalCTC: 1_081_445, ctcRangeLow: 919_228, ctcRangeHigh: 1_297_734,
  },
  'garden': {
    projectType: 'garden', sqft: 500,
    hardCostBase: 30_000, hardCost2026: 33_900, costPerSqft2026: 68,
    softCost: 4_360, riskCost: 5_750, executionCost: 8_790,
    totalCTC: 52_800, ctcRangeLow: 44_880, ctcRangeHigh: 63_360,
  },
  'landscape': {
    projectType: 'landscape', sqft: 1000,
    hardCostBase: 60_000, hardCost2026: 67_800, costPerSqft2026: 68,
    softCost: 8_700, riskCost: 11_500, executionCost: 17_580,
    totalCTC: 105_580, ctcRangeLow: 89_743, ctcRangeHigh: 126_696,
  },
}

// ── 2026 Service Delivery Cost Model ─────────────────────────────────────────

interface DeliveryModel {
  hoursMin: number
  hoursMax: number
  rateUsd:  number     // 2026 blended staff rate
  cogsMin:  number
  cogsMax:  number
  margin:   number     // target gross margin
}

const DELIVERY: Record<string, DeliveryModel> = {
  'ai-concept':           { hoursMin: 1.5, hoursMax: 2.5, rateUsd: 165, cogsMin: 248, cogsMax: 413, margin: 0.42 },
  'advanced-design':      { hoursMin: 6,   hoursMax: 10,  rateUsd: 165, cogsMin: 990, cogsMax: 1650, margin: 0.38 },
  'full-design':          { hoursMin: 20,  hoursMax: 40,  rateUsd: 165, cogsMin: 3300, cogsMax: 6600, margin: 0.40 },
  'permit-research':      { hoursMin: 3,   hoursMax: 5,   rateUsd: 165, cogsMin: 495, cogsMax: 825, margin: 0.28 },  // Loss leader
  'permit-package':       { hoursMin: 8,   hoursMax: 12,  rateUsd: 165, cogsMin: 1320, cogsMax: 1980, margin: 0.57 },
  'permit-coordination':  { hoursMin: 16,  hoursMax: 24,  rateUsd: 165, cogsMin: 2640, cogsMax: 3960, margin: 0.57 },
  'permit-expediting':    { hoursMin: 24,  hoursMax: 36,  rateUsd: 165, cogsMin: 3960, cogsMax: 5940, margin: 0.43 },
  'cost-estimate':        { hoursMin: 8,   hoursMax: 12,  rateUsd: 175, cogsMin: 1400, cogsMax: 2100, margin: 0.52 },
  'certified-estimate':   { hoursMin: 14,  hoursMax: 18,  rateUsd: 175, cogsMin: 2450, cogsMax: 3150, margin: 0.52 },
  'pm-advisory':          { hoursMin: 5,   hoursMax: 8,   rateUsd: 155, cogsMin: 775, cogsMax: 1240, margin: 0.28 },  // Monthly
  'pm-oversight':         { hoursMin: 14,  hoursMax: 20,  rateUsd: 155, cogsMin: 2170, cogsMax: 3100, margin: 0.41 }, // Monthly
  'water-assessment':     { hoursMin: 4,   hoursMax: 6,   rateUsd: 165, cogsMin: 660, cogsMax: 990, margin: 0.34 },
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n=== Seeding Kealee Service Catalog (2026 CTC Pricing) ===\n')

  // ─────────────────────────────────────────────────────────────────────────
  // AI DESIGN CATEGORY
  // ─────────────────────────────────────────────────────────────────────────

  const aiDesignServices = [
    { slug: 'kitchen-remodel',  name: 'Kitchen Remodel',         ctcKey: 'kitchen-remodel',  stripeEnvVar: 'STRIPE_PRICE_KITCHEN_REMODEL' },
    { slug: 'bath-remodel',     name: 'Bathroom Remodel',        ctcKey: 'bath-remodel',     stripeEnvVar: 'STRIPE_PRICE_BATH_REMODEL' },
    { slug: 'exterior',         name: 'Exterior Renovation',     ctcKey: 'exterior',         stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'interior-reno',    name: 'Interior Reno & Addition', ctcKey: 'interior-reno',   stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'whole-home',       name: 'Whole Home Renovation',   ctcKey: 'whole-home',       stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'basement',         name: 'Basement Finishing',      ctcKey: 'basement',         stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'adu',              name: 'ADU Design',              ctcKey: 'adu',              stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'tiny-home',        name: 'Tiny Home Design',        ctcKey: 'tiny-home',        stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'new-build',        name: 'New Build',               ctcKey: 'new-build',        stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'historic-renovation', name: 'Historic Renovation',  ctcKey: 'historic-renovation', stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'garden',           name: 'Garden & Farming Design', ctcKey: 'garden',           stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'landscape',        name: 'Landscape Design & Install', ctcKey: 'landscape',     stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
    { slug: 'ai-design',        name: 'AI Design (General)',     ctcKey: 'kitchen-remodel',  stripeEnvVar: 'STRIPE_PRICE_CONCEPT_VALIDATION' },
  ]

  for (const svc of aiDesignServices) {
    const ctc = CTC_BENCHMARKS[svc.ctcKey]
    const d_concept  = DELIVERY['ai-concept']
    const d_advanced = DELIVERY['advanced-design']
    const d_full     = DELIVERY['full-design']

    const basePrice = Math.max(44500, Math.round(ctc.totalCTC * 0.006 / 5) * 5)  // 0.6% of CTC, min $445
    const advPrice  = Math.max(78500, Math.round(ctc.totalCTC * 0.012 / 5) * 5)  // 1.2% of CTC, min $785

    // Large projects get higher base
    const isLarge = ctc.totalCTC > 300_000
    const effectiveBase = isLarge ? Math.max(66500, basePrice) : basePrice

    const service = await prisma.kealeeService.upsert({
      where: { slug: svc.slug },
      create: {
        slug:                 svc.slug,
        name:                 svc.name,
        tagline:              `AI concept design for ${svc.name.toLowerCase()} projects — delivered in 24–72 hours.`,
        category:             'AI_DESIGN',
        deliveryMode:         'STAFF_REVIEW',
        pricingBasis:         'FLAT_FEE',
        basePriceCents:       effectiveBase,
        maxPriceCents:        null,  // open for full design
        ctcBasisProjectType:  svc.ctcKey,
        ctcBasisSqft:         ctc.sqft,
        ctcTotalMinCents:     Math.round(ctc.ctcRangeLow * 100),
        ctcTotalMaxCents:     Math.round(ctc.ctcRangeHigh * 100),
        deliveryHoursMin:     d_concept.hoursMin,
        deliveryHoursMax:     d_concept.hoursMax,
        staffRateUsd:         d_concept.rateUsd,
        cogsMinCents:         Math.round(d_concept.cogsMin * 100),
        cogsMaxCents:         Math.round(d_concept.cogsMax * 100),
        ragAgents:            ['land', 'design'],
        conversionProduct:    'DESIGN_CONCEPT_VALIDATION',
        turnaroundDaysMin:    1,
        turnaroundDaysMax:    7,
        isBundle:             false,
        isMostPopular:        svc.slug === 'kitchen-remodel',
        isActive:             true,
        isVisible:            true,
        stripeEnvVar:         svc.stripeEnvVar,
        permitRequired:       ctc.totalCTC > 150_000 ? 'always' : 'sometimes',
        forWho:               `Homeowners planning a ${svc.name.toLowerCase()} in the DC/Maryland/Virginia metro area.`,
      },
      update: { updatedAt: new Date() },
    })

    // Tier 1 — AI Concept (Starter)
    await prisma.kealeeServiceTier.upsert({
      where: { id: `${service.id}-starter` },
      create: {
        id:             `${service.id}-starter`,
        serviceId:      service.id,
        tierType:       'STARTER',
        name:           `AI ${svc.name} Concept`,
        description:    'AI-generated concept options with staff review, permit scope, and cost band.',
        priceCents:     effectiveBase,
        cogsLaborHours: d_concept.hoursMax,
        cogsLaborRateUsd: d_concept.rateUsd,
        cogsLaborCents:   Math.round(d_concept.cogsMax * 100),
        cogsOverheadCents: Math.round(d_concept.cogsMax * 0.35 * 100),
        cogsTotalCents:    Math.round(d_concept.cogsMax * 1.35 * 100),
        grossMarginPct:    d_concept.margin,
        projectCtcMinCents: Math.round(ctc.ctcRangeLow * 100),
        projectCtcMaxCents: Math.round(ctc.ctcRangeHigh * 100),
        kealeeAsPctOfCtc:   effectiveBase / (ctc.totalCTC * 100),
        turnaroundDays:  ctc.totalCTC > 300_000 ? 5 : 2,
        roundsIncluded:  1,
        isPopular:       false,
        isActive:        true,
        stripeEnvVar:    svc.stripeEnvVar,
        ctaLabel:        `Start ${svc.name} Concept`,
        intakeHref:      `/intake/${svc.slug.replace('-', '_')}`,
        includes:        ['3 concept options', 'Permit scope assessment', 'Cost band estimate', 'Staff review', 'Downloadable PDF'],
        sortOrder:       0,
      },
      update: {},
    })

    // Tier 2 — Advanced Design (Standard)
    await prisma.kealeeServiceTier.upsert({
      where: { id: `${service.id}-standard` },
      create: {
        id:              `${service.id}-standard`,
        serviceId:       service.id,
        tierType:        'STANDARD',
        name:            `Advanced ${svc.name} Design`,
        description:     '3D views, detailed plans, and contractor-ready scope.',
        priceCents:      advPrice,
        cogsLaborHours:  d_advanced.hoursMax,
        cogsLaborRateUsd: d_advanced.rateUsd,
        cogsLaborCents:   Math.round(d_advanced.cogsMax * 100),
        cogsOverheadCents: Math.round(d_advanced.cogsMax * 0.35 * 100),
        cogsTotalCents:    Math.round(d_advanced.cogsMax * 1.35 * 100),
        grossMarginPct:    d_advanced.margin,
        projectCtcMinCents: Math.round(ctc.ctcRangeLow * 100),
        projectCtcMaxCents: Math.round(ctc.ctcRangeHigh * 100),
        kealeeAsPctOfCtc:   advPrice / (ctc.totalCTC * 100),
        turnaroundDays:   10,
        roundsIncluded:   3,
        isPopular:        true,
        isActive:         true,
        stripeEnvVar:     `${svc.stripeEnvVar}_ADVANCED`,
        ctaLabel:         `Start Advanced Design`,
        intakeHref:       `/intake/${svc.slug.replace('-', '_')}`,
        includes:         ['Everything in AI Concept', '3D views', 'Detailed floor plans', 'Full material direction', '60-min consultation'],
        sortOrder:        1,
      },
      update: {},
    })

    // Tier 3 — Full Design (Premium)
    const fullPriceMin = Math.max(282500, Math.round(ctc.totalCTC * 0.04 / 25) * 25)  // 4% of CTC, min $2,825
    await prisma.kealeeServiceTier.upsert({
      where: { id: `${service.id}-premium` },
      create: {
        id:               `${service.id}-premium`,
        serviceId:        service.id,
        tierType:         'PREMIUM',
        name:             `Full ${svc.name} Design Package`,
        description:      'Permit-ready drawing set with structural coordination and full specifications.',
        priceMinCents:    fullPriceMin,
        cogsLaborHours:   d_full.hoursMax,
        cogsLaborRateUsd: d_full.rateUsd,
        cogsLaborCents:   Math.round(d_full.cogsMax * 100),
        cogsOverheadCents: Math.round(d_full.cogsMax * 0.35 * 100),
        cogsTotalCents:    Math.round(d_full.cogsMax * 1.35 * 100),
        grossMarginPct:    d_full.margin,
        projectCtcMinCents: Math.round(ctc.ctcRangeLow * 100),
        projectCtcMaxCents: Math.round(ctc.ctcRangeHigh * 100),
        kealeeAsPctOfCtc:   fullPriceMin / (ctc.totalCTC * 100),
        turnaroundDays:   21,
        roundsIncluded:   5,
        isPopular:        false,
        isActive:         true,
        ctaLabel:         'Contact Us',
        intakeHref:       '/contact',
        includes:         ['Everything in Advanced', 'Permit-ready drawings', 'Structural coordination', 'Full spec package', 'Contractor bid documents'],
        sortOrder:        2,
      },
      update: {},
    })

    // CTC Pricing Snapshot for the service
    await prisma.cTCPricingSnapshot.upsert({
      where: { tierId: `${service.id}-starter` },
      create: {
        serviceId:           service.id,
        tierId:              `${service.id}-starter`,
        projectType:         svc.ctcKey,
        jurisdiction:        'Montgomery County, MD',
        representativeSqft:  ctc.sqft,
        hardCostBase:        ctc.hardCostBase,
        inflationFactor:     1.13,
        hardCost2026:        ctc.hardCost2026,
        costPerSqft2026:     ctc.costPerSqft2026,
        softCost:            ctc.softCost,
        riskCost:            ctc.riskCost,
        executionCost:       ctc.executionCost,
        totalCTC:            ctc.totalCTC,
        ctcRangeLow:         ctc.ctcRangeLow,
        ctcRangeHigh:        ctc.ctcRangeHigh,
        deliveryHours:       d_concept.hoursMax,
        deliveryRateUsd:     d_concept.rateUsd,
        cogsTotalUsd:        d_concept.cogsMax * 1.35,
        kaleePriceUsd:       effectiveBase / 100,
        grossMarginPct:      d_concept.margin,
        kaleePctOfCtc:       (effectiveBase / 100) / ctc.totalCTC,
        inflationNote:       '2023 RAG base cost × 1.13 cumulative DMV inflation (2023→2026)',
        dataSource:          'RAG-DMV-2026',
      },
      update: {},
    })

    console.log(`  ✓ ${svc.name}: AI Concept $${(effectiveBase/100).toLocaleString()} | Advanced $${(advPrice/100).toLocaleString()} | CTC $${Math.round(ctc.totalCTC/1000)}k`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERMITS CATEGORY
  // ─────────────────────────────────────────────────────────────────────────

  const permitServices = [
    {
      slug: 'permit-package',
      name: 'Permit Package',
      tiers: [
        { type: 'STARTER' as const,  name: 'Permit Research',      priceCents: 33500,  days: 3,  rounds: 0, delivery: 'permit-research',     stripe: 'STRIPE_PRICE_PERMIT_SIMPLE',       cta: 'Order Permit Research',    href: '/permits#start-permit', popular: false },
        { type: 'STANDARD' as const, name: 'Full Permit Package',   priceCents: 56500,  days: 10, rounds: 2, delivery: 'permit-package',      stripe: 'STRIPE_PRICE_PERMIT_PACKAGE',      cta: 'Start Permit Package',     href: '/permits#start-permit', popular: true  },
        { type: 'ADVANCED' as const, name: 'Permit Coordination',   priceCents: 113000, days: 45, rounds: 99, delivery: 'permit-coordination', stripe: 'STRIPE_PRICE_PERMIT_COORDINATION', cta: 'Start Permit Coordination',href: '/permits#start-permit', popular: false },
      ],
    },
    {
      slug: 'permit-research',
      name: 'Permit Research',
      tiers: [
        { type: 'STARTER' as const,  name: 'Permit Research Brief', priceCents: 33500, days: 3, rounds: 0, delivery: 'permit-research', stripe: 'STRIPE_PRICE_PERMIT_SIMPLE', cta: 'Order Permit Research', href: '/permits#start-permit', popular: false },
      ],
    },
    {
      slug: 'permit-coordination',
      name: 'Permit Coordination',
      tiers: [
        { type: 'ADVANCED' as const, name: 'Permit Coordination',   priceCents: 113000, days: 45, rounds: 99, delivery: 'permit-coordination', stripe: 'STRIPE_PRICE_PERMIT_COORDINATION', cta: 'Start Permit Coordination', href: '/permits#start-permit', popular: false },
      ],
    },
    {
      slug: 'permit-expediting',
      name: 'Expedited Permit Filing',
      tiers: [
        { type: 'PREMIUM' as const, name: 'Expedited Permit Filing', priceCents: 226000, days: 15, rounds: 99, delivery: 'permit-expediting', stripe: 'STRIPE_PRICE_PERMIT_EXPEDITING', cta: 'Start Expedited Filing', href: '/permits#start-permit', popular: false },
      ],
    },
  ]

  for (const svc of permitServices) {
    const ktcRef = CTC_BENCHMARKS['kitchen-remodel']  // Representative project
    const service = await prisma.kealeeService.upsert({
      where: { slug: svc.slug },
      create: {
        slug:              svc.slug,
        name:              svc.name,
        tagline:           'Expert permit filing, tracking, and comment response for DMV jurisdictions.',
        category:          'PERMITS',
        deliveryMode:      'PROFESSIONAL',
        pricingBasis:      'FLAT_FEE',
        basePriceCents:    svc.tiers[0].priceCents,
        maxPriceCents:     svc.tiers[svc.tiers.length - 1].priceCents,
        ctcBasisProjectType: 'residential',
        ctcTotalMinCents:  Math.round(ktcRef.ctcRangeLow * 100),
        ctcTotalMaxCents:  Math.round(CTC_BENCHMARKS['new-build'].ctcRangeHigh * 100),
        ragAgents:         ['permit'],
        conversionProduct: 'CONTRACTOR_MATCH',
        turnaroundDaysMin: svc.tiers[0].days,
        turnaroundDaysMax: svc.tiers[svc.tiers.length - 1].days,
        isActive:          true,
        isVisible:         true,
        stripeEnvVar:      svc.tiers[0].stripe,
        permitRequired:    'always',
      },
      update: { updatedAt: new Date() },
    })

    for (let i = 0; i < svc.tiers.length; i++) {
      const t = svc.tiers[i]
      const d = DELIVERY[t.delivery]
      await prisma.kealeeServiceTier.upsert({
        where: { id: `${service.id}-t${i}` },
        create: {
          id:               `${service.id}-t${i}`,
          serviceId:        service.id,
          tierType:         t.type,
          name:             t.name,
          priceCents:       t.priceCents,
          cogsLaborHours:   d.hoursMax,
          cogsLaborRateUsd: d.rateUsd,
          cogsLaborCents:   Math.round(d.cogsMax * 100),
          cogsOverheadCents: Math.round(d.cogsMax * 0.30 * 100),
          cogsTotalCents:    Math.round(d.cogsMax * 1.30 * 100),
          grossMarginPct:    d.margin,
          projectCtcMinCents: Math.round(ktcRef.ctcRangeLow * 100),
          projectCtcMaxCents: Math.round(CTC_BENCHMARKS['new-build'].ctcRangeHigh * 100),
          kealeeAsPctOfCtc:   t.priceCents / (ktcRef.totalCTC * 100),
          turnaroundDays:   t.days,
          roundsIncluded:   t.rounds,
          isPopular:        t.popular,
          isActive:         true,
          stripeEnvVar:     t.stripe,
          ctaLabel:         t.cta,
          intakeHref:       t.href,
          sortOrder:        i,
        },
        update: {},
      })
    }

    console.log(`  ✓ ${svc.name}: ${svc.tiers.map(t => `${t.name} $${(t.priceCents/100).toLocaleString()}`).join(' | ')}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ESTIMATION CATEGORY
  // ─────────────────────────────────────────────────────────────────────────

  const estimationServices = [
    {
      slug: 'cost-estimate',
      name: 'Detailed Cost Estimate',
      tiers: [
        { type: 'STANDARD' as const, name: 'Detailed Cost Estimate', priceCents: 67500,  days: 5, rounds: 1, delivery: 'cost-estimate',      stripe: 'STRIPE_PRICE_COST_ESTIMATE',      cta: 'Order Cost Estimate',     popular: false },
        { type: 'PREMIUM'  as const, name: 'Certified Cost Estimate', priceCents: 209500, days: 7, rounds: 1, delivery: 'certified-estimate', stripe: 'STRIPE_PRICE_CERTIFIED_ESTIMATE', cta: 'Order Certified Estimate', popular: true  },
        { type: 'ADVANCED' as const, name: 'Estimate + Permit Bundle', priceMinCents: 110000, priceMaxCents: 135000, days: 7, rounds: 1, delivery: 'cost-estimate', stripe: 'STRIPE_PRICE_COST_ESTIMATE', cta: 'Contact Us', popular: false },
      ],
    },
    {
      slug: 'certified-estimate',
      name: 'Certified Cost Estimate',
      tiers: [
        { type: 'PREMIUM' as const, name: 'Certified Cost Estimate', priceCents: 209500, days: 7, rounds: 1, delivery: 'certified-estimate', stripe: 'STRIPE_PRICE_CERTIFIED_ESTIMATE', cta: 'Order Certified Estimate', popular: false },
      ],
    },
  ]

  for (const svc of estimationServices) {
    const service = await prisma.kealeeService.upsert({
      where: { slug: svc.slug },
      create: {
        slug:              svc.slug,
        name:              svc.name,
        tagline:           'Trade-by-trade cost breakdown with licensed estimator review. Lender-ready.',
        category:          'ESTIMATION',
        deliveryMode:      'PROFESSIONAL',
        pricingBasis:      'FLAT_FEE',
        basePriceCents:    svc.tiers[0].priceCents ?? svc.tiers[0].priceMinCents!,
        ragAgents:         ['design', 'contractor'],
        conversionProduct: 'PERMIT_PACKAGE',
        turnaroundDaysMin: svc.tiers[0].days,
        turnaroundDaysMax: svc.tiers[svc.tiers.length - 1].days,
        isActive:          true,
        isVisible:         true,
        stripeEnvVar:      svc.tiers[0].stripe,
      },
      update: { updatedAt: new Date() },
    })

    for (let i = 0; i < svc.tiers.length; i++) {
      const t = svc.tiers[i]
      const d = DELIVERY[t.delivery]
      await prisma.kealeeServiceTier.upsert({
        where: { id: `${service.id}-t${i}` },
        create: {
          id:               `${service.id}-t${i}`,
          serviceId:        service.id,
          tierType:         t.type,
          name:             t.name,
          priceCents:       t.priceCents,
          priceMinCents:    t.priceMinCents,
          priceMaxCents:    t.priceMaxCents,
          cogsLaborHours:   d.hoursMax,
          cogsLaborRateUsd: d.rateUsd,
          cogsLaborCents:   Math.round(d.cogsMax * 100),
          cogsTotalCents:   Math.round(d.cogsMax * 1.30 * 100),
          grossMarginPct:   d.margin,
          turnaroundDays:   t.days,
          roundsIncluded:   t.rounds,
          isPopular:        t.popular,
          isActive:         true,
          stripeEnvVar:     t.stripe,
          ctaLabel:         t.cta,
          sortOrder:        i,
        },
        update: {},
      })
    }

    console.log(`  ✓ ${svc.name}: ${svc.tiers.map(t => `${t.name} $${((t.priceCents ?? t.priceMinCents!)/100).toLocaleString()}`).join(' | ')}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCTION MANAGEMENT CATEGORY
  // ─────────────────────────────────────────────────────────────────────────

  const pmServices = [
    {
      slug: 'pm-advisory',
      name: 'PM Advisory',
      tiers: [
        { type: 'STANDARD' as const, name: 'PM Advisory',       priceCents: 107500, days: 30, delivery: 'pm-advisory',  stripe: 'STRIPE_PRICE_PM_ADVISORY',  popular: false },
        { type: 'ADVANCED' as const, name: 'PM Oversight',      priceCents: 349900, days: 30, delivery: 'pm-oversight', stripe: 'STRIPE_PRICE_PM_OVERSIGHT', popular: true  },
        { type: 'PREMIUM'  as const, name: "Full Owner's Rep",  priceCents: null as any, days: 30, delivery: 'pm-oversight', stripe: 'STRIPE_PRICE_PM_OVERSIGHT', popular: false },
      ],
    },
    {
      slug: 'pm-oversight',
      name: 'PM Oversight',
      tiers: [
        { type: 'ADVANCED' as const, name: 'PM Oversight', priceCents: 349900, days: 30, delivery: 'pm-oversight', stripe: 'STRIPE_PRICE_PM_OVERSIGHT', popular: false },
      ],
    },
  ]

  for (const svc of pmServices) {
    const service = await prisma.kealeeService.upsert({
      where: { slug: svc.slug },
      create: {
        slug:              svc.slug,
        name:              svc.name,
        tagline:           'Professional construction oversight — site visits, milestone approvals, pay application review.',
        category:          'CONSTRUCTION_MGMT',
        deliveryMode:      'ON_SITE',
        pricingBasis:      'MONTHLY_RETAINER',
        basePriceCents:    svc.tiers[0].priceCents,
        ragAgents:         ['contractor'],
        conversionProduct: 'PROJECT_EXECUTION',
        turnaroundDaysMin: 1,
        turnaroundDaysMax: 1,
        isActive:          true,
        isVisible:         true,
        stripeEnvVar:      svc.tiers[0].stripe,
      },
      update: { updatedAt: new Date() },
    })

    for (let i = 0; i < svc.tiers.length; i++) {
      const t = svc.tiers[i]
      const d = DELIVERY[t.delivery]
      await prisma.kealeeServiceTier.upsert({
        where: { id: `${service.id}-t${i}` },
        create: {
          id:               `${service.id}-t${i}`,
          serviceId:        service.id,
          tierType:         t.type,
          name:             t.name,
          priceCents:       t.priceCents,
          cogsLaborHours:   d.hoursMax,
          cogsLaborRateUsd: d.rateUsd,
          cogsLaborCents:   Math.round(d.cogsMax * 100),
          cogsTotalCents:   Math.round(d.cogsMax * 1.30 * 100),
          grossMarginPct:   d.margin,
          turnaroundDays:   t.days,
          isPopular:        t.popular,
          isActive:         true,
          stripeEnvVar:     t.stripe,
          sortOrder:        i,
        },
        update: {},
      })
    }

    console.log(`  ✓ ${svc.name}: ${svc.tiers.map(t => t.priceCents ? `$${(t.priceCents/100).toLocaleString()}/mo` : 'Custom').join(' | ')}`)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUNDLES
  // ─────────────────────────────────────────────────────────────────────────

  const bundles = [
    {
      slug: 'adu-bundle',
      name: 'ADU Concept + Permit Bundle',
      priceCents: 152000,  // $1,520 (was $1,345, × 1.13)
      ctcKey: 'adu',
      description: 'AI Design + Full Permit Package bundled for ADU projects.',
      tiers: [
        { type: 'STANDARD' as const, name: 'ADU Bundle', priceCents: 152000, stripe: 'STRIPE_PRICE_ADU_BUNDLE', popular: true },
      ],
    },
    {
      slug: 'water-mitigation',
      name: 'Water Mitigation & Drainage',
      priceCents: 44500,
      ctcKey: 'exterior',
      description: 'Site drainage assessment, permit path, and contractor matching.',
      tiers: [
        { type: 'STARTER'  as const, name: 'Site Assessment',            priceCents: 44500,  stripe: 'STRIPE_PRICE_WATER_MITIGATION', popular: false },
        { type: 'STANDARD' as const, name: 'Assessment + Contractor Match', priceCents: 67500, stripe: 'STRIPE_PRICE_WATER_MITIGATION', popular: true  },
        { type: 'PREMIUM'  as const, name: 'Full Water Mitigation',       priceCents: null as any, stripe: 'STRIPE_PRICE_WATER_MITIGATION', popular: false },
      ],
    },
  ]

  for (const svc of bundles) {
    const ctc = CTC_BENCHMARKS[svc.ctcKey]
    const service = await prisma.kealeeService.upsert({
      where: { slug: svc.slug },
      create: {
        slug:              svc.slug,
        name:              svc.name,
        tagline:           svc.description,
        category:          svc.slug === 'water-mitigation' ? 'SPECIALTY' : 'BUNDLE',
        deliveryMode:      'HYBRID',
        pricingBasis:      svc.tiers[0].priceCents ? 'FLAT_FEE' : 'CUSTOM',
        basePriceCents:    svc.priceCents,
        ctcBasisProjectType: svc.ctcKey,
        ctcTotalMinCents:  Math.round(ctc.ctcRangeLow * 100),
        ctcTotalMaxCents:  Math.round(ctc.ctcRangeHigh * 100),
        ragAgents:         ['land', 'design', 'permit'],
        conversionProduct: 'DESIGN_CONCEPT_VALIDATION',
        isBundle:          svc.slug !== 'water-mitigation',
        isActive:          true,
        isVisible:         true,
        stripeEnvVar:      svc.tiers[0].stripe,
      },
      update: { updatedAt: new Date() },
    })

    for (let i = 0; i < svc.tiers.length; i++) {
      const t = svc.tiers[i]
      await prisma.kealeeServiceTier.upsert({
        where: { id: `${service.id}-t${i}` },
        create: {
          id:           `${service.id}-t${i}`,
          serviceId:    service.id,
          tierType:     t.type,
          name:         t.name,
          priceCents:   t.priceCents,
          isPopular:    t.popular,
          isActive:     true,
          stripeEnvVar: t.stripe,
          sortOrder:    i,
        },
        update: {},
      })
    }

    console.log(`  ✓ ${svc.name}: $${(svc.priceCents/100).toLocaleString()}`)
  }

  const [svcCount, tierCount, snapshotCount] = await Promise.all([
    prisma.kealeeService.count(),
    prisma.kealeeServiceTier.count(),
    prisma.cTCPricingSnapshot.count(),
  ])

  console.log(`\n=== Seed Complete ===`)
  console.log(`  KealeeService records:     ${svcCount}`)
  console.log(`  KealeeServiceTier records: ${tierCount}`)
  console.log(`  CTCPricingSnapshot records:${snapshotCount}`)
  console.log(`  Inflation factor applied:  ×1.13 (2023→2026 DMV)\n`)
}

seed()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
