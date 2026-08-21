/**
 * Site-plan applicability and the 5,000 sq ft disturbance gate.
 *
 * The behaviours worth protecting are the ones that cost money when wrong:
 * a routine addition must not be pushed into a Detailed Site Plan, and a project
 * whose disturbance is unknown must not be quietly treated as under threshold.
 */

import { classifyProject } from '../site-plan/classification'
import {
  calculateDisturbance,
  requiresSedimentAndStormwaterReview,
  DISTURBANCE_THRESHOLD_SQFT,
} from '../site-plan/disturbance'
import {
  gisSourceRecord,
  governingReliability,
  dataSupportsPermitSubmission,
  LEVEL_1_DISCLOSURE,
} from '../site-plan/reliability'

const gis = gisSourceRecord({
  sourceId: 'pg-zoning',
  authority: "M-NCPPC Prince George's County",
  dataset: 'Zoning (Full Description)',
  crs: 'EPSG:2248',
  horizontalDatum: 'NAD83',
})

const FULLY_QUANTIFIED = {
  buildingFootprintSqFt: 0, drivewaySqFt: 0, utilityTrenchesSqFt: 0, gradingSqFt: 0,
  stormwaterFacilitiesSqFt: 0, stockpilesSqFt: 0, constructionAccessSqFt: 0,
  offsiteWorkSqFt: 0, demolitionSqFt: 0, stagingAreasSqFt: 0,
}

describe('disturbance gate', () => {
  it('sums only known components and lists the unknown ones', () => {
    const r = calculateDisturbance({ buildingFootprintSqFt: 800, drivewaySqFt: 400 })
    expect(r.knownTotalSqFt).toBe(1200)
    expect(r.unknownComponents).toHaveLength(8)
  })

  it('treats a missing component as unknown, never as zero', () => {
    const r = calculateDisturbance({ buildingFootprintSqFt: 4_900 })
    expect(r.meetsThreshold).toBe(false)
    expect(r.indeterminate).toBe(true)
    // Cannot claim the project is under threshold while components are missing.
    expect(requiresSedimentAndStormwaterReview(r).required).toBe(true)
    expect(requiresSedimentAndStormwaterReview(r).certain).toBe(false)
  })

  it('is exact at the boundary', () => {
    const under = calculateDisturbance({ ...FULLY_QUANTIFIED, gradingSqFt: DISTURBANCE_THRESHOLD_SQFT - 1 })
    const at = calculateDisturbance({ ...FULLY_QUANTIFIED, gradingSqFt: DISTURBANCE_THRESHOLD_SQFT })
    const over = calculateDisturbance({ ...FULLY_QUANTIFIED, gradingSqFt: DISTURBANCE_THRESHOLD_SQFT + 1 })
    expect(under.meetsThreshold).toBe(false)
    expect(under.indeterminate).toBe(false)
    expect(at.meetsThreshold).toBe(true)      // "at or above"
    expect(over.meetsThreshold).toBe(true)
    expect(requiresSedimentAndStormwaterReview(under).required).toBe(false)
    expect(requiresSedimentAndStormwaterReview(under).certain).toBe(true)
  })
})

describe('project classification', () => {
  it('does NOT require a Detailed Site Plan for a routine single-family addition', () => {
    const r = classifyProject({
      zoneCode: 'RSF-65',
      isResidentialSingleFamily: true,
      dwellingUnitCount: 1,
      disturbance: { ...FULLY_QUANTIFIED, buildingFootprintSqFt: 800, drivewaySqFt: 400, gradingSqFt: 1_200 },
      sources: [gis],
    })
    expect(r.classifications).toContain('permit_plot_plan')
    expect(r.classifications).not.toContain('detailed_site_plan')
    expect(r.classifications).not.toContain('site_development_concept')
  })

  it('requires DSP inside the Chesapeake Bay Critical Area', () => {
    const r = classifyProject({ zoneCode: 'RSF-65', withinChesapeakeBayCriticalArea: true, sources: [gis] })
    const dsp = r.determinations.find(d => d.approval === 'detailed_site_plan')!
    expect(dsp.required).toBe(true)
    expect(dsp.reason).toMatch(/Critical Area/)
  })

  it('requires subdivision review only when new lots are created', () => {
    const withLots = classifyProject({ createsNewLots: true, newLotCount: 12, sources: [gis] })
    const without = classifyProject({ zoneCode: 'RSF-65', dwellingUnitCount: 1, sources: [gis] })
    expect(withLots.classifications).toContain('preliminary_plan_of_subdivision')
    expect(without.classifications).not.toContain('preliminary_plan_of_subdivision')
  })

  it('gives a reason for every determination, required or not', () => {
    const r = classifyProject({ zoneCode: 'RSF-65', dwellingUnitCount: 1, sources: [gis] })
    for (const d of r.determinations) {
      expect(d.reason.length).toBeGreaterThan(20)
    }
  })

  it('short-circuits for feasibility-only requests', () => {
    const r = classifyProject({ feasibilityOnly: true })
    expect(r.classifications).toEqual(['feasibility_only'])
  })

  it('raises environmental coordination as open items, not as approvals', () => {
    const r = classifyProject({
      zoneCode: 'RSF-65', removesWoodland: true, affectsStreamOrWetlandBuffer: true, sources: [gis],
    })
    expect(r.openItems.join(' ')).toMatch(/Tree Conservation Plan/)
    expect(r.openItems.join(' ')).toMatch(/24-4303\(c\)/)
  })
})

describe('reliability', () => {
  it('classifies county GIS as Level 1 with no vertical datum', () => {
    expect(gis.reliabilityLevel).toBe(1)
    expect(gis.verticalDatum).toBeNull()
  })

  it('applies the Level 1 disclosure to GIS-derived output', () => {
    const r = classifyProject({ zoneCode: 'RSF-65', sources: [gis] })
    expect(r.disclosure).toBe(LEVEL_1_DISCLOSURE)
  })

  it('takes the lowest reliability present', () => {
    expect(governingReliability([gis, { ...gis, reliabilityLevel: 0 }])).toBe(0)
    expect(governingReliability([])).toBe(0)
  })

  it('does not call GIS-only data sufficient for permit submission', () => {
    const r = dataSupportsPermitSubmission([gis])
    expect(r.sufficient).toBe(false)
    expect(r.missing.join(' ')).toMatch(/survey/i)
  })
})
