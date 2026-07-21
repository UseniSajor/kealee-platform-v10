/**
 * construction-os.ts
 *
 * Canonical module boundary definitions for the Kealee Construction OS.
 * This file is the authoritative source of truth for:
 *   - Domain ownership (which service owns what)
 *   - Capability matrix (which role can do what, in which phase)
 *   - Feature registry (slugs that map to ConstructionOSFeature DB rows)
 *   - Phase gates (which features unlock in which product phase)
 *
 * Engineers: import from here, never hard-code feature slugs or route prefixes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN OWNERSHIP MAP
// Maps each Construction OS domain to its canonical service + route prefix.
// ─────────────────────────────────────────────────────────────────────────────

export const DOMAIN_MAP = {
  schedule: {
    service:      'services/api',
    module:       'pm',
    routePrefix:  '/pm/schedule',
    endpoints: {
      list:         'GET  /pm/schedule',
      gantt:        'GET  /pm/schedule/gantt',
      criticalPath: 'GET  /pm/schedule/critical-path',
      milestones:   'GET  /pm/schedule/milestones',
      create:       'POST /pm/schedule',
      update:       'PATCH /pm/schedule/:id',
    },
    models:  ['ScheduleItem', 'PhaseMilestone'],
    phase:   1,
  },
  dailyLog: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/daily-logs',
    endpoints: {
      list:    'GET  /pm/daily-logs',
      summary: 'GET  /pm/daily-logs/summary',
      get:     'GET  /pm/daily-logs/:id',
      create:  'POST /pm/daily-logs',
      update:  'PATCH /pm/daily-logs/:id',
      signOff: 'POST /pm/daily-logs/:id/sign-off',
    },
    models:  ['DailyLog'],
    phase:   1,
  },
  rfi: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/rfis',
    endpoints: {
      list:    'GET  /pm/rfis',
      stats:   'GET  /pm/rfis/stats',
      get:     'GET  /pm/rfis/:id',
      create:  'POST /pm/rfis',
      update:  'PATCH /pm/rfis/:id',
      respond: 'POST /pm/rfis/:id/respond',
      close:   'POST /pm/rfis/:id/close',
    },
    models:  ['RFI'],
    phase:   1,
  },
  punchList: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/punch-list',
    endpoints: {
      list:    'GET  /pm/punch-list',
      stats:   'GET  /pm/punch-list/stats',
      get:     'GET  /pm/punch-list/:id',
      create:  'POST /pm/punch-list',
      update:  'PATCH /pm/punch-list/:id',
      resolve: 'POST /pm/punch-list/:id/resolve',
      verify:  'POST /pm/punch-list/:id/verify',
      reopen:  'POST /pm/punch-list/:id/reopen',
    },
    models:  ['Task'],    // punch list backed by Task model with type flag
    phase:   1,
  },
  budget: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/budget',
    endpoints: {
      overview:    'GET  /pm/budget',
      lines:       'GET  /pm/budget/lines',
      createLine:  'POST /pm/budget/lines',
      updateLine:  'PATCH /pm/budget/lines/:id',
      actuals:     'GET  /pm/budget/actuals',
      forecast:    'GET  /pm/budget/forecast',
    },
    models:  ['BudgetLine', 'BudgetEntry'],
    phase:   1,
  },
  changeOrder: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/change-orders',
    endpoints: {
      list:    'GET  /pm/change-orders',
      get:     'GET  /pm/change-orders/:id',
      create:  'POST /pm/change-orders',
      approve: 'POST /pm/change-orders/:id/approve',
      reject:  'POST /pm/change-orders/:id/reject',
    },
    models:  ['ChangeOrder'],
    phase:   2,
  },
  submittal: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/submittals',
    endpoints: {
      list:    'GET  /pm/submittals',
      get:     'GET  /pm/submittals/:id',
      create:  'POST /pm/submittals',
      submit:  'POST /pm/submittals/:id/submit',
      review:  'POST /pm/submittals/:id/review',
    },
    models:  ['Submittal'],
    phase:   2,
  },
  inspection: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/inspections',
    endpoints: {
      list:     'GET  /pm/inspections',
      get:      'GET  /pm/inspections/:id',
      schedule: 'POST /pm/inspections',
      result:   'PATCH /pm/inspections/:id/result',
    },
    models:  ['Inspection'],
    phase:   2,
  },
  safety: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/safety',
    endpoints: {
      incidents: 'GET  /pm/safety/incidents',
      create:    'POST /pm/safety/incidents',
      update:    'PATCH /pm/safety/incidents/:id',
    },
    models:  ['SafetyIncident'],
    phase:   2,
  },
  drawing: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/drawings',
    endpoints: {
      sets:      'GET  /pm/drawings/sets',
      sheets:    'GET  /pm/drawings/sheets',
      upload:    'POST /pm/drawings/sets',
      revisions: 'GET  /pm/drawings/sets/:id/revisions',
    },
    models:  ['DrawingSet'],
    phase:   2,
  },
  team: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/team',
    endpoints: {
      list:   'GET  /pm/team',
      add:    'POST /pm/team',
      remove: 'DELETE /pm/team/:memberId',
      roles:  'PATCH /pm/team/:memberId/role',
    },
    models:  [],    // relations on Project + User
    phase:   2,
  },
  timeTracking: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/time-tracking',
    endpoints: {
      list:    'GET  /pm/time-tracking',
      create:  'POST /pm/time-tracking',
      approve: 'POST /pm/time-tracking/:id/approve',
    },
    models:  [],
    phase:   2,
  },
  warranty: {
    service:     'services/api',
    module:      'pm',
    routePrefix: '/pm/warranty',
    endpoints: {
      list:   'GET  /pm/warranty',
      create: 'POST /pm/warranty',
      claim:  'POST /pm/warranty/:id/claim',
    },
    models:  [],
    phase:   3,
  },
  closeout: {
    service:     'services/api',
    module:      'closeout',
    routePrefix: '/closeout',
    endpoints: {
      status:   'GET  /closeout/:projectId',
      submit:   'POST /closeout/:projectId/submit',
      approve:  'POST /closeout/:projectId/approve',
    },
    models:  [],
    phase:   3,
  },
  handoff: {
    service:     'services/api',
    module:      'handoff',
    routePrefix: '/handoff',
    endpoints: {
      get:     'GET  /handoff/:projectId',
      create:  'POST /handoff/:projectId',
    },
    models:  [],
    phase:   3,
  },
  digitalTwin: {
    service:     'services/api',
    module:      'twins',
    routePrefix: '/twins',
    endpoints: {
      get:    'GET  /twins/:projectId',
      update: 'PATCH /twins/:projectId',
    },
    models:  [],
    package: 'core-ddts',
    phase:   3,
  },
} as const

export type ConstructionOSDomain = keyof typeof DOMAIN_MAP

// ─────────────────────────────────────────────────────────────────────────────
// CAPABILITY MATRIX
// role × domain × permission
// ─────────────────────────────────────────────────────────────────────────────

export type OSRole = 'owner' | 'gc' | 'subcontractor' | 'architect' | 'pm' | 'admin'
export type OSPermission = 'read' | 'write' | 'approve' | 'admin'

export const CAPABILITY_MATRIX: Record<
  ConstructionOSDomain,
  Partial<Record<OSRole, OSPermission[]>>
> = {
  schedule: {
    owner:         ['read'],
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  dailyLog: {
    owner:         ['read'],
    gc:            ['read', 'write'],
    subcontractor: ['write'],          // can create own logs
    architect:     ['read'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  rfi: {
    owner:         ['read', 'approve'],
    gc:            ['read', 'write'],
    subcontractor: ['read', 'write'],
    architect:     ['read', 'write', 'approve'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  punchList: {
    owner:         ['read', 'write'],  // owners can create punch items
    gc:            ['read', 'write', 'approve'],
    subcontractor: ['read'],
    architect:     ['read', 'write'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  budget: {
    owner:         ['read'],
    gc:            ['read', 'write'],
    subcontractor: [],                 // no budget access
    architect:     [],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  changeOrder: {
    owner:         ['read', 'approve'],
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read', 'approve'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  submittal: {
    owner:         ['read'],
    gc:            ['read', 'write'],
    subcontractor: ['read', 'write'],
    architect:     ['read', 'write', 'approve'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  inspection: {
    owner:         ['read'],
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read', 'approve'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  safety: {
    owner:         ['read'],
    gc:            ['read', 'write', 'approve'],
    subcontractor: ['write'],
    architect:     ['read'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  drawing: {
    owner:         ['read'],
    gc:            ['read'],
    subcontractor: ['read'],
    architect:     ['read', 'write', 'approve'],
    pm:            ['read', 'write'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  team: {
    owner:         ['read'],
    gc:            ['read', 'write', 'admin'],
    subcontractor: ['read'],
    architect:     ['read'],
    pm:            ['read', 'write', 'admin'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  timeTracking: {
    owner:         [],
    gc:            ['read', 'approve'],
    subcontractor: ['read', 'write'],
    architect:     [],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  warranty: {
    owner:         ['read', 'write'],  // owners file warranty claims
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  closeout: {
    owner:         ['read', 'approve'],
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read', 'approve'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  handoff: {
    owner:         ['read', 'approve'],
    gc:            ['read', 'write'],
    subcontractor: ['read'],
    architect:     ['read'],
    pm:            ['read', 'write', 'approve'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
  digitalTwin: {
    owner:         ['read'],
    gc:            ['read'],
    subcontractor: ['read'],
    architect:     ['read', 'write'],
    pm:            ['read'],
    admin:         ['read', 'write', 'approve', 'admin'],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURE REGISTRY
// Canonical slugs that must match ConstructionOSFeature.slug in DB.
// ─────────────────────────────────────────────────────────────────────────────

export const OS_FEATURES = {
  // Phase 1 — Core OS (always enabled for CONSTRUCTION_READY projects)
  DAILY_LOG:         'daily-log',
  SCHEDULE_VIEW:     'schedule-view',
  SCHEDULE_GANTT:    'schedule-gantt',
  RFI_LIST:          'rfi-list',
  RFI_CREATE:        'rfi-create',
  PUNCH_LIST:        'punch-list',
  BUDGET_OVERVIEW:   'budget-overview',
  PHOTO_LOG:         'photo-log',
  PROJECT_REPORTS:   'project-reports',

  // Phase 2 — Advanced Execution
  CHANGE_ORDERS:     'change-orders',
  SUBMITTALS:        'submittals',
  INSPECTIONS:       'inspections',
  SAFETY_LOG:        'safety-log',
  DRAWINGS:          'drawings',
  TEAM_MANAGEMENT:   'team-management',
  TIME_TRACKING:     'time-tracking',
  MEETINGS:          'meetings',
  SELECTIONS:        'selections',
  PRODUCTIVITY:      'productivity',

  // Phase 3 — Enterprise
  WARRANTY:          'warranty',
  CLOSEOUT:          'closeout',
  HANDOFF:           'handoff',
  DIGITAL_TWIN:      'digital-twin',
  BIM_VIEWER:        'bim-viewer',
  AI_MONITORING:     'ai-monitoring',
  PORTFOLIO_VIEW:    'portfolio-view',
  OWNER_REPORTING:   'owner-reporting',
  PREDICTIVE_COST:   'predictive-cost',
} as const

export type OSFeatureSlug = typeof OS_FEATURES[keyof typeof OS_FEATURES]

// ─────────────────────────────────────────────────────────────────────────────
// PHASE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type OSPhase = 1 | 2 | 3

export const PHASE_DEFINITIONS: Record<OSPhase, {
  name:        string
  description: string
  features:    OSFeatureSlug[]
  tier:        'standard' | 'pro' | 'enterprise'
}> = {
  1: {
    name:        'Core OS',
    description: 'Field operations, daily logs, schedule, RFIs, punch list, budget overview',
    features: [
      OS_FEATURES.DAILY_LOG,
      OS_FEATURES.SCHEDULE_VIEW,
      OS_FEATURES.SCHEDULE_GANTT,
      OS_FEATURES.RFI_LIST,
      OS_FEATURES.RFI_CREATE,
      OS_FEATURES.PUNCH_LIST,
      OS_FEATURES.BUDGET_OVERVIEW,
      OS_FEATURES.PHOTO_LOG,
      OS_FEATURES.PROJECT_REPORTS,
    ],
    tier: 'standard',
  },
  2: {
    name:        'Advanced Execution',
    description: 'Change orders, submittals, inspections, safety, drawings, team, time tracking',
    features: [
      OS_FEATURES.CHANGE_ORDERS,
      OS_FEATURES.SUBMITTALS,
      OS_FEATURES.INSPECTIONS,
      OS_FEATURES.SAFETY_LOG,
      OS_FEATURES.DRAWINGS,
      OS_FEATURES.TEAM_MANAGEMENT,
      OS_FEATURES.TIME_TRACKING,
      OS_FEATURES.MEETINGS,
      OS_FEATURES.SELECTIONS,
      OS_FEATURES.PRODUCTIVITY,
    ],
    tier: 'pro',
  },
  3: {
    name:        'Enterprise',
    description: 'Digital twin, BIM, AI monitoring, portfolio, owner reporting, predictive cost',
    features: [
      OS_FEATURES.WARRANTY,
      OS_FEATURES.CLOSEOUT,
      OS_FEATURES.HANDOFF,
      OS_FEATURES.DIGITAL_TWIN,
      OS_FEATURES.BIM_VIEWER,
      OS_FEATURES.AI_MONITORING,
      OS_FEATURES.PORTFOLIO_VIEW,
      OS_FEATURES.OWNER_REPORTING,
      OS_FEATURES.PREDICTIVE_COST,
    ],
    tier: 'enterprise',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE REGISTRY
// Canonical map of which microservice handles which domain.
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_REGISTRY = {
  'services/api':         { port: 3001, description: 'Main API — all PM routes live here' },
  'services/os-pm':       { port: 3005, description: 'Dedicated PM microservice (future split)' },
  'services/worker':      { port: null, description: 'Background jobs — RFI reminders, reports' },
  'services/command-center': { port: 3006, description: 'KeaBot orchestration' },
  'packages/core-ddts':   { port: null, description: 'Digital Development Twin System' },
  'packages/core-bim':    { port: null, description: 'BIM/IFC viewer integration' },
  'packages/core-events': { port: null, description: 'Event bus for OS state changes' },
  'packages/core-rules':  { port: null, description: 'Business rules engine' },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// PM ROUTE SURFACE
// Flat map of every exposed endpoint in the PM module.
// Useful for API contract validation and client generation.
// ─────────────────────────────────────────────────────────────────────────────

export const PM_ROUTE_SURFACE = [
  // ── Schedule ──────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/schedule',               domain: 'schedule',   phase: 1 },
  { method: 'GET',   path: '/pm/schedule/gantt',          domain: 'schedule',   phase: 1 },
  { method: 'GET',   path: '/pm/schedule/critical-path',  domain: 'schedule',   phase: 1 },
  { method: 'GET',   path: '/pm/schedule/milestones',     domain: 'schedule',   phase: 1 },
  { method: 'POST',  path: '/pm/schedule',                domain: 'schedule',   phase: 1 },
  { method: 'PATCH', path: '/pm/schedule/:id',            domain: 'schedule',   phase: 1 },
  // ── Daily Logs ────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/daily-logs',              domain: 'dailyLog',   phase: 1 },
  { method: 'GET',   path: '/pm/daily-logs/summary',      domain: 'dailyLog',   phase: 1 },
  { method: 'GET',   path: '/pm/daily-logs/:id',          domain: 'dailyLog',   phase: 1 },
  { method: 'POST',  path: '/pm/daily-logs',              domain: 'dailyLog',   phase: 1 },
  { method: 'PATCH', path: '/pm/daily-logs/:id',          domain: 'dailyLog',   phase: 1 },
  { method: 'POST',  path: '/pm/daily-logs/:id/sign-off', domain: 'dailyLog',   phase: 1 },
  // ── RFIs ──────────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/rfis',                    domain: 'rfi',        phase: 1 },
  { method: 'GET',   path: '/pm/rfis/stats',              domain: 'rfi',        phase: 1 },
  { method: 'GET',   path: '/pm/rfis/:id',                domain: 'rfi',        phase: 1 },
  { method: 'POST',  path: '/pm/rfis',                    domain: 'rfi',        phase: 1 },
  { method: 'PATCH', path: '/pm/rfis/:id',                domain: 'rfi',        phase: 1 },
  { method: 'POST',  path: '/pm/rfis/:id/respond',        domain: 'rfi',        phase: 1 },
  // ── Punch List ────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/punch-list',              domain: 'punchList',  phase: 1 },
  { method: 'GET',   path: '/pm/punch-list/stats',        domain: 'punchList',  phase: 1 },
  { method: 'POST',  path: '/pm/punch-list',              domain: 'punchList',  phase: 1 },
  { method: 'POST',  path: '/pm/punch-list/:id/resolve',  domain: 'punchList',  phase: 1 },
  { method: 'POST',  path: '/pm/punch-list/:id/verify',   domain: 'punchList',  phase: 1 },
  // ── Budget ────────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/budget',                  domain: 'budget',     phase: 1 },
  { method: 'GET',   path: '/pm/budget/lines',            domain: 'budget',     phase: 1 },
  { method: 'POST',  path: '/pm/budget/lines',            domain: 'budget',     phase: 1 },
  { method: 'GET',   path: '/pm/budget/forecast',         domain: 'budget',     phase: 1 },
  // ── Change Orders ─────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/change-orders',           domain: 'changeOrder', phase: 2 },
  { method: 'POST',  path: '/pm/change-orders',           domain: 'changeOrder', phase: 2 },
  { method: 'POST',  path: '/pm/change-orders/:id/approve', domain: 'changeOrder', phase: 2 },
  // ── Submittals ────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/submittals',              domain: 'submittal',  phase: 2 },
  { method: 'POST',  path: '/pm/submittals',              domain: 'submittal',  phase: 2 },
  { method: 'POST',  path: '/pm/submittals/:id/submit',   domain: 'submittal',  phase: 2 },
  // ── Safety ────────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/safety/incidents',        domain: 'safety',     phase: 2 },
  { method: 'POST',  path: '/pm/safety/incidents',        domain: 'safety',     phase: 2 },
  // ── Drawings ──────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/drawings/sets',           domain: 'drawing',    phase: 2 },
  { method: 'GET',   path: '/pm/drawings/sheets',         domain: 'drawing',    phase: 2 },
  { method: 'POST',  path: '/pm/drawings/sets',           domain: 'drawing',    phase: 2 },
  // ── Team ──────────────────────────────────────────────────────────────────
  { method: 'GET',   path: '/pm/team',                    domain: 'team',       phase: 2 },
  { method: 'POST',  path: '/pm/team',                    domain: 'team',       phase: 2 },
  // ── Closeout / Handoff ────────────────────────────────────────────────────
  { method: 'GET',   path: '/closeout/:projectId',        domain: 'closeout',   phase: 3 },
  { method: 'POST',  path: '/closeout/:projectId/submit', domain: 'closeout',   phase: 3 },
  { method: 'GET',   path: '/handoff/:projectId',         domain: 'handoff',    phase: 3 },
] as const satisfies ReadonlyArray<{
  method: string
  path:   string
  domain: ConstructionOSDomain
  phase:  OSPhase
}>

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Check if a role has a permission on a domain. */
export function canDo(
  role:       OSRole,
  domain:     ConstructionOSDomain,
  permission: OSPermission,
): boolean {
  return (CAPABILITY_MATRIX[domain][role] ?? []).includes(permission)
}

/** Get all features enabled for a given phase (inclusive). */
export function featuresUpToPhase(maxPhase: OSPhase): OSFeatureSlug[] {
  const all: OSFeatureSlug[] = []
  for (let p = 1; p <= maxPhase; p++) {
    all.push(...PHASE_DEFINITIONS[p as OSPhase].features)
  }
  return all
}

/** Get the phase a feature belongs to. */
export function getFeaturePhase(slug: OSFeatureSlug): OSPhase {
  for (const [phase, def] of Object.entries(PHASE_DEFINITIONS)) {
    if ((def.features as readonly string[]).includes(slug)) return Number(phase) as OSPhase
  }
  return 3
}
