/**
 * Mock data and API responses for E2E tests
 */

export const mockConceptResponse = {
  id: 'test-concept-123',
  summary: 'Your exterior needs updated roofing and siding. Expected cost: $15,000-$25,000',
  risks: [
    { type: 'structural', description: 'Foundation shows minor settling' },
    { type: 'weathering', description: 'Existing siding has 15+ year wear' },
    { type: 'code', description: 'Current windows may not meet energy codes' },
  ],
  recommendations: [
    'Replace roof shingles (30-year composition)',
    'New fiber cement siding',
    'Energy-efficient windows',
  ],
  nextStep: 'Get a detailed estimate',
}

export const mockProjectOutputResponse = {
  id: 'test-output-456',
  status: 'completed',
  summary: 'Modern exterior renovation with energy upgrades',
  risks: [
    'Structural assessment recommended before work',
    'May require local building permits',
    'Weather delays possible for spring projects',
  ],
  recommendations: [
    'Phase 1: Roof replacement (weeks 1-3)',
    'Phase 2: Siding installation (weeks 4-6)',
    'Phase 3: Window replacement (weeks 7-8)',
  ],
  nextStep: 'Schedule architect consultation',
  cta: 'Book Architect Meeting',
  conversionProduct: 'architect-consultation',
  estimatedBudget: '$18,500',
}

export const mockStripeCheckoutSession = {
  id: 'cs_test_123456789',
  object: 'checkout.session',
  url: 'https://checkout.stripe.com/pay/cs_test_123456789',
}

export const testUserData = {
  name: 'John Homeowner',
  email: 'john@example.com',
  phone: '555-123-4567',
  address: '123 Main St, Denver, CO 80202',
  projectDescription: 'Looking to update my exterior with new roofing and siding for better curb appeal',
}

export const testPermitData = {
  projectType: 'exterior',
  estimatedValue: '$20,000',
  description: 'New roof and siding installation',
}

export const testEstimationData = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  projectDescription: 'Complete kitchen remodel with new cabinets, countertops, and appliances',
}

/**
 * API response interceptor helper
 */
export async function mockApiResponse(
  page: any,
  urlPattern: string | RegExp,
  response: Record<string, any>,
  status = 200,
) {
  await page.route(urlPattern, (route: any) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * API error interceptor helper
 */
export async function mockApiError(
  page: any,
  urlPattern: string | RegExp,
  status = 500,
  message = 'Internal Server Error',
) {
  await page.route(urlPattern, (route: any) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    })
  })
}
