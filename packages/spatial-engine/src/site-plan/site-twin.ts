/**
 * The digital site twin — one authoritative, versioned model of the site.
 *
 * Every sheet is generated FROM this model. Nothing is redrawn independently on
 * two sheets: C-100 and C-200 both read the same BoundarySegment, so they cannot
 * disagree. That single rule is what makes cross-sheet consistency checkable
 * rather than aspirational.
 *
 * Geometry is GeoJSON-shaped in a stated CRS. Feet are US survey feet unless a
 * feature says otherwise.
 */

import type { ReliabilityLevel, SourceRecord } from './reliability'

export type Position = [number, number] | [number, number, number]
export interface Ring { coordinates: Position[] }

export interface FeatureBase {
  id: string
  /** Which SourceRecord this came from — every object is traceable. */
  sourceId: string
  reliabilityLevel: ReliabilityLevel
  crs: string
  revision: number
  notes?: string
}

export interface Parcel extends FeatureBase {
  kind: 'Parcel'
  parcelId: string | null
  taxAccount?: string
  lot?: string
  block?: string
  plat?: string
  ring: Ring
  areaSqFt: number | null
}

export interface BoundarySegment extends FeatureBase {
  kind: 'BoundarySegment'
  from: Position
  to: Position
  bearing?: string
  distanceFt?: number
  monument?: string
}

export interface Easement extends FeatureBase {
  kind: 'Easement'
  easementType: string
  ring: Ring
  widthFt?: number
  beneficiary?: string
  recordReference?: string
}

export interface BuildingFeature extends FeatureBase {
  kind: 'Building'
  ring: Ring
  existing: boolean
  storeys?: number
  heightFt?: number
  finishedFloorElevationFt?: number
  use?: string
}

export interface SetbackFeature extends FeatureBase {
  kind: 'Setback'
  side: 'front' | 'side' | 'rear'
  distanceFt: number
  /** Ordinance citation the distance came from. */
  citation: string
  ring?: Ring
}

export interface EnvironmentalFeature extends FeatureBase {
  kind: 'EnvironmentalBuffer' | 'Floodplain' | 'Woodland' | 'Tree'
  ring?: Ring
  designation?: string
  bufferWidthFt?: number
}

export interface LimitOfDisturbance extends FeatureBase {
  kind: 'LimitOfDisturbance'
  ring: Ring
  areaSqFt: number
}

export interface GenericFeature extends FeatureBase {
  kind:
    | 'ExistingFeature' | 'ProposedFeature' | 'Surface' | 'Contour' | 'Breakline'
    | 'SpotElevation' | 'Pavement' | 'ParkingSpace' | 'Sidewalk' | 'Utility'
    | 'StormPipe' | 'Structure' | 'DrainageArea' | 'SWMPractice'
    | 'DemolitionFeature'
  ring?: Ring
  line?: Position[]
  point?: Position
  attributes?: Record<string, unknown>
}

export type SiteFeature =
  | Parcel | BoundarySegment | Easement | BuildingFeature | SetbackFeature
  | EnvironmentalFeature | LimitOfDisturbance | GenericFeature

export interface Approval {
  id: string
  approvalType: string
  status: 'required' | 'not_required' | 'undetermined' | 'obtained'
  reason: string
  conditions?: string[]
  reference?: string
}

/**
 * The site model. `revision` increments on every mutation so a sheet can record
 * which revision it was generated from — that is what makes "regenerate every
 * affected sheet after one source-model change" verifiable.
 */
export interface SiteTwin {
  siteId: string
  projectId: string
  organizationId: string
  address: string
  jurisdictionCode: string
  crs: string
  horizontalDatum: string | null
  verticalDatum: string | null
  revision: number
  zoneCode: string | null
  overlayCodes: string[]
  features: SiteFeature[]
  approvals: Approval[]
  sources: SourceRecord[]
  updatedAt: string
}

export function createSiteTwin(input: {
  siteId: string
  projectId: string
  organizationId: string
  address: string
  jurisdictionCode: string
  crs: string
  horizontalDatum?: string | null
  verticalDatum?: string | null
}): SiteTwin {
  return {
    ...input,
    horizontalDatum: input.horizontalDatum ?? null,
    verticalDatum: input.verticalDatum ?? null,
    revision: 1,
    zoneCode: null,
    overlayCodes: [],
    features: [],
    approvals: [],
    sources: [],
    updatedAt: new Date().toISOString(),
  }
}

/** Mutations return a NEW twin with an incremented revision. */
export function addFeatures(twin: SiteTwin, features: SiteFeature[]): SiteTwin {
  return {
    ...twin,
    features: [...twin.features, ...features],
    revision: twin.revision + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function addSource(twin: SiteTwin, source: SourceRecord): SiteTwin {
  return {
    ...twin,
    sources: [...twin.sources, source],
    revision: twin.revision + 1,
    updatedAt: new Date().toISOString(),
  }
}

export function featuresOfKind<K extends SiteFeature['kind']>(
  twin: SiteTwin,
  kind: K,
): Extract<SiteFeature, { kind: K }>[] {
  return twin.features.filter(f => f.kind === kind) as Extract<SiteFeature, { kind: K }>[]
}

/** Shoelace area in square feet for a ring in a projected CRS. */
export function ringAreaSqFt(ring: Ring): number {
  const pts = ring.coordinates
  if (pts.length < 3) return 0
  let twice = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    twice += a[0] * b[1] - b[0] * a[1]
  }
  return Math.abs(twice) / 2
}

/**
 * Cross-sheet consistency. Because every sheet reads this model, a conflict here
 * is a conflict everywhere, and it can be caught before issuance.
 */
export interface ConsistencyFinding {
  code: string
  severity: 'blocking' | 'warning'
  message: string
}

export function checkTwinConsistency(twin: SiteTwin): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = []

  if (!twin.crs) {
    findings.push({ code: 'UNKNOWN_CRS', severity: 'blocking', message: 'Site has no coordinate reference system.' })
  }

  const parcels = featuresOfKind(twin, 'Parcel')
  if (parcels.length === 0) {
    findings.push({ code: 'NO_PARCEL', severity: 'blocking', message: 'No parcel geometry in the site model.' })
  }

  for (const p of parcels) {
    const c = p.ring.coordinates
    if (c.length < 3) {
      findings.push({ code: 'OPEN_BOUNDARY', severity: 'blocking', message: `Parcel ${p.parcelId ?? p.id} has fewer than three vertices.` })
      continue
    }
    const first = c[0]
    const last = c[c.length - 1]
    const closed = first[0] === last[0] && first[1] === last[1]
    if (!closed && c.length < 4) {
      findings.push({ code: 'OPEN_BOUNDARY', severity: 'blocking', message: `Parcel ${p.parcelId ?? p.id} boundary does not close.` })
    }
    if (p.areaSqFt != null) {
      const computed = ringAreaSqFt(p.ring)
      if (computed > 0 && Math.abs(computed - p.areaSqFt) / p.areaSqFt > 0.05) {
        findings.push({
          code: 'AREA_MISMATCH',
          severity: 'warning',
          message: `Parcel ${p.parcelId ?? p.id}: recorded area ${Math.round(p.areaSqFt)} sq ft differs from computed ${Math.round(computed)} sq ft by more than 5%.`,
        })
      }
    }
  }

  // Elevation work needs a vertical datum, and it must never be inferred.
  const needsVertical = twin.features.some(f =>
    ['Contour', 'SpotElevation', 'Surface', 'Breakline'].includes(f.kind),
  )
  if (needsVertical && !twin.verticalDatum) {
    findings.push({
      code: 'MISSING_VERTICAL_DATUM',
      severity: 'blocking',
      message: 'Elevation features are present but no vertical datum is recorded. Datums must never be assumed or silently converted.',
    })
  }

  // A feature whose CRS differs from the site's is a datum conflict.
  for (const f of twin.features) {
    if (f.crs && twin.crs && f.crs !== twin.crs) {
      findings.push({
        code: 'DATUM_CONFLICT',
        severity: 'blocking',
        message: `Feature ${f.id} is in ${f.crs} but the site model is ${twin.crs}. Reproject explicitly through PROJ; never convert silently.`,
      })
    }
  }

  for (const f of twin.features) {
    if (!f.sourceId) {
      findings.push({ code: 'UNSOURCED_FEATURE', severity: 'blocking', message: `Feature ${f.id} has no source record.` })
    }
  }

  return findings
}
