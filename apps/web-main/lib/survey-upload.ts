/**
 * Recognising an uploaded survey.
 *
 * The intake already accepts files, but it sorts them into image / video /
 * document / voice — so a surveyor's DXF or LandXML arrives as a "document",
 * lands in storage, and nothing ever reads it. The engine has parsers for every
 * one of these formats; they were simply never connected to the front door.
 *
 * This is the highest-value upload on the whole platform. A survey is what
 * moves a site plan from Level 1 GIS — preliminary, not for permit — to Level 2
 * professional. Everything downstream changes: setbacks measure from a real
 * boundary, the disturbance area becomes defensible, and the preliminary
 * disclosure can come off the sheets.
 */

/** Formats the Phase 3B parsers can actually read. */
export type SurveyUploadFormat = 'csv' | 'landxml' | 'dxf' | 'dwg' | 'las' | 'laz' | 'pdf'

export interface RecognisedSurveyFile {
  name: string
  url: string
  format: SurveyUploadFormat
  /** Whether the engine can extract coordinates, or only read the document. */
  coordinateBearing: boolean
  /** What a reviewer should expect from this format. */
  note: string
}

const BY_EXTENSION: Record<string, SurveyUploadFormat> = {
  csv: 'csv', txt: 'csv', pnt: 'csv',
  xml: 'landxml', landxml: 'landxml',
  dxf: 'dxf', dwg: 'dwg',
  las: 'las', laz: 'laz',
}

/**
 * Formats that carry survey coordinates, versus those that only depict them.
 * A PDF of a plat is a picture of a survey — useful for cross-checking, never
 * a source of geometry.
 */
const COORDINATE_BEARING: SurveyUploadFormat[] = ['csv', 'landxml', 'dxf', 'dwg']

const FORMAT_NOTES: Record<SurveyUploadFormat, string> = {
  csv: 'Point file. Coordinates are read directly; the CRS must be confirmed, never inferred.',
  landxml: 'Surfaces, breaklines and parcel calls are preserved as structure rather than flattened to linework.',
  dxf: 'Layers are mapped to typed objects. DXF carries no coordinate system, so the CRS must be confirmed.',
  dwg: 'Converted via the ODA File Converter when configured. DWG is never parsed directly.',
  las: 'LiDAR point cloud. Mapping grade — supports terrain, never promoted to a certified survey.',
  laz: 'Compressed LiDAR. The header is read here; points are extracted through PDAL.',
  pdf: 'Nonauthoritative. Calls and metadata are extracted for cross-checking; geometry is NOT traced.',
}

/** Extensions that look like a survey but are the wrong thing. */
const MISLEADING = new Set(['xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'heic'])

export function extensionOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

/**
 * Classifies one uploaded file.
 *
 * A PDF is only treated as a survey when its name suggests one. Most PDFs on an
 * intake are photographs of a kitchen or a contractor's quote, and running the
 * survey extractor over those would produce confident nonsense.
 */
export function recogniseSurveyFile(file: { name: string; url: string }): RecognisedSurveyFile | null {
  const ext = extensionOf(file.name)
  if (!ext || MISLEADING.has(ext)) return null

  let format = BY_EXTENSION[ext]
  if (!format && ext === 'pdf') {
    if (!/\b(survey|plat|boundary|topo|topographic|alta|as-?built)\b/i.test(file.name)) return null
    format = 'pdf'
  }
  if (!format) return null

  return {
    name: file.name,
    url: file.url,
    format,
    coordinateBearing: COORDINATE_BEARING.includes(format),
    note: FORMAT_NOTES[format],
  }
}

export interface SurveyUploadSummary {
  surveys: RecognisedSurveyFile[]
  /** True when at least one file can yield coordinates. */
  hasCoordinateData: boolean
  /** What ops should do next. */
  nextStep: string
  /** Questions that must be answered before the survey can be relied on. */
  requiresConfirmation: string[]
}

/**
 * Summarises the survey files on an intake.
 *
 * Deliberately does not parse anything here. Parsing belongs in fulfilment
 * where it can take its time and record provenance properly; the intake's job
 * is to notice that a survey arrived and say what happens next.
 */
export function summariseSurveyUploads(
  files: { name: string; url: string }[],
): SurveyUploadSummary {
  const surveys = files
    .map(recogniseSurveyFile)
    .filter((s): s is RecognisedSurveyFile => s !== null)

  const hasCoordinateData = surveys.some(s => s.coordinateBearing)
  const requiresConfirmation: string[] = []

  if (surveys.length > 0) {
    requiresConfirmation.push(
      'The coordinate reference system and datum. No format here declares them reliably, and a guessed ' +
      'CRS places the site somewhere else entirely.',
    )
    requiresConfirmation.push('The surveyor, their Maryland licence number, and the date of survey.')
    requiresConfirmation.push('Whether the document carries a valid seal — established by review, not by filename.')
  }

  return {
    surveys,
    hasCoordinateData,
    requiresConfirmation,
    nextStep:
      surveys.length === 0
        ? 'No survey was uploaded. The site plan is produced from state and county GIS at Level 1, which ' +
          'is preliminary and not for permit or construction.'
        : hasCoordinateData
          ? `${surveys.length} survey file(s) received, at least one carrying coordinates. Once the CRS, ` +
            'datum and surveyor are confirmed, this can replace the GIS boundary and lift the package to ' +
            'Level 2.'
          : `${surveys.length} survey document(s) received, none carrying coordinates. These support ` +
            'cross-checking only — ask the surveyor for the CSV, LandXML or DXF.',
  }
}

/** The `form_data` patch recording what arrived. */
export function surveyUploadFormData(summary: SurveyUploadSummary): Record<string, unknown> {
  return {
    surveyUploads: {
      count: summary.surveys.length,
      files: summary.surveys,
      hasCoordinateData: summary.hasCoordinateData,
      requiresConfirmation: summary.requiresConfirmation,
      nextStep: summary.nextStep,
      // Level 2 is granted by the promotion gate after review, never by an
      // upload. Recorded here so nothing downstream mistakes one for the other.
      grantsLevel2: false,
      recordedAt: new Date().toISOString(),
    },
  }
}

/** File input `accept` string for the intake form. */
export const SURVEY_ACCEPT_ATTRIBUTE =
  '.csv,.txt,.pnt,.xml,.landxml,.dxf,.dwg,.las,.laz,.pdf'

/** Shown next to the upload control. */
export const SURVEY_UPLOAD_HELP =
  'If you have a boundary or topographic survey, upload it here — CSV/point file, LandXML, DXF, DWG or ' +
  'LiDAR (LAS/LAZ). A PDF plat helps us cross-check but cannot be measured from. A survey is what lifts ' +
  'your plan from preliminary GIS to professional grade.'
