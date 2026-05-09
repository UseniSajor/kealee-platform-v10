# COMPREHENSIVE TESTING PROMPT: Concept & Permits Intake + Deliverable Validation

**Purpose:** Complete end-to-end testing suite for Kealee Platform concept intake, zoning intake, permit intake, and concept deliverable pages.

**Scope:** Test not just form submission but actual deliverable quality, content accuracy, data integrity, and user experience.

**Timeline:** 2-3 days of QA testing per environment (dev → staging → production)

---

## 🎯 COMPLETE TESTING PROMPT FOR CLAUDE CODE

```
MEGA PROMPT: Complete Testing Suite - Concept & Permits Intake + Deliverables
             Test intake forms, API responses, deliverable rendering, data accuracy

PROJECT: Kealee Platform v20 - QA & Testing
SCOPE: End-to-end functional testing, UI testing, API testing, data validation
GOAL: Verify concept intake, permit analysis, and deliverable pages work perfectly

═══════════════════════════════════════════════════════════════════════════════

PART 1: TEST ENVIRONMENT SETUP

1.1 Testing Stack

Tools Needed:
  - Playwright (E2E testing)
  - Jest (unit testing)
  - React Testing Library (component testing)
  - Postman (API testing)
  - Lighthouse (performance testing)
  - axe-core (accessibility testing)

Install Commands:
  npm install --save-dev @playwright/test jest @testing-library/react axe-core

Configuration:
  ✓ playwright.config.ts (headed/headless mode, timeouts, retries)
  ✓ jest.config.js (test environment, coverage thresholds)
  ✓ .env.test (test API keys, test database)

1.2 Test Data Setup

Create test user profiles:
  - User A: Budget $50K, kitchen remodel, DC 20024
  - User B: Budget $30K, bathroom remodel, MD 20745
  - User C: Budget $100K, whole house, VA 22202
  - User D: Budget $15K, garden design, MD 21201

Create test API responses (mock):
  - DesignBot response (concept with MEP, BOM, cost)
  - ZoningBot response (jurisdiction, permits, setbacks)
  - EstimateBot response (detailed cost breakdown)
  - PermitBot response (permit list, timeline)

Test Database:
  - Use test database (separate from production)
  - Seed with test projects
  - Reset between test runs

1.3 Test Environments

Dev Environment:
  - Local machine
  - localhost:3000
  - Test API backend (Railway dev)
  - Test database (Supabase test project)

Staging Environment:
  - Vercel preview deployment
  - staging-api.kealee.com
  - Staging database
  - Test Stripe keys

Production Environment:
  - kealee.com
  - Production API
  - Production database
  - Real Stripe keys (test mode)

═══════════════════════════════════════════════════════════════════════════════

PART 2: CONCEPT INTAKE FORM TESTING

2.1 Unit Tests (Form Components)

Test: TextField Component
  ✓ Renders with label, placeholder, error message
  ✓ Updates value on input change
  ✓ Shows error message when invalid
  ✓ Disables when disabled prop true
  ✓ Focuses correctly (accessibility)
  ✓ Clears value with clear button
  ✓ Accepts different input types (text, email, number, password)

Test: Select Component
  ✓ Opens dropdown on click
  ✓ Lists all options
  ✓ Selects option on click
  ✓ Shows selected value
  ✓ Filters options on search (if searchable)
  ✓ Closes dropdown on selection
  ✓ Closes dropdown on ESC key
  ✓ Keyboard navigation (arrow keys)

Test: RadioButton Component
  ✓ Renders with label and icon
  ✓ Selects on click
  ✓ Deselects when selecting another
  ✓ Keyboard navigation (arrow keys)
  ✓ Displays as selected with visual indicator

Test: Form Validation
  ✓ Validates required fields
  ✓ Validates email format
  ✓ Validates number ranges (budget min: $1,000)
  ✓ Validates string length (scope min: 10 characters)
  ✓ Validates ZIP code format (5 digits)
  ✓ Shows error messages on blur
  ✓ Clears errors on input change
  ✓ Prevents submission if invalid

Example Test Code:

describe('ConceptIntakeForm', () => {
  test('renders all form fields', () => {
    const { getByText, getByPlaceholderText } = render(<ConceptIntakeForm />);
    
    expect(getByText('What would you like to transform?')).toBeInTheDocument();
    expect(getByPlaceholderText('Tell us about your space')).toBeInTheDocument();
    expect(getByText('What\'s your budget?')).toBeInTheDocument();
    expect(getByText('Where is your project?')).toBeInTheDocument();
  });

  test('validates required scope field', async () => {
    const { getByText, getByPlaceholderText } = render(<ConceptIntakeForm />);
    
    const scopeField = getByPlaceholderText('Tell us about your space');
    fireEvent.blur(scopeField);
    
    expect(await getByText('Please describe your project (at least 10 characters)')).toBeInTheDocument();
  });

  test('validates budget is number and min 1000', async () => {
    const { getByLabelText, getByText } = render(<ConceptIntakeForm />);
    
    const budgetField = getByLabelText('What\'s your budget?');
    fireEvent.change(budgetField, { target: { value: '500' } });
    fireEvent.blur(budgetField);
    
    expect(await getByText('Budget must be at least $1,000')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    const { getByLabelText, getByText } = render(<ConceptIntakeForm />);
    
    const emailField = getByLabelText('Your email');
    fireEvent.change(emailField, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailField);
    
    expect(await getByText('Please enter a valid email')).toBeInTheDocument();
  });

  test('enables submit button when all fields valid', async () => {
    const { getByRole, getByLabelText } = render(<ConceptIntakeForm />);
    
    fireEvent.change(getByLabelText('Your name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByLabelText('Tell us about your space'), { 
      target: { value: 'I want a modern kitchen with island and new appliances' } 
    });
    fireEvent.change(getByLabelText('What\'s your budget?'), { target: { value: '75000' } });
    fireEvent.change(getByLabelText('Where is your project?'), { target: { value: '20024' } });
    fireEvent.change(getByLabelText('Your email'), { target: { value: 'john@example.com' } });
    
    const submitButton = getByRole('button', { name: /submit/i });
    expect(submitButton).not.toBeDisabled();
  });
});

2.2 Integration Tests (Form Submission)

Test: Multi-Step Form Flow

Scenario 1: Kitchen Remodel Submission
  ✓ User selects "Kitchen" service type
  ✓ Proceeds to Step 2
  ✓ Enters scope: "Modern kitchen with island, new appliances, granite counters"
  ✓ Enters budget: "75000"
  ✓ Selects location: "20024" (DC)
  ✓ Enters email: "user@example.com"
  ✓ Proceeds to Step 3 (Review)
  ✓ Reviews all entered data
  ✓ Clicks Submit
  ✓ Shows loading state for 2-5 seconds
  ✓ API call succeeds: POST /api/concept/intake
  ✓ Response contains: conceptId, status: "processing", estimatedReviewTime
  ✓ Redirects to concept deliverable page: /concept/[conceptId]
  ✓ Database entry created in concepts table

Scenario 2: Garden Design Submission
  ✓ User selects "Garden" service type
  ✓ Enters scope: "Native plants, irrigation, patio, evening lighting"
  ✓ Enters budget: "15000"
  ✓ Selects location: "20745" (MD - PG County)
  ✓ Enters email: "garden@example.com"
  ✓ Submits form
  ✓ API call succeeds with correct location (PG County jurisdiction)
  ✓ Concept created in database

Scenario 3: Form Validation Error Recovery
  ✓ User fills form with invalid data
  ✓ Clicks submit without email
  ✓ Gets error: "Your email is required"
  ✓ Fills in email correctly
  ✓ Error clears
  ✓ Submits successfully
  ✓ Concept created

Scenario 4: API Error Handling
  ✓ Form submits but API returns 500 error
  ✓ Loading state shows for 5 seconds
  ✓ Error modal appears: "Service error, please try again"
  ✓ Retry button available
  ✓ User clicks retry
  ✓ API call succeeds on second attempt
  ✓ Redirects to deliverable

Example E2E Test:

describe('Concept Intake Form - End to End', () => {
  test('complete kitchen remodel intake flow', async ({ page }) => {
    // Navigate to form
    await page.goto('http://localhost:3000/concept');
    
    // Step 1: Select kitchen service
    await page.click('label:has-text("Kitchen Remodel")');
    await page.click('button:has-text("Continue")');
    
    // Step 2: Fill project details
    await page.fill('[name="scope"]', 'Modern kitchen with island, new appliances, granite counters');
    await page.fill('[name="budget"]', '75000');
    await page.selectOption('[name="location"]', '20024');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="name"]', 'John Doe');
    
    // Step 3: Review and submit
    await page.click('button:has-text("Continue")');
    
    // Verify review page
    expect(await page.textContent('Kitchen Remodel')).toBeTruthy();
    expect(await page.textContent('Modern kitchen with island')).toBeTruthy();
    
    // Submit form
    await page.click('button:has-text("Submit")');
    
    // Wait for loading to complete (2-5 seconds)
    await page.waitForNavigation();
    
    // Verify redirected to deliverable
    const url = page.url();
    expect(url).toMatch(/\/concept\/[a-f0-9\-]+/);
    
    // Verify page loaded
    expect(await page.textContent('Kitchen Remodel')).toBeTruthy();
    expect(await page.textContent('Estimated Cost')).toBeTruthy();
  });
});

2.3 API Testing (Concept Intake Endpoint)

Test: POST /api/concept/intake

Request Body (Valid):
{
  projectType: "kitchen",
  scope: "Modern kitchen with island and new appliances",
  budget: 75000,
  location: "20024",
  homeownerEmail: "user@example.com",
  homeownerName: "John Doe"
}

Expected Response (200):
{
  conceptId: "uuid",
  status: "processing",
  estimatedReviewTime: 180,
  concept: {
    projectType: "kitchen",
    scope: "Modern kitchen with island and new appliances",
    budget: 75000,
    mepSystems: {
      electrical: "New circuits for island outlets, LED recessed lighting",
      plumbing: "Island sink connection, new water lines",
      hvac: "Updated ventilation hood, enhanced ductwork",
      lighting: "Recessed LED lights (12x), under-cabinet strips, island pendants"
    },
    billOfMaterials: [
      {
        item: "Custom kitchen cabinetry",
        quantity: 1,
        unit: "set",
        estimatedCost: 15000,
        description: "Soft-close hinges, modern handles"
      },
      {
        item: "Granite counters",
        quantity: 85,
        unit: "sqft",
        estimatedCost: 8500,
        description: "Premium edge finishing, backsplash included"
      },
      // ... more items
    ],
    estimatedCost: 70400,
    projectTimeline: "12-14 weeks",
    description: "...",
    designConcept: {
      style: "Modern",
      colorPalette: ["#FFFFFF", "#2F4F4F", "#FFD700"],
      keyFeatures: ["Island seating", "New appliances", "LED lighting"]
    }
  }
}

Test Cases:

Test 1: Valid Submission
  ✓ POST with valid data
  ✓ Returns 200 status
  ✓ Response has conceptId (UUID format)
  ✓ Response has status: "processing"
  ✓ Response has concept object with MEP systems
  ✓ Response has billOfMaterials array (min 5 items)
  ✓ BOM items have: item, quantity, unit, estimatedCost, description
  ✓ Total cost calculated correctly
  ✓ Estimated timeline populated
  ✓ Database entry created

Test 2: Missing Required Fields
  ✓ Missing projectType → 400 error: "projectType is required"
  ✓ Missing scope → 400 error: "scope is required"
  ✓ Missing budget → 400 error: "budget is required"
  ✓ Missing location → 400 error: "location is required"
  ✓ Missing email → 400 error: "email is required"

Test 3: Invalid Field Values
  ✓ Invalid projectType → 400 error: "invalid service type"
  ✓ Scope < 10 chars → 400 error: "scope must be at least 10 characters"
  ✓ Budget < 1000 → 400 error: "budget must be at least $1,000"
  ✓ Invalid ZIP code → 400 error: "invalid ZIP code format"
  ✓ Invalid email → 400 error: "invalid email format"

Test 4: Regional Variations
  ✓ DC 20024 → Returns DC DCRA zoning rules
  ✓ MD 20745 → Returns PG County jurisdiction
  ✓ VA 22202 → Returns Arlington County rules
  ✓ Each gets correct regional MEP specifications

Test 5: Performance
  ✓ API response time < 5 seconds
  ✓ DesignBot processes within 5 second timeout
  ✓ Database insert succeeds
  ✓ Concept ready for display

Example API Test (Postman/Jest):

describe('POST /api/concept/intake', () => {
  test('submits valid kitchen remodel concept', async () => {
    const response = await fetch('http://localhost:3000/api/concept/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'kitchen',
        scope: 'Modern kitchen with island and new appliances',
        budget: 75000,
        location: '20024',
        homeownerEmail: 'user@example.com',
        homeownerName: 'John Doe'
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('conceptId');
    expect(data.status).toBe('processing');
    expect(data.concept).toHaveProperty('mepSystems');
    expect(data.concept).toHaveProperty('billOfMaterials');
    expect(Array.isArray(data.concept.billOfMaterials)).toBe(true);
    expect(data.concept.billOfMaterials.length).toBeGreaterThan(5);
  });

  test('validates required fields', async () => {
    const response = await fetch('http://localhost:3000/api/concept/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'kitchen',
        // Missing other required fields
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  test('validates budget minimum', async () => {
    const response = await fetch('http://localhost:3000/api/concept/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'kitchen',
        scope: 'Modern kitchen',
        budget: 500, // Too low
        location: '20024',
        homeownerEmail: 'user@example.com'
      })
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('budget');
  });
});

═══════════════════════════════════════════════════════════════════════════════

PART 3: CONCEPT DELIVERABLE PAGE TESTING

3.1 Deliverable Content Validation

Test: Concept Deliverable Page (/concept/[id])

Content to Verify:
  ✓ Project type matches what user submitted (Kitchen, Bathroom, Garden, etc.)
  ✓ Service type icon displays correctly
  ✓ Cost summary shown with breakdown
    - Total estimated cost displayed (e.g., "$70,400")
    - Shows estimated range logic
    - Cost includes labor, materials, permits, contingency
  ✓ Timeline shown (e.g., "12-14 weeks")
    - Matches service type standard timeline
    - Shows breakdown by phase
  ✓ Permits required listed (correct number and types)
    - Kitchen: 4 permits (Building, Electrical, Plumbing, HVAC)
    - Bathroom: 3 permits (Building, Plumbing, Electrical)
    - Garden: 0-1 permits depending on location
  ✓ MEP Systems described in simple language
    - Electrical: "New circuits for island outlets, LED recessed lighting"
    - Plumbing: "Island sink connection, new water lines"
    - HVAC: "Updated ventilation hood, enhanced ductwork"
    - Lighting: "Recessed LED lights, under-cabinet strips"
  ✓ Bill of Materials table
    - Minimum 8-10 line items for kitchen/bathroom
    - Each item: name, quantity, unit, cost, description
    - Total cost calculated and matches header cost
    - Items are relevant to service type

Example Content Verification Code:

describe('Concept Deliverable Page - Content Validation', () => {
  beforeEach(async () => {
    // Create a test concept
    const response = await fetch('http://localhost:3000/api/concept/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: 'kitchen',
        scope: 'Modern kitchen with island',
        budget: 75000,
        location: '20024',
        homeownerEmail: 'test@example.com'
      })
    });
    
    const data = await response.json();
    conceptId = data.conceptId;
  });

  test('displays correct concept data for kitchen', async ({ page }) => {
    await page.goto(`http://localhost:3000/concept/${conceptId}`);
    
    // Verify cost
    const costText = await page.textContent('.cost-total');
    expect(costText).toContain('$70,400'); // Exact amount for kitchen
    
    // Verify timeline
    const timelineText = await page.textContent('.timeline-total');
    expect(timelineText).toContain('12-14 weeks');
    
    // Verify permits
    const permitsText = await page.textContent('.permits-count');
    expect(permitsText).toContain('4');
    
    const permitTypes = await page.locator('.permit-type').allTextContents();
    expect(permitTypes).toContain('Building');
    expect(permitTypes).toContain('Electrical');
    expect(permitTypes).toContain('Plumbing');
    expect(permitTypes).toContain('HVAC');
  });

  test('displays MEP systems with simple language', async ({ page }) => {
    await page.goto(`http://localhost:3000/concept/${conceptId}`);
    
    // Click electrical tab
    await page.click('button:has-text("Electrical")');
    const electricalText = await page.textContent('.mep-content');
    expect(electricalText).toContain('New circuits');
    expect(electricalText).toContain('LED lighting');
    expect(electricalText).not.toContain('API');
    expect(electricalText).not.toContain('algorithm');
  });

  test('displays BOM with correct items and costs', async ({ page }) => {
    await page.goto(`http://localhost:3000/concept/${conceptId}`);
    
    // Get all BOM rows
    const rows = await page.locator('.bom-row').count();
    expect(rows).toBeGreaterThanOrEqual(8); // At least 8 items
    
    // Verify total cost matches header
    const bomTotal = await page.textContent('.bom-total-cost');
    const headerTotal = await page.textContent('.cost-total');
    expect(bomTotal).toBe(headerTotal);
  });
});

3.2 UI/UX Rendering Tests

Test: Video Player

Expected Behavior:
  ✓ Video loads with poster image (thumbnail)
  ✓ Play button visible
  ✓ Video auto-plays when scrolling into view (muted)
  ✓ Controls visible: play/pause, timeline, volume, fullscreen, quality
  ✓ Quality selector shows 1080p and 720p options
  ✓ Video duration shows correctly (60-90 seconds)
  ✓ Fullscreen button works on desktop and mobile
  ✓ Keyboard shortcuts work: space (play/pause), f (fullscreen)
  ✓ Mobile: Video plays in portrait and landscape
  ✓ Performance: Video loads in <3 seconds

Test Code:

test('video player renders and plays correctly', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Verify video element exists
  const videoPlayer = await page.locator('video');
  expect(videoPlayer).toBeDefined();
  
  // Verify controls visible
  expect(await page.locator('[aria-label="Play"]')).toBeVisible();
  expect(await page.locator('[aria-label="Quality selector"]')).toBeVisible();
  expect(await page.locator('[aria-label="Fullscreen"]')).toBeVisible();
  
  // Click play
  await page.click('[aria-label="Play"]');
  
  // Verify video is playing
  const isPlaying = await page.evaluate(() => {
    const video = document.querySelector('video');
    return !video.paused;
  });
  expect(isPlaying).toBe(true);
});

Test: Image Gallery

Expected Behavior:
  ✓ Gallery displays grid (3 columns on desktop, 2 on tablet, 1 on mobile)
  ✓ All images load (lazy-loaded for performance)
  ✓ Images have captions (descriptive: "Granite Countertops", etc.)
  ✓ Click image opens lightbox
  ✓ Lightbox shows full-resolution image
  ✓ Lightbox has: prev/next buttons, close button, image counter
  ✓ Keyboard navigation: arrow keys (prev/next), ESC (close)
  ✓ Touch swipe on mobile: swipe left (next), swipe right (prev)
  ✓ All images load correctly without broken images
  ✓ Images display at correct aspect ratio

Test Code:

test('image gallery renders and navigates correctly', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Count gallery images
  const images = await page.locator('.gallery-image').count();
  expect(images).toBeGreaterThanOrEqual(6);
  
  // Click first image to open lightbox
  await page.click('.gallery-image:first-child');
  
  // Verify lightbox visible
  expect(await page.locator('.lightbox-modal')).toBeVisible();
  
  // Verify image counter shows 1/N
  const counter = await page.textContent('.image-counter');
  expect(counter).toMatch(/1\/\d+/);
  
  // Click next button
  await page.click('[aria-label="Next image"]');
  
  // Verify counter updated to 2/N
  const newCounter = await page.textContent('.image-counter');
  expect(newCounter).toMatch(/2\/\d+/);
  
  // Press ESC to close
  await page.press('[data-testid="lightbox"]', 'Escape');
  expect(await page.locator('.lightbox-modal')).toBeHidden();
});

Test: Before/After Slider

Expected Behavior:
  ✓ Slider displays both before and after images
  ✓ Slider divider is draggable
  ✓ Before image shows on left, after on right initially
  ✓ Dragging slider reveals more before/after
  ✓ Mobile: Swipe to slide (left/right)
  ✓ Keyboard: Arrow keys to adjust slider
  ✓ Touch: Tap and drag on mobile
  ✓ Smooth animation as slider moves
  ✓ Labels show "Before" and "After"

Test Code:

test('before/after slider works correctly', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Get slider container bounds
  const slider = page.locator('.before-after-slider');
  const sliderBox = await slider.boundingBox();
  
  // Drag slider to 75% position
  await page.dragAndDrop(
    '.slider-handle',
    { x: sliderBox.x + sliderBox.width * 0.75, y: sliderBox.y + sliderBox.height / 2 }
  );
  
  // Verify slider position changed (via computed style or data attribute)
  const handlePosition = await page.locator('.slider-handle').getAttribute('data-position');
  expect(parseInt(handlePosition)).toBeGreaterThan(50);
});

Test: Quick Facts Cards

Expected Behavior:
  ✓ 3 cards display: Cost, Timeline, Permits
  ✓ Each card shows:
    - Icon relevant to metric
    - Primary metric (e.g., "$70,400")
    - Description (e.g., "Estimated based on your project")
    - Sub-details (e.g., breakdown by category)
  ✓ Cards have white background with subtle shadow
  ✓ Cards are responsive: 3 columns desktop, 2 tablet, 1 mobile
  ✓ No overflow/wrapping text

Test Code:

test('quick facts cards display correctly', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Verify 3 cards present
  const cards = await page.locator('.quick-fact-card').count();
  expect(cards).toBe(3);
  
  // Verify card contents
  expect(await page.textContent('.quick-fact-card:nth-child(1)')).toContain('$');
  expect(await page.textContent('.quick-fact-card:nth-child(2)')).toContain('weeks');
  expect(await page.textContent('.quick-fact-card:nth-child(3)')).toContain('permits');
});

3.3 Interactive Elements Testing

Test: Tabs (MEP Systems)

Expected Behavior:
  ✓ 4 tabs visible: Electrical, Plumbing, HVAC, Lighting
  ✓ First tab (Electrical) active by default
  ✓ Clicking tab switches content
  ✓ Only one tab content visible at a time
  ✓ Tab appearance changes when active (color, underline, etc.)
  ✓ Keyboard navigation: arrow keys to switch tabs
  ✓ Tab focus visible on keyboard nav
  ✓ Content updates smoothly with animation

Test Code:

test('MEP systems tabs work correctly', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Verify electrical tab is active by default
  const electricalTab = page.locator('button:has-text("Electrical")');
  expect(await electricalTab.getAttribute('aria-selected')).toBe('true');
  
  // Click plumbing tab
  await page.click('button:has-text("Plumbing")');
  
  // Verify plumbing tab now active
  const plumbingTab = page.locator('button:has-text("Plumbing")');
  expect(await plumbingTab.getAttribute('aria-selected')).toBe('true');
  
  // Verify electrical no longer active
  expect(await electricalTab.getAttribute('aria-selected')).toBe('false');
  
  // Verify content changed
  const content = await page.textContent('.tab-content');
  expect(content).toContain('water');
  expect(content).not.toContain('wiring');
});

Test: Collapsible BOM

Expected Behavior:
  ✓ BOM sections collapsed by default (Cabinetry, Countertops, etc.)
  ✓ Click section header to expand
  ✓ Shows line items when expanded
  ✓ Click again to collapse
  ✓ Total cost shown at bottom (always visible)
  ✓ Smooth expand/collapse animation
  ✓ Keyboard: Enter key to toggle expand/collapse

Test Code:

test('BOM collapsible sections work', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Verify cabinetry section is collapsed
  const cabinetryItems = page.locator('.bom-section-cabinetry .item-row');
  expect(await cabinetryItems.count()).toBe(0);
  
  // Click to expand
  await page.click('[aria-label="Expand Cabinetry section"]');
  
  // Verify items now visible
  expect(await cabinetryItems.count()).toBeGreaterThan(0);
  
  // Click to collapse
  await page.click('[aria-label="Expand Cabinetry section"]');
  
  // Verify collapsed again
  expect(await cabinetryItems.count()).toBe(0);
});

3.4 Download & Share Features

Test: PDF Download

Expected Behavior:
  ✓ "Download PDF" button visible
  ✓ Clicking button triggers download
  ✓ PDF contains:
    - Concept title
    - Cost summary
    - Timeline
    - Permits list
    - MEP systems summary
    - BOM
    - Images (optional)
  ✓ PDF is readable and properly formatted
  ✓ PDF is under 10 MB
  ✓ PDF can be printed
  ✓ File naming: concept-[serviceType]-[date].pdf

Test Code:

test('PDF download works correctly', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download');
  
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  await page.click('button:has-text("Download PDF")');
  
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/concept-kitchen-\d+\.pdf/);
});

Test: Email Share

Expected Behavior:
  ✓ "Share" button opens menu/modal
  ✓ Email option available
  ✓ Clicking email option opens email client or email form
  ✓ Email contains link to concept
  ✓ Link is shareable and works for others
  ✓ Email subject: "Check out my project concept"
  ✓ Email body includes: concept description, link, user name

Test Code:

test('email share works', async ({ page }) => {
  await page.goto(`http://localhost:3000/concept/${conceptId}`);
  
  // Open share menu
  await page.click('button:has-text("Share")');
  
  // Click email option
  await page.click('a[href*="mailto"]');
  
  // Verify href contains concept ID
  const link = await page.locator('a[href*="mailto"]').getAttribute('href');
  expect(link).toContain(`/concept/${conceptId}`);
});

═══════════════════════════════════════════════════════════════════════════════

PART 4: ZONING & PERMITS INTAKE TESTING

4.1 Zoning Analysis Testing

Test: POST /api/zoning/intake

Request Body:
{
  conceptId: "uuid",
  location: "20024",
  projectType: "kitchen",
  scope: "Modern kitchen with island"
}

Expected Response:
{
  zoningId: "uuid",
  jurisdiction: "District of Columbia",
  zoningCode: "R-4",
  addressZone: "Urban residential (Setbacks: 0 ft all sides)",
  setbacks: {
    front: 0,
    side: 0,
    rear: 0,
    notes: "No setbacks required in urban core"
  },
  far: 2.8,
  permitTypes: ["Building", "Electrical", "Plumbing", "HVAC"],
  permitCosts: {
    building: 500,
    electrical: 200,
    plumbing: 150,
    hvac: 150,
    total: 1000
  },
  permitTimelines: {
    review: "14-21 days",
    approval: "7-14 days",
    inspection: "Per permit type"
  },
  requirements: [
    "Building permits required",
    "Electrical inspection required",
    "Plumbing inspection required",
    "HVAC review required"
  ]
}

Test Cases:

Test 1: DC 20024 Zoning
  ✓ Returns DCRA jurisdiction
  ✓ Returns R-4 zone or applicable zone
  ✓ Setbacks: 0 all directions (urban)
  ✓ FAR: 2.8 or correct for zone
  ✓ Permits required: 4
  ✓ Total permit cost: $1,000
  ✓ Timeline: 14-21 days review

Test 2: MD 20745 (PG County) Zoning
  ✓ Returns PG County jurisdiction
  ✓ Different zoning rules from DC
  ✓ Setback requirements populated
  ✓ FAR different (typically lower than DC)
  ✓ Correct permits for county
  ✓ County-specific timelines

Test 3: VA 22202 (Arlington) Zoning
  ✓ Returns Arlington County jurisdiction
  ✓ Virginia-specific zoning codes
  ✓ Setback requirements for VA
  ✓ Permits specific to Arlington
  ✓ Different costs than DC/MD

Test 4: Garden/Landscape Zoning
  ✓ May not require all permits
  ✓ Lower permit costs
  ✓ Faster timeline
  ✓ Zoning rules still apply if encroaching on setbacks

Example API Test:

describe('POST /api/zoning/intake', () => {
  test('returns correct DC zoning for 20024', async () => {
    const response = await fetch('http://localhost:3000/api/zoning/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conceptId: 'test-concept-id',
        location: '20024',
        projectType: 'kitchen',
        scope: 'Modern kitchen'
      })
    });

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.jurisdiction).toBe('District of Columbia');
    expect(data.permitTypes).toContain('Building');
    expect(data.permitTypes).toContain('Electrical');
    expect(data.permitTimelines.review).toMatch(/\d+-\d+ days/);
  });

  test('returns different zoning for different jurisdictions', async () => {
    const dc = await (await fetch('http://localhost:3000/api/zoning/intake', {
      method: 'POST',
      body: JSON.stringify({
        conceptId: 'test-1',
        location: '20024',
        projectType: 'kitchen',
        scope: 'Kitchen'
      })
    })).json();
    
    const md = await (await fetch('http://localhost:3000/api/zoning/intake', {
      method: 'POST',
      body: JSON.stringify({
        conceptId: 'test-2',
        location: '20745',
        projectType: 'kitchen',
        scope: 'Kitchen'
      })
    })).json();
    
    // DC and MD should have different jurisdictions
    expect(dc.jurisdiction).not.toBe(md.jurisdiction);
  });
});

4.2 Zoning Results Page Testing

Test: Zoning Results Display (/concept/[id]/zoning)

Expected Content:
  ✓ Jurisdiction name displayed (District of Columbia, PG County, etc.)
  ✓ Zoning code shown (R-4, etc.)
  ✓ Setback requirements displayed
    - Front setback: X ft
    - Side setback: X ft
    - Rear setback: X ft
    - Notes explaining rules
  ✓ FAR (Floor Area Ratio) shown
  ✓ Permit list with costs
    - Building: $500
    - Electrical: $200
    - Plumbing: $150
    - HVAC: $150
    - Total: $1,000
  ✓ Permit timeline shown
  ✓ Requirements checklist

Test Code:

describe('Zoning Results Page', () => {
  test('displays zoning information correctly', async ({ page }) => {
    await page.goto(`http://localhost:3000/concept/${conceptId}/zoning`);
    
    // Verify jurisdiction
    expect(await page.textContent('.jurisdiction-name')).toContain('District of Columbia');
    
    // Verify permits
    const permitList = await page.locator('.permit-item');
    expect(await permitList.count()).toBeGreaterThanOrEqual(3);
    
    // Verify costs
    expect(await page.textContent('.permit-total')).toContain('$1,000');
    
    // Verify timeline
    expect(await page.textContent('.permit-timeline')).toMatch(/\d+-\d+ days/);
  });
});

═══════════════════════════════════════════════════════════════════════════════

PART 5: END-TO-END JOURNEY TESTING

5.1 Complete User Journey Test

Scenario: Kitchen Remodel - Full Journey

Step 1: Homepage
  ✓ User lands on homepage
  ✓ Sees hero with video
  ✓ Sees service gallery
  ✓ Clicks "Build Your Project" (orange button)

Step 2: Concept Intake Form
  ✓ Redirects to /concept
  ✓ Fills out 4-step form:
    1. Selects "Kitchen"
    2. Enters details
    3. Reviews
    4. Submits
  ✓ Form validation works

Step 3: Processing
  ✓ Loading state shows (2-5 seconds)
  ✓ API processes DesignBot

Step 4: Concept Deliverable
  ✓ Redirects to /concept/[id]
  ✓ Video player shows transformation
  ✓ Quick facts displayed
  ✓ Gallery shows images
  ✓ MEP systems tabs work
  ✓ BOM table displays

Step 5: Continue Journey
  ✓ User clicks "Continue to Zoning"
  ✓ Redirects to /concept/[id]/zoning
  ✓ Zoning information displays

Step 6: Permits
  ✓ User continues to /concept/[id]/permits
  ✓ Permit checklist displays
  ✓ Timeline shown

Step 7: Lead Capture
  ✓ User sees "Request Contractor" CTA
  ✓ Email confirmation sent

Complete E2E Test:

describe('Complete Kitchen Remodel Journey', () => {
  test('full user journey from homepage to permits', async ({ page }) => {
    // Step 1: Homepage
    await page.goto('http://localhost:3000');
    expect(await page.title()).toContain('Kealee');
    await page.click('button:has-text("Build Your Project")');
    
    // Step 2-4: Concept Intake
    const url = page.url();
    expect(url).toContain('/concept');
    
    await page.fill('[name="scope"]', 'Modern kitchen with island');
    await page.fill('[name="budget"]', '75000');
    await page.selectOption('[name="location"]', '20024');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('button:has-text("Submit")');
    
    // Wait for redirect to deliverable
    await page.waitForNavigation();
    const deliverableUrl = page.url();
    expect(deliverableUrl).toMatch(/\/concept\/[a-f0-9\-]+$/);
    
    // Step 5: Verify deliverable content
    expect(await page.textContent('body')).toContain('Estimated Cost');
    expect(await page.textContent('body')).toContain('Timeline');
    expect(await page.textContent('body')).toContain('Permits');
    
    // Step 6: Continue to zoning
    await page.click('button:has-text("Continue to Zoning")');
    await page.waitForNavigation();
    expect(page.url()).toContain('/zoning');
    
    // Step 7: Verify zoning displayed
    expect(await page.textContent('body')).toContain('District of Columbia');
    expect(await page.textContent('body')).toContain('Permit');
  });
});

5.2 Data Flow Validation

Verify data flows correctly through journey:

Step 1: User Submits Intake Form
  Data entered:
  - projectType: "kitchen"
  - scope: "Modern kitchen with island"
  - budget: 75000
  - location: "20024"
  - email: "user@example.com"

Step 2: DesignBot Processes
  Receives: All intake data
  Generates: Concept with MEP systems, BOM, costs, timeline
  Returns: conceptId, concept object

Step 3: Deliverable Page
  Displays: All data from concept
  Verifies:
  - Cost matches what DesignBot calculated
  - Timeline matches template for kitchen
  - Permit count matches jurisdiction
  - MEP systems relevant to kitchen
  - BOM items relevant to kitchen

Step 4: ZoningBot Processes
  Receives: location (20024), projectType (kitchen)
  Generates: Jurisdiction rules, permits, setbacks
  Returns: zoningId, zoning object

Step 5: Zoning Results Page
  Displays: Zoning data from ZoningBot
  Verifies:
  - Jurisdiction correct for location
  - Permits match service type
  - Costs appropriate
  - Timeline reasonable

Test Data Flow:

test('data flows correctly through entire journey', async () => {
  const testData = {
    projectType: 'kitchen',
    scope: 'Modern kitchen with island',
    budget: 75000,
    location: '20024',
    email: 'user@example.com'
  };
  
  // Submit concept intake
  const conceptResponse = await fetch('http://localhost:3000/api/concept/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });
  
  const conceptData = await conceptResponse.json();
  const conceptId = conceptData.conceptId;
  
  // Verify concept response contains submitted data
  expect(conceptData.concept.projectType).toBe('kitchen');
  expect(conceptData.concept.estimatedCost).toBeGreaterThan(50000);
  
  // Submit zoning intake
  const zoningResponse = await fetch('http://localhost:3000/api/zoning/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conceptId,
      location: testData.location,
      projectType: testData.projectType,
      scope: testData.scope
    })
  });
  
  const zoningData = await zoningResponse.json();
  
  // Verify zoning is for correct jurisdiction
  expect(zoningData.jurisdiction).toBe('District of Columbia');
  
  // Verify permits match service type
  expect(zoningData.permitTypes).toContain('Electrical');
  expect(zoningData.permitTypes).toContain('Plumbing');
  
  // Verify cost is reasonable
  expect(zoningData.permitCosts.total).toBeGreaterThan(500);
});

═══════════════════════════════════════════════════════════════════════════════

PART 6: PERFORMANCE & ACCESSIBILITY TESTING

6.1 Performance Testing

Test: Page Load Performance

Metrics to Track:
  ✓ First Contentful Paint (FCP): < 1.5 seconds
  ✓ Largest Contentful Paint (LCP): < 2.5 seconds
  ✓ Cumulative Layout Shift (CLS): < 0.1
  ✓ Time to Interactive (TTI): < 3.5 seconds
  ✓ Total Page Size: < 5 MB
  ✓ Images optimized: WebP, responsive
  ✓ Video streaming: HLS, quality selector
  ✓ Lighthouse Performance Score: > 90

Lighthouse Testing:

test('homepage meets performance requirements', async () => {
  const lighthouse = require('lighthouse');
  
  const options = {
    logLevel: 'info',
    output: 'json',
    port: 9222,
  };
  
  const runnerResult = await lighthouse('http://localhost:3000', options);
  
  expect(runnerResult.lhr.scores.performance).toBeGreaterThan(90);
  expect(runnerResult.lhr.scores.accessibility).toBeGreaterThan(90);
  expect(runnerResult.lhr.scores['best-practices']).toBeGreaterThan(90);
  expect(runnerResult.lhr.scores.seo).toBeGreaterThan(90);
});

6.2 Accessibility Testing

Test: WCAG 2.1 AA Compliance

Accessibility Checks:
  ✓ All images have alt text
  ✓ Form labels properly associated
  ✓ Button text clear and descriptive
  ✓ Color contrast ratio > 4.5:1
  ✓ Keyboard navigation works (Tab, Enter, Arrow keys, ESC)
  ✓ Focus visible on all interactive elements
  ✓ ARIA labels on complex components
  ✓ No keyboard traps
  ✓ Video player has captions (if speech present)
  ✓ Screen reader compatible

Accessibility Test:

test('page meets WCAG 2.1 AA compliance', async ({ page }) => {
  const axe = require('@axe-core/playwright');
  
  await page.goto('http://localhost:3000/concept/test-id');
  
  const results = await axe.injectAxe(page);
  const accessibilityScan = await axe.getViolations(page);
  
  expect(accessibilityScan).toHaveLength(0);
});

═══════════════════════════════════════════════════════════════════════════════

PART 7: TESTING CHECKLIST & SIGN-OFF

7.1 Pre-Launch Testing Checklist

CONCEPT INTAKE FORM:
  ☐ All form fields render
  ☐ Form validation works (required, format, ranges)
  ☐ Error messages display in plain language
  ☐ Submit button enabled only when valid
  ☐ Loading state shows during processing
  ☐ API call succeeds
  ☐ Concept created in database
  ☐ Redirects to deliverable page
  ☐ Mobile responsive
  ☐ Keyboard navigation works
  ☐ WCAG 2.1 AA compliant

CONCEPT DELIVERABLE PAGE:
  ☐ Video player loads and plays
  ☐ Quality selector works (1080p, 720p)
  ☐ Quick facts cards display correct data
  ☐ Cost calculation correct
  ☐ Timeline matches service type
  ☐ Permit count correct
  ☐ Image gallery loads all images
  ☐ Lightbox works
  ☐ Before/after slider works
  ☐ MEP systems tabs work
  ☐ BOM table displays correctly
  ☐ Total cost matches header
  ☐ Download PDF works
  ☐ Share buttons work
  ☐ Mobile responsive
  ☐ Lighthouse >90
  ☐ WCAG 2.1 AA compliant

ZONING PAGE:
  ☐ Zoning data displays
  ☐ Jurisdiction correct
  ☐ Permits listed correctly
  ☐ Costs shown
  ☐ Timeline shown
  ☐ Mobile responsive

PERFORMANCE:
  ☐ FCP < 1.5s
  ☐ LCP < 2.5s
  ☐ CLS < 0.1
  ☐ Lighthouse Performance > 90
  ☐ Lighthouse Accessibility > 95
  ☐ All images optimized
  ☐ Video streaming configured

BROWSERS:
  ☐ Chrome (desktop + mobile)
  ☐ Firefox (desktop + mobile)
  ☐ Safari (desktop + iOS)
  ☐ Edge (desktop)

7.2 Test Report Template

```
═══════════════════════════════════════════════════════════════════════════════
KEALEE PLATFORM - QA TEST REPORT
Environment: [Dev/Staging/Production]
Date: [Date]
Tester: [Name]
Status: [PASS/FAIL]
═══════════════════════════════════════════════════════════════════════════════

SUMMARY:
✓ Passed: X tests
✗ Failed: X tests
⚠ Warnings: X items

CONCEPT INTAKE FORM:
✓ Form renders correctly
✓ Validation works
✓ API submission successful
✗ [Issue] Error message too long on mobile

CONCEPT DELIVERABLE:
✓ Video player works
✓ Gallery loads
✓ MEP tabs work
✗ [Issue] BOM total cost mismatch by $50

ZONING PAGE:
✓ Data displays correctly
✓ Permits listed
⚠ Timeline formatting could be clearer

PERFORMANCE:
✓ FCP: 1.2s (target <1.5s)
✓ LCP: 2.1s (target <2.5s)
✗ CLS: 0.15 (target <0.1) - images causing shift

ACCESSIBILITY:
✓ WCAG 2.1 AA compliant
✓ Keyboard navigation works
⚠ Color contrast on secondary button borderline

ISSUES FOUND:

Critical (Block Launch):
1. [Issue ID] BOM total cost mismatch - affects price accuracy

High (Resolve Before Launch):
1. [Issue ID] Mobile error message overflow - impacts UX

Medium (Nice to Have):
1. [Issue ID] Timeline formatting clarity

═══════════════════════════════════════════════════════════════════════════════
SIGN-OFF:

Tester: _________________ Date: _______

Lead QA: ________________ Date: _______

Product: ________________ Date: _______

Ready for Production: ☐ YES ☐ NO
```

═══════════════════════════════════════════════════════════════════════════════

EXECUTION: Run These Test Suites

Week 1 (Dev Environment):
  Day 1-2: Unit tests + component tests
  Day 3: Integration tests (form submission)
  Day 4-5: E2E tests (full journeys)
  Day 5-6: Performance + accessibility testing

Week 2 (Staging Environment):
  Day 1-2: Smoke tests (critical paths)
  Day 3-4: Full regression testing
  Day 5: Performance testing under load
  Day 6: User acceptance testing

Week 3 (Production):
  Day 1-2: Sanity checks on production
  Day 3-7: Monitor for errors, rollback if needed
  Ongoing: Monitor performance

═══════════════════════════════════════════════════════════════════════════════

RESULT: Complete QA Coverage

✅ Intake forms tested (unit + integration + E2E)
✅ Deliverable pages tested (content + UI + interactive)
✅ API endpoints tested (requests + responses + edge cases)
✅ Data flow validated (end-to-end)
✅ Performance verified (Lighthouse >90)
✅ Accessibility confirmed (WCAG 2.1 AA)
✅ User journeys tested (kitchen, bathroom, garden)
✅ Mobile + desktop tested
✅ Error handling tested
✅ All browsers tested

Production-Ready! 🚀
```

---

## 📋 NOW LET ME CREATE THE IMPLEMENTATION GUIDE

