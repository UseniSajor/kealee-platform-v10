/**
 * The boundary between a paid order and the site-plan engine.
 *
 * An order arrives as loose JSONB on `public_intake_leads.form_data`. This turns
 * it into a `ProjectContext`, runs it against the jurisdiction's certified rule
 * pack, and returns something an order page and an ops queue can both read.
 *
 * The rule that governs every mapping here: an absent field becomes `undefined`,
 * never a default. If the intake never asked whether the lot is a corner, the
 * answer is "we do not know" — which routes to a human — and not "interior",
 * which would silently apply the wrong setback. Guessing here is worse than
 * refusing, because the guess is invisible downstream.
 */

import type { ProjectContext } from '../rules/applicability'
import type { CertifiableRule } from '../rules/certification'
import type { RulePack } from '../rules/pack'
import { evaluateProjectRules, type ProjectRuleEvaluation } from '../rules/evaluate'
import type { ReviewItem } from '../review/disciplines'

/** The subset of intake form data the rules engine can use. */
export interface OrderFormData {
  address?: string
  jurisdictionCode?: string
  state?: string
  county?: string
  zone?: string
  zoning?: string
  overlays?: string[] | string
  environmentalOverlays?: string[] | string
  historicOverlays?: string[] | string
  use?: string
  service_type?: string
  property_type?: string
  buildingType?: string
  lotType?: string
  cornerLot?: boolean
  parcelStatus?: string
  subdivisionStatus?: string
  sqft?: number | string
  lot_size?: number | string
  lotAreaSqFt?: number | string
  lotWidthFt?: number | string
  frontageFt?: number | string
  proposedHeightFt?: number | string
  storeys?: number | string
  densityUnitsPerAcre?: number | string
  specialExceptions?: string[]
  variances?: string[]
  applicationDate?: string
  nonconforming?: boolean
  [key: string]: unknown
}

/** Jurisdictions with a rule pack. Everything else routes to manual review. */
export const SUPPORTED_JURISDICTIONS = ['prince_georges_md'] as const
export type SupportedJurisdiction = (typeof SUPPORTED_JURISDICTIONS)[number]

function num(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string') {
    const n = Number(v.replace(/[, ]/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function list(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string' && v.trim() !== '') return v.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
  return undefined
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

const LOT_TYPES = ['corner', 'interior', 'through', 'flag', 'reversed_frontage'] as const

export interface ContextBuildResult {
  context: ProjectContext
  /** Facts the intake did not establish. Each one can force a human review. */
  unknownFields: string[]
  /** Values that were present but not recognised, kept rather than dropped. */
  unmappedValues: { field: string; value: string }[]
}

/**
 * Builds a project context from order form data.
 *
 * Every field the intake did not answer is reported in `unknownFields` rather
 * than filled in, so the reason a rule went to review is traceable back to a
 * question nobody asked.
 */
export function buildProjectContext(
  formData: OrderFormData,
  jurisdictionCode: string,
): ContextBuildResult {
  const unknownFields: string[] = []
  const unmappedValues: ContextBuildResult['unmappedValues'] = []
  const note = (field: string, value: unknown) => {
    if (value === undefined) unknownFields.push(field)
    return value
  }

  const rawLotType = str(formData.lotType)
  let lotType: ProjectContext['lotType'] | undefined
  if (formData.cornerLot === true) lotType = 'corner'
  else if (formData.cornerLot === false) lotType = 'interior'
  else if (rawLotType) {
    const match = LOT_TYPES.find(t => t === rawLotType.toLowerCase().replace(/[\s-]/g, '_'))
    if (match) lotType = match
    else unmappedValues.push({ field: 'lotType', value: rawLotType })
  }
  note('lotType', lotType)

  const zone = str(formData.zone) ?? str(formData.zoning)
  note('zone', zone)

  const lotAreaSqFt = num(formData.lotAreaSqFt) ?? num(formData.lot_size)
  note('lotAreaSqFt', lotAreaSqFt)

  const lotWidthFt = num(formData.lotWidthFt)
  note('lotWidthFt', lotWidthFt)

  const frontageFt = num(formData.frontageFt)
  note('frontageFt', frontageFt)

  const proposedHeightFt = num(formData.proposedHeightFt)
  note('proposedHeightFt', proposedHeightFt)

  // Overlays absent is genuinely different from "no overlays". An intake that
  // never asked leaves this undefined; one that asked and got "none" gives [].
  const overlays = list(formData.overlays)
  note('overlays', overlays)
  const environmentalOverlays = list(formData.environmentalOverlays)
  note('environmentalOverlays', environmentalOverlays)
  const historicOverlays = list(formData.historicOverlays)
  note('historicOverlays', historicOverlays)

  const use = str(formData.use) ?? str(formData.service_type) ?? str(formData.property_type)
  note('use', use)

  const subdivisionStatusRaw = str(formData.subdivisionStatus)
  const subdivisionStatus = subdivisionStatusRaw as ProjectContext['subdivisionStatus'] | undefined
  note('subdivisionStatus', subdivisionStatus)

  const context: ProjectContext = {
    jurisdiction: jurisdictionCode,
    zone,
    overlays,
    environmentalOverlays,
    historicOverlays,
    use,
    buildingType: str(formData.buildingType),
    lotType,
    parcelStatus: str(formData.parcelStatus) as ProjectContext['parcelStatus'],
    subdivisionStatus,
    frontageFt,
    lotWidthFt,
    lotAreaSqFt,
    proposedHeightFt,
    proposedStoreys: num(formData.storeys),
    densityUnitsPerAcre: num(formData.densityUnitsPerAcre),
    specialExceptions: list(formData.specialExceptions),
    variances: list(formData.variances),
    applicationDate: str(formData.applicationDate),
    nonconforming: typeof formData.nonconforming === 'boolean' ? formData.nonconforming : undefined,
  }

  return { context, unknownFields, unmappedValues }
}

// ── Order evaluation ────────────────────────────────────────────────────────

export type OrderCoverage =
  /** A certified pack exists and the rules ran. */
  | 'automated'
  /** The jurisdiction is supported but the pack is not certified enough yet. */
  | 'data-assisted'
  /** No pack for this jurisdiction — a human produces the zoning analysis. */
  | 'manual-review'

export interface OrderRuleReport {
  orderId: string
  jurisdiction: string
  coverage: OrderCoverage
  /** Null when coverage is manual-review. */
  evaluation: ProjectRuleEvaluation | null
  /** Requirements the project must build to, where they were determined. */
  determinedRequirements: { ruleKey: string; codeSection: string; value: string; basis: string }[]
  /** Rules that need a human, with the discipline they were routed to. */
  reviewItems: ReviewItem[]
  unknownFields: string[]
  unmappedValues: { field: string; value: string }[]
  /** Never a claim that the jurisdiction approved anything. */
  regulatorilyResolved: boolean
  permitReadyBlocked: string[]
  /** Wording safe to show a customer. */
  customerSummary: string
  /** Wording for the ops queue. */
  opsSummary: string
}

export interface EvaluateOrderInput {
  orderId: string
  formData: OrderFormData
  jurisdictionCode: string
  /** The jurisdiction's certified rules, loaded from persistence — not parsed here. */
  rules: CertifiableRule[]
  pack: RulePack | null
  /** Current region hash per rule identity, from the last source refresh. */
  currentSourceHashes: Record<string, string | null>
  now?: Date
}

/**
 * Runs one order against its jurisdiction's rule pack.
 *
 * Touches no network and parses no ordinance — that is what makes it safe on a
 * request path. Everything it needs was produced by the maintenance workflow.
 */
export function evaluateOrder(input: EvaluateOrderInput): OrderRuleReport {
  const { context, unknownFields, unmappedValues } = buildProjectContext(input.formData, input.jurisdictionCode)

  const supported = (SUPPORTED_JURISDICTIONS as readonly string[]).includes(input.jurisdictionCode)
  if (!supported || !input.pack || input.rules.length === 0) {
    return {
      orderId: input.orderId,
      jurisdiction: input.jurisdictionCode,
      coverage: 'manual-review',
      evaluation: null,
      determinedRequirements: [],
      reviewItems: [],
      unknownFields,
      unmappedValues,
      regulatorilyResolved: false,
      permitReadyBlocked: [`No certified rule pack for ${input.jurisdictionCode}.`],
      customerSummary:
        'Your site is outside the areas we currently analyse automatically. A member of our team will ' +
        'prepare the zoning analysis by hand and it will be included in your package.',
      opsSummary:
        `No rule pack for ${input.jurisdictionCode}. Route to manual zoning analysis. ` +
        (unknownFields.length ? `Intake did not establish: ${unknownFields.join(', ')}.` : ''),
    }
  }

  const evaluation = evaluateProjectRules({
    projectId: input.orderId,
    context,
    pack: input.pack,
    rules: input.rules,
    currentSourceHashes: Object.fromEntries(
      Object.entries(input.currentSourceHashes).filter(([, v]) => v != null) as [string, string][],
    ),
    now: input.now,
  })

  const determinedRequirements = evaluation.evaluations
    .filter(e => e.outcome === 'APPLIED_CERTIFIED' && e.effectiveValue != null)
    .map(e => {
      const rule = input.rules.find(r => r.identity === e.ruleIdentity)
      const overridden = e.effectiveValue !== e.baseValue
      return {
        ruleKey: e.ruleKey,
        codeSection: rule?.scope.codeSection ?? e.ruleKey,
        value: e.effectiveValue as string,
        basis: overridden
          ? `${rule?.scope.codeSection ?? ''} as modified by an applicable footnote ` +
            `(base table value was ${e.baseValue ?? 'n/a'})`
          : `${rule?.scope.codeSection ?? ''}, certified against the published source`,
      }
    })

  // A pack that is certified but where this project still needs review is
  // data-assisted, not automated. The distinction matters to the customer.
  const coverage: OrderCoverage = evaluation.regulatorilyResolved ? 'automated' : 'data-assisted'

  return {
    orderId: input.orderId,
    jurisdiction: input.jurisdictionCode,
    coverage,
    evaluation,
    determinedRequirements,
    reviewItems: evaluation.reviewItems,
    unknownFields,
    unmappedValues,
    regulatorilyResolved: evaluation.regulatorilyResolved,
    permitReadyBlocked: evaluation.permitReadyBlocked,
    customerSummary:
      evaluation.regulatorilyResolved
        ? `${determinedRequirements.length} zoning requirement(s) were determined from the published ` +
          "Prince George's County ordinance. These are preliminary and are confirmed by the licensed " +
          'professional who reviews your package. County approval is a separate step.'
        : `${determinedRequirements.length} zoning requirement(s) were determined automatically; ` +
          `${evaluation.reviewItems.length} item(s) need a specialist to confirm before your package is ` +
          'finalised. We will not issue a plan that rests on an unconfirmed requirement.',
    opsSummary:
      `${evaluation.summary} ` +
      (unknownFields.length
        ? `Intake did not establish: ${unknownFields.join(', ')} — each of these can force a review item.`
        : 'Intake established every field the rules needed.'),
  }
}

/**
 * Whether an order can be marked ready for professional review.
 *
 * Deliberately conservative: an unresolved regulatory rule stops it, because a
 * plan drawn to an unconfirmed setback is not a draft, it is a hazard.
 */
export function canProceedToProfessionalReview(report: OrderRuleReport): {
  ok: boolean
  blockers: string[]
} {
  const blockers: string[] = []
  if (report.coverage === 'manual-review') {
    blockers.push('No certified rule pack for this jurisdiction; the zoning analysis is produced by hand.')
  }
  if (!report.regulatorilyResolved) {
    blockers.push(...report.permitReadyBlocked)
  }
  return { ok: blockers.length === 0, blockers }
}
