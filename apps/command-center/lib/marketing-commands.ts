/**
 * Marketing Automation Command System
 *
 * Defines every automation command as an explicit schema.
 * Each command has:
 *   - id, name, description, category, tags
 *   - inputs: typed field schemas (used to render forms + validate CLI args)
 *   - steps: human-readable execution plan
 *   - chain: ordered list of sub-commands that execute in sequence
 *
 * The executor (executeCommand) runs a command and returns a structured
 * CommandResult with timing, each step's output, and any errors.
 */

// ── Field schema ─────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'textarea' | 'number' | 'boolean' | 'enum'

export interface FieldSchema {
  type:         FieldType
  label:        string
  description?: string
  required:     boolean
  options?:     string[]
  default?:     unknown
  placeholder?: string
}

// ── Command schema ────────────────────────────────────────────────────────────

export type CommandCategory = 'content' | 'leads' | 'campaigns' | 'analytics'

export interface CommandSchema {
  id:          string
  name:        string
  description: string
  category:    CommandCategory
  tags:        string[]
  inputs:      Record<string, FieldSchema>
  steps:       string[]
  chain?:      string[]   // ordered sub-command IDs when this is a pipeline
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface StepResult {
  step:       string
  command?:   string
  status:     'success' | 'error' | 'skipped'
  output:     Record<string, unknown>
  durationMs: number
  error?:     string
}

export interface CommandResult {
  commandId:   string
  status:      'success' | 'partial' | 'error'
  startedAt:   string
  completedAt: string
  durationMs:  number
  steps:       StepResult[]
  output:      Record<string, unknown>  // merged final output
  error?:      string
}

// ── Service options (shared across commands) ──────────────────────────────────

export const SERVICE_OPTIONS = [
  'kitchen_remodel', 'bathroom_remodel', 'exterior_concept',
  'interior_renovation', 'whole_home_concept', 'whole_home_remodel',
  'addition_expansion', 'garden_concept', 'design_build',
  'design_estimate_permit_bundle', 'developer_concept',
  'single_lot_development', 'mixed_use', 'commercial_office',
  'multi_unit_residential', 'permit_path_only', 'cost_estimate',
  'contractor_match', 'adu', 'new_construction',
]

export const AUDIENCE_OPTIONS = [
  'homeowners', 'first-time buyers', 'luxury homeowners',
  'real estate investors', 'developers', 'contractors', 'architects',
  'flippers', 'landlords',
]

export const TONE_OPTIONS = ['friendly', 'professional', 'urgent', 'educational', 'inspirational']

// ── Command registry ─────────────────────────────────────────────────────────

export const COMMAND_REGISTRY: CommandSchema[] = [

  // ── Content ───────────────────────────────────────────────────────────────

  {
    id:          'generate-content',
    name:        'Generate Marketing Content',
    description: 'Generate Instagram, Facebook, Reddit, email, and DM scripts for any service type and target audience using the marketing bot.',
    category:    'content',
    tags:        ['instagram', 'facebook', 'reddit', 'email', 'social'],
    inputs: {
      service: {
        type:        'enum',
        label:       'Service Type',
        description: 'The Kealee service to promote',
        required:    true,
        options:     SERVICE_OPTIONS,
      },
      audience: {
        type:        'enum',
        label:       'Target Audience',
        required:    true,
        options:     AUDIENCE_OPTIONS,
      },
      tone: {
        type:        'enum',
        label:       'Tone',
        required:    false,
        options:     TONE_OPTIONS,
        default:     'friendly',
      },
    },
    steps: [
      'Call marketing-bot with service + audience + tone',
      'Return Instagram caption, Facebook post, Reddit title+post, email subject+body, DM script, key benefits',
    ],
  },

  // ── Leads ─────────────────────────────────────────────────────────────────

  {
    id:          'qualify-lead',
    name:        'Qualify Lead',
    description: 'Score and qualify an inbound lead message. Returns a tier (hot/warm/cold), score 0–100, detected project type, budget, timeline, and recommended next action.',
    category:    'leads',
    tags:        ['qualification', 'scoring', 'lead-bot'],
    inputs: {
      message: {
        type:        'textarea',
        label:       'Lead Message',
        description: 'The raw inbound message from the prospect',
        required:    true,
        placeholder: 'e.g. "Hi, I want to remodel my kitchen. Budget is around $60k. I\'m in Austin TX."',
      },
      source: {
        type:        'string',
        label:       'Source',
        description: 'Where this lead came from',
        required:    false,
        placeholder: 'instagram_dm / facebook_bot / chatbot / email_bot',
        default:     'command_center',
      },
    },
    steps: [
      'Send message to lead-bot (claude-haiku-4-5-20251001)',
      'Extract score, tier, projectType, budget, location, timeline',
      'Return qualification summary + recommended action',
    ],
  },

  {
    id:          'generate-pitch',
    name:        'Generate Pitch',
    description: 'Create a personalized concept package pitch for a qualified lead. Outputs a recommended tier, price, pitch paragraph, and CTA.',
    category:    'leads',
    tags:        ['pitch', 'pitch-bot', 'concept', 'sales'],
    inputs: {
      score: {
        type:     'number',
        label:    'Lead Score (0–100)',
        required: true,
        default:  75,
      },
      tier: {
        type:     'enum',
        label:    'Lead Tier',
        required: true,
        options:  ['hot', 'warm', 'cold'],
        default:  'warm',
      },
      projectType: {
        type:        'string',
        label:       'Project Type',
        required:    true,
        placeholder: 'kitchen_remodel',
      },
      budget: {
        type:        'string',
        label:       'Budget (optional)',
        required:    false,
        placeholder: '$50K–$100K',
      },
      location: {
        type:        'string',
        label:       'Location (optional)',
        required:    false,
        placeholder: 'Austin, TX',
      },
      timeline: {
        type:        'string',
        label:       'Timeline (optional)',
        required:    false,
        placeholder: 'Spring 2026',
      },
    },
    steps: [
      'Send lead profile to pitch-bot',
      'Bot recommends Tier 1/2/3 concept package',
      'Return pitch paragraph, price, CTA, and funnel URL',
    ],
  },

  {
    id:          'capture-lead',
    name:        'Capture Lead',
    description: 'Save a lead to the database, send a welcome email, and schedule the 3-email drip sequence (Day 1, Day 3, Day 7).',
    category:    'leads',
    tags:        ['capture', 'drip', 'email', 'database'],
    inputs: {
      email: {
        type:        'string',
        label:       'Email Address',
        required:    true,
        placeholder: 'prospect@example.com',
      },
      name: {
        type:        'string',
        label:       'Full Name',
        required:    false,
        placeholder: 'Jane Smith',
      },
      service: {
        type:     'enum',
        label:    'Service Interest',
        required: false,
        options:  SERVICE_OPTIONS,
        default:  'kitchen_remodel',
      },
      source: {
        type:        'string',
        label:       'Lead Source',
        required:    false,
        placeholder: 'instagram_dm / facebook_bot / email_bot / chatbot',
        default:     'command_center',
      },
      tier: {
        type:     'number',
        label:    'Package Tier (1–3)',
        required: false,
        default:  1,
      },
      budget: {
        type:        'string',
        label:       'Budget Range',
        required:    false,
        placeholder: '$50K–$100K',
      },
      location: {
        type:        'string',
        label:       'Location',
        required:    false,
        placeholder: 'Austin, TX',
      },
      message: {
        type:        'textarea',
        label:       'Original Message',
        required:    false,
        placeholder: 'Lead\'s original inquiry text',
      },
    },
    steps: [
      'POST to /api/leads/marketing',
      'Insert record in public_intake_leads (source: command_center)',
      'Send welcome email via Resend',
      'Schedule 3-email drip sequence in marketing_drip_queue',
      'Return leadId + funnel URL',
    ],
  },

  {
    id:          'estimate-project',
    name:        'Estimate Project Cost',
    description: 'Generate a detailed itemized cost estimate for a project scope using RSMeans-calibrated data.',
    category:    'analytics',
    tags:        ['estimate', 'cost', 'bom', 'estimate-bot'],
    inputs: {
      projectType: {
        type:        'string',
        label:       'Project Type',
        required:    true,
        placeholder: 'kitchen remodel with island, new cabinets, countertops',
      },
      squareFootage: {
        type:        'number',
        label:       'Square Footage',
        required:    false,
        placeholder: '250',
      },
      location: {
        type:        'string',
        label:       'Location',
        required:    false,
        placeholder: 'Austin, TX',
      },
      qualityTier: {
        type:     'enum',
        label:    'Quality Tier',
        required: false,
        options:  ['budget', 'standard', 'premium'],
        default:  'standard',
      },
    },
    steps: [
      'Send project spec to estimate-bot',
      'Bot generates itemized line items by category',
      'Return totalLow, totalHigh, lineItems, assumptions, contingency',
    ],
  },

  // ── Strategy prompts (brand-strategy driven copy) ─────────────────────────

  {
    id:          'email-subject-lines',
    name:        'Email Subject Lines (Nurture)',
    description: 'Generate 8 email subject lines for a nurture sequence. Confident, specific, no hype. Varied angles: speed, price, jurisdiction, portal, process.',
    category:    'content',
    tags:        ['email', 'subject-lines', 'nurture', 'ghl', 'strategy'],
    inputs: {
      audience: {
        type:        'enum',
        label:       'Target Audience',
        description: 'Who this sequence is for',
        required:    true,
        options:     ['homeowners', 'investors', 'contractors', 'developers'],
      },
      projectType: {
        type:        'string',
        label:       'Project Type',
        description: 'e.g. "ADU addition", "kitchen remodel", "whole-home renovation"',
        required:    true,
        placeholder: 'ADU addition',
      },
    },
    steps: [
      'Send audience + project type to email-subject-bot',
      'Bot applies brand voice rules: no emojis, no questions, no urgency bait',
      'Return 8 subject lines ordered Day 1–12 with varied angles',
    ],
  },

  {
    id:          'google-ad-copy',
    name:        'Google Ad Copy (Search)',
    description: 'Write 5 Google Search ad variations for a jurisdiction + keyword. Each has Headline 1 (30 chars), Headline 2 (30 chars), Description (90 chars). No exclamation marks.',
    category:    'content',
    tags:        ['google', 'ads', 'search', 'ppc', 'strategy'],
    inputs: {
      keyword: {
        type:        'string',
        label:       'Target Keyword',
        description: 'e.g. "ADU permit Arlington VA"',
        required:    true,
        placeholder: 'ADU permit Arlington VA',
      },
      jurisdiction: {
        type:        'string',
        label:       'Jurisdiction',
        description: 'City or county to name in the ads',
        required:    true,
        placeholder: 'Arlington, VA',
      },
      priceTier: {
        type:        'string',
        label:       'Price Tier to Feature',
        description: 'Which price point to anchor on',
        required:    false,
        placeholder: '$595–$1,499',
        default:     '$595–$1,499',
      },
    },
    steps: [
      'Send keyword + jurisdiction + price tier to google-ad-bot',
      'Bot writes 5 variations — each with distinct angle (speed / price / expertise / process / trust)',
      'Return ads as structured objects: headline1, headline2, description, angle',
    ],
  },

  {
    id:          'meta-ad-copy',
    name:        'Meta Ad Copy (Facebook / Instagram)',
    description: 'Write 3 Facebook/Instagram ad body copy variations (60–90 words each). Leads with a specific problem, introduces AI Concept as the low-risk first step. No rhetorical questions.',
    category:    'content',
    tags:        ['facebook', 'instagram', 'meta', 'ads', 'social', 'strategy'],
    inputs: {
      audience: {
        type:        'enum',
        label:       'Target Audience',
        required:    true,
        options:     ['homeowners', 'investors', 'contractors', 'developers'],
        default:     'homeowners',
      },
      jurisdictions: {
        type:        'string',
        label:       'Target Jurisdictions',
        description: 'Comma-separated list of cities/counties for ad targeting context',
        required:    true,
        placeholder: 'Arlington, Fairfax, Montgomery County',
      },
    },
    steps: [
      'Send audience + jurisdictions to meta-ad-bot',
      'Bot writes 3 variations — each leading with a different specific problem',
      'Return structured ads with problem, body, and CTA',
    ],
  },

  {
    id:          'ghl-day1-email',
    name:        'GHL Day 1 Welcome Email',
    description: 'Write the Day 1 welcome email for new Kealee leads. Confirms receipt, explains next steps (portal setup, 24hr response), introduces 3 service paths, single CTA to book a scope call. 200–260 words.',
    category:    'content',
    tags:        ['email', 'ghl', 'welcome', 'day1', 'nurture', 'strategy'],
    inputs: {
      leadName: {
        type:        'string',
        label:       'Lead First Name (optional)',
        description: 'Personalizes the greeting if known',
        required:    false,
        placeholder: 'Jane',
        default:     'there',
      },
      projectType: {
        type:        'string',
        label:       'Project Type (optional)',
        description: 'Personalizes the intro if known from intake',
        required:    false,
        placeholder: 'kitchen remodel',
      },
    },
    steps: [
      'Send lead name + project type to day1-email-bot',
      'Bot writes 200–260 word welcome email following brand voice rules',
      'Return subject line, full email body, word count, and CTA',
    ],
  },

  {
    id:          'ghl-day8-objection',
    name:        'GHL Day 8 Objection Email',
    description: 'Write the Day 8 objection-handling email for leads who haven\'t booked yet. Addresses 3 objections: readiness, bad past experience, jurisdiction uncertainty. 250–300 words.',
    category:    'content',
    tags:        ['email', 'ghl', 'objections', 'day8', 'nurture', 'strategy'],
    inputs: {
      jurisdiction: {
        type:        'string',
        label:       'Lead Jurisdiction (optional)',
        description: 'Personalizes the jurisdiction expertise block',
        required:    false,
        placeholder: 'Montgomery County, MD',
      },
    },
    steps: [
      'Send jurisdiction context to day8-email-bot',
      'Bot writes 250–300 word objection email with 3 distinct objection/response blocks',
      'Return subject line, full email body, objection labels, and CTA',
    ],
  },

  // ── Campaigns (chained pipelines) ─────────────────────────────────────────

  {
    id:          'qualify-and-pitch',
    name:        'Qualify → Pitch',
    description: 'Two-step pipeline: qualify an inbound lead message, then immediately generate a personalized concept pitch for the detected project type and tier.',
    category:    'campaigns',
    tags:        ['pipeline', 'qualify', 'pitch', 'chain'],
    chain:       ['qualify-lead', 'generate-pitch'],
    inputs: {
      message: {
        type:        'textarea',
        label:       'Lead Message',
        required:    true,
        placeholder: 'Raw inbound message from the prospect',
      },
      source: {
        type:     'string',
        label:    'Source',
        required: false,
        default:  'command_center',
      },
    },
    steps: [
      'Step 1 — qualify-lead: score and extract lead profile',
      'Step 2 — generate-pitch: use detected tier + projectType as pitch inputs',
      'Return full qualification + personalized pitch in one response',
    ],
  },

  {
    id:          'full-funnel',
    name:        'Full Funnel (Qualify → Pitch → Capture)',
    description: 'End-to-end pipeline: qualify a lead, generate a personalized pitch, capture to database, and trigger the 3-email drip sequence — one command.',
    category:    'campaigns',
    tags:        ['pipeline', 'full-funnel', 'chain', 'drip'],
    chain:       ['qualify-lead', 'generate-pitch', 'capture-lead'],
    inputs: {
      message: {
        type:        'textarea',
        label:       'Lead Message',
        required:    true,
        placeholder: 'Raw inbound message from the prospect',
      },
      email: {
        type:        'string',
        label:       'Email Address',
        required:    true,
        placeholder: 'prospect@example.com',
      },
      name: {
        type:        'string',
        label:       'Full Name',
        required:    false,
        placeholder: 'Jane Smith',
      },
      source: {
        type:     'string',
        label:    'Source',
        required: false,
        default:  'command_center',
      },
    },
    steps: [
      'Step 1 — qualify-lead: score and extract lead profile',
      'Step 2 — generate-pitch: generate personalized concept recommendation',
      'Step 3 — capture-lead: save to DB, send welcome email, schedule drip',
      'Return all outputs from all three steps',
    ],
  },

  {
    id:          'run-campaign',
    name:        'Run Full Campaign',
    description: 'Generate a complete multi-platform marketing campaign for a service. Returns ready-to-post content for Instagram, Facebook, Reddit, email, and DM outreach.',
    category:    'campaigns',
    tags:        ['campaign', 'multi-platform', 'content', 'social'],
    inputs: {
      service: {
        type:     'enum',
        label:    'Service Type',
        required: true,
        options:  SERVICE_OPTIONS,
      },
      audience: {
        type:     'enum',
        label:    'Target Audience',
        required: true,
        options:  AUDIENCE_OPTIONS,
      },
      tone: {
        type:     'enum',
        label:    'Tone',
        required: false,
        options:  TONE_OPTIONS,
        default:  'friendly',
      },
    },
    steps: [
      'Call marketing-bot with full campaign spec',
      'Return all platform outputs in a single response',
      'Each platform output is ready to copy + post',
    ],
  },

]

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getCommand(id: string): CommandSchema | undefined {
  return COMMAND_REGISTRY.find(c => c.id === id)
}

export function getCommandsByCategory(category: CommandCategory): CommandSchema[] {
  return COMMAND_REGISTRY.filter(c => c.category === category)
}

// ── Executor ──────────────────────────────────────────────────────────────────

/**
 * Execute a single atomic command (not a pipeline).
 * Calls the appropriate bot or external API and returns a StepResult.
 */
async function executeAtomicCommand(
  commandId: string,
  params:    Record<string, unknown>,
  baseUrl:   string,
): Promise<StepResult> {
  const start = Date.now()
  const step  = commandId

  try {
    // ── Bot-backed commands ──────────────────────────────────────────────────
    const BOT_MAP: Record<string, string> = {
      'generate-content':    'marketing-bot',
      'qualify-lead':        'lead-bot',
      'generate-pitch':      'pitch-bot',
      'estimate-project':    'estimate-bot',
      'run-campaign':        'marketing-bot',
      'email-subject-lines': 'email-subject-bot',
      'google-ad-copy':      'google-ad-bot',
      'meta-ad-copy':        'meta-ad-bot',
      'ghl-day1-email':      'day1-email-bot',
      'ghl-day8-objection':  'day8-email-bot',
    }

    if (BOT_MAP[commandId]) {
      const botId = BOT_MAP[commandId]
      const res   = await fetch(`${baseUrl}/api/bots/${botId}/execute`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ data: params }),
      })
      const json = await res.json()
      return {
        step,
        command:    commandId,
        status:     json.success ? 'success' : 'error',
        output:     json.result ?? {},
        durationMs: Date.now() - start,
        error:      json.success ? undefined : (json.error ?? 'Bot call failed'),
      }
    }

    // ── capture-lead → /api/leads/marketing ─────────────────────────────────
    if (commandId === 'capture-lead') {
      const webMainUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'
      const res        = await fetch(`${webMainUrl}/api/leads/marketing`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      return {
        step,
        command:    commandId,
        status:     'success',
        output:     json,
        durationMs: Date.now() - start,
      }
    }

    throw new Error(`Unknown atomic command: ${commandId}`)

  } catch (e: any) {
    return {
      step,
      command:    commandId,
      status:     'error',
      output:     {},
      durationMs: Date.now() - start,
      error:      e?.message ?? 'Unknown error',
    }
  }
}

/**
 * Build the params for each step in a pipeline by merging the
 * top-level params with outputs from previous steps.
 *
 * Chain-specific output remapping:
 *   qualify-lead  → generate-pitch:  map tier, projectType, budget, location, timeline, score
 *   generate-pitch → capture-lead:   pass tier as numeric (recommendedTier)
 *   qualify-lead  → capture-lead:    map projectType → service, budget, location
 */
function buildStepParams(
  commandId: string,
  topParams: Record<string, unknown>,
  stepOutputs: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...topParams }

  // Remap qualify-lead → generate-pitch
  if (commandId === 'generate-pitch' && stepOutputs['qualify-lead']) {
    const q = stepOutputs['qualify-lead']
    if (!merged.score)       merged.score       = q.score
    if (!merged.tier)        merged.tier        = q.tier
    if (!merged.projectType) merged.projectType = q.projectType
    if (!merged.budget)      merged.budget      = q.budget
    if (!merged.location)    merged.location    = q.location
    if (!merged.timeline)    merged.timeline    = q.timeline
  }

  // Remap qualify-lead → capture-lead
  if (commandId === 'capture-lead') {
    const q = stepOutputs['qualify-lead']
    const p = stepOutputs['generate-pitch']
    if (q) {
      if (!merged.service)  merged.service  = q.projectType
      if (!merged.budget)   merged.budget   = q.budget
      if (!merged.location) merged.location = q.location
    }
    if (p && !merged.tier) {
      // capture-lead expects tier as 1|2|3 number
      merged.tier = p.recommendedTier ?? 1
    }
  }

  return merged
}

/**
 * Main executor — handles both atomic commands and chained pipelines.
 */
export async function executeCommand(
  commandId: string,
  params:    Record<string, unknown>,
  baseUrl:   string,
): Promise<CommandResult> {
  const schema    = getCommand(commandId)
  const startedAt = new Date().toISOString()
  const startMs   = Date.now()

  if (!schema) {
    return {
      commandId,
      status:      'error',
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs:  0,
      steps:       [],
      output:      {},
      error:       `Unknown command: ${commandId}`,
    }
  }

  const stepResults: StepResult[]                     = []
  const stepOutputs: Record<string, Record<string, unknown>> = {}
  let   overallStatus: CommandResult['status']        = 'success'

  // ── Pipeline execution ───────────────────────────────────────────────────
  if (schema.chain && schema.chain.length > 0) {
    for (const subCommandId of schema.chain) {
      const stepParams = buildStepParams(subCommandId, params, stepOutputs)
      const result     = await executeAtomicCommand(subCommandId, stepParams, baseUrl)
      stepResults.push(result)
      stepOutputs[subCommandId] = result.output

      if (result.status === 'error') {
        overallStatus = 'partial'
        // Continue pipeline even after error — downstream steps may still work
      }
    }
  } else {
    // ── Single atomic command ────────────────────────────────────────────
    const result = await executeAtomicCommand(commandId, params, baseUrl)
    stepResults.push(result)
    stepOutputs[commandId] = result.output
    if (result.status === 'error') overallStatus = 'error'
  }

  // Merge all step outputs into a single flat output object
  const mergedOutput: Record<string, unknown> = {}
  for (const [cmdId, out] of Object.entries(stepOutputs)) {
    mergedOutput[cmdId] = out
  }
  // If single command, flatten directly
  if (stepResults.length === 1) {
    Object.assign(mergedOutput, stepOutputs[Object.keys(stepOutputs)[0]])
    delete mergedOutput[Object.keys(stepOutputs)[0] as keyof typeof mergedOutput]
    Object.assign(mergedOutput, stepResults[0].output)
  }

  return {
    commandId,
    status:      overallStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs:  Date.now() - startMs,
    steps:       stepResults,
    output:      schema.chain ? stepOutputs : (stepResults[0]?.output ?? {}),
  }
}
