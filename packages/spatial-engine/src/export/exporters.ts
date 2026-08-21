/**
 * Engineering data exports.
 *
 * The point of these is handoff. Kealee drafts the set; a consulting engineer or
 * surveyor may need to finish, revise or seal it in their own platform. Clean
 * exports mean they continue the work rather than redraw it.
 *
 * This is deliberately NOT a claim to replace Civil 3D. It is a clean data
 * handoff so the professional can work where they already work.
 */

import type { SiteTwin, SiteFeature, Ring } from '../site-plan/site-twin'
import type { Calculation } from '../site-plan/engineering'
import {
  resolveCrs, assertPlausibleWgs84, WGS84, CrsExportError,
  type CrsTransformer, type Point2D,
} from './crs'

// ── GeoJSON ─────────────────────────────────────────────────────────────────

/**
 * RFC 7946 GeoJSON — WGS84, longitude first.
 *
 * State Plane, local-grid and CAD coordinates are NEVER written into GeoJSON.
 * RFC 7946 removed the `crs` member, so a conforming reader treats whatever
 * numbers it finds as lon/lat degrees; emitting 1326382, 464763 would place this
 * Maryland site off the coast of West Africa.
 *
 * Therefore:
 *   - the source CRS is resolved and validated, and an unknown CRS or a datum
 *     conflict BLOCKS the export rather than defaulting;
 *   - geometry is transformed to EPSG:4326 through a real transformer;
 *   - the result is range-checked, because out-of-range values are the
 *     signature of untransformed coordinates;
 *   - the original engineering coordinates are retained per feature under
 *     `engineeringGeometry`, so the survey/CAD grid survives the round trip.
 */
export async function toGeoJson(
  twin: SiteTwin,
  transformer: CrsTransformer,
): Promise<string> {
  const sourceCrs = resolveCrs(twin.crs, twin.horizontalDatum)

  // Collect every coordinate once so the transform is a single batched call.
  const flat: Point2D[] = []
  const index: { feature: SiteFeature; kind: 'ring' | 'line' | 'point'; start: number; count: number }[] = []
  for (const f of twin.features) {
    const g = f as { ring?: Ring; line?: number[][]; point?: number[] }
    if (g.ring) {
      const pts = g.ring.coordinates.map(c => [c[0], c[1]] as Point2D)
      index.push({ feature: f, kind: 'ring', start: flat.length, count: pts.length })
      flat.push(...pts)
    } else if (g.line) {
      const pts = g.line.map(c => [c[0], c[1]] as Point2D)
      index.push({ feature: f, kind: 'line', start: flat.length, count: pts.length })
      flat.push(...pts)
    } else if (g.point) {
      index.push({ feature: f, kind: 'point', start: flat.length, count: 1 })
      flat.push([g.point[0], g.point[1]])
    }
  }

  const transformed =
    sourceCrs.epsg === WGS84.epsg ? flat : await transformer.transform(flat, sourceCrs, WGS84)
  assertPlausibleWgs84(transformed)

  const features = index.map(({ feature, kind, start, count }) => {
    const wgs = transformed.slice(start, start + count)
    const g = feature as { ring?: Ring; line?: number[][]; point?: number[] }
    const original =
      kind === 'ring' ? g.ring!.coordinates : kind === 'line' ? g.line! : [g.point!]

    const geometry =
      kind === 'ring'
        ? { type: 'Polygon', coordinates: [wgs] }
        : kind === 'line'
          ? { type: 'LineString', coordinates: wgs }
          : { type: 'Point', coordinates: wgs[0] }

    return {
      type: 'Feature',
      geometry,
      properties: {
        id: feature.id,
        kind: feature.kind,
        sourceId: feature.sourceId,
        reliabilityLevel: feature.reliabilityLevel,
        revision: feature.revision,
        // The engineering grid is retained, not discarded — a consultant needs
        // the original survey coordinates, not degrees rounded through a datum.
        engineeringGeometry: {
          crs: sourceCrs.code,
          crsName: sourceCrs.name,
          datum: sourceCrs.datum,
          unit: sourceCrs.unit,
          coordinates: original,
        },
        ...((feature as { attributes?: Record<string, unknown> }).attributes ?? {}),
      },
    }
  })

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      // No `crs` member: RFC 7946 removed it. Coordinates below ARE WGS84.
      features,
      kealee: {
        siteId: twin.siteId,
        modelRevision: twin.revision,
        geoJsonCrs: 'EPSG:4326 (RFC 7946, longitude first)',
        sourceCrs: sourceCrs.code,
        sourceCrsName: sourceCrs.name,
        horizontalDatum: twin.horizontalDatum,
        verticalDatum: twin.verticalDatum,
        transformer: transformer.name,
        note:
          'Geometry is WGS84 per RFC 7946. Original engineering coordinates are preserved ' +
          'per feature under properties.engineeringGeometry.',
      },
    },
    null,
    1,
  )
}

// ── DXF ─────────────────────────────────────────────────────────────────────

const DXF_LAYERS: Record<string, { name: string; color: number }> = {
  Parcel: { name: 'V-PROP-LINE', color: 7 },
  BoundarySegment: { name: 'V-PROP-LINE', color: 7 },
  Easement: { name: 'V-PROP-ESMT', color: 5 },
  Building: { name: 'A-BLDG-OTLN', color: 3 },
  Setback: { name: 'V-PROP-SBCK', color: 1 },
  LimitOfDisturbance: { name: 'C-LOD', color: 30 },
  Utility: { name: 'C-UTIL', color: 4 },
  StormPipe: { name: 'C-STRM-PIPE', color: 4 },
  SWMPractice: { name: 'C-SWM', color: 92 },
  DrainageArea: { name: 'C-DRNG-AREA', color: 150 },
  Pavement: { name: 'C-PVMT', color: 8 },
  Tree: { name: 'L-PLNT-TREE', color: 90 },
  DemolitionFeature: { name: 'C-DEMO', color: 1 },
  Contour: { name: 'C-TOPO-MAJR', color: 32 },
  SpotElevation: { name: 'C-TOPO-SPOT', color: 7 },
  ProposedFeature: { name: 'C-PROP', color: 6 },
}

function layerFor(kind: string): { name: string; color: number } {
  return DXF_LAYERS[kind] ?? { name: 'C-MISC', color: 7 }
}

function dxfPair(code: number | string, value: string | number): string {
  return `${code}\n${value}\n`
}

/**
 * Minimal but valid DXF R12 — the most broadly readable interchange format.
 * Deliberately hand-written rather than pulling a dependency: R12 entities are
 * simple, and this keeps the export path free of install-state problems.
 */
export function toDxf(twin: SiteTwin): string {
  const layers = [...new Set(twin.features.map(f => layerFor(f.kind).name))]

  let out = ''
  // HEADER
  out += dxfPair(0, 'SECTION') + dxfPair(2, 'HEADER')
  out += dxfPair(9, '$INSUNITS') + dxfPair(70, 2) // 2 = feet
  out += dxfPair(0, 'ENDSEC')

  // TABLES — layers
  out += dxfPair(0, 'SECTION') + dxfPair(2, 'TABLES')
  out += dxfPair(0, 'TABLE') + dxfPair(2, 'LAYER') + dxfPair(70, layers.length)
  for (const name of layers) {
    const color = Object.values(DXF_LAYERS).find(l => l.name === name)?.color ?? 7
    out += dxfPair(0, 'LAYER') + dxfPair(2, name) + dxfPair(70, 0) + dxfPair(62, color) + dxfPair(6, 'CONTINUOUS')
  }
  out += dxfPair(0, 'ENDTAB') + dxfPair(0, 'ENDSEC')

  // ENTITIES
  out += dxfPair(0, 'SECTION') + dxfPair(2, 'ENTITIES')
  for (const f of twin.features) {
    const layer = layerFor(f.kind).name
    const g = f as { ring?: Ring; line?: number[][]; point?: number[] }
    const coords = g.ring?.coordinates ?? g.line
    if (coords && coords.length > 1) {
      out += dxfPair(0, 'POLYLINE') + dxfPair(8, layer) + dxfPair(66, 1) + dxfPair(70, g.ring ? 1 : 0)
      for (const p of coords) {
        out += dxfPair(0, 'VERTEX') + dxfPair(8, layer)
        out += dxfPair(10, p[0]) + dxfPair(20, p[1]) + dxfPair(30, p[2] ?? 0)
      }
      out += dxfPair(0, 'SEQEND')
    } else if (g.point) {
      out += dxfPair(0, 'POINT') + dxfPair(8, layer)
      out += dxfPair(10, g.point[0]) + dxfPair(20, g.point[1]) + dxfPair(30, g.point[2] ?? 0)
    }
  }
  out += dxfPair(0, 'ENDSEC') + dxfPair(0, 'EOF')
  return out
}

// ── LandXML ─────────────────────────────────────────────────────────────────

const xmlEsc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * LandXML 1.2 — parcels and alignments, the format survey and civil packages
 * exchange. Surfaces are emitted only when real elevation data exists; an
 * invented TIN would be worse than none.
 */
export function toLandXml(twin: SiteTwin): string {
  const parcels = twin.features.filter(f => f.kind === 'Parcel') as (SiteFeature & { ring: Ring; parcelId?: string | null; areaSqFt?: number | null })[]
  const now = new Date().toISOString()

  const parcelXml = parcels
    .map(p => {
      const coords = p.ring.coordinates
        .map(c => `            <PntList2D>${c[1]} ${c[0]}</PntList2D>`)
        .join('\n')
      return [
        `      <Parcel name="${xmlEsc(p.parcelId ?? p.id)}" area="${p.areaSqFt ?? 0}" parcelType="Single">`,
        '        <CoordGeom>',
        coords,
        '        </CoordGeom>',
        '      </Parcel>',
      ].join('\n')
    })
    .join('\n')

  const hasElevation = twin.features.some(f => {
    const g = f as { point?: number[] }
    return g.point && g.point.length > 2
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"',
    '         version="1.2"',
    `         date="${now.slice(0, 10)}" time="${now.slice(11, 19)}">`,
    `  <Units><Imperial areaUnit="squareFoot" linearUnit="USSurveyFoot" volumeUnit="cubicFeet"`,
    '           temperatureUnit="fahrenheit" pressureUnit="inHG"/></Units>',
    `  <Project name="${xmlEsc(twin.address)}"/>`,
    '  <Application name="Kealee Site Plan Engine" version="1.0"/>',
    `  <!-- Coordinate system ${xmlEsc(twin.crs)}; horizontal datum ${xmlEsc(twin.horizontalDatum ?? 'NOT ESTABLISHED')};`,
    `       vertical datum ${xmlEsc(twin.verticalDatum ?? 'NOT ESTABLISHED')}. Model revision ${twin.revision}. -->`,
    `  <CoordinateSystem desc="${xmlEsc(twin.crs)}" horizontalDatum="${xmlEsc(twin.horizontalDatum ?? '')}"`,
    `                    verticalDatum="${xmlEsc(twin.verticalDatum ?? '')}"/>`,
    '  <Parcels>',
    parcelXml,
    '  </Parcels>',
    hasElevation
      ? '  <!-- Surfaces omitted: elevation data present but TIN generation requires a surveyed surface. -->'
      : '  <!-- No Surfaces element: no vertical datum or elevation data is established for this site. -->',
    '</LandXML>',
  ].join('\n')
}

// ── Machine-readable plan manifest ──────────────────────────────────────────

export interface PlanManifest {
  siteId: string
  address: string
  jurisdiction: string
  modelRevision: number
  crs: string
  horizontalDatum: string | null
  verticalDatum: string | null
  generatedAt: string
  platformRole: string
  sheets: { id: string; title: string; discipline: string; scale: string; modelRevision: number }[]
  calculations: { name: string; equation: string; value: unknown; assumptions: string[]; reference: string; calcVersion: string }[]
  assumptions: string[]
  sources: { dataset: string; authority: string; retrievedAt: string; reliabilityLevel: number }[]
  reviewStatus: string
}

export function buildPlanManifest(input: {
  twin: SiteTwin
  sheets: { id: string; title: string; discipline: string; scale: string }[]
  calculations: Record<string, Calculation<unknown>>
  assumptions: string[]
  reviewStatus: string
}): PlanManifest {
  return {
    siteId: input.twin.siteId,
    address: input.twin.address,
    jurisdiction: input.twin.jurisdictionCode,
    modelRevision: input.twin.revision,
    crs: input.twin.crs,
    horizontalDatum: input.twin.horizontalDatum,
    verticalDatum: input.twin.verticalDatum,
    generatedAt: new Date().toISOString(),
    platformRole: 'Kealee drafted this set. It requires review, correction and sealing by a licensed professional.',
    sheets: input.sheets.map(s => ({ ...s, modelRevision: input.twin.revision })),
    calculations: Object.entries(input.calculations).map(([name, c]) => ({
      name,
      equation: c.equation,
      value: c.value,
      assumptions: c.assumptions,
      reference: c.reference,
      calcVersion: c.calcVersion,
    })),
    assumptions: input.assumptions,
    sources: input.twin.sources.map(s => ({
      dataset: s.dataset,
      authority: s.authority,
      retrievedAt: s.retrievedAt,
      reliabilityLevel: s.reliabilityLevel,
    })),
    reviewStatus: input.reviewStatus,
  }
}
