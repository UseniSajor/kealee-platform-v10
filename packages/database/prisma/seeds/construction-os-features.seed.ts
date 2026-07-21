/**
 * construction-os-features.seed.ts
 *
 * Seeds all 27 Construction OS feature definitions into the
 * construction_os_features table.
 *
 * Feature slugs MUST match OS_FEATURES constants in:
 *   packages/types/src/construction-os.ts
 *
 * Run: npx ts-node packages/database/prisma/seeds/construction-os-features.seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const OS_FEATURE_DEFINITIONS = [
  // ── Phase 1: Core OS (STANDARD tier) ─────────────────────────────────────
  {
    slug:        'daily-log',
    name:        'Daily Field Log',
    description: 'Contractors submit daily work logs including crew count, weather, materials, and progress notes.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'schedule-view',
    name:        'Schedule View',
    description: 'Read-only schedule list view showing tasks, assignments, and status for all project stakeholders.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'schedule-gantt',
    name:        'Gantt Chart',
    description: 'Interactive Gantt chart with critical path highlighting and milestone markers.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'rfi-list',
    name:        'RFI List',
    description: 'View and track Requests for Information (RFIs) with status, priority, and assignment.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'rfi-create',
    name:        'RFI Creation',
    description: 'Create and submit new RFIs with attachments, priority, and assigned reviewer.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'punch-list',
    name:        'Punch List',
    description: 'Create and manage punch list items with severity, location, assignment, and resolution tracking.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'budget-overview',
    name:        'Budget Overview',
    description: 'High-level budget dashboard showing contracted amount, spent-to-date, committed costs, and forecast.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'photo-log',
    name:        'Site Photo Log',
    description: 'Geo-tagged site photos with date, location, and daily log attachment.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },
  {
    slug:        'project-reports',
    name:        'Project Reports',
    description: 'Weekly progress reports, executive summaries, and PDF export for owner distribution.',
    phase:       1,
    tier:        'STANDARD' as const,
    isEnabled:   true,
  },

  // ── Phase 2: Advanced Execution (PRO tier) ────────────────────────────────
  {
    slug:        'change-orders',
    name:        'Change Order Management',
    description: 'Create, price, and route change orders for owner approval with contract value impact tracking.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'submittals',
    name:        'Submittal Log',
    description: 'Track shop drawings, product data, and samples through review and approval workflow.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'inspections',
    name:        'Inspection Coordination',
    description: 'Schedule, track, and record results of municipal and third-party inspections.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'safety-log',
    name:        'Safety Incident Log',
    description: 'Record safety incidents, near-misses, OSHA metrics, and corrective actions.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'drawings',
    name:        'Drawing Management',
    description: 'Upload, version, and distribute drawing sets with markup and revision tracking.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'team-management',
    name:        'Team & Subcontractors',
    description: 'Manage project team members, subcontractor contacts, and role assignments.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'time-tracking',
    name:        'Time Tracking',
    description: 'Log and approve field labor hours with cost code assignment and payroll export.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'meetings',
    name:        'Meeting Minutes',
    description: 'Record OAC meeting minutes, action items, and distribute to project team.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'selections',
    name:        'Owner Selections',
    description: 'Track owner finish selections, allowances, and substitution requests with approval status.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },
  {
    slug:        'productivity',
    name:        'Productivity Analytics',
    description: 'Earned value, labor productivity, and schedule performance index (SPI/CPI) analytics.',
    phase:       2,
    tier:        'PRO' as const,
    isEnabled:   true,
  },

  // ── Phase 3: Enterprise tier ──────────────────────────────────────────────
  {
    slug:        'warranty',
    name:        'Warranty Management',
    description: 'Track warranty periods, owner claims, and subcontractor warranty callbacks.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'closeout',
    name:        'Project Closeout',
    description: 'Structured closeout checklist, O&M manual compilation, and final inspection workflow.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'handoff',
    name:        'Owner Handoff',
    description: 'Digital handoff package with as-built drawings, warranties, and system documentation.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'digital-twin',
    name:        'Digital Development Twin',
    description: 'Live digital twin of the project linked to schedule, budget, and field data via core-ddts.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   false,   // requires core-ddts activation
  },
  {
    slug:        'bim-viewer',
    name:        'BIM Model Viewer',
    description: 'IFC/BIM model viewer with clash detection and field annotation via core-bim.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   false,   // requires core-bim activation
  },
  {
    slug:        'ai-monitoring',
    name:        'AI Project Monitoring',
    description: 'ProjectMonitorBot automated health scoring, risk alerts, and recommended actions.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'portfolio-view',
    name:        'Portfolio Dashboard',
    description: 'Multi-project portfolio dashboard with aggregate KPIs for enterprise owners and GCs.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'owner-reporting',
    name:        'Automated Owner Reports',
    description: 'Scheduled automated PDF/email reports to owner with budget, schedule, and photo digest.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   true,
  },
  {
    slug:        'predictive-cost',
    name:        'Predictive Cost Analytics',
    description: 'AI-powered cost-at-completion forecasting using earned value + historical project data.',
    phase:       3,
    tier:        'ENTERPRISE' as const,
    isEnabled:   false,   // requires AI training data volume
  },
] as const

export async function seedConstructionOSFeatures() {
  console.log('🏗️  Seeding Construction OS feature definitions...')
  let created = 0
  let updated = 0

  for (const feature of OS_FEATURE_DEFINITIONS) {
    const existing = await prisma.constructionOSFeature.findUnique({
      where: { slug: feature.slug },
    })

    if (existing) {
      await prisma.constructionOSFeature.update({
        where: { slug: feature.slug },
        data: {
          name:      feature.name,
          phase:     feature.phase,
          tier:      feature.tier,
          isEnabled: feature.isEnabled,
        },
      })
      console.log(`  ↷ updated ${feature.slug}`)
      updated++
    } else {
      await prisma.constructionOSFeature.create({ data: feature })
      console.log(`  ✓ created ${feature.slug}`)
      created++
    }
  }

  console.log(`  → ${created} created, ${updated} updated`)
  return { created, updated }
}

// Stand-alone execution
if (require.main === module) {
  seedConstructionOSFeatures()
    .then(r => { console.log('Done:', r); process.exit(0) })
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
