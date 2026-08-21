/**
 * PDF survey ingestion — deliberately last, and deliberately nonauthoritative.
 *
 * A PDF of a plat or boundary survey is a picture of a survey, not a survey. Even
 * a vector PDF has no CRS, no units guarantee, and no way to distinguish a
 * plotted line from a dimension leader. Tracing geometry out of one and treating
 * it as a boundary is how sites end up built in the wrong place.
 *
 * So this module extracts METADATA and CALLS — the things a PDF states in
 * words — and refuses to promote traced geometry. Coordinates recovered from a
 * PDF stay Level 0 and are marked as requiring the source coordinate file.
 *
 * Text extraction itself is injected: the platform already has a PDF/OCR path in
 * `@kealee/storage`, and this module does not duplicate it.
 */

import {
  PARSER_VERSION,
  type SurveyImportRecord,
} from './import-record'

export interface PdfPageText {
  pageNumber: number
  text: string
  /** True when the text came from OCR rather than an embedded text layer. */
  ocr: boolean
  /** OCR confidence 0-1, when the extractor reports one. */
  confidence?: number
}

export interface ExtractedCall {
  raw: string
  bearing: string | null
  distanceFt: number | null
  /** Where in the document it was found, for verification against the sheet. */
  page: number
}

export interface PdfSurveyFindings {
  /** Drawing scale, e.g. 20 for 1" = 20'. */
  scaleDenominator: number | null
  scaleRaw: string | null
  surveyorName: string | null
  licenceNumber: string | null
  licenceState: string | null
  surveyDate: string | null
  /** Textual cues that a seal is present. Never treated as proof of a valid seal. */
  sealCues: string[]
  benchmarkText: string[]
  datumText: string[]
  calls: ExtractedCall[]
  areaSqFt: number | null
  areaRaw: string | null
  liber: string | null
  folio: string | null
  taxAccount: string | null
}

export interface PdfParseResult {
  record: SurveyImportRecord
  findings: PdfSurveyFindings
  warnings: string[]
  /** Fields a human must confirm before anything here is used. */
  requiresConfirmation: string[]
}

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec'

/** "N 45°30'00" E  125.42'" and the plain-ASCII variants surveyors actually type. */
const CALL_RE = new RegExp(
  String.raw`([NS])\s*(\d{1,3})\s*[°d\-\s]\s*(\d{1,2})\s*['´’\-\s]\s*(\d{1,2}(?:\.\d+)?)\s*["”\-\s]*\s*([EW])` +
  String.raw`[\s,]*(\d+(?:\.\d+)?)\s*(?:'|ft|feet)?`,
  'gi',
)

const SCALE_RE = /(?:scale\s*[:=]?\s*)?1\s*(?:"|inch|in\.?)\s*[=:]\s*(\d+(?:\.\d+)?)\s*(?:'|ft|feet)/i
const RATIO_SCALE_RE = /\bscale\s*[:=]?\s*1\s*[:/]\s*(\d+)\b/i
// "A. REYES, P.L.S. No. 21456" — the number may be separated by "No.", "#" or nothing.
const LICENCE_RE = /\b(?:p\.?\s?l\.?\s?s\.?|r\.?p\.?l\.?s\.?|professional\s+land\s+surveyor|reg(?:istration)?\.?|licen[sc]e)\s*(?:no\.?|number|#)?\s*[:#]?\s*(\d{3,8})\b/i
const NAME_NEAR_LICENCE_RE = /([A-Z][A-Za-z.\-']+(?:\s+[A-Z][A-Za-z.\-']+){1,3})\s*,?\s*(?:P\.?L\.?S\.?|R\.?P\.?L\.?S\.?|L\.?S\.?)\b/
const AREA_RE = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*(?:ft|feet)|square\s+feet|s\.?f\.?)\b/i
const ACRES_RE = /\b(\d+(?:\.\d+)?)\s*(?:acres?|ac\.?)\b/i
const LIBER_RE = /\b(?:liber|book)\s*[:.#]?\s*([A-Z0-9\-]+)\b/i
const FOLIO_RE = /\b(?:folio|page)\s*[:.#]?\s*(\d+)\b/i
const TAX_RE = /\b(?:tax\s*(?:account|id|map)|account\s*(?:no\.?|#))\s*[:.#]?\s*([A-Z0-9\-]+)\b/i
const DATE_RE = new RegExp(
  String.raw`\b(?:(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|((?:${MONTHS})[a-z]*\.?\s+\d{1,2},?\s+\d{4}))\b`, 'i',
)
const DATUM_RE = /\b(NAVD\s*-?\s*88|NGVD\s*-?\s*29|NAD\s*-?\s*83(?:\s*\/\s*\d{4})?|NAD\s*-?\s*27|WGS\s*-?\s*84|MARYLAND\s+STATE\s+PLANE|assumed\s+datum)\b/gi
const BENCHMARK_RE = /\b(?:T\.?B\.?M\.?|BENCH\s*MARK|BENCHMARK|B\.?M\.?)\s*[:#]?\s*([^\n]{0,80})/gi
const SEAL_CUE_RE = /\b(professional\s+(?:land\s+surveyor|engineer)|seal|signed|certif(?:y|ied|ication)|state\s+of\s+maryland)\b/gi

function dmsToText(d: string, m: string, s: string, ns: string, ew: string): string {
  return `${ns.toUpperCase()} ${Number(d)}-${String(Number(m)).padStart(2, '0')}-${
    Number(s).toFixed(2).padStart(5, '0')} ${ew.toUpperCase()}`
}

export function extractSurveyFindings(pages: PdfPageText[]): PdfSurveyFindings {
  const all = pages.map(p => p.text).join('\n')

  const scaleM = all.match(SCALE_RE)
  const ratioM = scaleM ? null : all.match(RATIO_SCALE_RE)

  const licM = all.match(LICENCE_RE)
  const nameM = all.match(NAME_NEAR_LICENCE_RE)

  const areaM = all.match(AREA_RE)
  const acresM = areaM ? null : all.match(ACRES_RE)

  const calls: ExtractedCall[] = []
  for (const page of pages) {
    CALL_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = CALL_RE.exec(page.text)) !== null) {
      const dist = Number(m[6])
      calls.push({
        raw: m[0].replace(/\s+/g, ' ').trim(),
        bearing: dmsToText(m[2], m[3], m[4], m[1], m[5]),
        distanceFt: Number.isFinite(dist) ? dist : null,
        page: page.pageNumber,
      })
    }
  }

  const datumText = [...new Set((all.match(DATUM_RE) ?? []).map(s => s.replace(/\s+/g, ' ').trim()))]
  const benchmarkText: string[] = []
  BENCHMARK_RE.lastIndex = 0
  let bm: RegExpExecArray | null
  while ((bm = BENCHMARK_RE.exec(all)) !== null) {
    benchmarkText.push(bm[0].replace(/\s+/g, ' ').trim())
  }
  const sealCues = [...new Set((all.match(SEAL_CUE_RE) ?? []).map(s => s.toLowerCase()))]

  const dateM = all.match(DATE_RE)
  const liberM = all.match(LIBER_RE)
  const folioM = all.match(FOLIO_RE)
  const taxM = all.match(TAX_RE)

  return {
    scaleDenominator: scaleM ? Number(scaleM[1]) : ratioM ? Number(ratioM[1]) : null,
    scaleRaw: scaleM?.[0] ?? ratioM?.[0] ?? null,
    surveyorName: nameM ? nameM[1].trim() : null,
    licenceNumber: licM ? licM[1] : null,
    licenceState: /state\s+of\s+maryland|maryland/i.test(all) ? 'MD' : null,
    surveyDate: dateM ? (dateM[1] ?? dateM[2]) : null,
    sealCues,
    benchmarkText: benchmarkText.slice(0, 10),
    datumText,
    calls,
    areaSqFt: areaM
      ? Number(areaM[1].replace(/,/g, ''))
      : acresM ? Number(acresM[1]) * 43560 : null,
    areaRaw: areaM?.[0] ?? acresM?.[0] ?? null,
    liber: liberM ? liberM[1] : null,
    folio: folioM ? folioM[1] : null,
    taxAccount: taxM ? taxM[1] : null,
  }
}

export interface ParsePdfOptions {
  filename: string
  checksum: string
  uploadedAt: string
  /** Set only when a person has actually looked at the seal on the document. */
  sealReviewedBy?: string
}

export function parseSurveyPdf(pages: PdfPageText[], opts: ParsePdfOptions): PdfParseResult {
  const findings = extractSurveyFindings(pages)
  const warnings: string[] = []
  const requiresConfirmation: string[] = []

  warnings.push(
    'PDF is a nonauthoritative source. Text and calls are extracted for cross-checking; geometry is not ' +
    'traced into the site model. Request the coordinate file (CSV, LandXML or DXF) from the surveyor.',
  )

  const ocrPages = pages.filter(p => p.ocr)
  if (ocrPages.length > 0) {
    const lowConf = ocrPages.filter(p => (p.confidence ?? 1) < 0.85)
    warnings.push(
      `${ocrPages.length} of ${pages.length} page(s) required OCR` +
      (lowConf.length ? `, ${lowConf.length} below 85% confidence` : '') +
      '. OCR routinely misreads bearings — 8 for 3, 0 for O — so every extracted call needs checking against the sheet.',
    )
    requiresConfirmation.push('Every extracted bearing and distance, against the drawing.')
  }

  if (!findings.scaleDenominator) {
    warnings.push('No drawing scale was found. Nothing can be measured off this document.')
  }
  if (findings.calls.length === 0) {
    warnings.push('No boundary calls were recognised. The metes and bounds may be in a table, a graphic, or absent.')
  }
  if (findings.datumText.length === 0) {
    warnings.push('No datum is stated anywhere in the extracted text.')
  } else if (findings.datumText.some(d => /assumed/i.test(d))) {
    warnings.push('The document states an ASSUMED datum. Its elevations are internally consistent but not tied to NAVD88.')
  }
  if (!findings.licenceNumber) {
    warnings.push('No surveyor licence number was found. The document cannot be attributed to a licensed professional from its text alone.')
  }
  if (findings.sealCues.length > 0 && !opts.sealReviewedBy) {
    warnings.push(
      'Text suggests a seal is present, but a seal is established by human review of the document, ' +
      'not by keyword matching. The import is recorded as unsealed.',
    )
    requiresConfirmation.push('Whether the document carries a valid, current professional seal.')
  }

  requiresConfirmation.push('The coordinate reference system, which no PDF declares.')
  if (findings.surveyDate) {
    requiresConfirmation.push(`The survey date (${findings.surveyDate} was read from the document text).`)
  } else {
    requiresConfirmation.push('The date the survey was performed.')
  }

  const record: SurveyImportRecord = {
    importId: `imp_${opts.checksum.slice(0, 16)}`,
    originalFilename: opts.filename,
    checksum: opts.checksum,
    format: 'pdf',
    uploadedAt: opts.uploadedAt,
    surveyDate: null,
    surveyor: findings.licenceNumber
      ? {
          name: findings.surveyorName ?? 'unnamed — read from document text, unconfirmed',
          licenceNumber: findings.licenceNumber,
          state: findings.licenceState ?? 'unknown',
        }
      : null,
    seal: opts.sealReviewedBy
      ? { sealed: true, evidence: 'document_reviewed', notes: `Reviewed by ${opts.sealReviewedBy}` }
      : { sealed: false, evidence: 'none', notes: findings.sealCues.length ? 'Seal-like text present but not reviewed.' : undefined },
    crs: null,
    candidateCrs: null,
    horizontalDatum: null,
    verticalDatum: findings.datumText.find(d => /NAVD|NGVD/i.test(d)) ?? null,
    coordinateUnit: null,
    benchmark: null,
    transformationPipeline: [],
    parserVersion: PARSER_VERSION,
    sourceGeometryCount: 0,
    normalizedGeometryCount: 0,
    confidence: 0.25,
    verificationStatus: 'unverified',
    reliabilityLevel: 0,
    levelRationale:
      'PDF extraction is nonauthoritative. Even with a reviewed seal this path is capped at Level 1 — ' +
      'a Level 2 object requires the surveyor\'s coordinate data, not a raster or vector rendering of it.',
    warnings,
  }

  return { record, findings, warnings, requiresConfirmation }
}
