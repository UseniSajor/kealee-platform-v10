/**
 * Sitework quantities from the site plan, in CSI MasterFormat.
 *
 * THE GAP THIS CLOSES:
 *
 * A delivered site plan already establishes disturbance area, building
 * footprint, driveway area, limit of disturbance and stormwater practices. The
 * estimation tool at `packages/automation/apps/estimation-tool` already takes
 * CSI-coded quantities and prices them against a cost database. Nothing
 * connected the two, so a customer who bought a site plan and then wanted a
 * number had their quantities re-measured by hand from a PDF the platform
 * itself had drawn.
 *
 * WHAT THIS IS NOT: it is not an estimate. It produces QUANTITIES with their
 * provenance and confidence, which an estimator prices. Sitework quantities
 * from a GIS-derived plan carry GIS accuracy, and every item says so, because
 * a takeoff that does not state its accuracy gets priced as though it were
 * surveyed.
 *
 * Division 31 is Earthwork, 32 Exterior Improvements, 33 Utilities. Those are
 * the divisions a site plan can speak to. It says nothing about Division 03
 * Concrete for the structure, and does not pretend to.
 */

import type { DisturbanceResult } from './disturbance'
import type { SiteTwin } from './site-twin'

/** Matches `QuantityItem` in the estimation tool's takeoff module. */
export interface SiteworkQuantity {
  code: string
  name: string
  category: string
  quantity: number
  unit: 'SF' | 'SY' | 'CY' | 'LF' | 'EA' | 'AC'
  /** Where the number came from, named so an estimator can judge it. */
  derivedFrom: string
  /**
   * 0-1. A GIS-derived area is not a surveyed one, and this is where that
   * difference is carried rather than lost.
   */
  confidence: number
  /** What would raise the confidence. */
  improvedBy: string
  notes?: string
}

export interface SiteworkTakeoff {
  quantities: SiteworkQuantity[]
  /** Reliability of the underlying geometry: 1 GIS, 2 survey. */
  reliabilityLevel: number
  /** Quantities a site plan CANNOT establish, named rather than omitted. */
  notEstablished: string[]
  summary: string
}

const SF_PER_SY = 9
const SF_PER_ACRE = 43_560

function sy(sqft: number): number { return Math.round((sqft / SF_PER_SY) * 10) / 10 }

/**
 * Confidence by reliability level.
 *
 * Level 1 is county GIS. The engine's own testing found the parcel fabric 4.3
 * ft off a surveyed line, which on a 60 ft lot frontage is a 7% area error —
 * so 0.7 is generous rather than pessimistic. Level 2 is survey-based.
 */
function confidenceFor(reliabilityLevel: number): number {
  return reliabilityLevel >= 2 ? 0.92 : 0.7
}

export function buildSiteworkTakeoff(input: {
  twin: SiteTwin
  disturbance: DisturbanceResult
  /** Depth assumption for topsoil strip, inches. Stated, never silent. */
  topsoilStripInches?: number
}): SiteworkTakeoff {
  const level = input.disturbance.reliabilityLevel === 2 ? 2 : 1
  const confidence = confidenceFor(level)
  const improvedBy = level >= 2
    ? 'A field survey has been supplied; a grading design would refine the earthwork volumes.'
    : 'A boundary and topographic survey raises these from county GIS accuracy to survey accuracy.'

  const q: SiteworkQuantity[] = []
  const components = new Map(input.disturbance.breakdown.map(b => [b.component, b.sqFt]))
  const get = (label: string): number | null => components.get(label) ?? null

  const disturbed = input.disturbance.knownTotalSqFt

  // ── 31 00 00 Earthwork ──
  if (disturbed > 0) {
    q.push({
      code: '31 10 00', name: 'Site clearing', category: 'Earthwork',
      quantity: sy(disturbed), unit: 'SY',
      derivedFrom: 'Limit of disturbance from the site plan',
      confidence, improvedBy,
    })
    q.push({
      code: '31 22 13', name: 'Rough grading', category: 'Earthwork',
      quantity: sy(disturbed), unit: 'SY',
      derivedFrom: 'Limit of disturbance from the site plan',
      confidence, improvedBy,
    })

    // Topsoil strip is a VOLUME, and volume needs a depth. The depth is an
    // assumption and is stated in the item rather than buried in a constant.
    const inches = input.topsoilStripInches ?? 6
    q.push({
      code: '31 23 16.13', name: `Topsoil strip and stockpile, ${inches}" assumed depth`,
      category: 'Earthwork',
      quantity: Math.round((disturbed * (inches / 12)) / 27),
      unit: 'CY',
      derivedFrom: `Disturbed area x ${inches}" assumed strip depth`,
      confidence: confidence * 0.8,
      improvedBy: 'A geotechnical report or test pits establish the actual topsoil depth.',
      notes:
        'The DEPTH is an assumption, not a measurement. A site plan establishes area, never ' +
        'the depth of a soil horizon.',
    })
  }

  const building = get('Building footprint')
  if (building) {
    q.push({
      code: '31 23 16', name: 'Excavation for building', category: 'Earthwork',
      quantity: building, unit: 'SF',
      derivedFrom: 'Proposed building footprint',
      confidence, improvedBy,
      notes: 'Area only. Excavation VOLUME needs a foundation depth the site plan does not carry.',
    })
  }

  // ── 32 00 00 Exterior Improvements ──
  const driveway = get('Driveway')
  if (driveway) {
    q.push({
      code: '32 12 16', name: 'Asphalt paving — driveway', category: 'Exterior Improvements',
      quantity: sy(driveway), unit: 'SY',
      derivedFrom: 'Driveway area from the site plan',
      confidence, improvedBy,
    })
  }

  if (disturbed > 0) {
    q.push({
      code: '32 92 19', name: 'Seeding and stabilisation of disturbed area',
      category: 'Exterior Improvements',
      quantity: sy(disturbed), unit: 'SY',
      derivedFrom: 'Disturbed area less permanent surfaces',
      confidence: confidence * 0.9,
      improvedBy,
      notes:
        'Gross disturbed area. Permanent surfaces are not deducted because the site plan ' +
        'does not yet carry a complete impervious schedule.',
    })
  }

  // ── 31 25 00 Erosion and sediment control ──
  // Required above the county threshold. This is the item most often missed in
  // a residential estimate and it is a permit condition, not an option.
  if (input.disturbance.meetsThreshold || input.disturbance.indeterminate) {
    q.push({
      code: '31 25 00', name: 'Erosion and sediment control', category: 'Earthwork',
      quantity: Math.round(disturbed / SF_PER_ACRE * 100) / 100 || 0.01, unit: 'AC',
      derivedFrom:
        `Disturbed area ${disturbed.toLocaleString()} SF against the ` +
        `${input.disturbance.thresholdSqFt.toLocaleString()} SF county threshold`,
      confidence, improvedBy,
      notes: input.disturbance.indeterminate
        ? 'The disturbed area is INDETERMINATE — unknown components could still cross the ' +
          'threshold. Carried because a permit condition that turns out to apply is worse ' +
          'discovered late than priced early.'
        : 'Above the county threshold, so a sediment control plan is a permit condition.',
    })
  }

  const swm = get('Stormwater facilities')
  if (swm) {
    q.push({
      code: '33 46 00', name: 'Stormwater management practice', category: 'Utilities',
      quantity: swm, unit: 'SF',
      derivedFrom: 'Stormwater practice footprint from the site plan',
      confidence: confidence * 0.8, improvedBy,
      notes: 'Footprint only. Storage volume and structures need a PE-signed SWM design.',
    })
  }

  // ── What a site plan cannot establish ──
  const notEstablished = [
    'Cut and fill volumes — needs a proposed grading surface against existing terrain.',
    'Foundation excavation volume — needs a foundation depth.',
    'Utility lateral lengths and inverts — needs a utility design; anything shown is ASCE 38 Quality Level D.',
    'Retaining structures — not designed by a site plan.',
    'Rock or unsuitable soil — needs a geotechnical report.',
  ]
  if (!building) notEstablished.push('Building footprint — none is proposed on this plan.')
  if (!driveway) notEstablished.push('Driveway area — none is shown on this plan.')

  return {
    quantities: q,
    reliabilityLevel: level,
    notEstablished,
    summary:
      `${q.length} sitework quantit${q.length === 1 ? 'y' : 'ies'} derived from the site plan at ` +
      `reliability level ${level} (${level >= 2 ? 'survey-based' : 'county GIS'}). ` +
      `${notEstablished.length} quantities are NOT established by a site plan and need other inputs. ` +
      'These are quantities, not an estimate.',
  }
}

/** Shape the estimation tool's takeoff module consumes. */
export function toEstimationQuantities(takeoff: SiteworkTakeoff): {
  code: string; name: string; category: string; quantity: number; unit: string
  confidence: number; notes: string
}[] {
  return takeoff.quantities.map(q => ({
    code: q.code,
    name: q.name,
    category: q.category,
    quantity: q.quantity,
    unit: q.unit,
    confidence: q.confidence,
    notes: [q.derivedFrom, q.notes, `Improved by: ${q.improvedBy}`].filter(Boolean).join(' — '),
  }))
}
