/**
 * Notes the County requires verbatim.
 *
 * The point of these tests is that the TEXT is right and stays right. A
 * reviewer looks for this exact language, and the engine had none of it.
 *
 * The A-11 stabilization note is the interesting case: the DPIE checklist
 * attributes the three/seven day rule to COMAR 26.17.01.08G, which does not
 * contain it. Transcribing the checklist would have shipped a wrong citation
 * on every sheet, so the note is taken from the 2011 Maryland Standards where
 * it is actually published and the County preamble is carried separately.
 */

import {
  PG_GRADING_CERTIFICATE, MD_STANDARD_STABILIZATION_NOTE, PG_STABILIZATION_PREAMBLE,
  PG_REQUIRED_PLAN_NOTES, requiredNotesForSheet, auditSheetNotes,
} from '../site-plan/required-notes'
import { auditSheetFrame } from '../sheets/sheet-template'
import { buildSheetContext } from '../sheets/render-svg'
import { createSiteTwin, addSource } from '../site-plan/site-twin'
import { gisSourceRecord } from '../site-plan/reliability'

describe('grading certificate — DPIE item A-10', () => {
  it('carries the full certificate, not a summary', () => {
    const t = PG_GRADING_CERTIFICATE.text
    expect(t).toMatch(/^I HEREBY CERTIFY THAT THIS PLAN CONFORMS TO THE REQUIREMENTS OF SUBTITLE 32, DIVISION 2/)
    expect(t).toMatch(/DRAINAGE FLOWS FROM UPHILL PROPERTIES ONTO THIS SITE/)
    expect(t).toMatch(/FROM THIS SITE ONTO DOWNHILL PROPERTIES/)
    expect(t).toMatch(/SUBSTANTIAL ACCORDANCE WITH APPLICABLE CODES\.$|MARYLAND\.$/)
    // Long enough that any truncating renderer would visibly mangle it.
    expect(t.length).toBeGreaterThan(400)
  })

  it('is sealed by a Maryland professional engineer', () => {
    expect(PG_GRADING_CERTIFICATE.sealedBy).toBe('professional_engineer')
  })

  it('goes on the grading sheet, not the demolition sheet', () => {
    // C-300 is Demolition; C-400 is Grading and Drainage.
    expect(PG_GRADING_CERTIFICATE.sheets).toEqual(['C-400'])
  })

  it('cites the checklist it came from, with its edition', () => {
    expect(PG_GRADING_CERTIFICATE.source.citation).toMatch(/item A-10/)
    expect(PG_GRADING_CERTIFICATE.source.edition).toBe('Last Edited June 27, 2013')
    expect(PG_GRADING_CERTIFICATE.source.url).toMatch(/princegeorgescountymd\.gov/)
  })
})

describe('stabilization note — the citation the checklist gets wrong', () => {
  it('takes the operative text from the 2011 Maryland Standards', () => {
    const n = MD_STANDARD_STABILIZATION_NOTE
    expect(n.source.citation).toMatch(/2011 Maryland Standards and Specifications/)
    expect(n.source.locator).toBe('Page 45')
    expect(n.text).toMatch(/Following initial soil disturbance or re-disturbance/)
    expect(n.text).toMatch(/Three \(3\) calendar days/)
    expect(n.text).toMatch(/Seven \(7\) calendar days/)
  })

  it('prints the slope ratio as 3:1, not the checklist\'s "3:l"', () => {
    expect(MD_STANDARD_STABILIZATION_NOTE.text).toContain('3 horizontal to 1 vertical (3:1)')
    expect(MD_STANDARD_STABILIZATION_NOTE.text).not.toContain('3:l')
  })

  it('does not attribute the timing rule to COMAR .08G', () => {
    // COMAR 26.17.01.08 is "Approval or Denial of Erosion and Sediment Control
    // Plans"; its subsection G is grandfathering. The timing rule is not in it.
    expect(MD_STANDARD_STABILIZATION_NOTE.source.citation).not.toMatch(/26\.17\.01\.08G/)
    expect(MD_STANDARD_STABILIZATION_NOTE.text).not.toMatch(/January 9, 2013/)
  })

  it('keeps the County preamble separate and correctly cited', () => {
    const p = PG_STABILIZATION_PREAMBLE
    expect(p.source.citation).toMatch(/26\.17\.01\.08G\(3\)/)
    expect(p.source.citation).toMatch(/Grandfathering/)
    // The regulation says "this chapter"; the checklist points it at itself.
    expect(p.text).toContain('COMAR 26.17.01')
    expect(p.text).not.toContain('26.17.1.08 G')
  })

  it('appears on both the grading and the sediment control sheets', () => {
    expect(MD_STANDARD_STABILIZATION_NOTE.sheets).toEqual(['C-400', 'C-700'])
  })
})

describe('routing notes onto sheets', () => {
  it('puts all three notes on the grading sheet', () => {
    const ids = requiredNotesForSheet('C-400').map(n => n.id)
    expect(ids).toEqual([
      'PG-GRADING-CERTIFICATE', 'PG-STABILIZATION-PREAMBLE', 'MD-STANDARD-STABILIZATION-NOTE',
    ])
  })

  it('does not put the grading certificate on the sediment control sheet', () => {
    const ids = requiredNotesForSheet('C-700').map(n => n.id)
    expect(ids).not.toContain('PG-GRADING-CERTIFICATE')
    expect(ids).toContain('MD-STANDARD-STABILIZATION-NOTE')
  })

  it('requires nothing of sheets the checklist does not reach', () => {
    expect(requiredNotesForSheet('C-100')).toHaveLength(0)
  })
})

describe('auditing what actually reached the sheet', () => {
  it('passes when the exact text is printed', () => {
    const a = auditSheetNotes('C-700', [
      MD_STANDARD_STABILIZATION_NOTE.text,
      PG_STABILIZATION_PREAMBLE.text,
    ])
    expect(a.complete).toBe(true)
    expect(a.missing).toHaveLength(0)
  })

  it('catches a retyped note that changed a word', () => {
    const mangled = MD_STANDARD_STABILIZATION_NOTE.text.replace('Seven (7)', 'Five (5)')
    const a = auditSheetNotes('C-700', [mangled, PG_STABILIZATION_PREAMBLE.text])
    expect(a.complete).toBe(false)
    expect(a.missing).toContain('MD-STANDARD-STABILIZATION-NOTE')
  })

  it('catches a truncated certificate', () => {
    const clipped = PG_GRADING_CERTIFICATE.text.slice(0, 130)
    const a = auditSheetNotes('C-400', [clipped])
    expect(a.missing).toContain('PG-GRADING-CERTIFICATE')
  })

  it('tolerates whitespace and case differences from the renderer', () => {
    const rewrapped = MD_STANDARD_STABILIZATION_NOTE.text
      .replace(/\s+/g, '\n  ').toLowerCase()
    const a = auditSheetNotes('C-700', [rewrapped, PG_STABILIZATION_PREAMBLE.text])
    expect(a.present).toContain('MD-STANDARD-STABILIZATION-NOTE')
  })
})

describe('sheet frame', () => {
  const twin = () => {
    let t = createSiteTwin({
      siteId: 's', projectId: 'p', organizationId: 'o',
      address: '4500 Rhode Island Ave, Brentwood, MD 20722',
      jurisdictionCode: 'prince_georges_md',
      crs: 'EPSG:2248', horizontalDatum: 'NAD83', verticalDatum: null,
    })
    t = addSource(t, gisSourceRecord({
      sourceId: 'gis1', authority: 'M-NCPPC', dataset: 'PGAtlas parcels',
      crs: 'EPSG:2248', horizontalDatum: 'NAD83',
    }))
    return t
  }

  it('counts required notes as a frame element', () => {
    const ctx = buildSheetContext({
      sheet: 'C-400', twin: twin(), projectName: 'P', sheetIndex: 1, sheetCount: 1,
    })
    // buildSheetContext populates them, so the element is satisfied.
    expect(ctx.requiredNotes).toHaveLength(3)
    expect(auditSheetFrame(ctx).missing).not.toContain('requiredCountyNotes')
  })

  it('flags a grading sheet built without its notes', () => {
    const ctx = buildSheetContext({
      sheet: 'C-400', twin: twin(), projectName: 'P', sheetIndex: 1, sheetCount: 1,
    })
    const stripped = { ...ctx, requiredNotes: [] }
    expect(auditSheetFrame(stripped).missing).toContain('requiredCountyNotes')
  })
})

describe('the note set as a whole', () => {
  it('carries a resolvable source for every note', () => {
    for (const n of PG_REQUIRED_PLAN_NOTES) {
      expect(n.source.citation.length).toBeGreaterThan(10)
      expect(n.source.url).toMatch(/^https:\/\//)
      expect(n.source.locator.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate ids', () => {
    const ids = PG_REQUIRED_PLAN_NOTES.map(n => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
