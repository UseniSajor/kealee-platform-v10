/**
 * Recognising an uploaded survey.
 *
 * The gap this closes: intake accepted files and sorted them into image /
 * video / document / voice, so a surveyor's DXF arrived as a "document",
 * landed in storage, and nothing ever read it.
 */

import {
  recogniseSurveyFile, summariseSurveyUploads, surveyUploadFormData,
  SURVEY_ACCEPT_ATTRIBUTE,
} from '../survey-upload'

const f = (name: string) => ({ name, url: `https://storage/${name}` })

describe('which files are surveys', () => {
  it('recognises the coordinate-bearing formats', () => {
    for (const n of ['lot12.csv', 'boundary.landxml', 'site.xml', 'plan.dxf', 'plan.dwg']) {
      expect(recogniseSurveyFile(f(n))?.coordinateBearing).toBe(true)
    }
  })

  it('recognises LiDAR but does not treat it as coordinate-bearing survey data', () => {
    // A point cloud is mapping grade; it is never a boundary survey.
    expect(recogniseSurveyFile(f('site.las'))?.coordinateBearing).toBe(false)
    expect(recogniseSurveyFile(f('site.laz'))?.note).toMatch(/PDAL/)
  })

  it('accepts a PDF only when the name says survey', () => {
    // Most PDFs on an intake are photos of a kitchen or a contractor's quote.
    expect(recogniseSurveyFile(f('boundary-survey.pdf'))?.format).toBe('pdf')
    expect(recogniseSurveyFile(f('plat-of-lot-12.pdf'))?.format).toBe('pdf')
    expect(recogniseSurveyFile(f('kitchen-quote.pdf'))).toBeNull()
  })

  it('ignores files that merely look technical', () => {
    for (const n of ['takeoff.xlsx', 'scope.docx', 'front.jpg', 'site.png', 'notes.heic']) {
      expect(recogniseSurveyFile(f(n))).toBeNull()
    }
  })

  it('says a PDF cannot be measured from', () => {
    expect(recogniseSurveyFile(f('survey.pdf'))?.note).toMatch(/geometry is NOT traced/i)
  })
})

describe('what the intake tells the customer and ops', () => {
  it('states plainly when no survey came in', () => {
    const s = summariseSurveyUploads([f('kitchen.jpg')])
    expect(s.surveys).toHaveLength(0)
    expect(s.nextStep).toMatch(/preliminary and not for permit/i)
  })

  it('recognises a usable survey and what it unlocks', () => {
    const s = summariseSurveyUploads([f('lot12.csv'), f('front.jpg')])
    expect(s.hasCoordinateData).toBe(true)
    expect(s.nextStep).toMatch(/lift the package to\s+Level 2/i)
  })

  it('tells ops to ask for coordinates when only a PDF arrived', () => {
    const s = summariseSurveyUploads([f('boundary-survey.pdf')])
    expect(s.hasCoordinateData).toBe(false)
    expect(s.nextStep).toMatch(/ask the surveyor for the CSV, LandXML or DXF/i)
  })

  it('always requires CRS, surveyor and seal confirmation', () => {
    const s = summariseSurveyUploads([f('lot12.csv')])
    expect(s.requiresConfirmation.join(' ')).toMatch(/coordinate reference system and datum/i)
    expect(s.requiresConfirmation.join(' ')).toMatch(/licence number/i)
    expect(s.requiresConfirmation.join(' ')).toMatch(/established by review, not by filename/i)
  })
})

describe('what is written to form_data', () => {
  it('never lets an upload alone grant Level 2', () => {
    const patch = surveyUploadFormData(summariseSurveyUploads([f('lot12.csv')]))
    const rec = patch.surveyUploads as Record<string, unknown>
    // Level 2 is granted by the promotion gate after review, not by uploading.
    expect(rec.grantsLevel2).toBe(false)
    expect(rec.count).toBe(1)
  })

  it('is JSON-serialisable for the JSONB column', () => {
    const patch = surveyUploadFormData(summariseSurveyUploads([f('a.dxf'), f('b.laz')]))
    expect(() => JSON.parse(JSON.stringify(patch))).not.toThrow()
  })

  it('offers every parseable format in the file picker', () => {
    for (const ext of ['.csv', '.xml', '.dxf', '.dwg', '.las', '.laz', '.pdf']) {
      expect(SURVEY_ACCEPT_ATTRIBUTE).toContain(ext)
    }
  })
})
