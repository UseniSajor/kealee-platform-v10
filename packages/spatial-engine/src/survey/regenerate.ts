/**
 * What actually happens after a survey is accepted.
 *
 * Replacing GIS geometry with surveyed geometry is not a cosmetic swap. The
 * boundary moves, so setbacks move; the topography changes, so cut and fill
 * change; the disturbance area changes, so the 5,000 sq ft determination may
 * flip and with it the entire permit path.
 *
 * This module runs that cascade in one place and produces a revision comparison
 * showing what changed and what it means — the thing a reviewer actually needs
 * when they are handed revision 2 of a plan they already read.
 */

import type { SiteTwin, SiteFeature } from '../site-plan/site-twin'
import { featuresOfKind, ringAreaSqFt, checkTwinConsistency } from '../site-plan/site-twin'
import { governingReliability } from '../site-plan/reliability'
import type { ReliabilityLevel } from '../site-plan/reliability'
import { calculateDisturbance, type DisturbanceComponents, type DisturbanceResult } from '../site-plan/disturbance'
import { cutFill, type GridSurface, type Calculation } from '../site-plan/engineering'
import type { SheetId, SheetStatus, RevisionEntry } from '../sheets/sheet-template'
import { planRegeneration, type RegenerationPlan } from './promotion'
import type { DiscrepancyReport } from './reconcile'

export interface ZoningCheckResult {
  zoneCode: string | null
  checks: {
    standard: string
    required: string
    provided: string
    compliant: boolean | null
    citation: string
  }[]
  /** Checks that changed outcome because the boundary moved. */
  changedByResurvey: string[]
}

export interface EasementCheckResult {
  encroachments: {
    easementId: string
    easementType: string
    featureId: string
    featureKind: SiteFeature['kind']
    note: string
  }[]
  unmappedWarning: string | null
}

export interface RevisionComparison {
  from: { twinRevision: number; governingLevel: ReliabilityLevel }
  to: { twinRevision: number; governingLevel: ReliabilityLevel }
  changes: {
    subject: string
    before: string
    after: string
    delta: string
    consequence: string
  }[]
  /** Superseded objects retained in the model, never deleted. */
  supersededObjectIds: string[]
  summary: string
}

export interface RegenerationInput {
  before: SiteTwin
  after: SiteTwin
  supersededObjectIds: string[]
  discrepancies: DiscrepancyReport
  /** Disturbance components before and after the survey. */
  disturbanceBefore: DisturbanceComponents
  disturbanceAfter: DisturbanceComponents
  /** Surfaces for earthwork, when both exist. */
  earthwork?: { existing: GridSurface; proposed: GridSurface }
  earthworkBefore?: { existing: GridSurface; proposed: GridSurface }
  /** Setback standards in force, for the zoning re-check. */
  setbacks?: { side: 'front' | 'side' | 'rear'; requiredFt: number; providedFt: number; citation: string }[]
  setbacksBefore?: { side: 'front' | 'side' | 'rear'; requiredFt: number; providedFt: number; citation: string }[]
  currentSheets: { sheet: SheetId; status: SheetStatus; revisions: RevisionEntry[] }[]
  revisionBy: string
  revisionDescription?: string
}

export interface RegenerationOutcome {
  plan: RegenerationPlan
  disturbance: { before: DisturbanceResult; after: DisturbanceResult; thresholdFlipped: boolean }
  earthwork: {
    before?: Calculation<{ cutCubicYards: number; fillCubicYards: number; netCubicYards: number }>
    after?: Calculation<{ cutCubicYards: number; fillCubicYards: number; netCubicYards: number }>
    changed: boolean
  }
  zoning: ZoningCheckResult
  easements: EasementCheckResult
  comparison: RevisionComparison
  /** Consistency findings on the regenerated model. */
  consistency: ReturnType<typeof checkTwinConsistency>
}

function pointInRing(p: [number, number], ring: { coordinates: [number, number][] | number[][] }): boolean {
  const c = ring.coordinates as number[][]
  let inside = false
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [xi, yi] = c[i], [xj, yj] = c[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

function representativePoint(f: SiteFeature): [number, number] | null {
  if ('ring' in f && f.ring && f.ring.coordinates.length > 0) {
    const pts = f.ring.coordinates
    return [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ]
  }
  if ('point' in f && f.point) return [f.point[0], f.point[1]]
  if ('line' in f && f.line && f.line.length) return [f.line[0][0], f.line[0][1]]
  if (f.kind === 'BoundarySegment') return [f.from[0], f.from[1]]
  return null
}

/** Re-runs the easement encroachment check against the surveyed boundary. */
export function recheckEasements(twin: SiteTwin): EasementCheckResult {
  const easements = featuresOfKind(twin, 'Easement')
  const encroachments: EasementCheckResult['encroachments'] = []

  const candidates = twin.features.filter(f =>
    f.kind === 'Building' || f.kind === 'ProposedFeature' || f.kind === 'SWMPractice' ||
    f.kind === 'Pavement' || f.kind === 'Structure',
  )

  for (const e of easements) {
    for (const f of candidates) {
      const p = representativePoint(f)
      if (!p) continue
      if (pointInRing(p, e.ring)) {
        encroachments.push({
          easementId: e.id,
          easementType: e.easementType,
          featureId: f.id,
          featureKind: f.kind,
          note:
            `${f.kind} ${f.id} falls within the ${e.easementType} easement. ` +
            'An easement encroachment discovered after approval is a stop-work item, not a comment.',
        })
      }
    }
  }

  return {
    encroachments,
    unmappedWarning: easements.length === 0
      ? 'No easements are in the model. This check found nothing because there was nothing to check — ' +
        'it is not evidence that the parcel is unencumbered. Confirm against the title report.'
      : null,
  }
}

/** Re-runs setback compliance against the surveyed boundary. */
export function recheckZoning(input: {
  twin: SiteTwin
  setbacks?: RegenerationInput['setbacks']
  setbacksBefore?: RegenerationInput['setbacksBefore']
}): ZoningCheckResult {
  const checks: ZoningCheckResult['checks'] = []
  const changed: string[] = []

  for (const s of input.setbacks ?? []) {
    const compliant = s.providedFt >= s.requiredFt
    checks.push({
      standard: `${s.side} setback`,
      required: `${s.requiredFt} ft`,
      provided: `${s.providedFt.toFixed(2)} ft`,
      compliant,
      citation: s.citation,
    })
    const prior = input.setbacksBefore?.find(b => b.side === s.side)
    if (prior && (prior.providedFt >= prior.requiredFt) !== compliant) {
      changed.push(
        `${s.side} setback changed from ${prior.providedFt >= prior.requiredFt ? 'compliant' : 'non-compliant'} ` +
        `to ${compliant ? 'compliant' : 'non-compliant'}: provided distance moved from ` +
        `${prior.providedFt.toFixed(2)} ft to ${s.providedFt.toFixed(2)} ft when the surveyed boundary replaced GIS.`,
      )
    }
  }

  const parcel = featuresOfKind(input.twin, 'Parcel')[0]
  if (parcel) {
    const area = ringAreaSqFt(parcel.ring)
    checks.push({
      standard: 'Lot area',
      required: 'per zone minimum',
      provided: `${area.toFixed(0)} sq ft`,
      compliant: null,
      citation: 'Subtitle 27, dimensional standards for the applicable zone',
    })
  }

  return { zoneCode: input.twin.zoneCode, checks, changedByResurvey: changed }
}

export function regenerateAfterSurvey(input: RegenerationInput): RegenerationOutcome {
  const disturbanceBefore = calculateDisturbance(input.disturbanceBefore)
  const disturbanceAfter = calculateDisturbance(input.disturbanceAfter)
  const thresholdFlipped = disturbanceBefore.meetsThreshold !== disturbanceAfter.meetsThreshold

  const earthworkBefore = input.earthworkBefore
    ? cutFill(input.earthworkBefore.existing, input.earthworkBefore.proposed)
    : undefined
  const earthworkAfter = input.earthwork
    ? cutFill(input.earthwork.existing, input.earthwork.proposed)
    : undefined

  const zoning = recheckZoning({
    twin: input.after,
    setbacks: input.setbacks,
    setbacksBefore: input.setbacksBefore,
  })
  const easements = recheckEasements(input.after)

  const beforeLevel = governingReliability(input.before.sources)
  const afterLevel = governingReliability(input.after.sources)

  // Which object kinds actually changed between the two models.
  const beforeById = new Map(input.before.features.map(f => [f.id, f]))
  const changedKinds = new Set<SiteFeature['kind']>()
  for (const f of input.after.features) {
    const prior = beforeById.get(f.id)
    if (!prior || prior.revision !== f.revision || prior.reliabilityLevel !== f.reliabilityLevel) {
      changedKinds.add(f.kind)
    }
  }
  for (const id of input.supersededObjectIds) {
    const f = beforeById.get(id)
    if (f) changedKinds.add(f.kind)
  }

  const plan = planRegeneration({
    changedKinds: [...changedKinds],
    currentSheets: input.currentSheets,
    newGoverningLevel: afterLevel,
    previousGoverningLevel: beforeLevel,
    description: input.revisionDescription
      ?? 'Preliminary GIS geometry replaced with certified survey; affected sheets regenerated.',
    by: input.revisionBy,
  })

  // ── Revision comparison ───────────────────────────────────────────────────
  const changes: RevisionComparison['changes'] = []

  const parcelBefore = featuresOfKind(input.before, 'Parcel')[0]
  const parcelAfter = featuresOfKind(input.after, 'Parcel').find(p => !input.supersededObjectIds.includes(p.id))
  if (parcelBefore && parcelAfter) {
    const a1 = ringAreaSqFt(parcelBefore.ring), a2 = ringAreaSqFt(parcelAfter.ring)
    if (Math.abs(a2 - a1) > 1) {
      changes.push({
        subject: 'Lot area',
        before: `${a1.toFixed(0)} sq ft`,
        after: `${a2.toFixed(0)} sq ft`,
        delta: `${(a2 - a1 >= 0 ? '+' : '')}${(a2 - a1).toFixed(0)} sq ft (${((a2 - a1) / a1 * 100).toFixed(2)}%)`,
        consequence:
          'Lot coverage, floor-area and density calculations are computed from this area and have been rerun.',
      })
    }
  }

  changes.push({
    subject: 'Governing reliability level',
    before: `Level ${beforeLevel}`,
    after: `Level ${afterLevel}`,
    delta: afterLevel === beforeLevel ? 'unchanged' : `${beforeLevel} → ${afterLevel}`,
    consequence: afterLevel === 2
      ? 'The preliminary disclosure comes off the affected sheets. The set is FOR_REVIEW, not a permit set — ' +
        'that still needs a professional review record and seal.'
      : 'The set remains preliminary and continues to say so on every sheet.',
  })

  if (disturbanceBefore.knownTotalSqFt !== disturbanceAfter.knownTotalSqFt) {
    changes.push({
      subject: 'Limit of disturbance',
      before: `${disturbanceBefore.knownTotalSqFt.toFixed(0)} sq ft${disturbanceBefore.indeterminate ? ' (indeterminate)' : ''}`,
      after: `${disturbanceAfter.knownTotalSqFt.toFixed(0)} sq ft${disturbanceAfter.indeterminate ? ' (indeterminate)' : ''}`,
      delta: `${(disturbanceAfter.knownTotalSqFt - disturbanceBefore.knownTotalSqFt >= 0 ? '+' : '')}${
        (disturbanceAfter.knownTotalSqFt - disturbanceBefore.knownTotalSqFt).toFixed(0)} sq ft`,
      consequence: thresholdFlipped
        ? disturbanceAfter.meetsThreshold
          ? 'The 5,000 sq ft threshold is now EXCEEDED. Sediment control and stormwater management review ' +
            'are required where they previously were not. This changes the permit path.'
          : 'The disturbance now falls below 5,000 sq ft. Confirm with DPIE before relying on the exemption — ' +
            'the county may still require review for other reasons.'
        : 'The threshold determination is unchanged.',
    })
  }

  if (earthworkBefore && earthworkAfter) {
    const n1 = earthworkBefore.value.netCubicYards, n2 = earthworkAfter.value.netCubicYards
    if (Math.abs(n2 - n1) > 1) {
      changes.push({
        subject: 'Net earthwork',
        before: `${n1.toFixed(0)} cy`,
        after: `${n2.toFixed(0)} cy`,
        delta: `${(n2 - n1 >= 0 ? '+' : '')}${(n2 - n1).toFixed(0)} cy`,
        consequence:
          'Existing grade came from the survey rather than LiDAR, so cut and fill quantities and the ' +
          'import/export assumption have changed. Grading notes have been rerun.',
      })
    }
  }

  for (const c of zoning.changedByResurvey) {
    changes.push({
      subject: 'Zoning compliance',
      before: 'as computed from the GIS boundary',
      after: 'as computed from the surveyed boundary',
      delta: c,
      consequence:
        'A setback outcome changed with the boundary. If a standard is now not met, the design must move ' +
        'or a variance is required — this is exactly what a survey is for.',
    })
  }

  if (easements.encroachments.length > 0) {
    changes.push({
      subject: 'Easement encroachment',
      before: 'none identified against the GIS boundary',
      after: `${easements.encroachments.length} identified against the surveyed easements`,
      delta: easements.encroachments.map(e => `${e.featureKind} in ${e.easementType}`).join('; '),
      consequence: 'Encroaching features must be relocated or the easement released before construction.',
    })
  }

  const comparison: RevisionComparison = {
    from: { twinRevision: input.before.revision, governingLevel: beforeLevel },
    to: { twinRevision: input.after.revision, governingLevel: afterLevel },
    changes,
    supersededObjectIds: input.supersededObjectIds,
    summary:
      `Revision ${plan.revisionEntry.number}: ${changes.length} substantive change(s) across ` +
      `${plan.affectedSheets.length} affected sheet(s). ${input.supersededObjectIds.length} object(s) ` +
      'superseded and retained. ' +
      (input.discrepancies.blockingCount > 0
        ? `${input.discrepancies.blockingCount} blocking discrepancy finding(s) remain outstanding.`
        : 'No blocking discrepancies outstanding.'),
  }

  return {
    plan,
    disturbance: { before: disturbanceBefore, after: disturbanceAfter, thresholdFlipped },
    earthwork: {
      before: earthworkBefore,
      after: earthworkAfter,
      changed: Boolean(
        earthworkBefore && earthworkAfter &&
        Math.abs(earthworkAfter.value.netCubicYards - earthworkBefore.value.netCubicYards) > 1,
      ),
    },
    zoning,
    easements,
    comparison,
    consistency: checkTwinConsistency(input.after),
  }
}
