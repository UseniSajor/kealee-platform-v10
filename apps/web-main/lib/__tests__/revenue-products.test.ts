import { describe, expect, it } from 'vitest'
import { getRevenueProduct, REVENUE_PRODUCT_CATALOG } from '../revenue-product-catalog'
import { DEPTH_REQUIREMENTS } from '../revenue-zoning'
import { mergeFulfillmentFormData, resolveProductAutomationRoute } from '../product-automation'
import { STRIPE_CHECKOUT_SESSION_FIXTURES, checkoutSessionFixture } from './fixtures/stripe-checkout-sessions'
import { fulfillmentPlan } from '@kealee/autonomous-runtime'
import { resolveV30OpenAIModel, V30_BOT_REGISTRY } from '@kealee/kealee-agent-stack'

describe('Revenue Product Catalog', () => {
  it('contains exactly the four approved products at approved prices', () => {
    expect(Object.keys(REVENUE_PRODUCT_CATALOG)).toHaveLength(4)
    expect(getRevenueProduct('home-project-readiness-review')?.priceCents).toBe(0)
    expect(getRevenueProduct('project-launch-package')?.priceCents).toBe(55_000)
    expect(getRevenueProduct('contractor-estimate-permit-package')?.priceCents).toBe(79_500)
    expect(getRevenueProduct('developer-feasibility-express')?.priceCents).toBe(109_500)
  })

  it('routes Products 3 and 4 to the correct agents and depth', () => {
    const contractor = getRevenueProduct('contractor-estimate-permit-package')!
    const developer = getRevenueProduct('developer-feasibility-express')!
    expect(contractor.responsibleAgent).toBe('contractor')
    expect(contractor.propertyIntelDepth).toBe('contractor')
    expect(developer.responsibleAgent).toBe('developer')
    expect(developer.propertyIntelDepth).toBe('development')
  })

  it('expands zoning deliverables by property intelligence depth', () => {
    expect(DEPTH_REQUIREMENTS.basic).not.toContain('entitlement path')
    expect(DEPTH_REQUIREMENTS.development).toContain('entitlement path')
    expect(DEPTH_REQUIREMENTS.contractor).toContain('inspection sequence')
  })

  it('keeps final professional outputs outside express scope', () => {
    for (const product of Object.values(REVENUE_PRODUCT_CATALOG)) {
      expect(product.exclusions.some((item) => /stamped|sealed|final permit/.test(item))).toBe(true)
    }
  })

  it('routes every revenue product to its exact purchased bot set', () => {
    for (const product of Object.values(REVENUE_PRODUCT_CATALOG)) {
      expect(resolveProductAutomationRoute({ source: 'revenue_product', productKey: product.productKey })).toEqual({
        fulfillmentBotTypes: product.botTypes,
        workflowTemplateId: product.workflowTemplateId,
        propertyIntelligenceDepth: product.propertyIntelDepth,
      })
    }
  })

  it('uses the configured Claude models for customer design, estimate, zoning, and permit execution', () => {
    expect(resolveV30OpenAIModel()).toBe(process.env.KEALEE_OPENAI_PRIMARY_MODEL ?? 'gpt-5.6-sol')
    expect(V30_BOT_REGISTRY.design.defaultModel).toBe('claude-opus-4-6')
    for (const botType of ['estimate', 'zoning', 'permit'] as const) {
      expect(V30_BOT_REGISTRY[botType].defaultModel).toBe('claude-sonnet-4-6')
    }
  })

  it('projects every purchased bot set into a dependency-safe autonomous capability plan', () => {
    for (const product of Object.values(REVENUE_PRODUCT_CATALOG)) {
      const plan = fulfillmentPlan(product.botTypes)
      expect(plan.steps[0].capability).toBe('intake.validate')
      expect(plan.steps.at(-3)?.capability).toBe('deliverable.assemble')
      expect(plan.steps.at(-2)?.capability).toBe('deliverable.publish')
      expect(plan.steps.at(-1)?.capability).toBe('customer.notify')
      expect(plan.steps.filter(step => step.key.startsWith('work_'))).toHaveLength(product.botTypes.length)
    }
  })

  it('requires qualified human review before a certified estimate can assemble', () => {
    const plan = fulfillmentPlan(['estimate', 'project'], { requireProfessionalReview: true })
    const review = plan.steps.find(step => step.capability === 'professional.review')
    expect(review).toEqual(expect.objectContaining({ requiresApproval: true, professionalService: true }))
    expect(plan.steps.find(step => step.capability === 'deliverable.assemble')?.dependsOn).toEqual(['professional_review'])
  })

  it('routes standalone and bundled estimate/permit purchases without extra bots', () => {
    expect(resolveProductAutomationRoute({ projectPath: 'cost_estimate' })?.fulfillmentBotTypes).toEqual(['estimate', 'project'])
    expect(resolveProductAutomationRoute({ projectPath: 'permit_path_only' })?.fulfillmentBotTypes).toEqual(['zoning', 'permit', 'project'])
    expect(resolveProductAutomationRoute({ projectPath: 'estimate_permit_bundle' })?.fulfillmentBotTypes).toEqual(['estimate', 'zoning', 'permit', 'project'])
    expect(resolveProductAutomationRoute({ projectPath: 'design_estimate_permit_bundle' })?.fulfillmentBotTypes).toEqual(['design', 'estimate', 'zoning', 'permit', 'project'])
  })

  it('routes every site-intelligence purchase into autonomous fulfillment', () => {
    for (const projectPath of ['preliminary_site_plan', 'verified_site_feasibility', 'permit_site_plan']) {
      expect(resolveProductAutomationRoute({ projectPath })).toEqual({
        fulfillmentBotTypes: ['zoning', 'permit', 'floorplan', 'project'],
        workflowTemplateId: 'wf_permit_roadmap_v1',
        propertyIntelligenceDepth: 'project',
      })
    }
  })

  it('routes legacy design service checkouts into durable generation', () => {
    expect(resolveProductAutomationRoute({ projectPath: 'whole_home_concept' })).toEqual({
      fulfillmentBotTypes: ['design', 'estimate', 'zoning', 'permit', 'floorplan', 'project'],
      workflowTemplateId: 'wf_design_estimate_permit_bundle_v1',
      propertyIntelligenceDepth: 'project',
    })
  })

  it('provides a signed-webhook contract fixture for every supported checkout source', () => {
    expect(STRIPE_CHECKOUT_SESSION_FIXTURES.map(item => item.name)).toEqual([
      'revenue product', 'dynamic design', 'standalone estimate', 'standalone permit',
      'estimate and permit bundle', 'design estimate permit bundle',
    ])
    expect(STRIPE_CHECKOUT_SESSION_FIXTURES.map((_, index) => checkoutSessionFixture(index).payment_status)).toEqual(Array(6).fill('paid'))
  })

  it('preserves design answers and every uploaded file when fulfillment metadata is merged', () => {
    const existing = {
      description: 'Open the kitchen while keeping the brick wall',
      stylePreferences: 'warm modern',
      uploadedFiles: ['photo-1.jpg', 'sketch.pdf', 'survey.pdf'],
      priorities: ['Budget', 'Accessibility'],
    }
    expect(mergeFulfillmentFormData(existing, { fulfillmentStatus: 'queued' })).toEqual({
      ...existing,
      fulfillmentStatus: 'queued',
    })
  })
})
