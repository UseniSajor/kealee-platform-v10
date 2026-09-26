/**
 * Kealee Site Plan Studio — the canonical engineering model.
 *
 * ONE model for every way a site plan is made: the AI generator, a drafter at
 * the canvas, an engineer prompting against a selection, a reviewer's redline.
 * Nothing edits a rendered drawing. Every change is a typed command against
 * these objects (commands.ts), every drawing is rendered FROM them through the
 * existing SiteTwin renderer (twin-bridge.ts), and every object says where it
 * came from and how far it can be trusted.
 *
 * Coordinates are feet in the project CRS (EPSG:2248 for the DMV work the
 * engine already does). Elevations are feet in the project's vertical datum.
 */

export const STUDIO_ENGINE_VERSION = 'kealee-studio-1.0.0'

export const STUDIO_OBJECT_TYPES = [
  'ParcelBoundary', 'Lot', 'BuildingFootprint', 'Structure', 'Setback', 'BuildableArea',
  'Easement', 'RightOfWay', 'Road', 'Curb', 'Gutter', 'Sidewalk', 'Driveway', 'Parking',
  'RetainingWall', 'Fence', 'Contour', 'SpotElevation', 'Breakline', 'SlopeArrow',
  'GradingPad', 'Swale', 'Ditch', 'Pipe', 'Culvert', 'Inlet', 'Manhole', 'Outfall',
  'StormwaterFacility', 'BMP', 'WaterLine', 'SewerLine', 'GasLine', 'ElectricLine',
  'TelecomLine', 'Utility', 'Floodplain', 'Floodway', 'Wetland', 'Buffer', 'Tree',
  'CriticalArea', 'Annotation', 'Dimension', 'Label', 'SheetViewport', 'Profile', 'Section',
] as const
export type StudioObjectType = typeof STUDIO_OBJECT_TYPES[number]

export type Pos = [number, number] | [number, number, number]
export type StudioGeometry =
  | { type: 'Point'; coordinates: Pos }
  | { type: 'LineString'; coordinates: Pos[] }
  | { type: 'Polygon'; coordinates: Pos[][] }

/**
 * Where a value came from. The order of `SOURCE_RELIABILITY` is the order of
 * trust; nothing in the command engine can move an object UP it.
 */
export const SOURCE_KINDS = [
  'RECORDED_PLAT', 'BOUNDARY_SURVEY', 'TOPOGRAPHIC_SURVEY', 'ALTA_SURVEY',
  'FIELD_OBSERVATION', 'ENGINEERING_REPORT', 'ARCHITECTURAL_DRAWING',
  'COUNTY_GIS', 'MUNICIPAL_GIS', 'UTILITY_GIS', 'LIDAR', 'DEM', 'SATELLITE_IMAGERY',
  'USER_SUPPLIED', 'AI_INFERRED', 'ENGINE_CALCULATED', 'PROPOSED_DESIGN',
] as const
export type SourceKind = typeof SOURCE_KINDS[number]

/**
 * Reliability, matching site-plan/reliability.ts: 2 = professional record,
 * 1 = preliminary (GIS/LiDAR), 0 = unverified. A PROPOSED_DESIGN object is the
 * design itself — its reliability is not a measurement claim, so it is scored
 * by review status instead.
 */
export const SOURCE_RELIABILITY: Record<SourceKind, 0 | 1 | 2> = {
  RECORDED_PLAT: 2, BOUNDARY_SURVEY: 2, TOPOGRAPHIC_SURVEY: 2, ALTA_SURVEY: 2,
  FIELD_OBSERVATION: 2, ENGINEERING_REPORT: 2, ARCHITECTURAL_DRAWING: 1,
  COUNTY_GIS: 1, MUNICIPAL_GIS: 1, UTILITY_GIS: 1, LIDAR: 1, DEM: 1, SATELLITE_IMAGERY: 0,
  USER_SUPPLIED: 0, AI_INFERRED: 0, ENGINE_CALCULATED: 1, PROPOSED_DESIGN: 1,
}

/**
 * Sources that record an EXISTING fact. Their geometry is evidence, not
 * design: no command moves, reshapes or deletes it. A boundary of record is
 * changed by a new survey import, never by an edit (KEALEE.md: the plat
 * supersedes every other source; when two disagree, report and move neither).
 */
export const RECORD_SOURCES: ReadonlySet<SourceKind> = new Set([
  'RECORDED_PLAT', 'BOUNDARY_SURVEY', 'TOPOGRAPHIC_SURVEY', 'ALTA_SURVEY', 'FIELD_OBSERVATION',
  'COUNTY_GIS', 'MUNICIPAL_GIS', 'UTILITY_GIS', 'LIDAR', 'DEM', 'SATELLITE_IMAGERY',
  'ENGINEERING_REPORT', 'ARCHITECTURAL_DRAWING',
])

/** Sources that claim a person measured or certified the value. */
export const SURVEYED_SOURCES: ReadonlySet<SourceKind> = new Set([
  'RECORDED_PLAT', 'BOUNDARY_SURVEY', 'TOPOGRAPHIC_SURVEY', 'ALTA_SURVEY', 'FIELD_OBSERVATION',
])

/** What a command may give a NEW object. Record sources arrive by import only. */
export const COMMAND_CREATABLE_SOURCES: ReadonlySet<SourceKind> = new Set([
  'PROPOSED_DESIGN', 'USER_SUPPLIED', 'AI_INFERRED', 'ENGINE_CALCULATED',
])

export type AccuracyClass = 'survey_grade' | 'mapping_grade' | 'approximate' | 'schematic' | 'unknown'

export const DISCIPLINES = [
  'SURVEY', 'CIVIL_SITE', 'GRADING', 'STORMWATER', 'UTILITIES', 'TRANSPORTATION',
  'ENVIRONMENTAL', 'ZONING', 'ARCHITECTURE', 'LANDSCAPE', 'DRAFTING',
] as const
export type Discipline = typeof DISCIPLINES[number]

export type ObjectStatus = 'EXISTING' | 'PROPOSED' | 'TO_BE_REMOVED' | 'REFERENCE' | 'SUPERSEDED'

export interface StudioObject {
  id: string
  organizationId: string
  workspaceId: string
  projectId: string
  type: StudioObjectType
  geometry: StudioGeometry
  attributes: Record<string, unknown>
  layer: string
  discipline: Discipline
  source: SourceKind
  sourceDate: string | null
  sourceAccuracy: AccuracyClass
  sourceAuthority: string | null
  /** 0..1 — how sure the producer is. An AI_INFERRED object never exceeds 0.6. */
  confidence: number
  createdBy: string
  createdAt: string
  modifiedBy: string
  modifiedAt: string
  /** The revision that last wrote this object. */
  revisionId: string
  status: ObjectStatus
}

/**
 * One requirement as the RULE ENGINE determined it (rules/evaluate.ts). The
 * Studio never decides what the ordinance requires — it compares the design
 * against this, and carries the certification outcome through so a PASS
 * against an uncertified number still routes to review.
 */
export interface RequirementRef {
  key: 'front' | 'side' | 'rear' | 'coverage' | 'height' | string
  value: number | null
  unit: 'ft' | '%'
  citation: string | null
  ruleSource: string | null
  ruleVersion: string | null
  effectiveDate: string | null
  /** RuleEvaluation.outcome from the rule engine. */
  outcome: 'APPLIED_CERTIFIED' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'NOT_APPLICABLE'
  reviewReasons: string[]
  certificationId: string | null
  /** Extraction/source confidence as the pack states it, 0..1. */
  confidence: number
  reviewDiscipline: string | null
}

/** Zoning context the rules evaluate against, with its citation carried through. */
export interface ZoningContext {
  jurisdictionCode: string
  zone: string | null
  frontFt: number | null
  sideFt: number | null
  rearFt: number | null
  coveragePct: number | null
  heightFt: number | null
  citation: string | null
  ruleSource: string | null
  ruleVersion: string | null
  effectiveDate: string | null
  /** Rule-certification state of the pack the numbers came from. */
  certification: 'CERTIFIED' | 'PRELIMINARY' | 'UNCERTIFIED'
  /** Per-requirement references; absent keys fall back to the fields above as UNCERTIFIED. */
  requirements?: RequirementRef[]
}

/** The requirement for a key, synthesised from the flat fields when no rule reference was supplied. */
export function requirementFor(z: ZoningContext | null, key: RequirementRef['key']): RequirementRef | null {
  if (!z) return null
  const found = z.requirements?.find(r => r.key === key)
  if (found) return found
  const value = key === 'front' ? z.frontFt : key === 'side' ? z.sideFt : key === 'rear' ? z.rearFt : key === 'coverage' ? z.coveragePct : key === 'height' ? z.heightFt : null
  if (value == null) return null
  return {
    key, value, unit: key === 'coverage' ? '%' : 'ft', citation: z.citation, ruleSource: z.ruleSource,
    ruleVersion: z.ruleVersion, effectiveDate: z.effectiveDate,
    outcome: z.certification === 'CERTIFIED' ? 'APPLIED_CERTIFIED' : 'REVIEW_REQUIRED',
    reviewReasons: z.certification === 'CERTIFIED' ? [] : ['RULE_NOT_CERTIFIED'],
    certificationId: null, confidence: z.certification === 'CERTIFIED' ? 0.95 : 0.8, reviewDiscipline: z.certification === 'CERTIFIED' ? null : 'land_use_planner',
  }
}

export interface StudioModel {
  organizationId: string
  workspaceId: string
  projectId: string
  /** Monotonic revision number; revisionId below names the same revision. */
  revision: number
  revisionId: string
  crs: string
  verticalDatum: string | null
  units: 'US_SURVEY_FT'
  zoning: ZoningContext | null
  /** Design criteria the project runs on, each with where it came from. */
  design?: {
    rainfallIntensityInPerHr?: number | null
    designStormYears?: number | null
    intensitySource?: string | null
    maxDrivewayGradePct?: number | null
  }
  objects: StudioObject[]
}

/** Layer defaults, NCS-style names, used when a command does not name one. */
export const DEFAULT_LAYER: Record<StudioObjectType, string> = {
  ParcelBoundary: 'V-PROP-LINE', Lot: 'V-PROP-LOTS', BuildingFootprint: 'C-BLDG', Structure: 'C-BLDG-STRC',
  Setback: 'C-PROP-BRLN', BuildableArea: 'C-PROP-ENVL', Easement: 'V-PROP-ESMT', RightOfWay: 'V-PROP-ROWY',
  Road: 'C-ROAD', Curb: 'C-ROAD-CURB', Gutter: 'C-ROAD-GUTR', Sidewalk: 'C-WALK', Driveway: 'C-ROAD-DRWY',
  Parking: 'C-PKNG', RetainingWall: 'C-SITE-RWAL', Fence: 'C-SITE-FENC', Contour: 'C-TOPO-MAJR',
  SpotElevation: 'C-TOPO-SPOT', Breakline: 'C-TOPO-BRKL', SlopeArrow: 'C-TOPO-SLOP', GradingPad: 'C-GRAD-PADS',
  Swale: 'C-STRM-SWAL', Ditch: 'C-STRM-DTCH', Pipe: 'C-STRM-PIPE', Culvert: 'C-STRM-CULV', Inlet: 'C-STRM-STRC',
  Manhole: 'C-STRM-STRC', Outfall: 'C-STRM-OUTF', StormwaterFacility: 'C-STRM-FACL', BMP: 'C-STRM-BMP',
  WaterLine: 'C-WATR', SewerLine: 'C-SSWR', GasLine: 'C-NGAS', ElectricLine: 'C-POWR', TelecomLine: 'C-COMM',
  Utility: 'C-UTIL', Floodplain: 'C-FLOD', Floodway: 'C-FLOD-WAY', Wetland: 'C-ENVR-WETL', Buffer: 'C-ENVR-BUFF',
  Tree: 'L-PLNT-TREE', CriticalArea: 'C-ENVR-CRIT', Annotation: 'C-ANNO-TEXT', Dimension: 'C-ANNO-DIMS',
  Label: 'C-ANNO-LABL', SheetViewport: 'G-ANNO-VPRT', Profile: 'C-PROF', Section: 'C-SECT',
}

export const DEFAULT_DISCIPLINE: Partial<Record<StudioObjectType, Discipline>> = {
  ParcelBoundary: 'SURVEY', Lot: 'SURVEY', Easement: 'SURVEY', RightOfWay: 'SURVEY',
  BuildingFootprint: 'ARCHITECTURE', Structure: 'ARCHITECTURE', Setback: 'ZONING', BuildableArea: 'ZONING',
  Contour: 'GRADING', SpotElevation: 'GRADING', Breakline: 'GRADING', SlopeArrow: 'GRADING', GradingPad: 'GRADING',
  RetainingWall: 'GRADING', Swale: 'STORMWATER', Ditch: 'STORMWATER', Pipe: 'STORMWATER', Culvert: 'STORMWATER',
  Inlet: 'STORMWATER', Manhole: 'STORMWATER', Outfall: 'STORMWATER', StormwaterFacility: 'STORMWATER', BMP: 'STORMWATER',
  WaterLine: 'UTILITIES', SewerLine: 'UTILITIES', GasLine: 'UTILITIES', ElectricLine: 'UTILITIES',
  TelecomLine: 'UTILITIES', Utility: 'UTILITIES', Road: 'TRANSPORTATION', Curb: 'TRANSPORTATION',
  Gutter: 'TRANSPORTATION', Sidewalk: 'TRANSPORTATION', Driveway: 'TRANSPORTATION', Parking: 'TRANSPORTATION',
  Floodplain: 'ENVIRONMENTAL', Floodway: 'ENVIRONMENTAL', Wetland: 'ENVIRONMENTAL', Buffer: 'ENVIRONMENTAL',
  CriticalArea: 'ENVIRONMENTAL', Tree: 'LANDSCAPE', Fence: 'CIVIL_SITE',
}

export const UTILITY_TYPES: ReadonlySet<StudioObjectType> = new Set([
  'WaterLine', 'SewerLine', 'GasLine', 'ElectricLine', 'TelecomLine', 'Utility', 'Pipe', 'Culvert',
])
export const ENVIRONMENTAL_TYPES: ReadonlySet<StudioObjectType> = new Set([
  'Floodplain', 'Floodway', 'Wetland', 'Buffer', 'CriticalArea',
])
export const IMPERVIOUS_TYPES: ReadonlySet<StudioObjectType> = new Set([
  'BuildingFootprint', 'Structure', 'Driveway', 'Sidewalk', 'Parking', 'Road',
])

export function objectById(model: StudioModel, id: string): StudioObject | undefined {
  return model.objects.find(o => o.id === id)
}

/** Every vertex of a geometry, flat. */
export function verticesOf(g: StudioGeometry): Pos[] {
  if (g.type === 'Point') return [g.coordinates]
  if (g.type === 'LineString') return g.coordinates
  return g.coordinates.flat()
}

/** Human-readable label for provenance, used by the UI and in explanations. */
export function provenanceLabel(o: Pick<StudioObject, 'source' | 'sourceAuthority' | 'sourceDate' | 'confidence'>): string {
  const lvl = SOURCE_RELIABILITY[o.source]
  const rel = lvl === 2 ? 'professional record' : lvl === 1 ? 'preliminary' : 'unverified'
  return `${o.source.replace(/_/g, ' ').toLowerCase()} (${rel})` +
    (o.sourceAuthority ? ` — ${o.sourceAuthority}` : '') +
    (o.sourceDate ? `, ${o.sourceDate.slice(0, 10)}` : '') +
    `, confidence ${Math.round(o.confidence * 100)}%`
}
