/**
 * The five E_DESIGN stage processors — grading, drainage, stormwater, utilities
 * and environmental constraints.
 *
 * Same rule as the first release: each processor is a thin adapter over a
 * function that already exists. `generateDesign()` produces every discipline's
 * proposed features in one pass, and each stage here reports the slice it owns.
 * Calling it once per stage is deliberate — the design is a pure function of the
 * twin, so four calls agree, and a stage that read another stage's features
 * would be unable to run on its own after a reopen.
 *
 * What these stages do NOT do is decide anything a licensed professional decides.
 * Every output carries a `beforeSeal` list saying what a Maryland PE or surveyor
 * must supply, and none of it withholds the drawing: the platform drafts, the
 * professional seals. `QcFinding.severity = 'pending_seal'` is the same idea one
 * layer up.
 */

import type { StageContext, StageResult, StageProcessor } from '../context'
import { requirePriorOutput } from '../context'
import type { SitePlanJobName } from '../definition'

import {
  generateDesign, type DesignResult, type DesignAssumption,
} from '../../site-plan/design'
import type { Calculation } from '../../site-plan/engineering'
import { requiresSedimentAndStormwaterReview } from '../../site-plan/disturbance'
import { fetchPgSiteConstraints, type PgSiteDataResult } from '../../jurisdictions/pg-site-data'
import type { SiteFeature, Position } from '../../site-plan/site-twin'
import type { LotPackage } from '../../self-perform/lot-package'
import {
  lotPackageFrom, type ResolvePropertyOutput, type ExistingConditionsOutput,
} from './first-release'

// ── Stage payloads ──────────────────────────────────────────────────────────

export interface GradingOutput {
  /** The interval the proposed contours are drawn at, in feet. */
  contourIntervalFt: number
  verticalDatum: string | null
  /** False when no benchmark is established and elevations are relative. */
  datumEstablished: boolean
  existingContourCount: number
  gradedAreaDrawn: boolean
  spotElevationCount: number
  assumptions: DesignAssumption[]
  notes: string[]
  beforeSeal: string[]
  summary: string
}

export interface DrainageOutput {
  drainageAreaAcres: number | null
  percentImpervious: number | null
  compositeRunoffCoefficient: number | null
  timeOfConcentrationMin: number | null
  peakDischargeCfs: number | null
  /** Sec. 32-162 — needs finished grades, which need a field survey. */
  overflowPathEstablished: boolean
  calculations: Record<string, Calculation<unknown>>
  beforeSeal: string[]
  summary: string
}

export interface StormwaterOutput {
  waterQualityVolumeCf: number | null
  rv: number | null
  percentImpervious: number | null
  practice: {
    type: string
    footprintSqFt: number
    pondingDepthFt: number
  } | null
  /** The 5,000 sq ft gate, from the disturbance calculation. */
  review: { required: boolean; certain: boolean; reason: string }
  knownDisturbanceSqFt: number
  thresholdSqFt: number
  sedimentControlDrawn: boolean
  calculations: Record<string, Calculation<unknown>>
  assumptions: DesignAssumption[]
  beforeSeal: string[]
  summary: string
}

export interface UtilitiesOutput {
  runs: { type: string; lengthFt: number }[]
  /** Sec. 32-106 wants existing AND proposed. The mains are not in the model. */
  existingMainsResolved: boolean
  assumptions: DesignAssumption[]
  beforeSeal: string[]
  summary: string
}

export interface EnvironmentalOutput {
  featureCount: number
  layers: {
    layer: string; title: string; count: number; drawn: number
    error: string | null; truncated: boolean
  }[]
  findings: string[]
  unavailable: { what: string; detail: string }[]
  /**
   * False when a layer did not answer. An absent constraint and an unanswered
   * query render identically on a sheet, and only one of them is a finding.
   */
  constraintsDetermined: boolean
  source: PgSiteDataResult['source'] | null
  summary: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

/** A drawn feature, with the optional members the design module fills in. */
type DrawnFeature = SiteFeature & {
  attributes?: Record<string, unknown>
  line?: Position[]
}

function ofKind(d: DesignResult, kind: SiteFeature['kind']): DrawnFeature[] {
  return d.features.filter(f => f.kind === kind) as DrawnFeature[]
}

function attr(f: DrawnFeature | undefined, key: string): unknown {
  return f?.attributes?.[key]
}

/**
 * The named calculations that were actually produced.
 *
 * A site with no parcel area produces none of them, and an absent key is the
 * honest record of that — a key holding `undefined` reads as a calculation that
 * ran and returned nothing.
 */
function pickCalculations(
  calcs: Record<string, Calculation<unknown>>, keys: string[],
): Record<string, Calculation<unknown>> {
  const out: Record<string, Calculation<unknown>> = {}
  for (const k of keys) if (calcs[k]) out[k] = calcs[k]
  return out
}

function polylineLengthFt(line: Position[] | undefined): number {
  if (!line || line.length < 2) return 0
  let total = 0
  for (let i = 1; i < line.length; i++) {
    total += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])
  }
  return Math.round(total * 10) / 10
}

/**
 * The contour interval the proposed grading is drawn at.
 *
 * The county publishes 2-ft contours, so the existing-conditions stage records
 * the interval it actually received. Older workflows persisted before that
 * field existed, so the spacing of the returned elevations is the fallback —
 * and 1 ft, the design module's default, is the last resort rather than the
 * first assumption.
 */
function contourIntervalFrom(cond: ExistingConditionsOutput | undefined): number {
  const stated = num((cond as { intervalFt?: number } | undefined)?.intervalFt)
  if (stated && stated > 0) return stated

  const els = (cond?.elevationsFt ?? []).slice().sort((a, b) => a - b)
  let smallest = Infinity
  for (let i = 1; i < els.length; i++) {
    const gap = els[i] - els[i - 1]
    if (gap > 0 && gap < smallest) smallest = gap
  }
  return Number.isFinite(smallest) ? smallest : 1
}

/**
 * Runs the design for this workflow.
 *
 * Deterministic given the persisted stage outputs, so every design stage sees
 * the same drawing without one stage depending on another's features.
 */
function designFrom(ctx: StageContext): { pkg: LotPackage; design: DesignResult } {
  const pkg = lotPackageFrom(ctx)
  const cond = ctx.priorOutputs['siteplan.build_existing_conditions'] as
    | ExistingConditionsOutput | undefined
  const f = ctx.subject.formData

  const design = generateDesign({
    twin: pkg.twin,
    contourIntervalFt: contourIntervalFrom(cond),
    hasDemolition: f.demolition === true || f.hasDemolition === true,
    hasRoadWork: f.roadWork === true || f.hasRoadWork === true,
  })
  return { pkg, design }
}

function assumptionsFor(d: DesignResult, features: string[]): DesignAssumption[] {
  return d.assumptions.filter(a => features.includes(a.feature))
}

// ── Processors ──────────────────────────────────────────────────────────────

/**
 * Proposed grading.
 *
 * Drawn, always — a grading plan on an assumed datum is what a drafter produces
 * before the surveyor sets the benchmark, and it is reviewable. What it cannot
 * carry is spot and finished-floor elevations: Sec. 32-130(a)(9) wants numbers
 * that only a field survey supplies, and inventing them would put a fabricated
 * elevation under a seal. The stage says so rather than filling them in.
 */
const generateGrading: StageProcessor = async (ctx): Promise<StageResult> => {
  const { design } = designFrom(ctx)
  const cond = ctx.priorOutputs['siteplan.build_existing_conditions'] as
    | ExistingConditionsOutput | undefined

  const datum = cond?.verticalDatum ?? null
  const graded = ofKind(design, 'ProposedFeature')
    .filter(f => attr(f, 'type') === 'Graded area')
  const spots = ofKind(design, 'SpotElevation')

  const beforeSeal = [
    'Spot and finished-floor elevations, Sec. 32-130(a)(9) — a field survey sets these. ' +
    'County 2-ft contours establish existing grade and nothing finer.',
    'A Maryland PE sets the final grades and seals the grading plan.',
  ]
  if (!datum) {
    beforeSeal.unshift(
      'Establish the vertical datum and set a site benchmark. Proposed contours are relative ' +
      'until a surveyor does, and are labelled as assumed.',
    )
  }
  if ((cond?.contourCount ?? 0) === 0) {
    beforeSeal.unshift(
      'No existing contours were obtained for this site, so existing grade is not established. ' +
      'The proposed grading is design intent only until a topographic survey is supplied.',
    )
  }

  const out: GradingOutput = {
    contourIntervalFt: contourIntervalFrom(cond),
    verticalDatum: datum,
    datumEstablished: datum !== null,
    existingContourCount: cond?.contourCount ?? 0,
    gradedAreaDrawn: graded.length > 0,
    spotElevationCount: spots.length,
    assumptions: assumptionsFor(design, ['Proposed grading']),
    notes: design.notes,
    beforeSeal,
    summary:
      `Grading drawn at a ${contourIntervalFrom(cond)} ft interval on ` +
      `${datum ?? 'an assumed'} datum; ${beforeSeal.length} items for the reviewing professional.`,
  }
  return { status: 'COMPLETED', outputs: out }
}

/**
 * On-site drainage — Sec. 32-162.
 *
 * The rational-method figures are computed and shown with their equations so a
 * PE checks the arithmetic instead of redoing it. The 100-year overflow path is
 * NOT established: it is a function of finished grades, and finished grades need
 * the survey the grading stage already said is missing.
 */
const generateDrainage: StageProcessor = async (ctx): Promise<StageResult> => {
  const { design } = designFrom(ctx)
  const da = ofKind(design, 'DrainageArea')[0]

  const tc = design.calculations.timeOfConcentration as
    | Calculation<number> | undefined
  const peak = design.calculations.peakDischarge as
    | Calculation<number> | undefined

  const out: DrainageOutput = {
    drainageAreaAcres: num(attr(da, 'areaAcres')),
    percentImpervious: num(attr(da, 'percentImpervious')),
    compositeRunoffCoefficient: num(attr(da, 'compositeC')),
    timeOfConcentrationMin: num(tc?.value),
    peakDischargeCfs: num(peak?.value),
    overflowPathEstablished: false,
    calculations: pickCalculations(design.calculations, [
      'compositeRunoffCoefficient', 'timeOfConcentration', 'peakDischarge',
    ]),
    beforeSeal: [
      'The 100-year overflow path, Sec. 32-162, follows finished grades and cannot be drawn ' +
      'until the grading is surveyed and set.',
      'Rainfall intensity is the design default for this jurisdiction — confirm the return ' +
      'period and IDF curve the reviewer requires.',
      'A Maryland PE signs the drainage computations.',
    ],
    summary: da
      ? `Drainage area ${num(attr(da, 'areaAcres')) ?? 0} ac at ` +
        `${num(attr(da, 'percentImpervious')) ?? 0}% impervious; peak ` +
        `${num(peak?.value) ?? 0} cfs by the rational method.`
      : 'No parcel geometry, so no drainage area was delineated.',
  }
  return { status: 'COMPLETED', outputs: out }
}

/**
 * Stormwater management concept.
 *
 * Two separate questions, and conflating them is the mistake: WHETHER review is
 * triggered is the 5,000 sq ft disturbance gate, answered from the disturbance
 * calculation — where indeterminate counts as triggered. WHAT the practice is
 * comes from the ESD sizing. A site under the gate still gets the sizing; a site
 * whose disturbance is unknown is treated as over it.
 */
const generateSwm: StageProcessor = async (ctx): Promise<StageResult> => {
  const { pkg, design } = designFrom(ctx)
  const practice = ofKind(design, 'SWMPractice')[0]
  const wq = design.calculations.waterQualityVolume as
    | Calculation<{ wqvCubicFeet: number; rv: number }> | undefined
  const da = ofKind(design, 'DrainageArea')[0]
  const escDrawn = ofKind(design, 'ProposedFeature')
    .some(f => attr(f, 'type') === 'Silt fence / super silt fence')

  const review = requiresSedimentAndStormwaterReview(pkg.disturbance)

  const out: StormwaterOutput = {
    waterQualityVolumeCf: num(wq?.value.wqvCubicFeet),
    rv: num(wq?.value.rv),
    percentImpervious: num(attr(da, 'percentImpervious')),
    practice: practice
      ? {
          type: String(attr(practice, 'practice') ?? 'Environmental Site Design'),
          footprintSqFt: num(attr(practice, 'footprintSqFt')) ?? 0,
          pondingDepthFt: num(attr(practice, 'pondingDepthFt')) ?? 0,
        }
      : null,
    review,
    knownDisturbanceSqFt: pkg.disturbance.knownTotalSqFt,
    thresholdSqFt: pkg.disturbance.thresholdSqFt,
    sedimentControlDrawn: escDrawn,
    calculations: pickCalculations(design.calculations, [
      'waterQualityVolume', 'practiceFootprint', 'sedimentTrapVolume',
    ]),
    assumptions: assumptionsFor(design, ['Stormwater practice']),
    beforeSeal: [
      'Infiltration feasibility and groundwater separation come from geotechnical testing. ' +
      'The practice type and its size change if the site will not infiltrate.',
      'Environmental Site Design to the maximum extent practicable must be demonstrated before ' +
      'a structural practice is accepted.',
      ...(escDrawn
        ? []
        : ['No limit of disturbance polygon is in the model, so perimeter sediment control and ' +
           'the stabilized construction entrance are not drawn. They are required on the plan.']),
      'A Maryland PE seals the stormwater management computations.',
    ],
    summary:
      `${review.required ? 'Sediment control and SWM review triggered' : 'Under the 5,000 sq ft gate'}` +
      ` (${review.certain ? 'certain' : 'INDETERMINATE — treated as triggered'}); ` +
      `WQv ${num(wq?.value.wqvCubicFeet) ?? 0} cf.`,
  }
  return { status: 'COMPLETED', outputs: out }
}

/**
 * Utility layout.
 *
 * Sec. 32-106 wants existing AND proposed utilities shown. Only the proposed
 * service runs can be drawn from what the model holds: no main locations, sizes
 * or inverts are in any county layer this engine reads, so the runs are
 * schematic and the output says so instead of implying a surveyed connection.
 */
const generateUtilities: StageProcessor = async (ctx): Promise<StageResult> => {
  const { design } = designFrom(ctx)
  const runs = ofKind(design, 'Utility').map(f => ({
    type: String(attr(f, 'type') ?? 'Utility'),
    lengthFt: polylineLengthFt(f.line),
  }))

  const out: UtilitiesOutput = {
    runs,
    existingMainsResolved: false,
    assumptions: assumptionsFor(design, ['Utility connections']),
    beforeSeal: [
      'Existing mains, sizes and inverts are not in the model. Obtain utility-owner records ' +
      'and show the existing utilities the Sec. 32-106 plan requires.',
      'Field locates through Miss Utility before any excavation. The runs shown are schematic ' +
      'and are not a located connection.',
      'A Maryland PE sizes and seals the service connections.',
    ],
    summary: runs.length
      ? `${runs.length} proposed service runs drawn schematically; no existing mains resolved.`
      : 'No proposed structure or frontage, so no service runs were drawn.',
  }
  return { status: 'COMPLETED', outputs: out }
}

/**
 * Streams, wetlands, buffers and floodplain, from the county's own layers.
 *
 * A live query, so it can fail — and a layer that did not answer must never
 * read as a layer with nothing in it. When at least one layer answers, the
 * result is reported with the failures named; when NONE answer, nothing was
 * learned and the stage blocks so it can be retried, rather than persisting an
 * empty constraint set that a later sheet would draw as a clear site.
 */
const generateEnvironmental: StageProcessor = async (ctx): Promise<StageResult> => {
  const prop = requirePriorOutput<ResolvePropertyOutput>(ctx, 'siteplan.resolve_property')

  let result: PgSiteDataResult
  try {
    result = await fetchPgSiteConstraints(prop.easting2248, prop.northing2248, {
      fetchImpl: ctx.capabilities.fetchImpl,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return {
      status: 'BLOCKED', outputs: null,
      blockers: [
        `The county environmental layers could not be queried: ${message}. No constraint set is ` +
        'recorded, because "did not answer" and "nothing there" are not the same finding.',
      ],
    }
  }

  const answered = result.layerResults.filter(l => l.error === null)
  if (answered.length === 0) {
    return {
      status: 'BLOCKED', outputs: null,
      blockers: [
        'Every county environmental layer returned an error, so nothing is known about streams, ' +
        'wetlands, buffers or floodplain at this site. Retry rather than record an empty set.',
        ...result.layerResults.map(l => `${l.title}: ${l.error}`),
      ],
    }
  }

  const failed = result.layerResults.filter(l => l.error !== null)
  const out: EnvironmentalOutput = {
    featureCount: result.features.length,
    layers: result.layerResults.map(l => ({
      layer: l.layer, title: l.title, count: l.count, drawn: l.drawn,
      error: l.error, truncated: l.truncated,
    })),
    findings: result.findings,
    unavailable: [...result.unavailable],
    constraintsDetermined: failed.length === 0,
    source: result.source,
    summary:
      `${result.features.length} environmental features from ${answered.length} of ` +
      `${result.layerResults.length} county layers` +
      (failed.length ? `; ${failed.length} did not answer and are NOT reported as clear.` : '.'),
  }
  return { status: 'COMPLETED', outputs: out, twinRevision: 1 }
}

export const DESIGN_PROCESSORS: Partial<Record<SitePlanJobName, StageProcessor>> = {
  'siteplan.generate_grading': generateGrading,
  'siteplan.generate_drainage': generateDrainage,
  'siteplan.generate_swm': generateSwm,
  'siteplan.generate_utilities': generateUtilities,
  'siteplan.generate_environmental': generateEnvironmental,
}
