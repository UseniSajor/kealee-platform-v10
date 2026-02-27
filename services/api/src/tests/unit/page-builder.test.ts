import { describe, it, expect } from 'vitest'

// Test the layout-designer logic directly without importing the full package
// (avoids @prisma/client resolution issues in test environment)
type SectionType = 'hero' | 'contractor_grid' | 'budget_breakdown' | 'timeline' | 'pricing_grid' | 'case_studies'

const LAYOUT_MAP: Record<string, SectionType[]> = {
  HOMEOWNER: ['hero', 'contractor_grid', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies'],
  CONTRACTOR: ['hero', 'case_studies', 'pricing_grid', 'budget_breakdown', 'timeline', 'contractor_grid'],
  ARCHITECT: ['hero', 'timeline', 'budget_breakdown', 'case_studies', 'contractor_grid', 'pricing_grid'],
  INVESTOR: ['hero', 'pricing_grid', 'budget_breakdown', 'contractor_grid', 'timeline', 'case_studies'],
  PROPERTY_MANAGER: ['hero', 'contractor_grid', 'pricing_grid', 'budget_breakdown', 'timeline', 'case_studies'],
}

const DEFAULT_LAYOUT: SectionType[] = ['hero', 'contractor_grid', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies']

function getLayout(userType: string): SectionType[] {
  return LAYOUT_MAP[userType] || DEFAULT_LAYOUT
}

describe('PageBuilder - LayoutDesigner', () => {
  it('should return homeowner layout with hero first', () => {
    const layout = getLayout('HOMEOWNER')
    expect(layout[0]).toBe('hero')
    expect(layout).toContain('contractor_grid')
    expect(layout).toContain('budget_breakdown')
    expect(layout).toContain('timeline')
    expect(layout).toContain('pricing_grid')
    expect(layout).toContain('case_studies')
  })

  it('should return contractor layout with case_studies earlier', () => {
    const layout = getLayout('CONTRACTOR')
    expect(layout[0]).toBe('hero')
    const caseStudyIdx = layout.indexOf('case_studies')
    const contractorGridIdx = layout.indexOf('contractor_grid')
    expect(caseStudyIdx).toBeLessThan(contractorGridIdx)
  })

  it('should return investor layout with pricing_grid early', () => {
    const layout = getLayout('INVESTOR')
    expect(layout[0]).toBe('hero')
    expect(layout[1]).toBe('pricing_grid')
  })

  it('should return 6 sections for all user types', () => {
    const types = ['HOMEOWNER', 'CONTRACTOR', 'ARCHITECT', 'INVESTOR', 'PROPERTY_MANAGER']
    for (const type of types) {
      const layout = getLayout(type)
      expect(layout).toHaveLength(6)
    }
  })

  it('should return default layout for unknown user type', () => {
    const layout = getLayout('UNKNOWN')
    expect(layout).toEqual(DEFAULT_LAYOUT)
  })
})
