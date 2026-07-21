/**
 * rag-retriever.test.ts  (integration)
 *
 * Loads the real dmv_full_dataset.jsonl — no mocks.
 * Verifies every public retrieval function against live seed data.
 *
 * Coverage:
 *   loadRAGData / isRAGLoaded / getRAGStatus
 *   retrievePermitContext  — exact match, alias, partial jurisdiction, limit
 *   retrieveZoningContext  — alias, required fields
 *   retrieveCostContext    — project_type index, jurisdiction filter, partial match
 *   retrieveWorkflowContext — stage index, project_type filter
 *   buildRAGContext        — composite context, null on no-match
 */

import { describe, it, expect, beforeAll } from 'vitest'
import {
  loadRAGData,
  isRAGLoaded,
  getRAGStatus,
  retrievePermitContext,
  retrieveZoningContext,
  retrieveCostContext,
  retrieveWorkflowContext,
  buildRAGContext,
} from '../rag-retriever'

// ── Load once for the entire suite ────────────────────────────────────────────

beforeAll(() => {
  if (!isRAGLoaded()) {
    loadRAGData()
  }
})

// ── loadRAGData / status ───────────────────────────────────────────────────────

describe('loadRAGData', () => {
  it('loads more than 1 000 records from the JSONL', () => {
    const { loaded, recordCount } = getRAGStatus()
    expect(loaded).toBe(true)
    expect(recordCount).toBeGreaterThan(1000)
  })

  it('isRAGLoaded returns true after load', () => {
    expect(isRAGLoaded()).toBe(true)
  })

  it('is idempotent — second call does not throw', () => {
    expect(() => loadRAGData()).not.toThrow()
    expect(isRAGLoaded()).toBe(true)
  })
})

// ── retrievePermitContext ──────────────────────────────────────────────────────

describe('retrievePermitContext', () => {
  it('returns permit records for "District of Columbia"', () => {
    const results = retrievePermitContext('District of Columbia', 'renovation')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe('permit')
    expect(results[0].jurisdiction.toLowerCase()).toContain('columbia')
  })

  it('resolves alias "dc" → District of Columbia', () => {
    const direct = retrievePermitContext('District of Columbia', 'renovation')
    const alias  = retrievePermitContext('dc', 'renovation')
    expect(alias.length).toBeGreaterThan(0)
    expect(alias.length).toBe(direct.length)
  })

  it('resolves alias "arlington va" → Arlington County', () => {
    const results = retrievePermitContext('arlington va', 'addition')
    expect(results.length).toBeGreaterThan(0)
  })

  it('resolves alias "nova" → Fairfax County', () => {
    const results = retrievePermitContext('nova', '')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns records with all required PermitRecord fields', () => {
    const results = retrievePermitContext('fairfax county', 'commercial')
    expect(results.length).toBeGreaterThan(0)
    const r = results[0]
    expect(typeof r.permit_type).toBe('string')
    expect(typeof r.processing_days).toBe('number')
    expect(r.processing_days).toBeGreaterThan(0)
    expect(typeof r.fee_base).toBe('number')
    expect(Array.isArray(r.project_types)).toBe(true)
    expect(Array.isArray(r.requirements)).toBe(true)
    expect(Array.isArray(r.common_issues)).toBe(true)
  })

  it('respects the limit parameter', () => {
    const all     = retrievePermitContext('dc', '')
    const limited = retrievePermitContext('dc', '', 3)
    expect(limited.length).toBeLessThanOrEqual(3)
    expect(all.length).toBeGreaterThan(limited.length)
  })

  it('returns empty array for unknown jurisdiction', () => {
    const results = retrievePermitContext('nonexistent-place-xyz-123', 'renovation')
    expect(results).toEqual([])
  })

  it('returns results across multiple DMV jurisdictions', () => {
    const jurisdictions = [
      'Montgomery County',
      "Prince George's County",
      'Arlington County',
      'Fairfax County',
    ]
    for (const j of jurisdictions) {
      const results = retrievePermitContext(j, '')
      expect(results.length).toBeGreaterThan(0)
    }
  })
})

// ── retrieveZoningContext ──────────────────────────────────────────────────────

describe('retrieveZoningContext', () => {
  it('returns zoning records for Montgomery County', () => {
    const results = retrieveZoningContext('Montgomery County')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe('zoning')
  })

  it('resolves alias "md" → Montgomery County', () => {
    const direct = retrieveZoningContext('Montgomery County')
    const alias  = retrieveZoningContext('md')
    expect(alias.length).toBeGreaterThan(0)
    expect(alias.length).toBe(direct.length)
  })

  it('resolves alias "arlington" → Arlington County', () => {
    const results = retrieveZoningContext('arlington')
    expect(results.length).toBeGreaterThan(0)
  })

  it('returns records with required ZoningRecord fields', () => {
    const results = retrieveZoningContext('Arlington County')
    expect(results.length).toBeGreaterThan(0)
    const r = results[0]
    expect(typeof r.zone).toBe('string')
    expect(r.zone.length).toBeGreaterThan(0)
    expect(typeof r.max_lot_coverage).toBe('number')
    expect(typeof r.min_lot_size_sqft).toBe('number')
    expect(typeof r.setback_front).toBe('number')
    expect(typeof r.setback_side).toBe('number')
    expect(typeof r.max_height_ft).toBe('number')
    expect(typeof r.adu_allowed).toBe('boolean')
  })

  it('respects the limit parameter', () => {
    const limited = retrieveZoningContext('dc', 2)
    expect(limited.length).toBeLessThanOrEqual(2)
  })

  it('returns empty array for unknown jurisdiction', () => {
    const results = retrieveZoningContext('nowhere-xyz-12345')
    expect(results).toEqual([])
  })
})

// ── retrieveCostContext ────────────────────────────────────────────────────────

describe('retrieveCostContext', () => {
  it('returns cost records for "renovation"', () => {
    const results = retrieveCostContext('renovation')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].type).toBe('cost')
  })

  it('returns records with required CostRecord fields', () => {
    const results = retrieveCostContext('renovation')
    expect(results.length).toBeGreaterThan(0)
    const r = results[0]
    expect(typeof r.cost_per_sqft).toBe('number')
    expect(r.cost_per_sqft).toBeGreaterThan(0)
    expect(typeof r.avg_size_sqft).toBe('number')
    expect(typeof r.soft_costs_percent).toBe('number')
    expect(typeof r.contingency_percent).toBe('number')
    expect(typeof r.typical_duration_months).toBe('number')
    expect(Array.isArray(r.primary_expense_categories)).toBe(true)
  })

  it('filters by jurisdiction when provided (alias "dc")', () => {
    const results = retrieveCostContext('renovation', 'dc')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => {
      expect(r.jurisdiction.toLowerCase()).toContain('columbia')
    })
  })

  it('returns results for all canonical project types', () => {
    const types = ['renovation', 'addition', 'multifamily', 'commercial']
    for (const pt of types) {
      const results = retrieveCostContext(pt)
      expect(results.length).toBeGreaterThan(0)
    }
  })

  it('returns empty array for unknown project type', () => {
    const results = retrieveCostContext('quantum-flux-construction-xyz')
    expect(results).toEqual([])
  })

  it('respects the limit parameter', () => {
    const all     = retrieveCostContext('renovation')
    const limited = retrieveCostContext('renovation', undefined, 2)
    expect(limited.length).toBeLessThanOrEqual(2)
    expect(all.length).toBeGreaterThanOrEqual(limited.length)
  })
})

// ── retrieveWorkflowContext ────────────────────────────────────────────────────

describe('retrieveWorkflowContext', () => {
  // Stages confirmed present in the dataset: pre-design, design, permitting,
  // construction, inspections, closeout, feasibility, bidding, due-diligence
  const KNOWN_STAGES = [
    'pre-design',
    'design',
    'permitting',
    'construction',
    'closeout',
  ]

  it('returns workflow records for all known stages', () => {
    for (const stage of KNOWN_STAGES) {
      const results = retrieveWorkflowContext(stage)
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].type).toBe('workflow')
      expect(results[0].stage).toBe(stage)
    }
  })

  it('returns records with required WorkflowRecord fields', () => {
    const results = retrieveWorkflowContext('construction')
    expect(results.length).toBeGreaterThan(0)
    const r = results[0]
    expect(typeof r.stage).toBe('string')
    expect(typeof r.project_type).toBe('string')
    expect(typeof r.jurisdiction).toBe('string')
    expect(Array.isArray(r.key_steps)).toBe(true)
    expect(r.key_steps.length).toBeGreaterThan(0)
    expect(typeof r.estimated_days).toBe('number')
    expect(Array.isArray(r.deliverables)).toBe(true)
  })

  it('filters by project_type when provided', () => {
    const all         = retrieveWorkflowContext('design')
    const renovation  = retrieveWorkflowContext('design', 'renovation')
    expect(renovation.length).toBeGreaterThan(0)
    renovation.forEach(r => expect(r.project_type).toBe('renovation'))
    // All-records set must be >= filtered set
    expect(all.length).toBeGreaterThanOrEqual(renovation.length)
  })

  it('returns empty array for unknown stage', () => {
    const results = retrieveWorkflowContext('xyz-nonexistent-stage-abc')
    expect(results).toEqual([])
  })

  it('respects the limit parameter', () => {
    const limited = retrieveWorkflowContext('construction', undefined, 2)
    expect(limited.length).toBeLessThanOrEqual(2)
  })
})

// ── buildRAGContext ────────────────────────────────────────────────────────────

describe('buildRAGContext', () => {
  it('returns null when no matches found for unknown jurisdiction + type', () => {
    const ctx = buildRAGContext({ jurisdiction: 'nowhere-xyz-abc', projectType: 'nothing-known' })
    expect(ctx).toBeNull()
  })

  it('returns full context for dc + renovation', () => {
    const ctx = buildRAGContext({ jurisdiction: 'dc', projectType: 'renovation' })
    expect(ctx).not.toBeNull()
    expect(ctx!.permits.length).toBeGreaterThan(0)
    expect(Array.isArray(ctx!.zoning)).toBe(true)
    expect(ctx!.zoning.length).toBeGreaterThan(0)
    expect(Array.isArray(ctx!.costs)).toBe(true)
    expect(ctx!.costs.length).toBeGreaterThan(0)
    expect(Array.isArray(ctx!.workflows)).toBe(true)
  })

  it('returns context with correct types on all arrays', () => {
    const ctx = buildRAGContext({ jurisdiction: 'arlington', projectType: 'addition' })
    expect(ctx).not.toBeNull()
    if (ctx) {
      ctx.permits.forEach(r => expect(r.type).toBe('permit'))
      ctx.zoning.forEach(r => expect(r.type).toBe('zoning'))
      ctx.costs.forEach(r => expect(r.type).toBe('cost'))
      ctx.workflows.forEach(r => expect(r.type).toBe('workflow'))
    }
  })

  it('accepts partial input (jurisdiction only)', () => {
    const ctx = buildRAGContext({ jurisdiction: 'fairfax' })
    expect(ctx).not.toBeNull()
  })
})
