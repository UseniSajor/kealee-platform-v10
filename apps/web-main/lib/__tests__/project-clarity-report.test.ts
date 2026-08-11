import { describe, expect, it } from 'vitest'
import { buildProjectClarityReport } from '../project-clarity-report'

describe('project clarity report', () => {
  it('recommends site planning and professional plans for an addition', () => {
    const report = buildProjectClarityReport({
      address: '100 Main Street',
      projectDescription: 'Build a two-story rear addition',
      budgetRange: '$100,000–$250,000',
      timeline: '3–6 months',
    })
    expect(report.recommendedServices.map(service => service.name)).toEqual(expect.arrayContaining([
      'Design Concept',
      'Site Plans & Feasibility',
      'Professional Permit Drawings',
    ]))
  })

  it('always feeds the free review into paid platform services', () => {
    const report = buildProjectClarityReport({ address: '100 Main Street', projectDescription: 'Update my kitchen' })
    expect(report.recommendedServices.length).toBeGreaterThanOrEqual(3)
    expect(report.recommendedServices.every(service => service.href.startsWith('/'))).toBe(true)
  })
})
