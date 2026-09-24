/**
 * Reading a supplied field survey off the order.
 *
 * THE GAP THIS CLOSES:
 *
 * `siteplan.ingest_survey` read only a RECORDED PLAT, and `reconcile_survey`
 * called `reconcileSurvey({ surveyPoints: [], ... })` with the array literally
 * hardcoded empty. So the engine's survey toolchain — CSV, LandXML, DXF, LAS
 * and PDF parsers, COGO, normalisation, promotion and a full reconciliation
 * report — was built and UNREACHABLE from the workflow.
 *
 * That matters more than it sounds. A plat is the boundary of record and the
 * engine already honours it. A FIELD SURVEY is a different instrument: it
 * carries located improvements, spot elevations, a benchmark and a vertical
 * datum. Those are precisely the items the engine reports as `pending_seal`
 * and precisely what separates a $395 GIS plan from a survey-based permit
 * plan. Without this path the product ladder's top rung had no way to receive
 * the thing it is named after.
 *
 * What this module does NOT do: it does not make the engine a surveyor. A
 * survey is supplied by a licensed surveyor, and everything here is about
 * reading what they delivered, recording its provenance, and refusing to
 * pretend about what is missing.
 */

import type { StageContext } from './context'
import {
  parseSurveyCsv, classifyDescription, assessReliability,
  type SurveyPoint, type SurveyorIdentity, type SurveyFormat,
} from '../survey'
import type { Ring } from '../site-plan/site-twin'

export interface SuppliedSurvey {
  format: SurveyFormat
  /** Raw file content as supplied. */
  content: string
  filename?: string | null
  /** Vertical datum the surveyor states. NEVER inferred. */
  verticalDatum?: string | null
  horizontalDatum?: string | null
  /** Linear unit the file is in. A unit error shrinks a site by 3.28. */
  unit?: 'usSurveyFoot' | 'foot' | 'metre' | null
  surveyor?: SurveyorIdentity | null
  /** ISO date of field work, not of the file. */
  surveyedOn?: string | null
  sealed?: boolean
}

export interface SurveyIngestResult {
  supplied: boolean
  format: SurveyFormat | null
  pointCount: number
  points: SurveyPoint[]
  boundary: Ring | null
  verticalDatum: string | null
  horizontalDatum: string | null
  surveyor: SurveyorIdentity | null
  surveyedOn: string | null
  sealed: boolean
  /** Point classes present, so the package can say what the survey establishes. */
  classes: Record<string, number>
  /** What the survey does NOT establish, named rather than left blank. */
  absent: string[]
  warnings: string[]
  summary: string
}

const EMPTY: SurveyIngestResult = {
  supplied: false, format: null, pointCount: 0, points: [], boundary: null,
  verticalDatum: null, horizontalDatum: null, surveyor: null, surveyedOn: null,
  sealed: false, classes: {}, absent: [], warnings: [],
  summary:
    'No field survey was supplied with the order. Existing grade comes from county 2-ft ' +
    'contours at Level 1, and spot and finished-floor elevations are not established.',
}

/** Reads the survey the order carried, if any. */
export function suppliedSurveyFrom(ctx: StageContext): SuppliedSurvey | null {
  const f = ctx.subject.formData as Record<string, unknown>
  const raw = f.fieldSurvey as Record<string, unknown> | undefined
  if (!raw || typeof raw !== 'object') return null
  const content = typeof raw.content === 'string' ? raw.content : null
  if (!content || content.trim().length === 0) return null
  return {
    format: (raw.format as SurveyFormat) ?? 'csv',
    content,
    filename: (raw.filename as string) ?? null,
    verticalDatum: (raw.verticalDatum as string) ?? null,
    horizontalDatum: (raw.horizontalDatum as string) ?? null,
    unit: (raw.unit as SuppliedSurvey['unit']) ?? null,
    surveyor: (raw.surveyor as SurveyorIdentity) ?? null,
    surveyedOn: (raw.surveyedOn as string) ?? null,
    sealed: raw.sealed === true,
  }
}

/**
 * What a survey with these point classes still does not establish.
 *
 * Reported rather than inferred from silence. A package that simply omits
 * finished-floor elevation reads as "not required"; one that names it as
 * absent reads as "someone must go and get this", which is the truth.
 */
export function absentFromSurvey(classes: Record<string, number>): string[] {
  const missing: string[] = []
  if (!classes.spot_elevation) {
    missing.push('Spot elevations — Sec. 32-130(a)(9) requires them and the survey carries none.')
  }
  if (!classes.building_corner) {
    missing.push(
      'Located building corners. Without them an existing structure is drawn from county GIS ' +
      'and its position is Level 1, not surveyed.',
    )
  }
  if (!classes.benchmark) {
    missing.push(
      'A benchmark. Without one the elevations cannot be tied to the stated vertical datum ' +
      'and must not be combined with county contours.',
    )
  }
  if (!classes.boundary_monument) {
    missing.push('Boundary monuments — the survey does not re-establish the property corners.')
  }
  if (!classes.utility_structure && !classes.drainage_structure && !classes.pipe_invert) {
    missing.push('Located utilities. Anything shown comes from county GIS at ASCE 38 Quality Level D.')
  }
  return missing
}

/**
 * Parses a supplied survey into points the reconciliation can actually use.
 *
 * Only CSV is parsed here today. LandXML, DXF, LAS and PDF parsers exist in
 * `survey/` and are wired the same way when the intake accepts those formats —
 * the point of this module is the ROUTE, which did not exist at all. An
 * unsupported format is reported, never silently treated as no survey: those
 * are different facts and the second one loses a file the customer paid for.
 */
export async function ingestSuppliedSurvey(
  survey: SuppliedSurvey | null,
): Promise<SurveyIngestResult> {
  if (!survey) return EMPTY

  if (survey.format !== 'csv') {
    return {
      ...EMPTY,
      supplied: true,
      format: survey.format,
      warnings: [
        `A ${survey.format.toUpperCase()} survey was supplied but only CSV is wired into the ` +
        'workflow today. The file is retained on the order and a person must convert it; it ' +
        'has NOT been silently ignored.',
      ],
      summary:
        `A ${survey.format.toUpperCase()} survey was supplied and could not be read automatically. ` +
        'The plan is drawn at Level 1 until it is converted.',
    }
  }

  const warnings: string[] = []
  let points: SurveyPoint[] = []
  try {
    const parsed = await parseSurveyCsv(survey.content, {
      originalFilename: survey.filename ?? 'survey.csv',
      coordinateUnit: survey.unit ?? 'usSurveyFoot',
      verticalDatum: survey.verticalDatum ?? null,
      horizontalDatum: survey.horizontalDatum ?? null,
      surveyDate: survey.surveyedOn ?? null,
      surveyor: survey.surveyor ?? null,
    })
    points = parsed.points
    warnings.push(...(parsed.record.warnings ?? []))
  } catch (e) {
    return {
      ...EMPTY,
      supplied: true, format: 'csv',
      warnings: [`The supplied survey CSV could not be parsed: ${e instanceof Error ? e.message : String(e)}`],
      summary:
        'A survey was supplied but could not be read. The plan is drawn at Level 1 and the ' +
        'file is flagged for a person, rather than treated as though no survey exists.',
    }
  }

  // A lenient parser returning zero points is NOT the same as no survey. The
  // customer paid a surveyor, the file arrived, and nothing came out of it —
  // that is a fact someone has to act on, and reporting it as "no survey
  // supplied" would bury it.
  if (points.length === 0) {
    return {
      ...EMPTY,
      supplied: true, format: 'csv',
      warnings: [
        ...warnings,
        'The supplied survey file was read but produced no usable points. Check the column ' +
        'mapping and the coordinate unit. The file is on the order and has NOT been discarded.',
      ],
      summary:
        'A survey file was supplied but no usable points could be read from it. The plan is ' +
        'drawn at Level 1 and the file is flagged for a person.',
    }
  }

  const classes: Record<string, number> = {}
  for (const p of points) {
    const cls = p.classification ?? classifyDescription(p.description ?? '')
    classes[cls] = (classes[cls] ?? 0) + 1
  }

  const absent = absentFromSurvey(classes)

  // A survey with no stated vertical datum cannot have its elevations used.
  // Saying so is the whole job; guessing NAVD88 because the county uses it
  // would put every proposed grade out by about a foot if it were NGVD29.
  if (points.some(p => p.elevation != null) && !survey.verticalDatum) {
    warnings.push(
      'The survey carries elevations but states no vertical datum. They cannot be combined ' +
      'with county contours until the surveyor states it. Not assumed.',
    )
  }

  return {
    supplied: true,
    format: 'csv',
    pointCount: points.length,
    points,
    boundary: null,
    verticalDatum: survey.verticalDatum ?? null,
    horizontalDatum: survey.horizontalDatum ?? null,
    surveyor: survey.surveyor ?? null,
    surveyedOn: survey.surveyedOn ?? null,
    sealed: survey.sealed === true,
    classes,
    absent,
    warnings,
    summary:
      `Field survey read: ${points.length} point${points.length === 1 ? '' : 's'}` +
      `${survey.surveyor?.name ? ` by ${survey.surveyor.name}` : ''}` +
      `${survey.verticalDatum ? `, ${survey.verticalDatum}` : ', vertical datum not stated'}. ` +
      `${absent.length} item${absent.length === 1 ? '' : 's'} still not established by it.`,
  }
}

/** Re-exported so the stage can report reliability without reaching into survey/. */
export { assessReliability }
