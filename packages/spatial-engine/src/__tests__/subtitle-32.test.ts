/**
 * Subtitle 32 — the grading code — and the plan-scale floor it sets.
 *
 * Two failure modes are guarded here, and both are ones the engine actually
 * had:
 *
 *   1. `fitViewport` fell through to the last entry of the scale table, 1"=200',
 *      whenever nothing else fitted. That silently produced a sheet DPIE
 *      rejects on intake, with nothing anywhere saying so.
 *
 *   2. eLaws answers an unknown slug with HTTP 200 and a headingless fallback
 *      page. Hashing one would give a value that never changes when the section
 *      is amended.
 */

import {
  ARCH_D, ANSI_B, fitViewport, boundsOf,
  PG_SCALE_GENERAL, PG_SCALE_SURPLUS_EARTH_10AC,
  scaleConstraintFor, effectiveMaxFtPerIn,
} from '../sheets/viewport'
import {
  PG_SUBTITLE_32_SECTIONS, PG_SUBTITLE_32_DIVISIONS, pgElawsUrl,
  assertSectionHeading, buildPgSubtitle32Sources,
  PG_PLAN_CONTENT_STANDARDS, unenforcedPlanContentStandards,
} from '../jurisdictions/pg-subtitle-32'

const X = 1326382.7, Y = 464763.1
const lot = (w: number, h: number) => ({
  coordinates: [[X, Y], [X + w, Y], [X + w, Y + h], [X, Y + h], [X, Y]] as [number, number][],
})

describe('plan scale floor — Sec. 32-130(a)(5)', () => {
  it('draws a normal infill lot at a permitted scale', () => {
    const vp = fitViewport(boundsOf([lot(65, 100)]), ARCH_D, 20)
    expect(vp.scaleCompliance.compliant).toBe(true)
    expect(vp.scaleFtPerIn).toBeLessThanOrEqual(50)
    expect(vp.scaleCompliance.citation).toBe('PGC Code Sec. 32-130(a)(5)')
  })

  it('never silently chooses a scale smaller than the cap', () => {
    // A site far too large for ARCH D at 1"=50'. The old chooser returned 200
    // with no complaint; the whole point of the fix is that this cannot pass.
    const vp = fitViewport(boundsOf([lot(4000, 3000)]), ARCH_D, 20)
    expect(vp.scaleCompliance.compliant).toBe(false)
    expect(vp.scaleCompliance.limitFtPerIn).toBe(50)
    expect(vp.scaleCompliance.remedy).toMatch(/match-lined sheets/)
    // It still draws — the geometry stays inspectable.
    expect(vp.pointsPerFoot).toBeGreaterThan(0)
  })

  it('reports non-compliance rather than throwing, so the drawing survives', () => {
    expect(() => fitViewport(boundsOf([lot(9000, 9000)]), ANSI_B, 20)).not.toThrow()
  })

  it("honours the Director's advance approval of a smaller scale", () => {
    // ARCH D holds ~1525 x 1150 ft at 1"=50'. This site exceeds that but fits
    // at 1"=100', so the approval is what makes the difference.
    const bounds = boundsOf([lot(2000, 1500)])
    const without = fitViewport(bounds, ARCH_D, 20)
    expect(without.scaleCompliance.compliant).toBe(false)

    const approved = scaleConstraintFor({
      directorApproval: {
        reference: 'DPIE SRPRD verbal, logged 2026-08-01',
        approvedOn: '2026-08-01',
        approvedMaxFtPerIn: 100,
      },
    })
    const withApproval = fitViewport(bounds, ARCH_D, 20, approved)
    expect(effectiveMaxFtPerIn(approved)).toBe(100)
    expect(withApproval.scaleCompliance.compliant).toBe(true)
    expect(withApproval.scaleFtPerIn).toBeLessThanOrEqual(100)
  })

  it('never lets an approval make the cap stricter by accident', () => {
    const c = scaleConstraintFor({
      directorApproval: { reference: 'r', approvedOn: '2026-01-01', approvedMaxFtPerIn: 20 },
    })
    // An approval is a relaxation, not a tightening: 20 < 50 must not lower the cap.
    expect(effectiveMaxFtPerIn(c)).toBe(50)
  })
})

describe('Sec. 32-130(a)(6) — surplus earth disposal', () => {
  it('permits 1"=200\' only for the narrow case the code describes', () => {
    const c = scaleConstraintFor({
      surplusEarthDisposal: true, siteAreaAcres: 12, workWithin50FtOfPropertyLine: false,
    })
    expect(c).toBe(PG_SCALE_SURPLUS_EARTH_10AC)
    expect(c.maxFtPerIn).toBe(200)
    expect(c.contourIntervalsFt).toContain(5)
  })

  it('reverts to (a)(5) for work within fifty feet of a property line', () => {
    const c = scaleConstraintFor({
      surplusEarthDisposal: true, siteAreaAcres: 12, workWithin50FtOfPropertyLine: true,
    })
    expect(c).toBe(PG_SCALE_GENERAL)
    expect(c.maxFtPerIn).toBe(50)
  })

  it('reverts to (a)(5) below ten acres', () => {
    expect(scaleConstraintFor({
      surplusEarthDisposal: true, siteAreaAcres: 9.9, workWithin50FtOfPropertyLine: false,
    })).toBe(PG_SCALE_GENERAL)
  })

  it('defaults to (a)(5) when nothing is asserted', () => {
    // The narrow exception must be asked for, never inferred.
    expect(scaleConstraintFor()).toBe(PG_SCALE_GENERAL)
    expect(scaleConstraintFor({ surplusEarthDisposal: true, siteAreaAcres: 50 })).toBe(PG_SCALE_GENERAL)
  })
})

describe('Subtitle 32 locators', () => {
  it('maps the sections the Design Review Checklist cites', () => {
    const sections = PG_SUBTITLE_32_SECTIONS.map(s => s.section)
    for (const s of ['32-106', '32-130', '32-131', '32-151', '32-156', '32-161', '32-162']) {
      expect(sections).toContain(s)
    }
  })

  it('records all five divisions', () => {
    expect(PG_SUBTITLE_32_DIVISIONS).toHaveLength(5)
    expect(PG_SUBTITLE_32_DIVISIONS.map(d => d.division)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps 32-106 on its verified subdivision slug', () => {
    const s = PG_SUBTITLE_32_SECTIONS.find(x => x.section === '32-106')!
    // The hierarchy is not uniform. `div1_sec32-106` returns 200 with a
    // fallback page; only `div1_subdiv2_sec32-106` is the real section.
    expect(s.slug).toBe('coor_subtitle32_div1_subdiv2_sec32-106')
    expect(pgElawsUrl(s)).toBe(
      'https://princegeorges-md.elaws.us/code/coor_subtitle32_div1_subdiv2_sec32-106')
  })

  it('rejects a fallback page that carries no section heading', () => {
    const s = PG_SUBTITLE_32_SECTIONS.find(x => x.section === '32-130')!
    const fallback = 'prince georges county municipal regulations of maryland sign in sign up'
    const bad = assertSectionHeading(s, fallback)
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.reason).toMatch(/fallback page/i)

    const good = assertSectionHeading(s, '§ 32-130. contents of grading/site development plan.')
    expect(good.ok).toBe(true)
  })

  it('emits sources only for sections that actually back a rule', () => {
    const rules = [{ ruleKey: 'plan.content.grading', identity: 'id-plan-content' }] as never
    const bundles = buildPgSubtitle32Sources(rules)
    expect(bundles).toHaveLength(1)
    expect(bundles[0].source.sourceId).toBe('pgc-elaws-32-130')
    expect(bundles[0].authority).toBe('OFFICIAL_CODE')
    expect(bundles[0].locators[0].ruleIdentities).toEqual(['id-plan-content'])
  })

  it('extracts the section body from the last heading, not the <title>', () => {
    const bundles = buildPgSubtitle32Sources(
      [{ ruleKey: 'plan.content.grading', identity: 'i' }] as never)
    const extract = bundles[0].locators[0].extract
    // The heading appears twice: once in the title, once in the body.
    const doc = '§ 32-130. contents ... nav ... § 32-130. contents of grading BODY TEXT HERE'
    expect(extract(doc)).toMatch(/BODY TEXT HERE/)
  })
})

describe('Sec. 32-130(a) plan content standards', () => {
  it('transcribes all fifteen paragraphs', () => {
    expect(PG_PLAN_CONTENT_STANDARDS).toHaveLength(15)
    expect(PG_PLAN_CONTENT_STANDARDS[0].paragraph).toBe('(a)(1)')
    expect(PG_PLAN_CONTENT_STANDARDS[14].paragraph).toBe('(a)(15)')
  })

  it("keeps the Director's-approval qualifier the DPIE checklist drops", () => {
    const a5 = PG_PLAN_CONTENT_STANDARDS.find(s => s.paragraph === '(a)(5)')!
    expect(a5.requirement).toMatch(/Director's approval in advance of plan preparation/)
  })

  it('is honest about what the engine does not yet enforce', () => {
    const unenforced = unenforcedPlanContentStandards()
    // Nine of the fifteen have no implementation. The count is asserted so that
    // implementing one forces a deliberate update rather than passing silently.
    expect(unenforced).toHaveLength(9)
    expect(unenforced.map(s => s.paragraph)).toContain('(a)(11)')
  })

  it('records the sheet-size cap as satisfied by ARCH D', () => {
    const a1 = PG_PLAN_CONTENT_STANDARDS.find(s => s.paragraph === '(a)(1)')!
    expect(a1.requirement).toMatch(/30" x 42"/)
    expect(ARCH_D.widthPt / 72).toBeLessThanOrEqual(42)
    expect(ARCH_D.heightPt / 72).toBeLessThanOrEqual(30)
  })
})
