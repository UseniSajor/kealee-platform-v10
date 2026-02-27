import { describe, it, expect } from 'vitest'
import { getLayout } from '@kealee/page-builder'

describe('PageBuilder - LayoutDesigner', () => {
  it('should return homeowner layout with hero first', () => {
    const layout = getLayout('HOMEOWNER' as any)
    expect(layout[0]).toBe('hero')
    expect(layout).toContain('contractor_grid')
    expect(layout).toContain('budget_breakdown')
    expect(layout).toContain('timeline')
    expect(layout).toContain('pricing_grid')
    expect(layout).toContain('case_studies')
  })

  it('should return contractor layout with case_studies earlier', () => {
    const layout = getLayout('CONTRACTOR' as any)
    expect(layout[0]).toBe('hero')
    const caseStudyIdx = layout.indexOf('case_studies')
    const contractorGridIdx = layout.indexOf('contractor_grid')
    expect(caseStudyIdx).toBeLessThan(contractorGridIdx)
  })

  it('should return investor layout with pricing_grid early', () => {
    const layout = getLayout('INVESTOR' as any)
    expect(layout[0]).toBe('hero')
    expect(layout[1]).toBe('pricing_grid')
  })

  it('should return 6 sections for all user types', () => {
    const types = ['HOMEOWNER', 'CONTRACTOR', 'ARCHITECT', 'INVESTOR', 'PROPERTY_MANAGER']
    for (const type of types) {
      const layout = getLayout(type as any)
      expect(layout).toHaveLength(6)
    }
  })
})
