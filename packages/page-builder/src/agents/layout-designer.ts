import type { FunnelUserType } from '@prisma/client'
import type { SectionType } from '../types'

const LAYOUT_MAP: Record<string, SectionType[]> = {
  HOMEOWNER: ['hero', 'contractor_grid', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies'],
  CONTRACTOR: ['hero', 'case_studies', 'pricing_grid', 'budget_breakdown', 'timeline', 'contractor_grid'],
  ARCHITECT: ['hero', 'timeline', 'budget_breakdown', 'case_studies', 'contractor_grid', 'pricing_grid'],
  INVESTOR: ['hero', 'pricing_grid', 'budget_breakdown', 'contractor_grid', 'timeline', 'case_studies'],
  PROPERTY_MANAGER: ['hero', 'contractor_grid', 'pricing_grid', 'budget_breakdown', 'timeline', 'case_studies'],
}

const DEFAULT_LAYOUT: SectionType[] = ['hero', 'contractor_grid', 'budget_breakdown', 'timeline', 'pricing_grid', 'case_studies']

export function getLayout(userType: FunnelUserType): SectionType[] {
  return LAYOUT_MAP[userType] || DEFAULT_LAYOUT
}
