# 🎨 KEALEE PLATFORM UI/UX REDESIGN PROMPT & EXECUTION

## Comprehensive Design System for Dual Service Model

---

## PART 1: DESIGN SYSTEM PHILOSOPHY & UPDATES

### Core Design Principle

```
PREVIOUS MESSAGING: "Get permits filed"
NEW MESSAGING: "Choose your path: Use existing plans OR we generate them"

VISUAL HIERARCHY:
Old:  [Design] → [Estimate] → [Permits]
New:  
  ├─ PATH A: [Upload Plans] → [Permits] (Quick, low-cost)
  └─ PATH B: [Design] → [Plans] → [Permits] (Complete, higher-cost)

COLOR SYSTEM:
├─ Primary: #E8724B (Orange - Kealee brand)
├─ Secondary: #2563EB (Blue - Action/decisions)
├─ Path A (Budget): #059669 (Green - Fast, affordable)
├─ Path B (Premium): #7C3AED (Purple - Complete solution)
├─ Success: #10B981 (Green)
├─ Warning: #F59E0B (Amber)
└─ Background: #FFFBF5 (Warm cream)

TYPOGRAPHY:
├─ H1: 48px, 700 weight, Primary text
├─ H2: 32px, 600 weight
├─ H3: 24px, 600 weight
├─ Body: 16px, 400 weight
├─ Small: 14px, 400 weight
└─ Micro: 12px, 400 weight

SPACING: 8px base unit (8, 16, 24, 32, 40, 48, 56, 64px)

COMPONENT PATTERNS:
├─ Card-based layouts (shadow: 0 1px 3px rgba(0,0,0,0.1))
├─ Two-column for comparisons (Path A vs B)
├─ Vertical steppers for flows
├─ Action-oriented CTAs (blue, not orange)
└─ Icon indicators for status
```

---

## PART 2: HOMEPAGE REDESIGN

### New Homepage Structure

**File:** `apps/web-main/app/page.tsx` (Redesigned)

```typescript
/**
 * KEALEE HOMEPAGE REDESIGN
 * 
 * HERO: Path selection (not generic "get started")
 * MAIN: Two clear paths with transparent pricing
 * FEATURES: What you get at each tier
 * PROOF: Testimonials/case studies
 * CTA: Path-specific call to action
 */

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-warm-50 to-white min-h-screen">
      
      {/* SECTION 1: HERO - PATH SELECTION */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-gray-900">
              Permits Made Simple
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose your path: File existing plans, or let us handle everything
            </p>
          </div>

          {/* PATH COMPARISON CARDS */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* PATH A: CLIENT HAS PLANS */}
            <PathCard
              path="A"
              title="I Have Plans"
              subtitle="Already have architect-stamped plans"
              icon="📋"
              color="green"
              benefits={[
                "Upload existing plans",
                "Permits filed in 30 minutes",
                "Professional coordination",
                "Status tracking",
              ]}
              price="$99-599"
              timeframe="1 day to file"
              cta={{
                text: "Start with Path A",
                href: "/permits-only",
                variant: "primary",
              }}
              features={{
                tier1: {
                  name: "Basic",
                  price: "$99",
                  details: "Permit checklist + filing guidance",
                },
                tier2: {
                  name: "Professional",
                  price: "$349",
                  details: "We file permits + inspection coordination",
                },
                tier3: {
                  name: "Premium",
                  price: "$599",
                  details: "Everything + expedited + construction admin",
                },
              }}
            />

            {/* PATH B: KEALEE GENERATES PLANS */}
            <PathCard
              path="B"
              title="Need Plans?"
              subtitle="We'll design and generate everything"
              icon="🏗️"
              color="purple"
              benefits={[
                "Professional design concept",
                "Full MEP specifications",
                "PE/Architect stamped",
                "Permits included",
              ]}
              price="$1,200-6,500"
              timeframe="14-21 days"
              cta={{
                text: "Start with Path B",
                href: "/concept",
                variant: "primary",
              }}
              features={{
                tier1: {
                  name: "Basic Plans",
                  price: "$1,200",
                  details: "Design + floor plan + basic MEP",
                },
                tier2: {
                  name: "Professional Plans",
                  price: "$2,500",
                  details: "Full MEP engineering + PE stamp",
                },
                tier3: {
                  name: "Complete",
                  price: "$4,500",
                  details: "Everything + construction admin + expediting",
                },
              }}
            />
          </div>

          {/* COMPARISON TABLE */}
          <ComparisonTable 
            columns={["Feature", "Path A", "Path B"]}
            rows={[
              ["Designer provided", "You", "Kealee"],
              ["Timeline", "1 day to file", "14-21 days"],
              ["Professional MEP specs", "You provide", "Kealee generates"],
              ["PE/Architect stamp", "You provide", "Kealee includes"],
              ["Permit filing", "Tier 2+", "Included"],
              ["Cost", "$99-599", "$1,200-6,500"],
              ["Best for", "Contractors, existing plans", "Homeowners, complete solution"],
            ]}
          />
        </div>
      </section>

      {/* SECTION 2: WHAT YOU GET (Tier Benefits) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-16 text-center">
            What's Included at Each Tier
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* BASIC TIER */}
            <TierCard
              tier={1}
              name="Basic"
              pathA={{
                name: "Basic Permits",
                price: "$99-199",
              }}
              pathB={{
                name: "Basic Plans",
                price: "$1,200",
              }}
              deliverables={{
                "Design Concept": "✓ (Path B only)",
                "Floor Plan": "✓ (Path B only)",
                "Renderings": "✓ (Path B only)",
                "Permit Checklist": "✓ (Both)",
                "Submission Guidance": "✓ (Both)",
                "Status Tracking": "✗",
                "Inspection Coordination": "✗",
              }}
              bestFor="Budget-conscious DIYers"
            />

            {/* PROFESSIONAL TIER */}
            <TierCard
              tier={2}
              name="Professional"
              highlighted={true}
              pathA={{
                name: "Professional Permits",
                price: "$349",
              }}
              pathB={{
                name: "Professional Plans",
                price: "$2,500-3,500",
              }}
              deliverables={{
                "Design Concept": "✓ (Path B only)",
                "Floor Plan": "✓ (Professional)",
                "MEP Specifications": "✓ (Full, Path B only)",
                "PE/Architect Stamp": "✓ (Path B only)",
                "Permit Filing": "✓ (We submit)",
                "Status Tracking": "✓ (24/7 monitoring)",
                "Inspection Coordination": "✓ (Our team)",
                "Plan Review Handling": "✓ (Automatic)",
              }}
              bestFor="Homeowners wanting complete solution"
            />

            {/* PREMIUM TIER */}
            <TierCard
              tier={3}
              name="Premium"
              pathA={{
                name: "Premium Permits",
                price: "$599",
              }}
              pathB={{
                name: "Complete Package",
                price: "$4,500-6,500",
              }}
              deliverables={{
                "Everything in Professional": "✓",
                "Expedited Processing": "✓ (+$250 saved)",
                "Construction Administration": "✓ (4 weeks)",
                "Inspection Day Presence": "✓ (Optional)",
                "Weekly Check-ins": "✓",
                "Contractor Coordination": "✓ (Direct contact)",
                "24/7 Dedicated Support": "✓",
                "Design Revisions": "✓ (Path B only)",
              }}
              bestFor="Complete peace of mind"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW IT WORKS */}
      <HowItWorksSection />

      {/* SECTION 4: PROCESS FLOWCHART */}
      <ProcessFlowSection />

      {/* SECTION 5: TESTIMONIALS */}
      <TestimonialsSection />

      {/* SECTION 6: FAQ */}
      <FAQSection />

      {/* SECTION 7: CTA FOOTER */}
      <CTAFooterSection />
    </div>
  );
}
```

---

## PART 3: PATH SELECTION FLOW

### Path A: Permits-Only Flow

**File:** `apps/web-main/app/permits-only/page.tsx`

```typescript
/**
 * PATH A: PERMITS ONLY
 * For customers with existing plans
 * 
 * Hero → Intake → Tier Selection → Payment → Done
 * Total time: 10 minutes
 * Messaging: Fast, affordable, professional coordination
 */

export default function PermitsOnlyPage() {
  const [stage, setStage] = useState<"hero" | "intake" | "tiers" | "payment">("hero");

  return (
    <div className="bg-gradient-to-br from-warm-50 to-white min-h-screen">
      
      {/* BREADCRUMB */}
      <Breadcrumb items={["Home", "Path A: Permits Only"]} />

      {stage === "hero" && (
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-block bg-green-100 px-4 py-2 rounded-full mb-4">
              <span className="text-green-700 font-semibold text-sm">PATH A</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-4">
              Permits. Fast. Professional.
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              You have the plans. We'll handle the permits.
            </p>

            {/* VALUE PROPS */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <ValueProp
                icon="⚡"
                title="30 Minutes"
                description="Permits filed to building department"
              />
              <ValueProp
                icon="💰"
                title="Transparent Pricing"
                description="From $99-599, no hidden fees"
              />
              <ValueProp
                icon="🤝"
                title="Peace of Mind"
                description="We monitor status 24/7"
              />
            </div>

            <button
              onClick={() => setStage("intake")}
              className="px-8 py-3 bg-green-600 text-white text-lg rounded-lg hover:bg-green-700 font-semibold"
            >
              Start Now →
            </button>
          </div>

          {/* COMPARISON: PATH A vs PATH B */}
          <PathComparison
            highlightPath="A"
            details={{
              timeline: "1 day to file",
              cost: "$99-599",
              work: "30 minutes",
              margin: "80-95%",
              bestFor: "Contractors, existing plans",
            }}
          />
        </section>
      )}

      {stage === "intake" && (
        <IntakeFormStage onComplete={() => setStage("tiers")} />
      )}

      {stage === "tiers" && (
        <TierSelectionStage pathA={true} onComplete={() => setStage("payment")} />
      )}

      {stage === "payment" && (
        <PaymentStage pathA={true} />
      )}
    </div>
  );
}

/**
 * INTAKE FORM STAGE (Path A)
 * Simple 3-step form
 */
function IntakeFormStage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Your Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Step 2: Project
    projectType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    scope: "",
    
    // Step 3: Plans
    hasPlansPDF: false,
    planDescription: "",
  });

  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <StepIndicator currentStep={step} totalSteps={3} />

      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Your Information</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(val) => setFormData({...formData, firstName: val})}
                placeholder="John"
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(val) => setFormData({...formData, lastName: val})}
                placeholder="Smith"
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(val) => setFormData({...formData, email: val})}
              placeholder="you@example.com"
            />

            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(val) => setFormData({...formData, phone: val})}
              placeholder="(202) 555-1234"
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Your Project</h2>
          
          <div className="space-y-4">
            <Select
              label="Project Type"
              options={[
                "Kitchen Remodel",
                "Bathroom Remodel",
                "Addition",
                "Renovation",
                "Other",
              ]}
              value={formData.projectType}
              onChange={(val) => setFormData({...formData, projectType: val})}
            />

            <Input
              label="Address"
              value={formData.address}
              onChange={(val) => setFormData({...formData, address: val})}
              placeholder="123 Main St"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(val) => setFormData({...formData, city: val})}
                placeholder="Washington"
              />
              <Input
                label="State"
                maxLength={2}
                value={formData.state}
                onChange={(val) => setFormData({...formData, state: val})}
                placeholder="DC"
              />
              <Input
                label="ZIP"
                value={formData.zipCode}
                onChange={(val) => setFormData({...formData, zipCode: val})}
                placeholder="20005"
              />
            </div>

            <Textarea
              label="Project Scope"
              value={formData.scope}
              onChange={(val) => setFormData({...formData, scope: val})}
              placeholder="What work is being done?"
              rows={4}
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Your Plans</h2>
          
          <div className="space-y-6">
            <FileUpload
              label="Upload Plans (Optional but helpful)"
              hint="PDF, JPG, or PNG. We'll extract details to speed up filing."
              multiple={true}
              onUpload={(files) => {
                // Handle file upload
              }}
            />

            <Textarea
              label="Plan Description"
              value={formData.planDescription}
              onChange={(val) => setFormData({...formData, planDescription: val})}
              placeholder="Describe your plans (dimensions, layout, etc)"
              rows={4}
            />

            <InfoBox
              title="What happens next?"
              items={[
                "We'll review your project details",
                "Determine permits required for your location",
                "Show you pricing options (Tier 1, 2, or 3)",
                "You select tier and pay",
                "We file permits (30 minutes)",
                "You get tracking dashboard",
              ]}
            />
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-gray-200 text-gray-900 rounded-lg"
            >
              ← Back
            </button>
            <button
              onClick={onComplete}
              className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Review Pricing →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * TIER SELECTION STAGE
 */
function TierSelectionStage({ pathA, onComplete }: { pathA: boolean; onComplete: () => void }) {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(2);

  const tiers = pathA
    ? [
        {
          tier: 1,
          name: "Basic Permits",
          price: "$99-199",
          description: "Permit checklist & filing guidance",
          features: [
            "Permit requirements checklist",
            "Code summary overview",
            "Inspection schedule outline",
            "You submit your own permits",
            "Email support",
          ],
          notIncluded: [
            "We don't file for you",
            "Status tracking",
            "Inspection coordination",
          ],
          bestFor: "Budget-conscious DIYers",
          icon: "📋",
        },
        {
          tier: 2,
          name: "Professional Permits",
          price: "$349",
          description: "We handle everything",
          features: [
            "Complete permit applications",
            "Code compliance review",
            "We file permits with department",
            "Inspection coordination",
            "Plan review follow-up",
            "Status tracking dashboard",
            "Phone & email support",
          ],
          notIncluded: [
            "Expedited processing",
            "Construction administration",
          ],
          popular: true,
          bestFor: "Most customers",
          icon: "⭐",
        },
        {
          tier: 3,
          name: "Premium Permits",
          price: "$599",
          description: "White-glove service",
          features: [
            "Everything in Professional",
            "Expedited processing",
            "Inspector relationships used",
            "Construction administration",
            "Inspection day presence (optional)",
            "90-day premium support",
            "Weekly check-ins",
          ],
          notIncluded: [],
          bestFor: "Complete peace of mind",
          icon: "👑",
        },
      ]
    : [
        // Path B tiers...
      ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Choose Your Tier</h2>
        <p className="text-lg text-gray-600">
          All prices include permit filing, application prep, and status tracking
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <TierOption
            key={tier.tier}
            tier={tier}
            selected={selectedTier === tier.tier}
            onSelect={() => setSelectedTier(tier.tier as 1 | 2 | 3)}
          />
        ))}
      </div>

      <div className="mt-12 flex gap-4 justify-center">
        <button className="px-8 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold">
          Back to Project
        </button>
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Continue to Payment →
        </button>
      </div>
    </section>
  );
}
```

### Path B: Full Design + Plans Flow

**File:** `apps/web-main/app/concept/page.tsx`

```typescript
/**
 * PATH B: FULL DESIGN + PLANS
 * For customers who need everything
 * 
 * Hero → Intake → Design Concept → Tier Selection → Payment → Timeline
 * Total time: 14-21 days (delivered)
 */

export default function ConceptPage() {
  const [stage, setStage] = useState<"hero" | "intake" | "design" | "tiers" | "payment" | "timeline">("hero");

  return (
    <div className="bg-gradient-to-br from-warm-50 to-white min-h-screen">
      
      <Breadcrumb items={["Home", "Path B: Design + Plans"]} />

      {stage === "hero" && (
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-block bg-purple-100 px-4 py-2 rounded-full mb-4">
              <span className="text-purple-700 font-semibold text-sm">PATH B</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-4">
              Complete Design + Permits
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              From concept to filing. We handle everything.
            </p>

            {/* WHAT'S INCLUDED */}
            <div className="grid md:grid-cols-4 gap-6 mb-12 text-left">
              <Step
                number="1"
                title="Design Concept"
                description="Floor plan + renderings (2-4 hours)"
                timeline="Day 1-2"
              />
              <Step
                number="2"
                title="Professional Plans"
                description="Architect review + stamping (5-10 days)"
                timeline="Day 3-12"
              />
              <Step
                number="3"
                title="Full MEP Specs"
                description="Electrical, plumbing, HVAC engineer (5-8 days)"
                timeline="Day 5-12"
              />
              <Step
                number="4"
                title="Permit Filing"
                description="Submitted to building dept (30 min)"
                timeline="Day 12"
              />
            </div>

            <button
              onClick={() => setStage("intake")}
              className="px-8 py-3 bg-purple-600 text-white text-lg rounded-lg hover:bg-purple-700 font-semibold"
            >
              Start Your Design →
            </button>
          </div>

          {/* MESSAGING: What You Get */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Feature
              icon="🎨"
              title="Professional Design"
              items={[
                "AI-generated initial concept",
                "Architect refinement",
                "3-4 perspective renderings",
                "Material board",
              ]}
            />
            <Feature
              icon="📐"
              title="Full Engineering"
              items={[
                "Electrical specifications",
                "Plumbing specifications",
                "HVAC specifications",
                "PE/Architect stamp",
              ]}
            />
            <Feature
              icon="📋"
              title="Permits Included"
              items={[
                "Applications prepared",
                "Documents compiled",
                "Submitted to building dept",
                "Status tracking",
              ]}
            />
          </div>

          {/* COMPARISON: PATH A vs PATH B */}
          <PathComparison
            highlightPath="B"
            details={{
              timeline: "14-21 days to stamped plans",
              cost: "$1,200-6,500",
              work: "40-60 hours",
              margin: "43-61%",
              bestFor: "Homeowners, complete solution",
            }}
          />
        </section>
      )}

      {stage === "intake" && (
        <IntakeFormStagePathB onComplete={() => setStage("design")} />
      )}

      {stage === "design" && (
        <DesignConceptStage onComplete={() => setStage("tiers")} />
      )}

      {stage === "tiers" && (
        <TierSelectionStagePathB onComplete={() => setStage("payment")} />
      )}

      {stage === "payment" && (
        <PaymentStagePathB onComplete={() => setStage("timeline")} />
      )}

      {stage === "timeline" && (
        <TimelineStage />
      )}
    </div>
  );
}
```

---

## PART 4: DELIVERABLE EXECUTION SPECIFICATIONS

### How Each Deliverable Is Executed

```
DELIVERABLE EXECUTION ROADMAP:
═════════════════════════════════════════════════════════════════════

1. DESIGN CONCEPT (Claude DesignBot)
   ├─ Input: Customer intake form (5 min form)
   ├─ Processing:
   │  ├─ Claude analyzes preferences (Opus 4.6)
   │  ├─ Generates JSON floor plan spec
   │  ├─ Generates rendering specifications
   │  ├─ Estimates MEP needs (rough)
   │  └─ Creates cost estimate
   ├─ Execution time: 3-5 minutes
   ├─ Output: JSON specification
   ├─ Next step: Rendering engine creates visuals
   └─ Deliverable type: Digital (web + PDF)

2. RENDERINGS (Graphics Engine - NOT Claude)
   ├─ Input: JSON spec from DesignBot
   ├─ Processing:
   │  ├─ Rendering engine (Three.js or similar)
   │  ├─ Applies materials/colors
   │  ├─ Generates perspective views
   │  └─ Creates PNG/JPG images
   ├─ Execution time: 5-10 minutes
   ├─ Output: 3-4 high-quality perspective images
   └─ Deliverable type: Digital images + PDF

3. FLOOR PLAN (Hybrid: Claude + Graphics)
   ├─ Input: DesignBot JSON spec
   ├─ Processing:
   │  ├─ Graphics engine creates 2D layout
   │  ├─ Claude adds dimensions/notes
   │  ├─ Auto-calculates square footage
   │  ├─ Adds title block
   │  └─ Formats for PDF
   ├─ Execution time: 2-3 minutes
   ├─ Output: Professional 2D floor plan (PDF)
   └─ Deliverable type: Digital (PDF + JPG)

4. PRELIMINARY MEP SPECS (Claude)
   ├─ Input: Design concept data
   ├─ Processing:
   │  ├─ Claude analyzes MEP needs (rough)
   │  ├─ Generates electrical summary
   │  ├─ Generates plumbing summary
   │  ├─ Generates HVAC summary
   │  └─ Creates JSON output
   ├─ Execution time: 2-3 minutes
   ├─ Output: JSON specifications (preliminary)
   ├─ Note: NOT permit-ready (preliminary only)
   └─ Deliverable type: Digital (JSON + PDF summary)

5. PROFESSIONAL FLOOR PLAN (Architect)
   ├─ Input: Design concept + DesignBot floor plan
   ├─ Processing:
   │  ├─ Human architect reviews (15 min)
   │  ├─ Adds professional details
   │  ├─ Ensures buildability
   │  ├─ Adds dimensions/annotations
   │  ├─ Creates CAD version
   │  └─ Formats for print
   ├─ Execution time: 2-4 hours
   ├─ Output: CAD file + professional PDF
   └─ Deliverable type: Digital files (DWG, PDF)

6. FULL ELECTRICAL SPECS (Electrical Engineer)
   ├─ Input: Design + preliminary MEP from Claude
   ├─ Processing:
   │  ├─ Load calculations (NEC-compliant)
   │  ├─ Panel upgrade assessment
   │  ├─ Wire sizing calculations
   │  ├─ Circuit design
   │  ├─ AFCI/GFCI placement per code
   │  ├─ One-line diagram creation
   │  └─ Code compliance verification
   ├─ Execution time: 4-6 hours
   ├─ Output: Detailed electrical plans + calculations
   └─ Deliverable type: Professional drawings (PDF + CAD)

7. FULL PLUMBING SPECS (Plumbing Engineer)
   ├─ Input: Design + preliminary MEP from Claude
   ├─ Processing:
   │  ├─ Pressure & gravity drain calculations
   │  ├─ Trap sizing per IRC
   │  ├─ Vent stack routing design
   │  ├─ Supply line sizing
   │  ├─ Hot water system sizing
   │  ├─ Isometric drawings
   │  └─ Code compliance verification
   ├─ Execution time: 4-6 hours
   ├─ Output: Detailed plumbing plans
   └─ Deliverable type: Professional drawings (PDF + CAD)

8. FULL HVAC SPECS (HVAC Engineer)
   ├─ Input: Design + preliminary MEP from Claude
   ├─ Processing:
   │  ├─ Load calculation (heating/cooling)
   │  ├─ Equipment selection & sizing
   │  ├─ Ductwork sizing (ASHRAE)
   │  ├─ CFM calculations per room
   │  ├─ Return air planning
   │  ├─ Controls & thermostat placement
   │  └─ Code compliance verification
   ├─ Execution time: 4-6 hours
   ├─ Output: Detailed HVAC plans + calculations
   └─ Deliverable type: Professional drawings (PDF + CAD)

9. PE/ARCHITECT STAMP (Licensed Professional)
   ├─ Input: All completed drawings + calculations
   ├─ Processing:
   │  ├─ Professional review (1-2 hours)
   │  ├─ Code compliance verification
   │  ├─ Legal liability assessment
   │  ├─ Digital signature/stamp
   │  └─ Certification of accuracy
   ├─ Execution time: 1-2 hours
   ├─ Output: Stamped, court-admissible plans
   ├─ Required for: Permit submission
   └─ Deliverable type: Official stamped PDFs

10. PERMIT SUBMISSION (PermitBot)
    ├─ Input: Completed stamped plans
    ├─ Processing:
    │  ├─ Plan review for completeness
    │  ├─ Jurisdiction verification
    │  ├─ Permit application generation
    │  ├─ Document compilation
    │  ├─ Portal authentication
    │  ├─ Application submission
    │  ├─ Confirmation receipt
    │  └─ Audit trail creation
    ├─ Execution time: 30 minutes
    ├─ Output: Application numbers, tracking IDs
    └─ Deliverable type: Digital (dashboard + email)

11. CONTINUOUS TRACKING (PermitBot Background Job)
    ├─ Input: Application IDs from submission
    ├─ Processing:
    │  ├─ Daily: Poll jurisdiction portal (automated)
    │  ├─ Daily: Check for plan review comments
    │  ├─ On event: Alert coordinator/customer
    │  ├─ If comments: Claude analyzes feedback
    │  ├─ If approvable: Auto-revise & resubmit
    │  ├─ If inspection ready: Schedule automatically
    │  └─ If complete: Mark as done
    ├─ Execution: 24/7 background (minimal human work)
    ├─ Output: Status updates, alerts, tracking
    └─ Deliverable type: Digital (dashboard + notifications)

12. INSPECTION COORDINATION (PermitBot + Coordinator)
    ├─ Input: Approved permits
    ├─ Processing:
    │  ├─ PermitBot: Detects inspection readiness
    │  ├─ PermitBot: Suggests inspection dates
    │  ├─ PermitBot: Schedules with building dept
    │  ├─ Coordinator: Confirms with contractor
    │  ├─ PermitBot: Sends confirmations
    │  ├─ PermitBot: Monitors for results
    │  └─ Coordinator: Logs any failures
    ├─ Execution: Automated + 1 hour coordinator time
    ├─ Output: Inspection confirmations + results
    └─ Deliverable type: Digital communications

13. FINAL CERTIFICATE (From Jurisdiction)
    ├─ Input: All inspections passed
    ├─ Processing:
    │  ├─ Building dept issues certificate
    │  ├─ PermitBot retrieves from portal
    │  ├─ Kealee compiles documentation
    │  ├─ Customer notified
    │  └─ Files archived
    ├─ Execution time: 30 minutes (after last inspection)
    ├─ Output: Official certificate + all documentation
    └─ Deliverable type: Official document (PDF)
```

---

## PART 5: COMPONENT UPDATE SPECIFICATIONS

### Updated UI Components

```typescript
/**
 * NEW/UPDATED COMPONENTS NEEDED
 */

// TIER CARDS - Show Path A & B together
<TierComparison
  pathA={{
    tier: 1,
    name: "Basic",
    price: "$99",
    features: ["Checklist", "Guidance"],
  }}
  pathB={{
    tier: 1,
    name: "Basic Plans",
    price: "$1,200",
    features: ["Design", "Floor Plan"],
  }}
/>

// PATH SELECTOR - On homepage
<PathSelector
  pathA={{
    icon: "📋",
    title: "Path A: I Have Plans",
    description: "Already have stamped plans",
    cta: "Start",
    color: "green",
  }}
  pathB={{
    icon: "🏗️",
    title: "Path B: Need Plans?",
    description: "We'll design everything",
    cta: "Start",
    color: "purple",
  }}
/>

// STEP INDICATOR - For multi-step flows
<StepIndicator
  steps={[
    { number: 1, label: "Your Info", completed: true },
    { number: 2, label: "Project", completed: true },
    { number: 3, label: "Plans", completed: false, current: true },
  ]}
/>

// TIMELINE - For Path B (14-21 days)
<ProcessTimeline
  steps={[
    { day: 1, label: "Design Concept", person: "AI" },
    { day: "3-12", label: "Professional Plans", person: "Architect" },
    { day: "5-12", label: "MEP Engineering", person: "Engineer" },
    { day: 12, label: "Permits Filed", person: "Bot" },
  ]}
/>

// FEATURE COMPARISON TABLE
<ComparisonTable
  rows={[
    ["Timeline", "1 day to file", "14-21 days"],
    ["Who designs", "You", "Kealee"],
    ["MEP specs", "You provide", "Kealee generates"],
    ["PE stamp", "You provide", "Kealee includes"],
    ["Cost", "$99-599", "$1,200-6,500"],
  ]}
/>

// DELIVERABLE CHECKLIST (Path B)
<DeliverableChecklist
  items={[
    { name: "Design Concept", status: "delivered", date: "Jan 15" },
    { name: "Floor Plans", status: "in-progress", date: "Jan 16-18" },
    { name: "Electrical Specs", status: "pending", date: "Jan 19-20" },
    { name: "Plumbing Specs", status: "pending", date: "Jan 19-20" },
    { name: "HVAC Specs", status: "pending", date: "Jan 19-20" },
    { name: "PE Stamp", status: "pending", date: "Jan 21" },
    { name: "Permits Filed", status: "pending", date: "Jan 22" },
  ]}
/>

// STATUS DASHBOARD (Post-payment)
<ProjectDashboard
  project={{
    name: "Kitchen Remodel - 123 Main St",
    path: "A",
    tier: 2,
    status: "Permits Submitted",
    timeline: {
      submitted: "Jan 22",
      estimatedApproval: "Feb 10",
      daysRemaining: 19,
    },
  }}
  updates={[
    { date: "Jan 22", message: "Permits submitted to DC DCRA" },
    { date: "Jan 23", message: "Building dept received applications" },
    { date: "Jan 25", message: "In plan review (estimated 2-3 weeks)" },
  ]}
/>
```

---

## PART 6: MESSAGING FRAMEWORK

### What to Say Where

```
HOMEPAGE HERO:
├─ Current: "Get your permits filed"
└─ NEW: "Choose your path: You have plans? Or do you need them?"

PATH A MESSAGING:
├─ Headline: "Permits. Fast. Professional."
├─ Tagline: "You have the plans. We'll handle the permits."
├─ Timeline: "Filed in 30 minutes"
├─ Cost: "From $99-599"
└─ For: "Contractors, existing plans"

PATH B MESSAGING:
├─ Headline: "Complete Design + Permits"
├─ Tagline: "From concept to filing. We handle everything."
├─ Timeline: "Stamped plans in 14-21 days"
├─ Cost: "From $1,200-6,500"
└─ For: "Homeowners, complete solution"

TIER 1 MESSAGING:
├─ Adjective: "Budget-friendly"
├─ Best for: "DIYers, cost-conscious"
├─ Tone: "You're in control"
└─ CTA: "Get started at $99"

TIER 2 MESSAGING:
├─ Adjective: "Most popular"
├─ Best for: "Most customers, busy professionals"
├─ Tone: "We've got this"
├─ CTA: "Choose professional service at $349"

TIER 3 MESSAGING:
├─ Adjective: "Premium, white-glove"
├─ Best for: "Peace of mind seekers"
├─ Tone: "Relax, we handle everything"
└─ CTA: "Get premium support at $599"

DELIVERABLE MESSAGING:
├─ Design Concept: "AI-generated initial concept"
├─ Floor Plan: "Professional architect-reviewed layout"
├─ Renderings: "See your space before construction"
├─ MEP Specs: "Full engineering specifications"
├─ PE Stamp: "Licensed professional certification"
└─ Permits Filed: "Submitted to building department"

ERROR/EDGE CASES:
├─ "You need plans to file permits" (for Path A without plans)
├─ "This service is available in your area starting [date]"
├─ "We found [X] potential code issues - contact coordinator"
└─ "Building dept requested revisions - we're handling it"
```

---

## PART 7: DESIGN TOKENS & SYSTEM

### CSS Variables (Tailwind Config)

```javascript
// tailwind.config.ts
module.exports = {
  theme: {
    colors: {
      // Brand
      orange: {
        600: "#E8724B", // Primary Kealee
      },
      
      // Path indicators
      green: {
        600: "#059669", // Path A (budget, fast)
      },
      purple: {
        600: "#7C3AED", // Path B (premium, complete)
      },
      
      // Semantic
      blue: {
        600: "#2563EB", // Primary action
      },
      amber: {
        500: "#F59E0B", // Warnings
      },
      
      // Warm palette
      warm: {
        50: "#FFFBF5",
        100: "#FFF5E6",
        200: "#FFEFD0",
      },
      
      // Neutrals
      gray: {
        50: "#F9FAFB",
        100: "#F3F4F6",
        900: "#111827",
      },
    },
    
    fontSize: {
      micro: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "32px",
      "4xl": "48px",
      "5xl": "64px",
    },
    
    spacing: {
      // 8px base unit
      0: "0",
      1: "8px",
      2: "16px",
      3: "24px",
      4: "32px",
      5: "40px",
      6: "48px",
      7: "56px",
      8: "64px",
    },
  },
};
```

---

## EXECUTION SUMMARY

```
UI/UX UPDATES REQUIRED:
═════════════════════════════════════════════════════════════════════

HOMEPAGE:
├─ [ ] New hero section with path selection
├─ [ ] Tier comparison table
├─ [ ] Path A vs Path B comparison cards
├─ [ ] Process flow visual
├─ [ ] Updated testimonials (Path A & B examples)
└─ [ ] CTA buttons (green for A, purple for B)

PERMITS-ONLY FLOW (Path A):
├─ [ ] New landing page (/permits-only)
├─ [ ] 3-step intake form
├─ [ ] Tier selection (Basic, Professional, Premium)
├─ [ ] Payment flow
├─ [ ] Confirmation & dashboard
└─ [ ] Success page

DESIGN + PLANS FLOW (Path B):
├─ [ ] Updated /concept page
├─ [ ] Enhanced intake form (design preferences)
├─ [ ] Design concept preview stage
├─ [ ] Deliverable timeline (14-21 days)
├─ [ ] Tier selection (Basic Plans, Professional, Complete)
├─ [ ] Payment flow
└─ [ ] Project dashboard with status updates

DASHBOARD / TRACKING:
├─ [ ] Path A dashboard (permit status)
├─ [ ] Path B dashboard (design + permit status)
├─ [ ] Timeline visual (days remaining)
├─ [ ] Notification system (status updates)
└─ [ ] Document download section

COMPONENTS:
├─ [ ] PathSelector component
├─ [ ] TierComparison component
├─ [ ] StepIndicator component
├─ [ ] ProcessTimeline component
├─ [ ] DeliverableChecklist component
├─ [ ] StatusDashboard component
└─ [ ] ComparisonTable component

TOTAL ESTIMATED EFFORT: 60-80 hours design/dev work
PRIORITY: High (revenue-dependent)
```

EOF
cat /mnt/user-data/outputs/KEALEE-UI-UX-REDESIGN-PROMPT.md
