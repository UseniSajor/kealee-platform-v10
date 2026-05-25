/**
 * Machine-readable marketing plan — aligned with STACK-RECOMMENDATION.md
 * No GHL. Prices always from @kealee/core-rules at runtime.
 *
 * Canonical upsell after concept: permit → professional drawings (see upsell-path.json).
 */

/** Post-concept upsell order — always permit, then drawings. */
export const CANONICAL_UPSELL_PATH = [
  { stage: 'permit', goal: 'Permit path & filing', path: '/intake/permit_path_only' },
  { stage: 'drawings', goal: 'Permit-ready professional drawings', path: '/intake/professional_drawings' },
] as const

export const MARKETING_FUNNEL = [
  { stage: 'traffic', goal: 'DMV-targeted visits to web-main' },
  { stage: 'lead', goal: 'Capture email + project_path', api: 'POST /api/leads/marketing' },
  { stage: 'paid_concept', goal: 'Stripe checkout → v30 parallel bots', status: 'paid' },
  { stage: 'concept_ready', goal: 'Deliverables in owner portal', status: 'concept_ready' },
  ...CANONICAL_UPSELL_PATH,
  { stage: 'build', goal: 'Contractor match, PM, milestones on platform' },
] as const

/** Tools to use (in-repo first). */
export const MARKETING_STACK = {
  crm: 'supabase_public_intake_leads',
  email: 'resend',
  payments: 'stripe',
  queue: 'bullmq',
  ads: ['meta', 'google', 'nextdoor'],
  opsUi: 'command_center_marketing',
  bots: {
    planning: 'api_marketing_bot', // services/api marketing.bot.ts
    v30Ops: 'kealee_agent_stack_marketing_bot', // prompt only; V30_OPS_BOT_TYPES
    qualification: 'lead_bot',
    postPaymentUpsell: 'sales_bot',
  },
  disabledByDefault: ['ghl'],
  deferUntilScale: ['klaviyo', 'segment', 'zapier', 'zoho_full_crm'],
} as const

export const DRIP_SEQUENCE = [
  { step: 0, trigger: 'lead_created', channel: 'resend', template: 'welcome' },
  { step: 1, delayDays: 1, channel: 'resend', template: 'package_included' },
  { step: 2, delayDays: 3, channel: 'resend', template: 'social_proof' },
  { step: 3, delayDays: 7, channel: 'resend', template: 'final_cta' },
  { step: 4, delayDays: 14, channel: 'resend', template: 'permit_upsell', when: 'concept_ready' },
  { step: 5, delayDays: 21, channel: 'resend', template: 'drawings_upsell', when: 'concept_ready' },
] as const

export const CONVERSION_CTAS = [
  'Start your AI concept',
  'Continue to permit planning',
  'Get permit-ready drawings',
  'Find a contractor on Kealee',
] as const
