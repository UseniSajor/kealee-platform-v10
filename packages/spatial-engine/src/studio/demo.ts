/**
 * The demo professional project — a realistic single-family infill lot.
 *
 * Every value is either stated as a demo value or reproduces a real rule:
 * the setbacks and coverage are Prince George's RSF-95 as the certified
 * pg-2022.1 pack states them; the rainfall intensity is labelled a demo value.
 * The lot, house, driveway, contours, utilities and storm structures are
 * invented, and the project says so on every object's provenance.
 *
 * It is built to exercise the professional workflow: the driveway is too
 * steep for the project limit, the water and sewer in the street are closer
 * than Ten States allows, no building-to-lot-line dimensions exist yet, and
 * the rear-yard inlet has a drainage area but no pipe.
 */

import type { StudioModel, StudioObject, StudioObjectType, SourceKind, StudioGeometry, ObjectStatus, Pos } from './model'
import { DEFAULT_LAYER, DEFAULT_DISCIPLINE } from './model'

export const DEMO_ORIGIN: [number, number] = [1_320_000, 440_000]
export const DEMO_AUTHORITY = 'Kealee demo project (illustrative data)'

export function demoModel(ids: { organizationId: string; workspaceId: string; projectId: string; now?: string }): StudioModel {
  const now = ids.now ?? '2026-09-26T12:00:00.000Z'
  const [X, Y] = DEMO_ORIGIN
  const P = (x: number, y: number, z?: number): Pos => (z == null ? [X + x, Y + y] : [X + x, Y + y, z])
  const ring = (...pts: [number, number][]): StudioGeometry => ({ type: 'Polygon', coordinates: [[...pts.map(([x, y]) => P(x, y)), P(pts[0][0], pts[0][1])]] })
  const objs: StudioObject[] = []
  let n = 0
  const add = (type: StudioObjectType, geometry: StudioGeometry, status: ObjectStatus, source: SourceKind, attributes: Record<string, unknown> = {}, confidence = 0.9) => {
    const o: StudioObject = {
      id: `${ids.projectId}-o${String(++n).padStart(3, '0')}`, organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId: ids.projectId,
      type, geometry, attributes, layer: DEFAULT_LAYER[type], discipline: DEFAULT_DISCIPLINE[type] ?? 'CIVIL_SITE',
      source, sourceDate: '2026-09-01', sourceAccuracy: source === 'RECORDED_PLAT' ? 'survey_grade' : source === 'PROPOSED_DESIGN' ? 'schematic' : 'mapping_grade',
      sourceAuthority: DEMO_AUTHORITY, confidence, createdBy: 'demo-seed', createdAt: now, modifiedBy: 'demo-seed', modifiedAt: now,
      revisionId: `${ids.projectId}-r1`, status,
    }
    objs.push(o)
    return o
  }

  // Lot 100 × 150 ft; the street is to the south. Edge 0 (south) fronts it.
  add('ParcelBoundary', ring([0, 0], [100, 0], [100, 150], [0, 150]), 'EXISTING', 'RECORDED_PLAT',
    { parcelId: 'DEMO-LOT-12', lot: '12', block: 'B', plat: 'Plat Book DEMO-1, p. 4', areaSqFt: 15000, lotWidthFt: 100, edgeYards: ['front', 'side', 'rear', 'side'], label: 'Lot 12' }, 0.95)
  add('Lot', ring([100, 0], [180, 0], [180, 150], [100, 150]), 'EXISTING', 'COUNTY_GIS', { label: 'Lot 13' }, 0.75)
  add('Lot', ring([-80, 0], [0, 0], [0, 150], [-80, 150]), 'EXISTING', 'COUNTY_GIS', { label: 'Lot 11' }, 0.75)
  add('RightOfWay', ring([-80, -50], [180, -50], [180, 0], [-80, 0]), 'EXISTING', 'RECORDED_PLAT', { label: 'Demo Street (50 ft ROW)', widthFt: 50 }, 0.95)
  add('Road', { type: 'LineString', coordinates: [P(-80, -25), P(180, -25)] }, 'EXISTING', 'COUNTY_GIS', { label: 'Demo Street centreline' }, 0.75)
  add('Curb', { type: 'LineString', coordinates: [P(-80, -12), P(180, -12)] }, 'EXISTING', 'COUNTY_GIS', { label: 'Existing curb and gutter' }, 0.75)
  add('Easement', ring([0, 140], [100, 140], [100, 150], [0, 150]), 'EXISTING', 'RECORDED_PLAT', { easementType: '10 ft public utility easement', widthFt: 10, recordReference: 'Plat Book DEMO-1, p. 4', label: '10\' PUE' }, 0.95)

  // Existing ground rises 1 ft for every 15 ft northward: 100 at the front line to 110 at the rear.
  for (let k = 0; k <= 10; k++) add('Contour', { type: 'LineString', coordinates: [P(-10, 15 * k, 100 + k), P(110, 15 * k, 100 + k)] }, 'EXISTING', 'LIDAR', { elevationFt: 100 + k, major: (100 + k) % 5 === 0 }, 0.7)
  add('SpotElevation', { type: 'Point', coordinates: P(50, -12, 99.4) }, 'EXISTING', 'LIDAR', { elevationFt: 99.4, label: 'TC 99.4' }, 0.7)

  add('WaterLine', { type: 'LineString', coordinates: [P(-80, -8), P(180, -8)] }, 'EXISTING', 'UTILITY_GIS', { label: '8" W (WSSC GIS)', diameterIn: 8 }, 0.6)
  add('SewerLine', { type: 'LineString', coordinates: [P(-80, -16), P(180, -16)] }, 'EXISTING', 'UTILITY_GIS', { label: '8" S (WSSC GIS)', diameterIn: 8 }, 0.6)
  add('Inlet', { type: 'Point', coordinates: P(85, -12) }, 'EXISTING', 'UTILITY_GIS', { label: 'CB-2', invertFt: 95.5, rimFt: 99.4 }, 0.6)
  add('Tree', { type: 'Point', coordinates: P(15, 100) }, 'EXISTING', 'USER_SUPPLIED', { species: 'Red oak', dbhIn: 24, canopyRadiusFt: 18, label: '24" oak' }, 0.7)

  // Proposed design.
  add('BuildingFootprint', ring([30, 30], [70, 30], [70, 60], [30, 60]), 'PROPOSED', 'PROPOSED_DESIGN', { label: 'Proposed house', finishedFloorFt: 104.5, storeys: 2, heightFt: 28, use: 'Single-family detached' })
  add('Driveway', ring([45, 0], [55, 0], [55, 30], [45, 30]), 'PROPOSED', 'PROPOSED_DESIGN', { label: 'Proposed driveway', widthFt: 10, centerline: [P(50, 0, 100.0), P(50, 30, 104.0)] })
  add('Inlet', { type: 'Point', coordinates: P(85, 125) }, 'PROPOSED', 'PROPOSED_DESIGN', { label: 'CB-1', invertFt: 104.0, rimFt: 107.5, drainageAreaAcres: 0.35, runoffCoefficient: 0.45, outletTo: 'CB-2' })

  return {
    organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId: ids.projectId,
    revision: 1, revisionId: `${ids.projectId}-r1`, crs: 'EPSG:2248', verticalDatum: 'NAVD88', units: 'US_SURVEY_FT',
    zoning: {
      jurisdictionCode: 'prince_georges_md', zone: 'RSF-95', frontFt: 25, sideFt: 8, rearFt: 20, coveragePct: 35, heightFt: 35,
      citation: 'PG Zoning Ordinance §27-4202(e), Table 27-4202(e)', ruleSource: 'Prince George\'s County Zoning Ordinance (2022)',
      ruleVersion: 'pg-2022.1', effectiveDate: '2022-04-01', certification: 'CERTIFIED',
      requirements: (['front', 'side', 'rear', 'coverage', 'height'] as const).map(key => ({
        key, value: { front: 25, side: 8, rear: 20, coverage: 35, height: 35 }[key], unit: key === 'coverage' ? '%' as const : 'ft' as const,
        citation: 'PG Zoning Ordinance §27-4202(e)', ruleSource: 'Prince George\'s County Zoning Ordinance (2022)', ruleVersion: 'pg-2022.1',
        effectiveDate: '2022-04-01', outcome: 'APPLIED_CERTIFIED' as const, reviewReasons: [], certificationId: `demo-cert-${key}`, confidence: 0.95, reviewDiscipline: null,
      })),
    },
    design: { rainfallIntensityInPerHr: 7.1, designStormYears: 10, intensitySource: 'Demo value — use NOAA Atlas 14 at the site', maxDrivewayGradePct: 12 },
    objects: objs,
  }
}

export const DEMO_PROMPTS = [
  'Move the proposed house 5 feet east.',
  'Increase the driveway width to 12 feet.',
  'Check all setbacks.',
  'Create proposed grading around the house.',
  'Calculate drainage flow.',
  'Size the connecting storm pipe.',
  'Show conflicts.',
  'Explain failed rules.',
  'Prepare revised sheets.',
  'Reduce this section below 8% without changing the garage elevation.',
  'Create dimensions from this building to each property line.',
  'Connect CB-1 to CB-2.',
]
