/**
 * launch-config.seed.ts
 *
 * Seeds the MarketplaceLaunchConfig table with operational feature flags
 * and runtime parameters for the national marketplace launch.
 *
 * Engineers and ops can toggle these via:
 *   PUT /marketplace/launch/config/:key
 * without a code deploy.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const LAUNCH_CONFIG_DEFAULTS = [
  // ── Rotation & lead distribution ──────────────────────────────────────────
  {
    key:         'rotation_enabled',
    value:       true,
    description: 'Master switch for the contractor rotation queue. Set false to pause all lead distribution.',
    category:    'rotation',
  },
  {
    key:         'lead_distribution_paused',
    value:       false,
    description: 'Temporarily pause lead distribution without disabling rotation (e.g. during maintenance).',
    category:    'rotation',
  },
  {
    key:         'lead_acceptance_window_hours',
    value:       48,
    description: 'Hours a contractor has to accept a ProfessionalAssignment before forfeiture.',
    category:    'rotation',
  },
  {
    key:         'max_active_assignments_per_contractor',
    value:       5,
    description: 'Maximum concurrent open ProfessionalAssignments per contractor.',
    category:    'rotation',
  },
  {
    key:         'sponsored_lead_enabled',
    value:       true,
    description: 'Allow direct/sponsored lead routing (bypasses rotation queue).',
    category:    'rotation',
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  {
    key:         'contractor_self_registration_enabled',
    value:       true,
    description: 'Allow new contractors to self-register via POST /marketplace/contractors/register.',
    category:    'onboarding',
  },
  {
    key:         'require_manual_approval',
    value:       true,
    description: 'When true, contractors reach UNDER_REVIEW before becoming APPROVED. Set false for auto-approval in pilot markets.',
    category:    'onboarding',
  },
  {
    key:         'auto_approve_after_docs',
    value:       false,
    description: 'Auto-approve contractors who upload all required docs (license + insurance). Requires require_manual_approval=false.',
    category:    'onboarding',
  },
  {
    key:         'invite_only_mode',
    value:       false,
    description: 'Restrict registration to contractors with a valid LaunchCohort invite code.',
    category:    'onboarding',
  },

  // ── Fees & pricing ────────────────────────────────────────────────────────
  {
    key:         'platform_fee_pct',
    value:       3.0,
    description: 'Standard platform fee percentage applied to contracted project value.',
    category:    'pricing',
  },
  {
    key:         'escrow_fee_pct',
    value:       1.0,
    description: 'Escrow fee percentage for standard-tier subscriptions.',
    category:    'pricing',
  },
  {
    key:         'escrow_fee_reduced_pct',
    value:       0.5,
    description: 'Reduced escrow fee for Package C/D subscribers.',
    category:    'pricing',
  },
  {
    key:         'escrow_fee_max_usd',
    value:       500,
    description: 'Maximum escrow fee cap in USD regardless of project size.',
    category:    'pricing',
  },
  {
    key:         'max_bid_over_srp_pct',
    value:       3.0,
    description: 'Maximum allowed bid percentage above the SRP (suggested retail price).',
    category:    'pricing',
  },

  // ── Quality gates ─────────────────────────────────────────────────────────
  {
    key:         'require_construction_ready_for_contractor',
    value:       true,
    description: 'Enforce CONSTRUCTION_READY gate before routing leads to contractors.',
    category:    'quality',
  },
  {
    key:         'min_lead_score_for_distribution',
    value:       65,
    description: 'Minimum LeadBot score required before a lead is distributed.',
    category:    'quality',
  },
  {
    key:         'require_verified_contractor_for_lead',
    value:       true,
    description: 'Only distribute leads to contractors with verified = true in MarketplaceProfile.',
    category:    'quality',
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  {
    key:         'sms_lead_notifications_enabled',
    value:       true,
    description: 'Send SMS via Twilio when a new lead is assigned to a contractor.',
    category:    'notifications',
  },
  {
    key:         'email_lead_notifications_enabled',
    value:       true,
    description: 'Send email via Resend when a new lead is assigned to a contractor.',
    category:    'notifications',
  },
  {
    key:         'forfeit_warning_hours',
    value:       6,
    description: 'Hours before the acceptance deadline to send a forfeit warning notification.',
    category:    'notifications',
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    key:         'kpi_recalculation_interval_minutes',
    value:       60,
    description: 'How often the KPI worker recalculates all marketplace metrics.',
    category:    'analytics',
  },
] as const

export async function seedLaunchConfig() {
  console.log('⚙️  Seeding launch config flags...')
  let created = 0
  let skipped = 0

  for (const cfg of LAUNCH_CONFIG_DEFAULTS) {
    const existing = await prisma.marketplaceLaunchConfig.findUnique({ where: { key: cfg.key } })
    if (existing) {
      console.log(`  ↷ skipping ${cfg.key} (exists, not overwriting)`)
      skipped++
      continue
    }
    await prisma.marketplaceLaunchConfig.create({ data: cfg })
    console.log(`  ✓ created ${cfg.key}`)
    created++
  }

  console.log(`  → ${created} created, ${skipped} skipped`)
  return { created, skipped }
}

// Stand-alone execution
if (require.main === module) {
  seedLaunchConfig()
    .then(r => { console.log('Done:', r); process.exit(0) })
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}
