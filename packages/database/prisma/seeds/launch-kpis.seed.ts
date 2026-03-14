/**
 * launch-kpis.seed.ts
 *
 * Seeds 20 canonical marketplace launch KPI definitions into the KPI table.
 * These are the authoritative targets for the national launch dashboard.
 * Run with: npx ts-node packages/database/prisma/seeds/launch-kpis.seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// KPI definitions aligned with launch-metrics.service.ts metric names
export const LAUNCH_KPIS = [
  // ── Supply ──────────────────────────────────────────────────────────────────
  {
    name:                 'contractors_registered',
    displayName:          'Total Contractors Registered',
    description:          'Total number of contractors who have completed registration',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'supply',
    targetValue:          200,
    threshold:            50,
    calculationFrequency: 'HOURLY',
    alertEnabled:         false,
  },
  {
    name:                 'contractors_verified',
    displayName:          'Verified Contractors',
    description:          'Contractors with approved license + insurance documents',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'supply',
    targetValue:          150,
    threshold:            30,
    calculationFrequency: 'HOURLY',
    alertEnabled:         true,
    alertThreshold:       30,
  },
  {
    name:                 'contractors_accepting',
    displayName:          'Contractors Accepting Leads',
    description:          'Verified contractors with acceptingLeads = true in rotation queue',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'supply',
    targetValue:          100,
    threshold:            20,
    calculationFrequency: 'HOURLY',
    alertEnabled:         true,
    alertThreshold:       10,
  },
  {
    name:                 'contractor_verification_rate',
    displayName:          'Contractor Verification Rate',
    description:          'Percentage of registered contractors who are verified',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'supply',
    targetValue:          80,
    threshold:            60,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       50,
  },
  {
    name:                 'contractor_activation_rate',
    displayName:          'Contractor Activation Rate',
    description:          'Percentage of verified contractors actively accepting leads',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'supply',
    targetValue:          75,
    threshold:            60,
    calculationFrequency: 'DAILY',
    alertEnabled:         false,
  },

  // ── Demand ──────────────────────────────────────────────────────────────────
  {
    name:                 'leads_created_7d',
    displayName:          'New Leads (7-day)',
    description:          'Construction leads created in the last 7 days',
    type:                 'COUNTER',
    unit:                 'count',
    category:             'demand',
    targetValue:          20,
    threshold:            10,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       5,
  },
  {
    name:                 'lead_acceptance_rate',
    displayName:          'Lead Acceptance Rate',
    description:          'Percentage of distributed leads accepted within 48-hour window',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'demand',
    targetValue:          70,
    threshold:            60,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       50,
  },
  {
    name:                 'lead_forfeit_rate',
    displayName:          'Lead Forfeit Rate',
    description:          'Percentage of leads that expired or were forfeited',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'demand',
    targetValue:          15,
    threshold:            20,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       25,
  },
  {
    name:                 'lead_quote_rate',
    displayName:          'Quote Rate',
    description:          'Percentage of accepted leads that result in a submitted quote',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'demand',
    targetValue:          50,
    threshold:            40,
    calculationFrequency: 'DAILY',
    alertEnabled:         false,
  },
  {
    name:                 'lead_conversion_rate',
    displayName:          'Lead → Contract Rate',
    description:          'Percentage of distributed leads that convert to a signed contract',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'demand',
    targetValue:          25,
    threshold:            20,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       15,
  },

  // ── Financial ────────────────────────────────────────────────────────────────
  {
    name:                 'platform_fees_mtd',
    displayName:          'Platform Fees MTD',
    description:          'Platform fees collected month-to-date in USD cents',
    type:                 'COUNTER',
    unit:                 'usd',
    category:             'financial',
    targetValue:          1000000,           // $10,000 in cents
    threshold:            500000,
    calculationFrequency: 'DAILY',
    alertEnabled:         false,
  },
  {
    name:                 'avg_contract_value',
    displayName:          'Average Contract Value',
    description:          'Average awarded project estimated value in USD',
    type:                 'GAUGE',
    unit:                 'usd',
    category:             'financial',
    targetValue:          75000,
    threshold:            40000,
    calculationFrequency: 'WEEKLY',
    alertEnabled:         false,
  },
  {
    name:                 'escrow_balance',
    displayName:          'Escrow Balance',
    description:          'Current sum of funds held in escrow (HOLD status fees)',
    type:                 'GAUGE',
    unit:                 'usd',
    category:             'financial',
    targetValue:          500000,
    threshold:            0,
    calculationFrequency: 'HOURLY',
    alertEnabled:         false,
  },

  // ── Quality ──────────────────────────────────────────────────────────────────
  {
    name:                 'permit_ready_rate',
    displayName:          'Permit-Ready Lead Rate',
    description:          'Percentage of leads from CONSTRUCTION_READY projects',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'quality',
    targetValue:          80,
    threshold:            70,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       60,
  },
  {
    name:                 'avg_contractor_rating',
    displayName:          'Avg Contractor Rating',
    description:          'Average star rating across all verified marketplace contractors',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'quality',
    targetValue:          4.5,
    threshold:            4.0,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       3.5,
  },
  {
    name:                 'docs_under_review',
    displayName:          'Docs Awaiting Review',
    description:          'Number of verification documents currently in UNDER_REVIEW status',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'quality',
    targetValue:          0,
    threshold:            20,
    calculationFrequency: 'HOURLY',
    alertEnabled:         true,
    alertThreshold:       30,
  },

  // ── Onboarding ───────────────────────────────────────────────────────────────
  {
    name:                 'onboarding_completion_rate',
    displayName:          'Onboarding Completion Rate',
    description:          'Percentage of started onboardings that reach APPROVED or ACTIVE',
    type:                 'RATIO',
    unit:                 'percent',
    category:             'supply',
    targetValue:          65,
    threshold:            50,
    calculationFrequency: 'DAILY',
    alertEnabled:         false,
  },
  {
    name:                 'avg_days_to_approval',
    displayName:          'Avg Days to Approval',
    description:          'Average calendar days from REGISTRATION to APPROVED stage',
    type:                 'GAUGE',
    unit:                 'days',
    category:             'supply',
    targetValue:          3,
    threshold:            7,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       10,
  },
  {
    name:                 'docs_expiring_30d',
    displayName:          'Docs Expiring (30d)',
    description:          'Approved verification docs expiring within the next 30 days',
    type:                 'GAUGE',
    unit:                 'count',
    category:             'quality',
    targetValue:          0,
    threshold:            5,
    calculationFrequency: 'DAILY',
    alertEnabled:         true,
    alertThreshold:       5,
  },
  {
    name:                 'contractors_new_7d',
    displayName:          'New Contractors (7d)',
    description:          'New marketplace profiles created in the last 7 days',
    type:                 'COUNTER',
    unit:                 'count',
    category:             'supply',
    targetValue:          10,
    threshold:            3,
    calculationFrequency: 'DAILY',
    alertEnabled:         false,
  },
] as const

export async function seedLaunchKPIs() {
  console.log('📊 Seeding launch KPI definitions...')
  let created = 0
  let updated = 0

  for (const kpi of LAUNCH_KPIS) {
    const existing = await prisma.kPI.findUnique({ where: { name: kpi.name } })
    if (existing) {
      await prisma.kPI.update({
        where: { name: kpi.name },
        data: {
          targetValue: kpi.targetValue,
          threshold:   kpi.threshold,
        },
      })
      console.log(`  ↷ updated ${kpi.name}`)
      updated++
    } else {
      await prisma.kPI.create({
        data: {
          name:                 kpi.name,
          displayName:          kpi.displayName,
          description:          kpi.description,
          type:                 kpi.type as any,
          unit:                 kpi.unit,
          category:             kpi.category,
          currentValue:         0,
          targetValue:          kpi.targetValue,
          threshold:            kpi.threshold,
          calculationFrequency: kpi.calculationFrequency as any,
          alertEnabled:         kpi.alertEnabled,
          alertThreshold:       'alertThreshold' in kpi ? (kpi as any).alertThreshold : null,
        },
      })
      console.log(`  ✓ created ${kpi.name}`)
      created++
    }
  }

  console.log(`  → ${created} created, ${updated} updated`)
  return { created, updated }
}

// Stand-alone execution
if (require.main === module) {
  seedLaunchKPIs()
    .then(r => { console.log('Done:', r); process.exit(0) })
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
