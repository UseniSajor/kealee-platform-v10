import { describe, it, expect } from 'vitest'
import {
  canAgencyTransitionStatus,
  canAdminTransitionStatus,
  AGENCY_FORBIDDEN_STATUS_TRANSITIONS,
} from '../types'
import { buildConceptVisualPrompt } from '../concept-visual/prompts'

describe('marketing-agency access control', () => {
  it('agency cannot transition to approved, rejected, or published', () => {
    for (const status of AGENCY_FORBIDDEN_STATUS_TRANSITIONS) {
      expect(canAgencyTransitionStatus('draft', status as never)).toBe(false)
    }
  })

  it('agency can submit drafts', () => {
    expect(canAgencyTransitionStatus('draft', 'submitted')).toBe(true)
    expect(canAgencyTransitionStatus('needs_revision', 'submitted')).toBe(true)
  })

  it('admin can approve submitted assets', () => {
    expect(canAdminTransitionStatus('submitted', 'approved')).toBe(true)
    expect(canAdminTransitionStatus('approved', 'published')).toBe(true)
  })

  it('concept visual prompt labels as representative example', () => {
    const prompt = buildConceptVisualPrompt({
      service_type: 'kitchen_remodel',
      property_type: 'single_family',
      property_style: 'modern',
      variant: 'after',
    })
    expect(prompt.toLowerCase()).toContain('representative')
    expect(prompt.toLowerCase()).toContain('not a real customer project')
  })
})
