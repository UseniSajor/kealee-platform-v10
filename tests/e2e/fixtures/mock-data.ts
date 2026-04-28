/**
 * Mock data and API responses for E2E tests
 * Updated per MEGA PROMPT testing spec — Concept & Permits Intake + Deliverables
 */

// ── Legacy helpers (kept for existing specs) ──────────────────────────────────

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

// ── Test user profiles (from MEGA PROMPT §1.2) ─────────────────────────────

export const TEST_USERS = {
  userA: {
    name: 'Alex Johnson',
    email: 'alex.johnson@test.kealee.com',
    phone: '202-555-0101',
    projectPath: 'kitchen_remodel',
    budget: '$50,000',
    description: 'Modern kitchen with island, new appliances, granite counters',
    address: '1234 Capitol Hill St NW, Washington DC 20024',
    zipCode: '20024',
  },
  userB: {
    name: 'Beth Martinez',
    email: 'beth.martinez@test.kealee.com',
    phone: '301-555-0102',
    projectPath: 'bathroom_remodel',
    budget: '$30,000',
    description: 'Spa-style master bath with walk-in shower, double vanity, heated floors',
    address: '456 River Rd, Temple Hills MD 20745',
    zipCode: '20745',
  },
  userC: {
    name: 'Carlos Wei',
    email: 'carlos.wei@test.kealee.com',
    phone: '703-555-0103',
    projectPath: 'whole_home_remodel',
    budget: '$100,000',
    description: 'Full whole-house renovation: kitchen, bathrooms, flooring, paint, fixtures',
    address: '789 Arlington Blvd, Arlington VA 22202',
    zipCode: '22202',
  },
  userD: {
    name: 'Dana Park',
    email: 'dana.park@test.kealee.com',
    phone: '410-555-0104',
    projectPath: 'garden_concept',
    budget: '$15,000',
    description: 'Native plant garden with drip irrigation, stone patio, and evening lighting',
    address: '321 Inner Harbor Way, Baltimore MD 21201',
    zipCode: '21201',
  },
} as const

// ── Mock intake API responses ─────────────────────────────────────────────────

export const mockIntakeResponse = {
  intakeId: 'test-intake-uuid-001',
  status: 'paid',
  deliverableUrl: '/concept/deliverable?intakeId=test-intake-uuid-001',
}

export const mockConceptOutput = {
  designConcept: {
    style: 'Modern Contemporary',
    colorPalette: ['Crisp White', 'Charcoal Grey', 'Brushed Brass', 'Warm Oak'],
    keyFeatures: [
      'Waterfall quartz island with seating for 4',
      'Custom shaker cabinetry with soft-close hardware',
      'Under-cabinet LED strip lighting',
      'Professional-grade 48" range',
      'Built-in beverage center',
    ],
  },
  mepSystem: {
    electrical: 'New 20A dedicated circuits for island outlets, 15A circuits for LED recessed lighting (12 fixtures), range hood wiring',
    plumbing: 'Island sink connection with 3/4" supply lines, filtered water dispenser rough-in, dishwasher connection upgrade',
    hvac: 'Updated range hood ductwork (6" to 8" transition), recirculating ventilation option',
    lighting: '12x recessed LED (6000K/2700K switchable), 3x pendant island lights, 18ft under-cabinet strip, toe-kick lighting',
  },
  billOfMaterials: [
    { item: 'Custom shaker cabinetry', quantity: 1, unit: 'set', estimatedCost: 18000, description: 'Soft-close hinges, dovetail drawers, painted finish' },
    { item: 'Quartz countertops', quantity: 95, unit: 'sqft', estimatedCost: 9500, description: 'Calacatta white, waterfall island edge' },
    { item: 'Subway tile backsplash', quantity: 42, unit: 'sqft', estimatedCost: 1680, description: '3x6 white ceramic, subway pattern' },
    { item: 'Professional range (48")', quantity: 1, unit: 'unit', estimatedCost: 8500, description: '6-burner + griddle, dual oven' },
    { item: 'LED recessed lighting', quantity: 12, unit: 'fixtures', estimatedCost: 1440, description: '6" gimbal, 2700K/6000K switchable' },
    { item: 'Island pendant lights', quantity: 3, unit: 'fixtures', estimatedCost: 900, description: 'Brushed brass, 12" diameter' },
    { item: 'Labor — demolition', quantity: 40, unit: 'hours', estimatedCost: 3200, description: 'Removal and disposal of existing kitchen' },
    { item: 'Labor — installation', quantity: 120, unit: 'hours', estimatedCost: 9600, description: 'Cabinet, countertop, appliance installation' },
  ],
  estimatedCost: 52820,
  projectTimeline: '10–14 weeks',
  description: 'A modern chef\'s kitchen with a large island, premium appliances, and custom cabinetry that maximizes your $50,000 budget while delivering a professional-grade cooking environment.',
  includes: [
    '3 concept visuals (before/after renders)',
    'Bill of Materials (BOM) with line-item costs',
    'MEP specification (electrical, plumbing, HVAC, lighting)',
    'Detailed cost estimate',
    'Design brief with style direction',
    'Zoning & permit scope brief',
    'Path-to-approval summary',
    '30-min consultation call',
  ],
}

export const mockLeadResponse = {
  success: true,
  saved: false, // CI/test environments won't have real DB
}

// ── Legacy test data aliases ────────────────────────────────────────────────

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

// ── API interceptor helpers ────────────────────────────────────────────────

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
