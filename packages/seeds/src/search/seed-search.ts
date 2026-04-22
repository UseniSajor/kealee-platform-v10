/**
 * Seed Data Search
 * In-memory search functions for seed data:
 * - jurisdictions
 - service offerings
 * - rules
 * Pattern: Load seeds once, index them, provide fast search APIs
 */

import { jurisdictionSeeds } from '../jurisdictions/dmv.jurisdictions.seed'
import { serviceOfferingSeeds } from '../services/service-catalog.seed'
import { ruleSeeds } from '../rules/risk-approval-rules.seed'

/**
 * Search jurisdictions by state, county, or code
 */
export function searchJurisdictions(query: string): typeof jurisdictionSeeds {
  const lowerQuery = query.toLowerCase()

  return jurisdictionSeeds.filter((j) => {
    const state = (j.state || '').toLowerCase()
    const county = (j.county || '').toLowerCase()
    const code = (j.code || '').toLowerCase()
    const fipsCode = (j.fipsCode || '').toLowerCase()
    const name = (j.name || '').toLowerCase()

    return (
      state.includes(lowerQuery) ||
      county.includes(lowerQuery) ||
      code.includes(lowerQuery) ||
      fipsCode.includes(lowerQuery) ||
      name.includes(lowerQuery)
    )
  })
}

/**
 * Find jurisdiction by state + county combination
 */
export function findJurisdiction(
  state: string,
  county: string
): (typeof jurisdictionSeeds)[0] | null {
  const stateUpper = state.toUpperCase()
  const countyTitle = county
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')

  return (
    jurisdictionSeeds.find(
      (j) => j.state === stateUpper && j.county === countyTitle
    ) || null
  )
}

/**
 * Search service offerings by name, category, or description
 */
export function searchServiceOfferings(query: string): typeof serviceOfferingSeeds {
  const lowerQuery = query.toLowerCase()

  return serviceOfferingSeeds.filter((s) => {
    const name = (s.name || '').toLowerCase()
    const category = (s.category || '').toLowerCase()
    const description = (s.description || '').toLowerCase()
    const code = (s.code || '').toLowerCase()

    return (
      name.includes(lowerQuery) ||
      category.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      code.includes(lowerQuery)
    )
  })
}

/**
 * Find service offering by code
 */
export function findServiceOfferingByCode(
  code: string
): (typeof serviceOfferingSeeds)[0] | null {
  return serviceOfferingSeeds.find((s) => s.code === code) || null
}

/**
 * Get service offerings by category
 */
export function getServiceOfferingsByCategory(
  category: string
): typeof serviceOfferingSeeds {
  return serviceOfferingSeeds.filter(
    (s) => s.category?.toLowerCase() === category.toLowerCase()
  )
}

/**
 * Search rules by type, name, or description
 */
export function searchRules(query: string): typeof ruleSeeds {
  const lowerQuery = query.toLowerCase()

  return ruleSeeds.filter((r) => {
    const name = (r.name || '').toLowerCase()
    const ruleType = (r.ruleType || '').toLowerCase()
    const description = (r.description || '').toLowerCase()
    const code = (r.code || '').toLowerCase()

    return (
      name.includes(lowerQuery) ||
      ruleType.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      code.includes(lowerQuery)
    )
  })
}

/**
 * Get rules by type
 */
export function getRulesByType(ruleType: string): typeof ruleSeeds {
  return ruleSeeds.filter((r) => r.ruleType === ruleType)
}

/**
 * Find rule by code
 */
export function findRuleByCode(code: string): (typeof ruleSeeds)[0] | null {
  return ruleSeeds.find((r) => r.code === code) || null
}

/**
 * Get all active rules
 */
export function getActiveRules(): typeof ruleSeeds {
  return ruleSeeds.filter((r) => r.status === 'active')
}
