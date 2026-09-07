/**
 * Design generation — the drafting step.
 *
 * Takes the site model plus the calculation package and produces the proposed
 * features each discipline sheet draws: demolition items, proposed grading,
 * utility runs, drainage areas and practices, sediment controls, paving, and
 * planting.
 *
 * This is what a designer does before a PE reviews. Where an input is missing,
 * the design proceeds on a STATED ASSUMPTION recorded on the feature, exactly as
 * a drafter would note it on the drawing — it does not stop.
 */

import type { SiteTwin, SiteFeature, Ring, Position } from './site-twin'
import { featuresOfKind, ringAreaSqFt } from './site-twin'
import {
  waterQualityVolume, practiceFootprint, sedimentTrapVolume,
  compositeRunoffCoefficient, peakDischargeRational, timeOfConcentrationKirpich,
  type Calculation,
} from './engineering'

export interface DesignAssumption {
  feature: string
  assumption: string
  resolvedBy: 'survey' | 'geotechnical' | 'applicant' | 'engineer' | 'utility_owner'
}

export interface DesignResult {
  features: SiteFeature[]
  assumptions: DesignAssumption[]
  calculations: Record<string, Calculation<unknown>>
  notes: string[]
}

/** Offsets a ring inward by a distance in feet (approximate, centroid-based). */
function insetRing(ring: Ring, feet: number): Ring {
  const pts = ring.coordinates
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return {
    coordinates: pts.map(p => {
      const dx = p[0] - cx
      const dy = p[1] - cy
      const d = Math.hypot(dx, dy) || 1
      const k = Math.max(0, (d - feet) / d)
      return [cx + dx * k, cy + dy * k] as Position
    }),
  }
}

function ringCentroid(ring: Ring): Position {
  const pts = ring.coordinates
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ]
}

function boxAt(center: Position, widthFt: number, heightFt: number): Ring {
  const [x, y] = center
  const w = widthFt / 2
  const h = heightFt / 2
  return { coordinates: [[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h], [x - w, y - h]] }
}

let seq = 0
const nextId = (p: string) => `${p}-${++seq}`

/** Even-odd point-in-ring. EPSG:2248 feet, so no projection. */
function pointInRing(p: Position, ring: readonly Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > p[1]) !== (yj > p[1])
        && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside
  }
  return inside
}

export interface DesignInput {
  twin: SiteTwin
  /** Design storm depth for water quality, inches. */
  waterQualityStormIn?: number
  /** Rainfall intensity for peak flow, in/hr. */
  designIntensityInPerHr?: number
  /** Assumed contour interval, feet. */
  contourIntervalFt?: number
  /**
   * Midpoint of the FRONT lot line, from the street-based edge classification.
   *
   * Service runs and the driveway start here. Without it this module used
   * `site.coordinates[0]` — an arbitrary parcel vertex — which ran the utility
   * runs off the property on any lot whose first vertex is not the frontage.
   */
  frontPoint?: Position
  /** Buildable envelope. Planting and practices are kept inside the lot. */
  envelope?: Ring
  hasDemolition?: boolean
  hasRoadWork?: boolean
}

/**
 * Produces the full proposed design from the model.
 *
 * Every generated feature carries `sourceId: 'design'` so it is distinguishable
 * from surveyed or GIS-sourced geometry — a reviewer can tell at a glance what
 * Kealee drew versus what was measured.
 */
export function generateDesign(input: DesignInput): DesignResult {
  const { twin } = input
  const features: SiteFeature[] = []
  const assumptions: DesignAssumption[] = []
  const calculations: Record<string, Calculation<unknown>> = {}
  const notes: string[] = []

  const base = { sourceId: 'design', reliabilityLevel: twin.sources.length ? 1 : 0, crs: twin.crs, revision: 1 } as const

  const parcel = featuresOfKind(twin, 'Parcel')[0]
  if (!parcel) {
    notes.push('No parcel geometry — design produced against the limit of disturbance only.')
  }
  const site = parcel?.ring
  const siteAreaSqFt = site ? ringAreaSqFt(site) : 0
  const siteAcres = siteAreaSqFt / 43_560

  const proposedBuildings = featuresOfKind(twin, 'Building').filter(b => !b.existing)
  const existingBuildings = featuresOfKind(twin, 'Building').filter(b => b.existing)
  const lod = featuresOfKind(twin, 'LimitOfDisturbance')[0]

  // ── C-300 Demolition ──────────────────────────────────────────────────────
  if (input.hasDemolition || existingBuildings.length > 0) {
    for (const b of existingBuildings) {
      features.push({
        ...base, kind: 'DemolitionFeature', id: nextId('demo'), ring: b.ring,
        attributes: { action: 'Remove existing structure', protectDuringDemolition: 'Adjacent structures and utilities' },
      } as SiteFeature)
    }
    notes.push('Demolition limits follow the existing structure footprints in the model.')
  }

  // ── C-400 Grading and drainage ────────────────────────────────────────────
  const contourIntervalFt = input.contourIntervalFt ?? 1
  if (!twin.verticalDatum) {
    assumptions.push({
      feature: 'Proposed grading',
      assumption:
        'No vertical datum is established. Proposed contours are shown on an ASSUMED datum with ' +
        'the benchmark to be set by the surveyor; all elevations are relative until then.',
      resolvedBy: 'survey',
    })
  }
  if (site) {
    // Drainage arrows follow the fall from the building pad toward the low side.
    const c = ringCentroid(site)
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('grade'),
      ring: insetRing(site, 5),
      attributes: {
        type: 'Graded area',
        // Routes this to the grading sheet. Without it `ProposedFeature` maps
        // to site_layout and the grading sheet draws no grading.
        proposed: true,
        contourIntervalFt,
        note: 'Positive drainage away from structure at 2% minimum for the first 10 ft.',
      },
    } as SiteFeature)
    features.push({
      ...base, kind: 'SpotElevation', id: nextId('ffe'), point: c,
      attributes: { label: 'FFE', note: 'Finished floor elevation to be set above the adjacent grade per code.' },
    } as SiteFeature)
  }

  // ── C-500 Utilities ───────────────────────────────────────────────────────
  if (site && proposedBuildings[0]) {
    const bc = ringCentroid(proposedBuildings[0].ring)
    const frontage = input.frontPoint ?? site.coordinates[0]
    for (const [type, offset] of [['Water service', -4], ['Sanitary lateral', 0], ['Storm drain', 4]] as const) {
      features.push({
        ...base, kind: 'Utility', id: nextId('util'),
        line: [[frontage[0] + offset, frontage[1]], [bc[0] + offset, bc[1]]],
        attributes: {
          type,
          note: 'Record information. Field verification required before excavation — call Miss Utility.',
        },
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Utility connections',
      assumption:
        'Main locations and inverts are not in the model. Service runs are shown schematically from ' +
        'the frontage to the structure and must be confirmed against utility-owner records and field locates.',
      resolvedBy: 'utility_owner',
    })
  }

  // ── C-600 Stormwater ──────────────────────────────────────────────────────
  const impervious =
    proposedBuildings.reduce((s, b) => s + ringAreaSqFt(b.ring), 0) +
    (lod ? ringAreaSqFt(lod.ring) * 0.15 : 0)
  const percentImpervious = siteAreaSqFt > 0 ? Math.min(100, (impervious / siteAreaSqFt) * 100) : 0

  if (siteAcres > 0) {
    const wq = waterQualityVolume(input.waterQualityStormIn ?? 1.0, percentImpervious, siteAcres)
    calculations.waterQualityVolume = wq as Calculation<unknown>
    const fp = practiceFootprint(wq.value.wqvCubicFeet, 2)
    calculations.practiceFootprint = fp as Calculation<unknown>

    const cComposite = compositeRunoffCoefficient([
      { areaAcres: impervious / 43_560, surface: 'roof' },
      { areaAcres: Math.max(0, siteAcres - impervious / 43_560), surface: 'lawn_average' },
    ])
    calculations.compositeRunoffCoefficient = cComposite as Calculation<unknown>
    const tc = timeOfConcentrationKirpich(Math.max(50, Math.sqrt(siteAreaSqFt)), 0.02)
    calculations.timeOfConcentration = tc as Calculation<unknown>
    calculations.peakDischarge = peakDischargeRational(
      cComposite.value, input.designIntensityInPerHr ?? 6.2, siteAcres,
    ) as Calculation<unknown>

    if (site) {
      // Place the practice at the low corner of the site.
      const low = site.coordinates.reduce((a, p) => (p[1] < a[1] ? p : a), site.coordinates[0])
      const side = Math.sqrt(fp.value.footprintSqFt)
      features.push({
        ...base, kind: 'SWMPractice', id: nextId('swm'),
        ring: boxAt([low[0] + side / 2 + 6, low[1] + side / 2 + 6], side, side),
        attributes: {
          practice: 'Environmental Site Design — micro-bioretention',
          requiredVolumeCf: wq.value.wqvCubicFeet,
          footprintSqFt: fp.value.footprintSqFt,
          pondingDepthFt: 2,
        },
      } as SiteFeature)
      features.push({
        ...base, kind: 'DrainageArea', id: nextId('da'), ring: site,
        attributes: {
          areaAcres: Number(siteAcres.toFixed(4)),
          percentImpervious: Number(percentImpervious.toFixed(1)),
          compositeC: cComposite.value,
        },
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Stormwater practice',
      assumption:
        'Infiltration feasibility is assumed pending geotechnical testing. Practice type and sizing ' +
        'change if infiltration rates or groundwater separation do not support ESD.',
      resolvedBy: 'geotechnical',
    })
  }

  // ── C-700 Sediment and erosion control ────────────────────────────────────
  if (lod) {
    const lodAcres = ringAreaSqFt(lod.ring) / 43_560
    const trap = sedimentTrapVolume(lodAcres)
    calculations.sedimentTrapVolume = trap as Calculation<unknown>
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('esc'), ring: lod.ring,
      attributes: {
        type: 'Silt fence / super silt fence',
        note: 'Perimeter control on the down-gradient limit of disturbance.',
      },
    } as SiteFeature)
    const entry = lod.ring.coordinates[0]
    features.push({
      ...base, kind: 'ProposedFeature', id: nextId('sce'),
      ring: boxAt([entry[0] + 15, entry[1] - 8], 30, 16),
      attributes: { type: 'Stabilized construction entrance', note: 'Mountable berm, washrack where required.' },
    } as SiteFeature)
    notes.push(
      'Sequence of construction: install perimeter controls and stabilized entrance, ' +
      'then clear and grub, rough grade, install utilities and stormwater practices, ' +
      'fine grade, stabilize, and remove controls only after permanent stabilization.',
    )
  }

  // ── C-800 Paving and access ───────────────────────────────────────────────
  if (input.hasRoadWork || proposedBuildings[0]) {
    if (site && proposedBuildings[0]) {
      const bc = ringCentroid(proposedBuildings[0].ring)
      const front = input.frontPoint ?? site.coordinates[0]
      features.push({
        ...base, kind: 'Pavement', id: nextId('drive'),
        ring: {
          coordinates: [
            [front[0] + 4, front[1]], [front[0] + 16, front[1]],
            [bc[0] + 16, bc[1]], [bc[0] + 4, bc[1]], [front[0] + 4, front[1]],
          ],
        },
        attributes: { type: 'Driveway', widthFt: 12, surface: 'Asphalt over compacted base' },
      } as SiteFeature)
    }
  }

  // ── L-100 Landscape and canopy ────────────────────────────────────────────
  if (site) {
    const c = ringCentroid(site)
    // Inside the buildable envelope when there is one: a shade tree drawn
    // over the neighbour's lot is a defect, and on an infill lot a fixed
    // 30 ft offset from the centroid lands there.
    const plantRef = input.envelope ?? { coordinates: site.coordinates }
    const pc = ringCentroid(plantRef)
    const spread = Math.max(8, Math.min(24, Math.sqrt(ringAreaSqFt(plantRef)) / 4))

    // TREES GO IN THE YARD, NOT ON THE HOUSE.
    //
    // They were offset from the ENVELOPE centroid — which is where the dwelling
    // sits, because the dwelling is placed against the front of that same
    // envelope. All three landed on the roof.
    //
    // Candidates now ring the footprint and are kept only where they fall
    // inside the lot and clear of the building. A tree that cannot be placed is
    // not placed: a shade tree drawn through a wall is a defect a reviewer sees
    // before anything else on the sheet.
    const footprintRing = proposedBuildings[0]?.ring?.coordinates as Position[] | undefined
    const TREE_HALF = 6, CLEAR_FT = 8
    const clearOfHouse = (q: Position) => {
      if (!footprintRing) return true
      let near = Infinity
      for (let i = 0; i < footprintRing.length - 1; i++) {
        const a2 = footprintRing[i], b2 = footprintRing[i + 1]
        const vx = b2[0] - a2[0], vy = b2[1] - a2[1]
        const t = Math.max(0, Math.min(1,
          ((q[0] - a2[0]) * vx + (q[1] - a2[1]) * vy) / (vx * vx + vy * vy || 1)))
        near = Math.min(near, Math.hypot(q[0] - (a2[0] + t * vx), q[1] - (a2[1] + t * vy)))
      }
      return near >= CLEAR_FT + TREE_HALF && !pointInRing(q, footprintRing)
    }
    const inLot = (q: Position) => pointInRing(q, site.coordinates as Position[])
    const anchor: Position = footprintRing ? ringCentroid({ coordinates: footprintRing }) : pc
    const placed: Position[] = []
    for (let ring2 = 1; ring2 <= 4 && placed.length < 3; ring2++) {
      const r2 = spread * ring2
      for (let k = 0; k < 12 && placed.length < 3; k++) {
        const th = (k / 12) * Math.PI * 2
        const q: Position = [anchor[0] + Math.cos(th) * r2, anchor[1] + Math.sin(th) * r2]
        if (!inLot(q) || !clearOfHouse(q)) continue
        if (placed.some(p2 => Math.hypot(p2[0] - q[0], p2[1] - q[1]) < spread)) continue
        placed.push(q)
      }
    }
    for (const q of placed) {
      features.push({
        ...base, kind: 'Tree', id: nextId('tree'),
        ring: boxAt(q, TREE_HALF * 2, TREE_HALF * 2),
        designation: 'Proposed shade tree',
      } as SiteFeature)
    }
    assumptions.push({
      feature: 'Tree canopy schedule',
      assumption:
        'Subtitle 25 § 25-128 Table 1 is loaded: RSF-65 requires 20% canopy on the NET TRACT AREA. ' +
        'The trees drawn are a layout, not the schedule — quantity and species come from the ' +
        'Landscape Manual, and § 25-129 lets preserved trees and street trees in the right-of-way ' +
        'count at ten-year canopy.',
      resolvedBy: 'engineer',
    })
  }

  return { features, assumptions, calculations, notes }
}
