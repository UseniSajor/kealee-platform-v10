/**
 * Survey import provenance.
 *
 * A survey is the only Level 2 evidence the engine accepts, so what is recorded
 * about it matters as much as the geometry. Every field the brief requires is
 * explicit here, and nothing is inferred: an unknown CRS, datum, benchmark,
 * licence or certification stays unknown.
 *
 * Where automatic detection suggests a CRS it is stored as `candidateCrs` and
 * never as `crs`. Candidate geometry cannot reach Level 2 until a human confirms
 * it — a plausible guess about coordinate systems is exactly the kind of error
 * that survives review and puts a building on the neighbour's lot.
 */

import type { ReliabilityLevel } from '../site-plan/reliability'

export type SurveyFormat = 'csv' | 'landxml' | 'dxf' | 'dwg' | 'las' | 'laz' | 'pdf' | 'geojson' | 'shapefile'

export type VerificationStatus =
  | 'unverified'
  | 'candidate_crs_pending_confirmation'
  | 'confirmed'
  | 'professionally_certified'

export interface SurveyorIdentity {
  name: string
  /** Maryland Professional Land Surveyor number. */
  licenceNumber: string
  state: string
  licenceVerifiedAt?: string
}

export interface SealStatus {
  /** Whether the source document carries a seal/signature. */
  sealed: boolean
  signedAt?: string
  /** How the seal was established — never assumed from the file alone. */
  evidence: 'document_reviewed' | 'declared_by_uploader' | 'none'
  notes?: string
}

export interface TransformationStep {
  operation: string
  from: string
  to: string
  method: string
  performedBy: string
}

/** Everything the brief requires an import to preserve. */
export interface SurveyImportRecord {
  importId: string
  originalFilename: string
  /** SHA-256 of the uploaded bytes. */
  checksum: string
  format: SurveyFormat
  uploadedAt: string
  /** Date the survey was performed, when stated. Never inferred from upload date. */
  surveyDate: string | null
  surveyor: SurveyorIdentity | null
  seal: SealStatus
  /** Confirmed horizontal CRS. Null until confirmed. */
  crs: string | null
  /** Auto-detected CRS awaiting confirmation. Never treated as `crs`. */
  candidateCrs: string | null
  horizontalDatum: string | null
  verticalDatum: string | null
  coordinateUnit: 'usSurveyFoot' | 'foot' | 'metre' | 'degree' | null
  benchmark: BenchmarkRecord | null
  transformationPipeline: TransformationStep[]
  parserVersion: string
  /** Raw parsed geometry before any normalisation. */
  sourceGeometryCount: number
  normalizedGeometryCount: number
  confidence: number
  verificationStatus: VerificationStatus
  reliabilityLevel: ReliabilityLevel
  /** Why the import sits at the level it does. */
  levelRationale: string
  warnings: string[]
}

export interface BenchmarkRecord {
  id: string
  description: string
  elevation: number
  datum: string
  /** Location in the survey's own coordinate system. */
  northing?: number
  easting?: number
}

export const PARSER_VERSION = 'kealee-survey-1.0.0'

/** Point identifier plus description, kept distinct rather than flattened. */
export interface SurveyPoint {
  pointId: string
  northing: number
  easting: number
  elevation: number | null
  /** Raw description code from the field book, e.g. "IPF", "EOP", "TREE24". */
  description: string
  /** Classification derived from the description, never overwriting it. */
  classification: SurveyPointClass
}

export type SurveyPointClass =
  | 'boundary_monument'
  | 'control'
  | 'benchmark'
  | 'spot_elevation'
  | 'building_corner'
  | 'pavement'
  | 'curb'
  | 'sidewalk'
  | 'wall'
  | 'fence'
  | 'tree'
  | 'utility_structure'
  | 'drainage_structure'
  | 'pipe_invert'
  | 'stream'
  | 'unclassified'

/**
 * Description-code mapping. Codes vary by surveyor, so an unrecognised code
 * classifies as `unclassified` and keeps its raw text rather than being guessed
 * into the wrong object type.
 */
const DESCRIPTION_CODES: [RegExp, SurveyPointClass][] = [
  [/^(IPF|IPS|IRF|IRS|MON|REBAR|PK|CONC\s*MON)/i, 'boundary_monument'],
  [/^(CP|CTRL|CONTROL)/i, 'control'],
  [/^(BM|TBM|BENCH)/i, 'benchmark'],
  [/^(SPOT|GND|GRD|EL)/i, 'spot_elevation'],
  [/^(BLDG|BC|HOUSE|GAR)/i, 'building_corner'],
  [/^(EOP|EP|AC|ASPH|PVMT)/i, 'pavement'],
  [/^(CURB|C&G|TC|BC(?!.*BLDG))/i, 'curb'],
  [/^(SW|SIDEWALK|WALK)/i, 'sidewalk'],
  [/^(WALL|RW|RET)/i, 'wall'],
  [/^(FEN|FENCE|FN)/i, 'fence'],
  [/^(TR|TREE)/i, 'tree'],
  [/^(MH|MANHOLE|WV|WM|GV|GM|EM|TEL|UTIL)/i, 'utility_structure'],
  [/^(INL|INLET|CB|CATCH|DI)/i, 'drainage_structure'],
  [/^(INV|INVERT|FL)/i, 'pipe_invert'],
  [/^(STR|STREAM|CL\s*STR|TOB)/i, 'stream'],
]

export function classifyDescription(description: string): SurveyPointClass {
  const d = description.trim()
  for (const [re, cls] of DESCRIPTION_CODES) if (re.test(d)) return cls
  return 'unclassified'
}

/** SHA-256 without pulling a dependency — uses the platform crypto. */
export async function checksumOf(bytes: string | Uint8Array): Promise<string> {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Decides the reliability level an import may claim.
 *
 * Level 2 requires: a confirmed CRS (not a candidate), a horizontal datum, an
 * identified Maryland surveyor with a licence number, and seal evidence
 * established by document review. Anything short of that is Level 1 or 0 with
 * the reason recorded — the data is still usable for drafting.
 */
export function assessReliability(input: {
  crs: string | null
  candidateCrs: string | null
  horizontalDatum: string | null
  surveyor: SurveyorIdentity | null
  seal: SealStatus
  format: SurveyFormat
  hasGeometry: boolean
}): { level: ReliabilityLevel; status: VerificationStatus; rationale: string } {
  if (!input.hasGeometry) {
    return { level: 0, status: 'unverified', rationale: 'No geometry was parsed from the file.' }
  }
  if (!input.crs) {
    return {
      level: input.candidateCrs ? 1 : 0,
      status: input.candidateCrs ? 'candidate_crs_pending_confirmation' : 'unverified',
      rationale: input.candidateCrs
        ? `A coordinate system (${input.candidateCrs}) was inferred but not confirmed. Geometry is ` +
          'usable for drafting at Level 1; confirmation is required before it can be treated as certified.'
        : 'No coordinate reference system is established, so the geometry cannot be georeferenced.',
    }
  }
  if (!input.horizontalDatum) {
    return { level: 1, status: 'confirmed', rationale: 'CRS is confirmed but no horizontal datum is recorded.' }
  }
  if (!input.surveyor?.licenceNumber) {
    return {
      level: 1, status: 'confirmed',
      rationale: 'Geometry is georeferenced but no responsible Maryland surveyor is identified, ' +
        'so it cannot be treated as a certified survey.',
    }
  }
  if (!input.seal.sealed || input.seal.evidence !== 'document_reviewed') {
    return {
      level: 1, status: 'confirmed',
      rationale:
        input.seal.evidence === 'declared_by_uploader'
          ? 'Seal is declared by the uploader but the document has not been reviewed. An uploader ' +
            'declaration is not certification evidence.'
          : 'No seal or signature evidence is attached.',
    }
  }
  if (input.format === 'pdf') {
    return {
      level: 1, status: 'confirmed',
      rationale:
        'PDF extraction is not authoritative for coordinate geometry. The document may support ' +
        'certification once a reviewer confirms the extracted values against it.',
    }
  }
  return {
    level: 2, status: 'professionally_certified',
    rationale: `Confirmed ${input.crs} on ${input.horizontalDatum}, certified by ` +
      `${input.surveyor.name} (${input.surveyor.state} PLS ${input.surveyor.licenceNumber}) with reviewed seal evidence.`,
  }
}
