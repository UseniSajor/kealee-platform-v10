/**
 * Notes the County requires to appear on the plan, verbatim.
 *
 * Two of these are named on the DPIE Site Rough Grading Design Review
 * Checklist (items A-10 and A-11) and neither was on any sheet the engine
 * produced. A reviewer looks for this exact language; paraphrasing it is a
 * comment on resubmission.
 *
 * ── Why these are not simply copied out of the checklist ────────────────────
 *
 * The checklist is a DPIE summary, and for A-11 it is a summary of somebody
 * else's document. Transcribing it verbatim would have propagated three
 * defects:
 *
 *   1. The checklist cites "COMAR 26.17.1.08 G" as the source of the
 *      three/seven day stabilization rule. It is not there. COMAR 26.17.01.08
 *      is "Approval or Denial of Erosion and Sediment Control Plans" and its
 *      subsection G is "Grandfathering of approved plans". The timing rule
 *      lives in the "2011 Maryland Standards and Specifications for Soil
 *      Erosion and Sediment Control", which .08A(1) adopts by reference, where
 *      it is published as the "Standard Stabilization Note" (page 45).
 *
 *   2. COMAR .08G(3) says stabilization must comply with "the requirements of
 *      THIS CHAPTER" — the whole of 26.17.01. The checklist renders that as
 *      "the requirements of COMAR 26.17.1.08 G", which points the sentence at
 *      itself.
 *
 *   3. The checklist prints the slope ratio as "3:l" — a lowercase letter L.
 *      The Standards print "3:1".
 *
 * So the stabilization note is modelled as what it actually is: the State's
 * Standard Stabilization Note, which is the operative text, plus a County
 * preamble that DPIE asks for. They come from different authorities and are
 * kept separately attributed rather than concatenated into one anonymous blob.
 *
 * The grading certificate has no higher source — it is DPIE's own, and the
 * checklist is the authority for it.
 */

import type { Discipline } from '../review/disciplines'
import type { SheetId } from '../sheets/sheet-template'

export interface NoteSource {
  /** Document as it should be cited on a checklist or in a review. */
  citation: string
  url: string | null
  /** Revision or edition, where the document states one. */
  edition: string | null
  /** Page or item within the document. */
  locator: string
}

export interface RequiredPlanNote {
  id: string
  title: string
  /** Printed on the sheet exactly as written here. */
  text: string
  source: NoteSource
  /** Sheets the note belongs on. */
  sheets: SheetId[]
  /**
   * Discipline whose seal the note carries, when it is a certification rather
   * than a standing instruction. Null for notes nobody signs.
   */
  sealedBy: Discipline | null
  /** Anything a maintainer needs to know about how this text was captured. */
  transcription?: string
}

/**
 * DPIE Design Review Checklist item A-10.
 *
 * Transcribed from the checklist PDF. Two artefacts of that source are worth
 * recording: the quoted block opens with a double quote and never closes it,
 * and "BEEN  ADDRESSED" carries a double space that is a line-wrap artefact of
 * the PDF layout, normalised to one space here.
 *
 * The final sentence reads as an instruction to the drafter rather than part
 * of what the engineer certifies, but DPIE prints it inside the quoted block,
 * so it is reproduced inside it. `sealedBy` carries the same requirement in a
 * form the engine can actually check.
 */
export const PG_GRADING_CERTIFICATE: RequiredPlanNote = {
  id: 'PG-GRADING-CERTIFICATE',
  title: 'Grading Certificate',
  text:
    'I HEREBY CERTIFY THAT THIS PLAN CONFORMS TO THE REQUIREMENTS OF SUBTITLE 32, DIVISION 2 ' +
    "OF THE CODE OF PRINCE GEORGE'S COUNTY WATER RESOURCES PROTECTION AND GRADING CODE; AND " +
    'THAT I OR MY STAFF HAVE INSPECTED THIS SITE AND THAT DRAINAGE FLOWS FROM UPHILL PROPERTIES ' +
    'ONTO THIS SITE, AND FROM THIS SITE ONTO DOWNHILL PROPERTIES, HAVE BEEN ADDRESSED IN ' +
    'SUBSTANTIAL ACCORDANCE WITH APPLICABLE CODES. SIGNED, SEALED AND DATED BY A PROFESSIONAL ' +
    'ENGINEER LICENSED IN THE STATE OF MARYLAND.',
  source: {
    citation: "Prince George's County DPIE, Site Rough Grading Design Review Checklist, item A-10",
    url: 'https://www.princegeorgescountymd.gov/sites/default/files/media-document/' +
      'Design%20Review%20Checklist%20Site%20Rough%20Grading%20(PDF).pdf',
    edition: 'Last Edited June 27, 2013',
    locator: 'Item A-10, page 2 of 4',
  },
  sheets: ['C-400'],
  sealedBy: 'professional_engineer',
  transcription:
    'Unbalanced opening quote and a double space before ADDRESSED in the source PDF; the double ' +
    'space is a line-wrap artefact and is normalised to one.',
}

/**
 * The State's Standard Stabilization Note — the operative text.
 *
 * Quoted from the 2011 Maryland Standards and Specifications for Soil Erosion
 * and Sediment Control, page 45, which COMAR 26.17.01.08A(1) adopts as the
 * criteria for plan approval. This is the text that must appear; it is not
 * County-specific and applies statewide.
 */
export const MD_STANDARD_STABILIZATION_NOTE: RequiredPlanNote = {
  id: 'MD-STANDARD-STABILIZATION-NOTE',
  title: 'Standard Stabilization Note',
  text:
    'Following initial soil disturbance or re-disturbance, permanent or temporary stabilization ' +
    'must be completed within: a.) Three (3) calendar days as to the surface of all perimeter ' +
    'dikes, swales, ditches, perimeter slopes, and all slopes steeper than 3 horizontal to 1 ' +
    'vertical (3:1); and b.) Seven (7) calendar days as to all other disturbed or graded areas ' +
    'on the project site not under active grading.',
  source: {
    citation:
      '2011 Maryland Standards and Specifications for Soil Erosion and Sediment Control, ' +
      '"Standard Stabilization Note" (adopted by COMAR 26.17.01.08A(1))',
    url: 'https://mde.maryland.gov/programs/water/StormwaterManagementProgram/Documents/' +
      '2011%20MD%20Standard%20and%20Specifications%20for%20Soil%20Erosion%20and%20Sediment%20Control.pdf',
    edition: '2011',
    locator: 'Page 45',
  },
  sheets: ['C-400', 'C-700'],
  sealedBy: null,
}

/**
 * The County's preamble to the stabilization note.
 *
 * DPIE asks for this sentence ahead of the State note. It is COMAR
 * 26.17.01.08G(3) — a grandfathering provision — quoted as the regulation
 * actually words it ("this chapter"), not as the checklist rewords it.
 *
 * Kept separate because its authority is different and because its operative
 * date has passed: it fixed a compliance deadline of January 9, 2013 for plans
 * approved before the current chapter took effect. It says nothing about what
 * a plan drawn today must do — the State note does that. A reviewer may still
 * expect to see it, so it is produced, but it is never the thing that carries
 * the stabilization requirement.
 */
export const PG_STABILIZATION_PREAMBLE: RequiredPlanNote = {
  id: 'PG-STABILIZATION-PREAMBLE',
  title: 'Stabilization Compliance Preamble',
  text:
    'Stabilization practices on all projects must be in compliance with the requirements of ' +
    'COMAR 26.17.01 by January 9, 2013, regardless of when an erosion and sediment control ' +
    'plan was approved.',
  source: {
    citation: 'COMAR 26.17.01.08G(3), Grandfathering of approved plans',
    url: 'https://dsd.maryland.gov/regulations/Pages/26.17.01.08.aspx',
    edition: null,
    locator: '.08G(3)',
  },
  sheets: ['C-400', 'C-700'],
  sealedBy: null,
  transcription:
    'The regulation says "the requirements of this chapter"; expanded to "COMAR 26.17.01" so the ' +
    'sentence still resolves once lifted onto a drawing. DPIE item A-11 renders the citation as ' +
    '"COMAR 26.17.1.08 G", which points the sentence at itself.',
}

export const PG_REQUIRED_PLAN_NOTES: RequiredPlanNote[] = [
  PG_GRADING_CERTIFICATE,
  PG_STABILIZATION_PREAMBLE,
  MD_STANDARD_STABILIZATION_NOTE,
]

/**
 * Notes required for a given sheet.
 *
 * The grading certificate is only meaningful where grading is actually shown,
 * so it follows the grading sheet rather than being stamped on everything.
 */
export function requiredNotesForSheet(sheet: SheetId): RequiredPlanNote[] {
  return PG_REQUIRED_PLAN_NOTES.filter(n => n.sheets.includes(sheet))
}

export interface NoteAudit {
  sheet: SheetId
  present: string[]
  missing: string[]
  complete: boolean
}

/**
 * Checks that every required note actually made it onto a sheet.
 *
 * Compares on normalised text rather than on the note id, because the failure
 * this guards against is a drafter retyping the certificate and changing a
 * word. An id match would pass that; a text match will not.
 */
export function auditSheetNotes(sheet: SheetId, printedNotes: string[]): NoteAudit {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase()
  const printed = printedNotes.map(norm)
  const present: string[] = []
  const missing: string[] = []

  for (const note of requiredNotesForSheet(sheet)) {
    ;(printed.some(p => p.includes(norm(note.text))) ? present : missing).push(note.id)
  }

  return { sheet, present, missing, complete: missing.length === 0 }
}
