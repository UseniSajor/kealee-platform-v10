import { describe, expect, it } from 'vitest'
import { INTAKE_PRICE_CENTS, isBundleProductKey } from '@kealee/core-rules'
import { CANONICAL_PRODUCT_WORKFLOWS, resolveProductAutomationRoute } from '../product-automation'
import { SERVICE_DELIVERABLES } from '../service-deliverables'

/**
 * Coverage audit for the paid-order fulfillment map.
 *
 * A Stripe checkout that completes hands the order to exactly one producer:
 *
 *   automation — `CANONICAL_PRODUCT_WORKFLOWS` route, run by the bot fleet
 *   concept    — legacy `/api/concept/generate`, for `generatesConcept` services
 *   manual     — the human fulfillment queue
 *
 * The precedence is the one `handleCheckoutCompleted` applies, so this table is
 * the same decision the webhook makes. Site Plan orders were sellable with no
 * route here once, which meant a paid order matched neither branch and nothing
 * ran; this test exists so that cannot happen again unnoticed.
 */
type Producer = 'automation' | 'concept' | 'manual'

/**
 * Products delivered by a person by design. Both are scoped or matched before
 * any work can be produced, so there is nothing for a bot to run at checkout.
 */
const MANUAL_BY_DESIGN: Record<string, string> = {
  professional_drawings: 'Priced after scope review; drawings are produced by a licensed professional.',
  contractor_match: 'Matchmaking against the contractor network, not a generated artifact.',
}

function producerFor(projectPath: string): Producer {
  if (resolveProductAutomationRoute({ projectPath })) return 'automation'
  const deliverable = SERVICE_DELIVERABLES[projectPath]
  // The webhook only reaches the concept generator for non-bundle purchases.
  if (deliverable?.generatesConcept && !isBundleProductKey(projectPath)) return 'concept'
  return 'manual'
}

describe('Paid product fulfillment coverage', () => {
  it('hands every sellable product to a producer, and only the by-design ones to a human', () => {
    const manual = Object.keys(INTAKE_PRICE_CENTS).filter(path => producerFor(path) === 'manual')
    expect(manual.sort()).toEqual(Object.keys(MANUAL_BY_DESIGN).sort())
  })

  it('describes every sellable product to the customer on the paid order', () => {
    for (const projectPath of Object.keys(INTAKE_PRICE_CENTS)) {
      // The webhook copies label, includes, and delivery window onto form_data
      // from here; without an entry a paid order shows the customer nothing.
      expect(SERVICE_DELIVERABLES[projectPath], projectPath).toBeDefined()
    }
  })

  it('routes both upsell bundles through automation rather than the concept generator', () => {
    for (const bundleKey of ['estimate_permit_bundle', 'design_estimate_permit_bundle']) {
      expect(isBundleProductKey(bundleKey)).toBe(true)
      expect(producerFor(bundleKey)).toBe('automation')
    }
  })

  it('keeps every canonical workflow sellable, project-scoped, and bound to a template', () => {
    for (const [projectPath, route] of Object.entries(CANONICAL_PRODUCT_WORKFLOWS)) {
      // A route with no price is a product nobody can buy — dead configuration
      // that drifts out of sync with the fleet it names.
      expect(INTAKE_PRICE_CENTS[projectPath], projectPath).toBeDefined()
      // 'project' is the bot that assembles and publishes the deliverable, so
      // a route without it queues work no customer ever receives.
      expect(route.fulfillmentBotTypes, projectPath).toContain('project')
      expect(route.workflowTemplateId, projectPath).toMatch(/^wf_[a-z0-9_]+_v\d+$/)
    }
  })

  it('resolves project-path products only through the canonical map', () => {
    for (const [projectPath, route] of Object.entries(CANONICAL_PRODUCT_WORKFLOWS)) {
      expect(resolveProductAutomationRoute({ projectPath })).toEqual(route)
    }
    expect(resolveProductAutomationRoute({ projectPath: 'not_a_product' })).toBeUndefined()
    expect(resolveProductAutomationRoute({})).toBeUndefined()
  })
})
