export const STRIPE_CHECKOUT_SESSION_FIXTURES = [
  { name: 'revenue product', source: 'revenue_product', productKey: 'project-launch-package', projectPath: undefined },
  { name: 'dynamic design', source: 'public_intake_v30', projectPath: 'whole_home_concept' },
  { name: 'standalone estimate', source: 'public_intake', projectPath: 'cost_estimate' },
  { name: 'standalone permit', source: 'public_intake', projectPath: 'permit_path_only' },
  { name: 'estimate and permit bundle', source: 'public_intake', projectPath: 'estimate_permit_bundle' },
  { name: 'design estimate permit bundle', source: 'public_intake', projectPath: 'design_estimate_permit_bundle' },
] as const

export function checkoutSessionFixture(index: number) {
  const fixture = STRIPE_CHECKOUT_SESSION_FIXTURES[index]
  return {
    id: `cs_test_fixture_${index}`,
    object: 'checkout.session',
    amount_total: 55000,
    payment_status: 'paid',
    metadata: {
      source: fixture.source,
      intakeId: `intake-${index}`,
      productKey: 'productKey' in fixture ? fixture.productKey : undefined,
      projectPath: fixture.projectPath,
    },
  }
}
