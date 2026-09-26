/**
 * The Studio model and the SiteTwin are the same site seen two ways.
 *
 * Drawings are NOT redrawn for the Studio: the model is converted to a
 * SiteTwin and handed to the renderers and exporters the engine already has
 * (sheets/render-pdf.ts, render-svg.ts, export/dxf-ncs.ts, exporters.ts). The
 * reverse mapping imports a generated twin — the AI generator's output — as
 * Studio objects, so a Kealee-generated plan and a hand-drafted one live in
 * one model.
 */

import type { SiteTwin, SiteFeature, Ring, Position } from '../site-plan/site-twin'
import type { SourceRecord, ReliabilityLevel } from '../site-plan/reliability'
import {
  type StudioModel, type StudioObject, type StudioObjectType, type SourceKind, type Pos, type StudioGeometry,
  SOURCE_RELIABILITY, DEFAULT_LAYER, DEFAULT_DISCIPLINE, STUDIO_ENGINE_VERSION,
} from './model'
import { buffer, centroid } from './geometry'

const ring = (g: StudioGeometry): Ring | undefined => (g.type === 'Polygon' ? { coordinates: g.coordinates[0] as Position[] } : undefined)
const line = (g: StudioGeometry): Position[] | undefined => (g.type === 'LineString' ? (g.coordinates as Position[]) : undefined)
const point = (g: StudioGeometry): Position | undefined => (g.type === 'Point' ? (g.coordinates as Position) : g.type === 'Polygon' ? (centroid(g) as Position) : undefined)

function sourceIdOf(o: StudioObject) { return `${o.source}:${o.sourceAuthority ?? 'unstated'}` }

/** Studio model → SiteTwin, for the existing renderers and exporters. */
export function studioToTwin(m: StudioModel, meta: { siteId: string; address: string; horizontalDatum?: string | null }): SiteTwin {
  const live = m.objects.filter(o => o.status !== 'SUPERSEDED')
  const sources = new Map<string, SourceRecord>()
  for (const o of live) {
    const id = sourceIdOf(o)
    if (!sources.has(id)) sources.set(id, {
      sourceId: id, authority: o.sourceAuthority ?? o.source.replace(/_/g, ' ').toLowerCase(), dataset: o.source.replace(/_/g, ' ').toLowerCase(),
      retrievedAt: o.sourceDate ?? o.createdAt, crs: m.crs, horizontalDatum: meta.horizontalDatum ?? null, verticalDatum: m.verticalDatum,
      accuracyClass: o.sourceAccuracy, reliabilityLevel: SOURCE_RELIABILITY[o.source] as ReliabilityLevel,
    })
  }
  const features: SiteFeature[] = []
  for (const o of live) {
    const base = { id: o.id, sourceId: sourceIdOf(o), reliabilityLevel: SOURCE_RELIABILITY[o.source] as ReliabilityLevel, crs: m.crs, revision: m.revision }
    const attrs = { ...o.attributes, studioType: o.type, status: o.status, layer: o.layer, proposed: o.status === 'PROPOSED' }
    const f = toFeature(o, base, attrs)
    if (f) features.push(f)
  }
  return {
    siteId: meta.siteId, projectId: m.projectId, organizationId: m.organizationId, address: meta.address,
    jurisdictionCode: m.zoning?.jurisdictionCode ?? 'undetermined', crs: m.crs, horizontalDatum: meta.horizontalDatum ?? null,
    verticalDatum: m.verticalDatum, revision: m.revision, zoneCode: m.zoning?.zone ?? null, overlayCodes: [],
    features, approvals: [], sources: [...sources.values()], updatedAt: new Date().toISOString(),
  }
}

function toFeature(o: StudioObject, base: any, attrs: Record<string, unknown>): SiteFeature | null {
  const g = o.geometry
  switch (o.type) {
    case 'ParcelBoundary': return { ...base, kind: 'Parcel', parcelId: String(o.attributes.parcelId ?? '') || null, ring: ring(g)!, areaSqFt: Number(o.attributes.areaSqFt) || null, plat: o.attributes.plat as string | undefined }
    case 'BuildingFootprint': case 'Structure': return { ...base, kind: 'Building', ring: ring(g)!, existing: o.status !== 'PROPOSED', storeys: o.attributes.storeys as number | undefined, finishedFloorElevationFt: o.attributes.finishedFloorFt as number | undefined, use: o.attributes.use as string | undefined }
    case 'Setback': return { ...base, kind: 'Setback', side: (o.attributes.yard as 'front') ?? 'side', distanceFt: Number(o.attributes.distanceFt ?? 0), citation: String(o.attributes.citation ?? ''), ring: undefined }
    case 'BuildableArea': return { ...base, id: 'buildable-envelope', kind: 'ProposedFeature', ring: ring(g), attributes: { ...attrs, type: 'Buildable envelope' } }
    case 'Easement': return { ...base, kind: 'Easement', easementType: String(o.attributes.easementType ?? 'easement'), ring: ring(g) ?? { coordinates: [] }, widthFt: o.attributes.widthFt as number | undefined, recordReference: o.attributes.recordReference as string | undefined }
    case 'Floodplain': case 'Floodway': return { ...base, kind: 'Floodplain', ring: ring(g), designation: o.type }
    case 'Wetland': case 'Buffer': case 'CriticalArea': return { ...base, kind: 'EnvironmentalBuffer', ring: ring(g), designation: String(o.attributes.bufferType ?? o.type), bufferWidthFt: o.attributes.distanceFt as number | undefined }
    case 'Tree': { const p = point(g); const r = buffer({ type: 'Point', coordinates: p ?? [0, 0] }, Number(o.attributes.canopyRadiusFt ?? 10)); return { ...base, kind: 'Tree', ring: r ? ring(r) : undefined, designation: String(o.attributes.species ?? 'tree') } }
    case 'Contour': return { ...base, kind: 'Contour', line: line(g), attributes: { ...attrs, elevationFt: o.attributes.elevationFt } }
    case 'SpotElevation': return { ...base, kind: 'SpotElevation', point: point(g), attributes: attrs }
    case 'Breakline': return { ...base, kind: 'Breakline', line: line(g), attributes: attrs }
    case 'Driveway': case 'Parking': case 'Road': return { ...base, kind: 'Pavement', ring: ring(g), line: line(g), attributes: { ...attrs, type: o.type === 'Driveway' ? 'Driveway' : o.type } }
    case 'Sidewalk': return { ...base, kind: 'Sidewalk', ring: ring(g), line: line(g), attributes: attrs }
    case 'Pipe': case 'Culvert': return { ...base, kind: 'StormPipe', line: line(g), attributes: { ...attrs, size: o.attributes.label } }
    case 'WaterLine': case 'SewerLine': case 'GasLine': case 'ElectricLine': case 'TelecomLine': case 'Utility':
      return { ...base, kind: 'Utility', line: line(g), ring: ring(g), attributes: { ...attrs, type: String(o.attributes.utilityType ?? o.type.replace(/Line$/, '')) } }
    case 'Inlet': case 'Manhole': case 'Outfall': return { ...base, kind: 'Structure', point: point(g), attributes: { ...attrs, type: o.type } }
    case 'StormwaterFacility': case 'BMP': return { ...base, kind: 'SWMPractice', ring: ring(g), attributes: { ...attrs, practice: o.attributes.practice ?? o.type } }
    case 'GradingPad': return { ...base, kind: 'ProposedFeature', ring: ring(g), attributes: { ...attrs, type: 'Graded area', proposed: true } }
    default:
      return { ...base, kind: o.status === 'PROPOSED' ? 'ProposedFeature' : 'ExistingFeature', ring: ring(g), line: line(g), point: g.type === 'Point' ? point(g) : undefined, attributes: { ...attrs, type: o.type } }
  }
}

/** A twin source record → Studio provenance. Record data keeps its record class. */
export function sourceKindOf(s: SourceRecord | undefined, proposed: boolean): SourceKind {
  if (proposed) return 'PROPOSED_DESIGN'
  if (!s) return 'USER_SUPPLIED'
  const t = `${s.authority} ${s.dataset}`.toLowerCase()
  if (/\bplat\b/.test(t)) return 'RECORDED_PLAT'
  if (/\balta\b/.test(t)) return 'ALTA_SURVEY'
  if (/topographic survey|topo survey/.test(t)) return 'TOPOGRAPHIC_SURVEY'
  if (/boundary survey|\bsurvey\b/.test(t) && s.reliabilityLevel === 2) return 'BOUNDARY_SURVEY'
  if (/lidar|3dep|point cloud/.test(t)) return 'LIDAR'
  if (/\bdem\b|elevation model/.test(t)) return 'DEM'
  if (/utility|wssc|pepco|bge|washington gas|verizon/.test(t)) return 'UTILITY_GIS'
  if (/imagery|aerial|satellite|ortho/.test(t)) return 'SATELLITE_IMAGERY'
  if (/town|city of|municipal/.test(t)) return 'MUNICIPAL_GIS'
  if (/gis|county|atlas|parcel|imap|vgin|dcgis|mar\b|sdat/.test(t)) return 'COUNTY_GIS'
  if (/noaa|atlas 14|computed|calculated|engine|kealee/.test(t)) return 'ENGINE_CALCULATED'
  return s.reliabilityLevel === 0 ? 'USER_SUPPLIED' : 'COUNTY_GIS'
}

const KIND_TO_TYPE: Record<string, StudioObjectType> = {
  Parcel: 'ParcelBoundary', Building: 'BuildingFootprint', Setback: 'Setback', Easement: 'Easement', Floodplain: 'Floodplain',
  EnvironmentalBuffer: 'Buffer', Woodland: 'CriticalArea', Tree: 'Tree', Contour: 'Contour', SpotElevation: 'SpotElevation',
  Breakline: 'Breakline', Pavement: 'Driveway', Sidewalk: 'Sidewalk', StormPipe: 'Pipe', Structure: 'Inlet', SWMPractice: 'StormwaterFacility',
  LimitOfDisturbance: 'Annotation', DrainageArea: 'Annotation', DemolitionFeature: 'Structure', ParkingSpace: 'Parking', Surface: 'Annotation',
}

/**
 * SiteTwin → Studio objects. Used to bring a generated plan into the model.
 * Record features keep their record source; generated design is PROPOSED_DESIGN.
 */
export function twinToStudioObjects(twin: SiteTwin, ids: { organizationId: string; workspaceId: string; projectId: string; actorId: string; revisionId: string; now: string }): StudioObject[] {
  const src = new Map(twin.sources.map(s => [s.sourceId, s]))
  const out: StudioObject[] = []
  for (const f of twin.features) {
    const a = ((f as any).attributes ?? {}) as Record<string, unknown>
    let type: StudioObjectType | undefined = KIND_TO_TYPE[f.kind]
    const proposed = f.kind === 'Building' ? !(f as any).existing : f.kind === 'ProposedFeature' || a.proposed === true || /^(proposed|buildable)/i.test(f.id)
    if (f.kind === 'ProposedFeature' || f.kind === 'ExistingFeature' || f.kind === 'GenericFeature' as any) {
      const t = String(a.type ?? '').toLowerCase()
      type = f.id === 'buildable-envelope' || /buildable/.test(t) ? 'BuildableArea' : /graded/.test(t) ? 'GradingPad' : /swale/.test(t) ? 'Swale' : /silt|sediment|entrance/.test(t) ? 'Annotation' : 'Annotation'
    }
    if (f.kind === 'Utility') { const t = String(a.type ?? '').toLowerCase(); type = /water/.test(t) ? 'WaterLine' : /sewer|sanitary/.test(t) ? 'SewerLine' : /storm/.test(t) ? 'Pipe' : /gas/.test(t) ? 'GasLine' : /electric|power/.test(t) ? 'ElectricLine' : 'Utility' }
    if (f.kind === 'Pavement' && !/drive/i.test(String(a.type ?? 'drive'))) type = 'Parking'
    if (!type) continue
    const geometry = geometryOf(f)
    if (!geometry) continue
    const s = src.get(f.sourceId)
    const source = sourceKindOf(s, proposed || f.kind === 'Setback')
    out.push({
      id: `${ids.projectId.slice(0, 8)}-${f.id}`, organizationId: ids.organizationId, workspaceId: ids.workspaceId, projectId: ids.projectId,
      type, geometry, attributes: { ...a, ...(f.kind === 'Parcel' ? { parcelId: (f as any).parcelId, areaSqFt: (f as any).areaSqFt, plat: (f as any).plat } : {}), ...(f.kind === 'Setback' ? { yard: (f as any).side, distanceFt: (f as any).distanceFt, citation: (f as any).citation } : {}), ...(f.kind === 'Easement' ? { easementType: (f as any).easementType, recordReference: (f as any).recordReference } : {}), twinId: f.id },
      layer: DEFAULT_LAYER[type], discipline: DEFAULT_DISCIPLINE[type] ?? 'CIVIL_SITE',
      source: f.kind === 'Setback' ? 'ENGINE_CALCULATED' : source, sourceDate: s?.effectiveDate ?? s?.retrievedAt ?? null,
      sourceAccuracy: s?.accuracyClass ?? 'unknown', sourceAuthority: s?.authority ?? null,
      confidence: proposed ? 0.9 : s ? (s.reliabilityLevel === 2 ? 0.95 : s.reliabilityLevel === 1 ? 0.75 : 0.5) : 0.5,
      createdBy: ids.actorId, createdAt: ids.now, modifiedBy: ids.actorId, modifiedAt: ids.now, revisionId: ids.revisionId,
      status: proposed ? 'PROPOSED' : f.kind === 'DemolitionFeature' ? 'TO_BE_REMOVED' : 'EXISTING',
    })
  }
  return out
}

function geometryOf(f: SiteFeature): StudioGeometry | null {
  const r = (f as any).ring as Ring | undefined, l = (f as any).line as Pos[] | undefined, p = (f as any).point as Pos | undefined
  if (r?.coordinates?.length && r.coordinates.length >= 3) return { type: 'Polygon', coordinates: [r.coordinates as Pos[]] }
  if (l?.length && l.length >= 2) return { type: 'LineString', coordinates: l }
  if (p) return { type: 'Point', coordinates: p }
  if (f.kind === 'BoundarySegment') return { type: 'LineString', coordinates: [(f as any).from, (f as any).to] }
  return null
}

export const TWIN_BRIDGE_VERSION = STUDIO_ENGINE_VERSION
