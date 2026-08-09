/**
 * seed-dmv-rag.test.ts
 *
 * Unit tests for the pure helper functions exported by seed-dmv-rag.ts.
 * No I/O, no @kealee/ai dependency — tests the serialisation logic only.
 */

import { describe, it, expect } from 'vitest'
import { recordContent, recordTitle, recordSourceId } from '../../../../../scripts/seed-dmv-rag'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const PERMIT = {
  type: 'permit' as const,
  jurisdiction: 'District of Columbia',
  project_types: ['renovation', 'addition'],
  permit_type: 'Building Permit',
  processing_days: 30,
  requirements: ['Site plan', 'Architectural drawings'],
  common_issues: ['Incomplete drawings'],
  fee_base: 500,
  fee_per_sqft: 0.5,
  expedited_available: true,
  online_submission: true,
}

const ZONING = {
  type: 'zoning' as const,
  jurisdiction: 'Arlington County',
  zone: 'R-5',
  max_lot_coverage: 40,
  min_lot_size_sqft: 5000,
  setback_front: 25,
  setback_side: 5,
  setback_rear: 20,
  max_height_ft: 35,
  adu_allowed: true,
  min_adu_sqft: 400,
  max_adu_sqft: 1200,
  parking_spaces_required: 2,
}

const COST = {
  type: 'cost' as const,
  jurisdiction: 'Fairfax County',
  project_type: 'renovation',
  cost_per_sqft: 150,
  avg_size_sqft: 2000,
  total_hard_cost_est: 300000,
  soft_costs_percent: 15,
  contingency_percent: 10,
  typical_duration_months: 6,
  primary_expense_categories: ['Labor', 'Materials'],
  permit_fee_est: 2500,
  design_fee_est: 18000,
}

const WORKFLOW = {
  type: 'workflow' as const,
  jurisdiction: 'Montgomery County',
  stage: 'permitting',
  project_type: 'addition',
  key_steps: ['Submit application', 'Plan review', 'Approval'],
  estimated_days: 45,
  deliverables: ['Approved permit', 'Inspection card'],
  next_stage: 'construction',
  required_professionals: ['Architect', 'Engineer'],
  common_blockers: ['Incomplete plans', 'Zoning conflicts'],
}

// ── recordTitle ────────────────────────────────────────────────────────────────

describe('recordTitle', () => {
  it('formats permit title with permit_type and jurisdiction', () => {
    const title = recordTitle(PERMIT)
    expect(title).toBe('Permit: Building Permit — District of Columbia')
  })

  it('formats zoning title with zone and jurisdiction', () => {
    const title = recordTitle(ZONING)
    expect(title).toBe('Zoning: R-5 — Arlington County')
  })

  it('formats cost title with project_type and jurisdiction', () => {
    const title = recordTitle(COST)
    expect(title).toBe('Cost: renovation — Fairfax County')
  })

  it('formats workflow title with stage and project_type', () => {
    const title = recordTitle(WORKFLOW)
    expect(title).toBe('Workflow: permitting — addition')
  })
})

// ── recordSourceId ─────────────────────────────────────────────────────────────

describe('recordSourceId', () => {
  it('generates stable permit source ID', () => {
    const id = recordSourceId(PERMIT, 0)
    expect(id).toMatch(/^dmv-permit-district-of-columbia-0$/)
  })

  it('generates stable zoning source ID containing zone', () => {
    const id = recordSourceId(ZONING, 7)
    expect(id).toMatch(/^dmv-zoning-arlington-county-r-5-7$/)
  })

  it('generates stable cost source ID', () => {
    const id = recordSourceId(COST, 42)
    expect(id).toMatch(/^dmv-cost-renovation-fairfax-county-42$/)
  })

  it('generates stable workflow source ID', () => {
    const id = recordSourceId(WORKFLOW, 1)
    expect(id).toMatch(/^dmv-workflow-permitting-addition-1$/)
  })

  it('uses different indices to produce distinct IDs', () => {
    const id0 = recordSourceId(PERMIT, 0)
    const id1 = recordSourceId(PERMIT, 1)
    expect(id0).not.toBe(id1)
  })
})

// ── recordContent (permit) ────────────────────────────────────────────────────

describe('recordContent — permit', () => {
  it('includes permit_type', () => {
    expect(recordContent(PERMIT)).toContain('Building Permit')
  })

  it('includes jurisdiction', () => {
    expect(recordContent(PERMIT)).toContain('District of Columbia')
  })

  it('includes processing_days', () => {
    expect(recordContent(PERMIT)).toContain('30')
  })

  it('includes fee_base', () => {
    expect(recordContent(PERMIT)).toContain('500')
  })

  it('includes fee_per_sqft when present', () => {
    expect(recordContent(PERMIT)).toContain('0.5')
  })

  it('mentions expedited when available', () => {
    expect(recordContent(PERMIT)).toContain('Expedited')
  })

  it('mentions online submission when available', () => {
    expect(recordContent(PERMIT)).toContain('Online submission')
  })

  it('omits expedited line when unavailable', () => {
    const noExp = { ...PERMIT, expedited_available: false }
    expect(recordContent(noExp)).not.toContain('Expedited')
  })
})

// ── recordContent (zoning) ────────────────────────────────────────────────────

describe('recordContent — zoning', () => {
  it('includes zone', () => {
    expect(recordContent(ZONING)).toContain('R-5')
  })

  it('includes max_lot_coverage', () => {
    expect(recordContent(ZONING)).toContain('40')
  })

  it('includes setback_rear when present', () => {
    expect(recordContent(ZONING)).toContain('Rear Setback')
  })

  it('includes ADU info', () => {
    const content = recordContent(ZONING)
    expect(content).toContain('ADU Allowed')
    expect(content).toContain('400')   // min_adu_sqft
    expect(content).toContain('1200')  // max_adu_sqft
  })

  it('includes parking spaces', () => {
    expect(recordContent(ZONING)).toContain('2 spaces')
  })

  it('omits setback_rear when absent', () => {
    const noRear = { ...ZONING, setback_rear: undefined }
    expect(recordContent(noRear)).not.toContain('Rear Setback')
  })
})

// ── recordContent (cost) ──────────────────────────────────────────────────────

describe('recordContent — cost', () => {
  it('includes cost_per_sqft', () => {
    expect(recordContent(COST)).toContain('150')
  })

  it('includes total_hard_cost_est label', () => {
    expect(recordContent(COST)).toContain('Total Hard Cost Estimate')
  })

  it('includes permit and design fee estimates', () => {
    const content = recordContent(COST)
    expect(content).toContain('Permit Fee Estimate')
    expect(content).toContain('Design Fee Estimate')
  })

  it('includes primary_expense_categories', () => {
    const content = recordContent(COST)
    expect(content).toContain('Labor')
    expect(content).toContain('Materials')
  })

  it('omits permit_fee_est line when absent', () => {
    const noFee = { ...COST, permit_fee_est: undefined }
    expect(recordContent(noFee)).not.toContain('Permit Fee Estimate')
  })
})

// ── recordContent (workflow) ──────────────────────────────────────────────────

describe('recordContent — workflow', () => {
  it('includes stage', () => {
    expect(recordContent(WORKFLOW)).toContain('permitting')
  })

  it('includes key_steps', () => {
    const content = recordContent(WORKFLOW)
    expect(content).toContain('Submit application')
    expect(content).toContain('Plan review')
  })

  it('includes next_stage', () => {
    expect(recordContent(WORKFLOW)).toContain('construction')
  })

  it('includes required_professionals', () => {
    const content = recordContent(WORKFLOW)
    expect(content).toContain('Architect')
    expect(content).toContain('Engineer')
  })

  it('includes common_blockers', () => {
    const content = recordContent(WORKFLOW)
    expect(content).toContain('Incomplete plans')
    expect(content).toContain('Zoning conflicts')
  })

  it('omits next_stage line when null', () => {
    const noNext = { ...WORKFLOW, next_stage: null }
    expect(recordContent(noNext)).not.toContain('Next Stage')
  })
})
