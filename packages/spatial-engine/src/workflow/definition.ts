/**
 * The site-plan workflow, as versioned executable data.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * The engine is ~23,000 lines and, at the time this was written, exactly one
 * file outside the package imported it. Everything that draws — GIS, twin,
 * envelope, composition, render, QC, persistence — had no caller. A module that
 * exists but is unreachable is not implemented.
 *
 * This file is the authority on what stages exist, what order they run in, and
 * which existing function each one calls. It is data, not prose: the state
 * machine, the guard, the worker registry and the synchronisation test all read
 * from it, so documentation and behaviour cannot drift apart.
 *
 * ── Reusing the schema's vocabulary ────────────────────────────────────────
 *
 * `SitePlanStageCode` already existed in Prisma with eight values and had ZERO
 * references anywhere in the engine — the vocabulary was defined and never
 * implemented. This maps onto those eight rather than minting a parallel set,
 * so no destructive enum migration is needed and every detailed stage still
 * persists under a code the database already accepts.
 */

/** The eight codes `SitePlanStageCode` persists. Do not add without a migration. */
export type PersistedStageCode =
  | 'PARCEL_RESOLUTION'
  | 'DOCUMENT_COLLECTION'
  | 'FEASIBILITY'
  | 'PLAN_GENERATION'
  | 'COMPLIANCE_AUDIT'
  | 'PROFESSIONAL_REVIEW'
  | 'SUBMITTED_TO_JURISDICTION'
  | 'SUBMISSION_CORRECTIONS'

/** Practical grouping, so activation stays manageable. */
export type StageGroup =
  | 'A_INTAKE' | 'B_EVIDENCE' | 'C_JURISDICTION_RULES' | 'D_EXISTING_CONDITIONS'
  | 'E_DESIGN' | 'F_SHEETS_EXPORTS' | 'G_PRELIMINARY_QC' | 'H_PROFESSIONAL_REVIEW'
  | 'I_ISSUANCE_QC' | 'J_SUBMISSION'

/** Registered job names. These ARE the detailed states. */
export type SitePlanJobName =
  // First release — the preliminary vertical slice.
  | 'siteplan.initialize'
  | 'siteplan.resolve_property'
  | 'siteplan.ingest_documents'
  | 'siteplan.resolve_jurisdiction'
  | 'siteplan.evaluate_rules'
  | 'siteplan.build_existing_conditions'
  | 'siteplan.generate_envelope'
  | 'siteplan.generate_layout'
  | 'siteplan.compose_sheets'
  | 'siteplan.render_exports'
  | 'siteplan.run_draft_qc'
  | 'siteplan.persist_package'
  | 'siteplan.deliver_preliminary'
  // Connected after the slice is live.
  | 'siteplan.ingest_survey'
  | 'siteplan.reconcile_survey'
  | 'siteplan.generate_grading'
  | 'siteplan.generate_drainage'
  | 'siteplan.generate_swm'
  | 'siteplan.generate_utilities'
  | 'siteplan.generate_environmental'
  | 'siteplan.route_review'
  | 'siteplan.apply_revisions'
  | 'siteplan.run_issuance_qc'
  | 'siteplan.build_submission'
  | 'siteplan.ingest_comments'

export interface StageDefinition {
  job: SitePlanJobName
  group: StageGroup
  /** The code written to `SitePlanStageExecution.stage`. */
  persistAs: PersistedStageCode
  /** Human summary. Printed in docs; never the source of behaviour. */
  purpose: string
  /**
   * Existing exported function this stage calls, as `module#export`. Null where
   * the stage is orchestration only. NEVER a function invented for this file —
   * the point is to connect what exists.
   */
  implementation: string | null
  /** Jobs that must have COMPLETED before this one may start. */
  requires: SitePlanJobName[]
  /**
   * Whether the same input reliably produces the same output. A stage that
   * calls a live GIS service is not deterministic, which is why its result is
   * persisted and reused rather than recomputed on resume.
   */
  deterministic: boolean
  /** Safe to run again after a partial failure without corrupting state. */
  retrySafe: boolean
  /** Reaching the end of this stage means the customer can be given something. */
  deliverable?: boolean
  /** Part of the first-release vertical slice. */
  inFirstRelease: boolean
}

/**
 * Bump when the ORDER or the SET of stages changes in a way that would make an
 * in-flight workflow resume incorrectly. Adding a field to a payload does not
 * require a bump; removing a stage or reordering does.
 */
export const SITE_PLAN_WORKFLOW_VERSION = 1

export const SITE_PLAN_STAGES: StageDefinition[] = [
  {
    job: 'siteplan.initialize', group: 'A_INTAKE', persistAs: 'PARCEL_RESOLUTION',
    purpose: 'Create or resume the workflow instance and record the order linkage.',
    implementation: null,
    requires: [], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.resolve_property', group: 'A_INTAKE', persistAs: 'PARCEL_RESOLUTION',
    purpose: 'Address to lot, zone and street frontage from the jurisdiction GIS.',
    implementation: 'jurisdictions/pgatlas#resolvePgAtlasSite',
    requires: ['siteplan.initialize'], deterministic: false, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.ingest_documents', group: 'B_EVIDENCE', persistAs: 'DOCUMENT_COLLECTION',
    purpose: 'Register uploaded evidence and its provenance. No survey is required to draw.',
    implementation: 'persistence/store#persistIngestionCycle',
    requires: ['siteplan.initialize'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.resolve_jurisdiction', group: 'C_JURISDICTION_RULES', persistAs: 'FEASIBILITY',
    purpose: 'Identify the governing jurisdiction. Never guessed.',
    implementation: 'integration/site-plan-order#buildProjectContext',
    requires: ['siteplan.resolve_property'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.evaluate_rules', group: 'C_JURISDICTION_RULES', persistAs: 'FEASIBILITY',
    purpose: 'Evaluate the certified rule pack and record the exact version used.',
    implementation: 'integration/site-plan-order#evaluateOrder',
    requires: ['siteplan.resolve_jurisdiction'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.build_existing_conditions', group: 'D_EXISTING_CONDITIONS', persistAs: 'FEASIBILITY',
    purpose: 'Level 1 site twin: parcel, 2-ft contours, vertical datum, sources.',
    implementation: 'site-plan/site-twin#createSiteTwin',
    requires: ['siteplan.evaluate_rules', 'siteplan.ingest_documents'],
    deterministic: false, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.generate_envelope', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Per-edge setback inset following the lot outline; BRL and yard classification.',
    implementation: 'site-plan/buildable-envelope#deriveBuildableEnvelope',
    requires: ['siteplan.build_existing_conditions'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.generate_layout', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Estimate the footprint from the customer programme and set it to the front building line.',
    implementation: 'site-plan/footprint-programme#estimateFootprint',
    requires: ['siteplan.generate_envelope'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.compose_sheets', group: 'F_SHEETS_EXPORTS', persistAs: 'PLAN_GENERATION',
    purpose: 'Choose the sheet set. An infill lot composes to one or two sheets, never ten.',
    implementation: 'sheets/composer#composeSheets',
    requires: ['siteplan.generate_layout'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.render_exports', group: 'F_SHEETS_EXPORTS', persistAs: 'PLAN_GENERATION',
    purpose: 'Render the vector PDF at a dimensionally true scale.',
    implementation: 'sheets/render-pdf#renderSheetSetPdf',
    requires: ['siteplan.compose_sheets'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.run_draft_qc', group: 'G_PRELIMINARY_QC', persistAs: 'COMPLIANCE_AUDIT',
    purpose: 'Drafting QC. Findings are recorded; pending_seal items never withhold the plan.',
    implementation: 'review/checklist#runIssuanceQc',
    requires: ['siteplan.render_exports'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.persist_package', group: 'G_PRELIMINARY_QC', persistAs: 'COMPLIANCE_AUDIT',
    purpose: 'Write twin, rules, sheets, artifacts and findings.',
    implementation: 'persistence/store#persistIngestionCycle',
    requires: ['siteplan.run_draft_qc'], deterministic: true, retrySafe: true, inFirstRelease: true,
  },
  {
    job: 'siteplan.deliver_preliminary', group: 'G_PRELIMINARY_QC', persistAs: 'COMPLIANCE_AUDIT',
    purpose: 'Publish the preliminary package to the existing deliverable store.',
    implementation: null,
    requires: ['siteplan.persist_package'],
    deterministic: true, retrySafe: true, deliverable: true, inFirstRelease: true,
  },

  // ── Connected after the vertical slice is live ────────────────────────────
  {
    job: 'siteplan.ingest_survey', group: 'B_EVIDENCE', persistAs: 'DOCUMENT_COLLECTION',
    purpose: 'Parse an uploaded survey. CSV, LandXML, DXF, LAS or PDF.',
    implementation: 'survey/index#parseSurveyCsv',
    requires: ['siteplan.initialize'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.reconcile_survey', group: 'B_EVIDENCE', persistAs: 'DOCUMENT_COLLECTION',
    purpose: 'Reconcile survey against GIS. Certified geometry is never moved or rubber-sheeted.',
    implementation: 'survey/reconcile#reconcileSurvey',
    requires: ['siteplan.ingest_survey'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.generate_grading', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Proposed grading. Requires spot elevations that only a field survey supplies.',
    implementation: 'site-plan/design#generateDesign',
    requires: ['siteplan.generate_layout'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.generate_drainage', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'On-site drainage and the 100-year overflow path, Sec. 32-162.',
    implementation: 'site-plan/design#generateDesign',
    requires: ['siteplan.generate_grading'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.generate_swm', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Stormwater management concept and computations.',
    implementation: 'site-plan/engineering#waterQualityVolume',
    requires: ['siteplan.generate_drainage'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.generate_utilities', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Utility layout. Sec. 32-106 requires existing and proposed to be shown.',
    implementation: null,
    requires: ['siteplan.generate_layout'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.generate_environmental', group: 'E_DESIGN', persistAs: 'PLAN_GENERATION',
    purpose: 'Streams, wetlands, floodplain, buffers and woodland.',
    implementation: 'jurisdictions/pg-site-data#fetchPgSiteConstraints',
    requires: ['siteplan.build_existing_conditions'], deterministic: false, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.route_review', group: 'H_PROFESSIONAL_REVIEW', persistAs: 'PROFESSIONAL_REVIEW',
    purpose: 'Route content to the professionals authorised for each subject.',
    implementation: 'review/content-scope#buildResponsibilityBlock',
    requires: ['siteplan.deliver_preliminary'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.apply_revisions', group: 'H_PROFESSIONAL_REVIEW', persistAs: 'PROFESSIONAL_REVIEW',
    purpose: 'Apply reviewer redlines and bump the sheet revision.',
    implementation: null,
    requires: ['siteplan.route_review'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.run_issuance_qc', group: 'I_ISSUANCE_QC', persistAs: 'COMPLIANCE_AUDIT',
    purpose: 'Issuance QC against evidence. Approval cannot clear absent evidence.',
    implementation: 'review/evidence#applyEvidenceGate',
    requires: ['siteplan.route_review'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.build_submission', group: 'J_SUBMISSION', persistAs: 'SUBMITTED_TO_JURISDICTION',
    purpose: 'Assemble the submission package and county checklist.',
    implementation: 'review/checklist#buildCountyChecklist',
    requires: ['siteplan.run_issuance_qc'],
    deterministic: true, retrySafe: true, deliverable: true, inFirstRelease: false,
  },
  {
    job: 'siteplan.ingest_comments', group: 'J_SUBMISSION', persistAs: 'SUBMISSION_CORRECTIONS',
    purpose: 'Record jurisdiction review comments and reopen the affected stages.',
    implementation: null,
    requires: ['siteplan.build_submission'], deterministic: true, retrySafe: true, inFirstRelease: false,
  },
]

const BY_JOB = new Map(SITE_PLAN_STAGES.map(s => [s.job, s]))

export function stageFor(job: SitePlanJobName): StageDefinition {
  const s = BY_JOB.get(job)
  if (!s) throw new Error(`Unregistered site-plan job: ${job}`)
  return s
}

export function isRegisteredJob(name: string): name is SitePlanJobName {
  return BY_JOB.has(name as SitePlanJobName)
}

/** The first-release vertical slice, in dependency order. */
export const FIRST_RELEASE_STAGES: StageDefinition[] =
  SITE_PLAN_STAGES.filter(s => s.inFirstRelease)

/** The job that starts a workflow. */
export const FIRST_JOB: SitePlanJobName = 'siteplan.initialize'

/**
 * Every stage whose implementation names a function that must exist.
 *
 * The synchronisation test reads this and fails if a stage points at something
 * the package does not export — which is what stops this file from drifting
 * into documentation of modules nobody wrote.
 */
export function implementedStages(): { job: SitePlanJobName; module: string; export: string }[] {
  return SITE_PLAN_STAGES
    .filter((s): s is StageDefinition & { implementation: string } => s.implementation !== null)
    .map(s => {
      const [module, exp] = s.implementation.split('#')
      return { job: s.job, module, export: exp }
    })
}
