# Kealee Platform - Design Generation Prompt

Use this prompt with AI design tools (Figma AI, Midjourney, DALL-E) or as a brief for designers.

---

## Brand Identity

**Company**: Kealee Platform
**Tagline**: "Build Better, Build Smarter"
**Core Differentiator**: Kealee provides SERVICE - Remote Project Management and Construction Operations, not just software.

**Target Market**: DC-Baltimore Corridor construction professionals
- Residential homeowners
- Architects & designers
- General contractors (including developers, commercial building owners, investors)
- Specialty subcontractors
- Estimators & cost consultants

---

## Design Philosophy

### NOT Procore-Style
Avoid the typical construction software look (blue/gray corporate, heavy icons, cluttered dashboards). Instead, draw inspiration from:

| Reference | What to Take |
|-----------|--------------|
| **Stripe** | Clean pricing tables, clear typography hierarchy, confident CTAs |
| **Shopify** | Marketplace feel, merchant-focused commerce UI, success stories |
| **Airbnb** | Trust indicators, photography usage, smooth flows |
| **Linear** | Modern SaaS aesthetic, dark mode excellence, keyboard-first feel |
| **Notion** | Workspace flexibility, clean content blocks |

### Design Principles

1. **Modern Enterprise** - Professional but not boring. Tech-forward, not legacy.
2. **Confident & Direct** - Bold statements, clear value props, no hedging.
3. **Commerce-Ready** - Every page should feel transactional; users should want to buy.
4. **Service-First** - Emphasize human expertise alongside software automation.
5. **Trust-Building** - Social proof, guarantees, transparent pricing throughout.

---

## Color System

### Primary Palette
```
Navy #1A2B4A    - Trust, professionalism, primary text
Orange #E8793A  - CTAs, energy, conversion elements
Teal #2ABFBF    - Technology, innovation, highlights
Green #38A169   - Success, approvals, positive outcomes
```

### Usage Guidelines
- **Navy**: Headlines, body text, footer backgrounds, serious messaging
- **Orange**: Primary buttons, pricing highlights, "Most Popular" badges, urgent CTAs
- **Teal**: Feature icons, technology sections, AI features, secondary highlights
- **Green**: Success states, approval badges, "Guaranteed" messaging

### Dark Mode
- Background: Navy 950 (#0F1A2E)
- Cards: Navy 900 (#1A2B4A)
- Text: White with gray-300 secondary
- Accent colors remain vibrant

---

## Typography

### Fonts
- **Clash Display** (Headings) - Modern geometric sans, confident
- **Plus Jakarta Sans** (Body) - Friendly professional, highly readable
- **JetBrains Mono** (Pricing/Numbers) - Technical precision for costs & estimates

### Hierarchy
```
Hero Headlines:     60-72px / Bold / -0.025em tracking
Section Headlines:  36-48px / Semibold / -0.025em tracking
Card Headlines:     24-30px / Semibold
Body Large:         18px / Regular / 1.6 line-height
Body:               16px / Regular / 1.5 line-height
Captions:           14px / Medium / 0.025em tracking (uppercase for labels)
Pricing Numbers:    48-72px / JetBrains Mono / Bold
```

---

## Visual Style

### Photography
- **Construction sites**: Modern, well-organized sites (not messy/dangerous)
- **People**: Diverse professionals in meetings, on tablets, reviewing plans
- **Before/After**: Renovation transformations
- **Architecture**: Beautiful finished projects, permit-ready drawings
- **Style**: Warm tones, natural lighting, professional but approachable

### Illustrations
- **Style**: Geometric, clean lines, limited color palette
- **Use cases**: Process flows, feature explanations, empty states, AI features
- **Don't**: Avoid cartoon/playful styles; stay professional

### Icons
- **Style**: Lucide icons (outline style, 24px standard)
- **Weight**: 1.5-2px stroke
- **Usage**: Feature lists, navigation, status indicators, CSI divisions

---

## Component Patterns

### Hero Sections
```
- Full-width with subtle gradient or pattern background
- Eyebrow badge (e.g., "TurboTax for Building Permits")
- Large headline (max 8 words)
- Supporting subheadline (1-2 sentences)
- 2 CTAs: Primary (orange) + Secondary (outline or ghost)
- Trust indicators below (3 key stats)
- Optional: Hero image or product screenshot on right
```

### Pricing Cards
```
- 3-4 tier display (grid on desktop, carousel on mobile)
- "Most Popular" badge on recommended tier
- Price prominent with period (e.g., "$799 / 48 hours")
- 5-7 feature bullets with checkmarks
- Single primary CTA per card
- Enterprise tier with "Contact Sales"
```

### Service Cards
```
- Clean white cards with subtle shadow
- Category badge (top)
- Service name (headline)
- Brief description (2 lines max)
- Price (bottom-left)
- Turnaround time (if applicable)
- Arrow CTA (bottom-right)
```

### Estimation-Specific Components
```
- CSI Division selector (dropdown or tabs)
- Assembly library browser (searchable grid)
- Cost breakdown tables (material/labor/equipment columns)
- Regional cost index selector
- AI confidence indicators (percentage badges)
- Takeoff measurement tools UI
- Estimate comparison tables
```

### Testimonials
```
- Quote in large italic
- Photo + Name + Title + Company
- Optional: Project photo or stat
- Star rating where applicable
```

### Trust Indicators
```
- Logo bars of partners/clients
- Statistics with icons (e.g., "3,000+ jurisdictions")
- Certification badges
- "Money-back guarantee" banners
```

---

## Page Templates

### Landing Page Structure
1. **Navigation**: Sticky, transparent-to-solid on scroll
2. **Hero**: Full viewport height, single conversion focus
3. **Social Proof**: Logo bar or testimonial
4. **Problem/Solution**: Pain points → Kealee solution
5. **Features**: 3-4 key features with icons/illustrations
6. **How It Works**: 3-step process
7. **Pricing**: Clear tier comparison
8. **Testimonials**: Real customer stories
9. **FAQ**: Accordion style
10. **Final CTA**: Repeated hero-style section
11. **Footer**: Full navigation + trust badges

### Estimation Landing Page Structure
1. **Hero**: "AI-Powered Construction Estimating"
2. **Pain Points**: Manual estimates, errors, delays
3. **Service Tiers**: Basic → Standard → Premium → Enterprise
4. **AI Features**: Scope analyzer, cost predictor, value engineer
5. **How It Works**: Upload plans → AI analysis → Expert review → Deliver
6. **Assembly Library**: Showcase 100+ pre-built assemblies
7. **CSI Coverage**: Show supported divisions
8. **Pricing Calculator**: Interactive estimate selector
9. **Testimonials**: Contractor success stories
10. **Final CTA**: "Get Your Estimate"

### Dashboard Structure (Logged-in)
1. **Sidebar**: Navigation with icons + labels
2. **Header**: Breadcrumbs + search + notifications + profile
3. **Main Content**: Cards/tables with clear hierarchy
4. **Actions**: Primary action buttons top-right

---

## Animation & Interaction

### Principles
- Subtle, purposeful animations (not decorative)
- 200-300ms transitions
- Ease-out for entries, ease-in-out for state changes
- Reduce motion for accessibility

### Patterns
- **Buttons**: Scale 1.02 on hover, shadow increase
- **Cards**: Lift with shadow on hover
- **Modals**: Fade in + slight scale up
- **Page transitions**: Crossfade, no sliding
- **Loading**: Skeleton screens, not spinners
- **AI Processing**: Pulse animation with progress indicator

---

## Conversion Optimization

### CTA Hierarchy
1. **Primary**: Orange background, white text (main conversion)
2. **Secondary**: Navy background or outline (alternative path)
3. **Tertiary**: Ghost/text link (learn more)

### Persuasion Elements
- **Urgency**: "Limited availability" where genuine
- **Social proof**: "Join 1,000+ contractors"
- **Risk reversal**: "Money-back guarantee"
- **Anchoring**: Show savings on annual plans
- **Specificity**: "$50M+ projects managed" (not "millions")

### Forms
- Progressive disclosure (multi-step wizards)
- Inline validation
- Clear error states
- Auto-save where possible
- Mobile-optimized inputs

---

## SEO & AI Optimization

### Content Structure
- Semantic HTML (h1 → h2 → h3)
- Schema.org markup for services/pricing
- Descriptive alt text for images
- FAQ schema for common questions

### Keywords to Emphasize
- "building permits DC Maryland"
- "construction project management"
- "remote project management services"
- "construction cost estimation"
- "contractor bidding platform"
- "AI construction estimating"
- "material takeoff services"
- "value engineering analysis"

### AI Discoverability
- Clear, factual descriptions (AI assistants will cite)
- Structured pricing tables (easy to extract)
- FAQ sections with direct answers
- Service descriptions with specific deliverables

---

## Responsive Breakpoints

| Breakpoint | Target |
|------------|--------|
| 640px (sm) | Mobile landscape |
| 768px (md) | Tablet |
| 1024px (lg) | Desktop |
| 1280px (xl) | Large desktop |
| 1440px (2xl) | Wide screens |

### Mobile Considerations
- Touch targets: 44x44px minimum
- Bottom navigation for logged-in apps
- Swipeable carousels for pricing
- Collapsible sections for content-heavy pages
- Sticky CTAs at bottom

---

## File Deliverables Expected

### Figma Structure
```
Kealee Design System/
├── 🎨 Foundations/
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Icons
│   └── Effects
├── 🧱 Components/
│   ├── Buttons
│   ├── Forms
│   ├── Cards
│   ├── Navigation
│   ├── Modals
│   ├── Tables
│   └── Marketing/
│       ├── Hero
│       ├── Pricing
│       ├── Features
│       └── Testimonials
├── 📊 Estimation/
│   ├── Estimate Cards
│   ├── CSI Selectors
│   ├── Assembly Browser
│   ├── Cost Tables
│   ├── AI Indicators
│   └── Takeoff Tools
├── 📱 Templates/
│   ├── Landing Pages
│   ├── Dashboard
│   ├── Auth
│   └── Error
└── 📄 Pages/
    ├── Homepage
    ├── Permits Landing
    ├── Architect Landing
    ├── Ops Services Landing
    ├── Estimation Landing
    ├── Pricing
    └── Dashboard
```

---

## Quick Reference: Product Offering

### Portal Architecture

**3 Client Portals (Login Required - Paid Clients)**

| Portal | URL | Primary Users | Icon |
|--------|-----|---------------|------|
| Homeowner | app.kealee.com | Residential homeowners | Home |
| Contractor | contractor.kealee.com | GCs, builders, developers, commercial owners, investors | HardHat |
| Professional | professional.kealee.com | Architects, designers, engineers | PenTool |

**Platform Services (Integrated within Portals)**

| Service | Description | Available To |
|---------|-------------|--------------|
| Estimation | AI-powered cost estimation | All portals |
| Permits | Permit processing & inspections | All portals |
| Marketplace | Contractor bidding platform | Homeowner, Contractor |
| Finance & Trust | Escrow & payment services | All portals |
| PM Services | Managed project management | Homeowner, Contractor |

### Login & CTA Requirements
- All dashboards require login (paid clients only)
- Marketing pages show "Login" and "Sign Up" CTAs in header
- Services purchased are accessible within client portal dashboard
- Each portal has its own branding but shared design system

### Homeowner Sidebar Navigation (app.kealee.com)
```
Dashboard           (LayoutDashboard)
My Projects         (FolderKanban)
  ├── Active Projects
  ├── Completed
  └── Start New Project
Pre-Construction    (ClipboardList)
  ├── Project Pipeline
  ├── Design Packages
  └── Cost Estimates
Estimation          (Calculator) [NEW badge]
  ├── Request Estimate
  ├── My Estimates
  └── Compare Estimates
Permits             (FileCheck)
  ├── Active Permits
  ├── New Application
  └── Inspections
Find Contractors    (Users)
  ├── Search Contractors
  ├── Active Bids
  └── Saved Contractors
Payments            (CreditCard)
  ├── Escrow Account
  ├── Payment History
  └── Payment Schedule
Documents           (FileText)
Reports             (BarChart3)
Settings            (Settings)
```

### Contractor Sidebar Navigation (contractor.kealee.com)
*(GCs, builders, developers, commercial building owners, investors)*
```
Dashboard           (LayoutDashboard)
Projects            (FolderKanban)
Estimation          (Calculator)
  ├── New Estimate
  ├── Assembly Library
  ├── Estimate History
  └── Templates
Bidding             (Gavel)
  ├── Opportunities
  ├── Submitted Bids
  └── Won Projects
Schedule            (Calendar)
Team                (Users)
  ├── Team Members
  ├── Subcontractors
  └── Invitations
Permits             (FileCheck)
  ├── Active Permits
  ├── New Application
  └── Inspections
Finances            (DollarSign)
  ├── Overview
  ├── Invoices
  └── Payments
Documents           (FileText)
Reports             (BarChart3)
Settings            (Settings)
```

### Professional Sidebar Navigation (professional.kealee.com)
*(Architects, designers, engineers)*
```
Dashboard           (LayoutDashboard)
Projects            (FolderKanban)
  ├── Active Projects
  ├── Completed
  └── Proposals
Deliverables        (Package)
  ├── In Progress
  ├── Under Review
  └── Approved
Clients             (Users)
  ├── Active Clients
  └── Leads
Estimation          (Calculator)
  ├── Request Estimate
  └── Estimate History
Permits             (FileCheck)
  ├── Active Permits
  ├── New Application
  └── Inspections
Billing & Fees      (CreditCard)
  ├── Invoices
  ├── Payments
  └── Fee Schedule
Documents           (FileText)
Reports             (BarChart3)
Settings            (Settings)
```

### Key Price Points
- **Permits**: $495 - $2,995 (one-time) or $7,500/mo (enterprise)
- **PM Software**: $99 - $499/mo
- **PM Services**: $1,750 - $16,500/mo
- **Estimation**: $299 - $4,999 per estimate
- **Architect**: Free - 3% of project value
- **Escrow**: 1% (max $500)
- **Platform Commission**: 3.5% (paid by contractor)

### Estimation Service Tiers
| Tier | Price | Turnaround | Best For |
|------|-------|------------|----------|
| Basic | $299 | 24 hours | Small residential <$50K |
| Standard | $799 | 48 hours | Mid-size residential & light commercial |
| Premium | $1,999 | 3-5 days | Large commercial projects |
| Enterprise | $4,999 | Custom | Multi-phase & complex builds |

### Unique Selling Points
1. "TurboTax for Building Permits" - 85% first-try approval
2. Remote PM Services - We run your project, not just software
3. AI-Powered Estimation - ML models trained on thousands of projects
4. Fair Bidding Marketplace - No pay-to-play
5. Integrated Platform - Permits → Design → Estimate → Bid → Build
6. DC-Baltimore Expertise - Local knowledge, 3,000+ jurisdictions

---

## Estimation Module Details

### AI-Powered Features
1. **Scope Analyzer** - Identifies gaps, risks, missing items
2. **Cost Predictor** - ML-based forecasting with confidence intervals
3. **Value Engineer** - Automated cost optimization (9 opportunity types)
4. **Plan Analyzer** - Automatic quantity extraction from PDFs

### CSI MasterFormat Coverage
- Division 01-02: General Requirements
- Division 03: Concrete
- Division 04: Masonry
- Division 05: Metals
- Division 06: Wood, Plastics & Composites
- Division 07: Thermal & Moisture Protection
- Division 08: Openings
- Division 09: Finishes
- Division 21-27: MEP (Fire, Plumbing, HVAC, Electrical)
- Division 31-33: Exterior & Site Work

### Assembly Library (100+ Pre-built)
- Concrete Slab on Grade
- Wood Stud Walls
- Roof Trusses
- Asphalt Shingles
- Drywall & Finishes
- Interior Paint
- Plumbing Fixtures
- Electrical Outlets & Fixtures

### Regional Cost Indices
- Washington, DC: 1.18
- Baltimore, MD: 1.08
- Arlington, VA: 1.15
- National Baseline: 1.00

---

# COPY-PASTE PROMPTS

Below are ready-to-use prompts for AI design tools.

---

## PROMPT 1: Homepage Hero Design

```
Design a modern SaaS landing page hero section for Kealee Platform, a construction project management company.

BRAND:
- Primary color: Navy #1A2B4A
- Accent color: Orange #E8793A
- Secondary: Teal #2ABFBF
- Font: Clash Display for headlines, Plus Jakarta Sans for body

CONTENT:
- Eyebrow badge: "Build Better, Build Smarter"
- Headline: "The Complete Construction Platform"
- Subheadline: "From permits to project completion. AI-powered tools + expert services for the DC-Baltimore corridor."
- Primary CTA: "Get Started Free" (orange button)
- Secondary CTA: "See How It Works" (outline button)
- Trust indicators: "3,000+ jurisdictions" | "85% first-try approval" | "$50M+ managed"

STYLE:
- Modern enterprise SaaS (like Stripe or Linear)
- Clean, confident, not cluttered
- Subtle grid or dot pattern background
- Product screenshot or illustration on right side
- Light mode with white background
- Full viewport height

OUTPUT: Figma-ready design at 1440px width
```

---

## PROMPT 2: Estimation Landing Page Hero

```
Design a hero section for a construction estimating service landing page.

BRAND:
- Navy #1A2B4A (primary text)
- Orange #E8793A (CTAs)
- Teal #2ABFBF (AI/technology features)
- Fonts: Clash Display (headlines), Plus Jakarta Sans (body), JetBrains Mono (prices)

CONTENT:
- Eyebrow: "AI-Powered Construction Estimating"
- Headline: "Accurate Estimates in 24 Hours"
- Subheadline: "Professional construction estimates powered by AI and validated by experts. Material takeoffs, labor analysis, and cash flow projections."
- Primary CTA: "Get Your Estimate" (orange)
- Secondary CTA: "View Sample Report" (outline)
- Trust indicators: "100+ assemblies" | "20+ CSI divisions" | "RS Means integrated"

VISUAL:
- Split layout: text left, illustration/screenshot right
- Show estimate document preview or dashboard mockup
- Teal accents for AI-related elements
- Professional, enterprise feel
- Light background with subtle pattern

OUTPUT: Desktop (1440px) and mobile (375px) versions
```

---

## PROMPT 3: Pricing Page - Estimation Tiers

```
Design a 4-tier pricing section for construction estimation services.

BRAND COLORS:
- Navy #1A2B4A
- Orange #E8793A (for "Most Popular" badge and primary CTAs)
- Teal #2ABFBF
- Green #38A169 (checkmarks)

TIERS:
1. BASIC - $299 / 24 hours
   - Small residential projects
   - Features: Labor breakdown, Material takeoff, Timeline estimate, PDF report

2. STANDARD (Most Popular) - $799 / 48 hours
   - Mid-size residential & commercial
   - Features: Everything in Basic + Supplier pricing, Profit analysis, Excel + PDF

3. PREMIUM - $1,999 / 3-5 days
   - Large commercial projects
   - Features: Everything in Standard + BOQ, Multi-vendor comparison, Cash flow, Dedicated estimator

4. ENTERPRISE - $4,999 / Custom
   - Multi-phase complex builds
   - Features: Everything in Premium + Value engineering, Sub bid packages, On-site consultation

DESIGN REQUIREMENTS:
- Cards with subtle shadows
- Price in JetBrains Mono font, large (48px)
- Feature checkmarks in green
- Orange badge on Standard tier
- Orange CTA buttons
- Clean, Stripe-inspired layout
- Dark mode variant also needed

OUTPUT: Figma component with both light and dark mode variants
```

---

## PROMPT 4: Service Cards Grid

```
Design a responsive grid of service cards for construction operations services.

BRAND:
- Navy #1A2B4A
- Orange #E8793A
- Background: White or Gray-50
- Font: Plus Jakarta Sans

SERVICES TO SHOW:
1. Site Analysis Report - $125
2. Scope of Work Development - $195
3. Contractor Vetting - $175
4. Bid Leveling & Analysis - $245
5. Contract Review - $295
6. Quick Estimate - $195

CARD DESIGN:
- White background with subtle shadow (elevation on hover)
- Category badge at top (e.g., "Project Controls" in teal soft badge)
- Service name as headline (18px semibold)
- 2-line description (14px gray-600)
- Price at bottom left (JetBrains Mono, orange)
- Arrow icon at bottom right (→)
- Rounded corners (12px)
- Padding: 24px

LAYOUT:
- 3 columns on desktop
- 2 columns on tablet
- 1 column stacked on mobile
- 24px gap between cards

OUTPUT: Figma component with responsive variants
```

---

## PROMPT 5: AI Features Section

```
Design a features section showcasing AI-powered estimation capabilities.

BRAND:
- Navy #1A2B4A (text)
- Teal #2ABFBF (AI feature highlights)
- Orange #E8793A (CTAs)
- Background: Light gray or white

SECTION HEADLINE: "AI-Powered Accuracy"
SUBHEADLINE: "Machine learning models trained on thousands of real projects deliver estimates you can trust."

FEATURES (4 cards):
1. SCOPE ANALYZER
   - Icon: Magnifying glass + document
   - "Identifies gaps and risks in your project scope"
   - Teal accent

2. COST PREDICTOR
   - Icon: Chart trending up
   - "ML-based forecasting with confidence intervals"
   - Teal accent

3. VALUE ENGINEER
   - Icon: Lightbulb + dollar
   - "Automated cost optimization opportunities"
   - Teal accent

4. PLAN ANALYZER
   - Icon: Blueprint + AI sparkle
   - "Automatic quantity extraction from PDFs"
   - Teal accent

DESIGN STYLE:
- 2x2 grid or horizontal 4-column
- Feature cards with icon (48px), headline, description
- Subtle glow/gradient on teal elements
- Modern, tech-forward feel
- Add small "AI" badge on each card

OUTPUT: Section design for landing page (full width)
```

---

## PROMPT 6: CSI Division Selector

```
Design a CSI MasterFormat division selector component for a construction estimating app.

BRAND:
- Navy #1A2B4A
- Teal #2ABFBF (selected state)
- Orange #E8793A (hover accent)
- Gray-100 (backgrounds)

CSI DIVISIONS TO SHOW:
- 03 Concrete
- 04 Masonry
- 05 Metals
- 06 Wood & Composites
- 07 Thermal Protection
- 08 Openings
- 09 Finishes
- 22 Plumbing
- 23 HVAC
- 26 Electrical

COMPONENT REQUIREMENTS:
- Horizontal scrollable tabs OR vertical sidebar
- Division code (03) prominent
- Division name below/beside
- Selected state: Teal background, white text
- Hover state: Light teal background
- Unselected: White background, navy text
- Small icon for each division (optional)
- Show "All Divisions" option

USE CASE: User selects division to filter assembly library or estimate sections

OUTPUT: Figma component with all states (default, hover, selected, disabled)
```

---

## PROMPT 7: Estimate Summary Card

```
Design a compact estimate summary card showing cost breakdown.

BRAND:
- Navy #1A2B4A
- Orange #E8793A
- Green #38A169 (positive/success)
- JetBrains Mono for numbers

CONTENT:
- Project Name: "Smith Kitchen Renovation"
- Estimate Date: "Feb 4, 2026"
- Status Badge: "Approved" (green)

COST BREAKDOWN TABLE:
- Direct Cost: $42,500
- Overhead (10%): $4,250
- Profit (10%): $4,675
- Contingency (5%): $2,571
- TOTAL: $53,996

ADDITIONAL INFO:
- Cost/SF: $180/SF (300 SF)
- CSI Divisions: 6 (shown as small badges)
- Confidence: 92% (teal badge)

CARD DESIGN:
- White card with shadow
- Header with project name and status
- Table with alternating row backgrounds
- Total row emphasized (larger font, bold)
- Download buttons: PDF | Excel
- Subtle divider between sections

OUTPUT: Card component at 400px width, suitable for dashboard
```

---

## PROMPT 8: Homeowner Dashboard (Light & Dark Mode)

```
Design a homeowner dashboard with full sidebar navigation.

BRAND:
- Light mode: White background, Navy text
- Dark mode: Navy 950 #0F1A2E background, White text
- Accent: Orange #E8793A (CTAs), Teal #2ABFBF (highlights)

SIDEBAR NAVIGATION (240px, collapsible):
- Logo: "Kealee" at top
- Main sections with Lucide icons:
  1. Dashboard (LayoutDashboard)
  2. My Projects (FolderKanban) - expandable
  3. Pre-Construction (ClipboardList) - expandable
  4. Estimation (Calculator) - with "NEW" badge, expandable
     - Request Estimate
     - My Estimates
     - Compare Estimates
  5. Permits (FileCheck) - expandable
  6. Find Contractors (Users) - expandable
  7. Payments (CreditCard) - expandable
  8. Documents (FileText)
  9. Reports (BarChart3)
- Settings at bottom
- User profile card at bottom with avatar

NAVIGATION STATES:
- Default: Navy text, transparent background
- Hover: Light teal background (#E5F8F8)
- Active: Teal left border (3px), light teal background, teal text
- Expanded section: Indented children with smaller text

HEADER (top, 64px):
- Breadcrumbs: Home > Projects > Kitchen Renovation
- Search bar (right side)
- Notifications bell icon with badge
- User avatar dropdown

MAIN CONTENT - DASHBOARD VIEW:
- Stats row (4 cards): Active Projects, Pending Estimates, Permits in Progress, Total Spent
- Recent Projects table
- Estimation quick action card: "Get a New Estimate" with orange CTA
- Activity feed

DESIGN REQUIREMENTS:
- 16px body text, 14px sidebar labels
- Smooth hover transitions (200ms)
- Collapsed sidebar shows icons only (64px width)
- Mobile: Bottom tab navigation with 5 key items

OUTPUT: Both light and dark mode at 1440x900px, plus collapsed sidebar variant
```

---

## PROMPT 9: Mobile Estimation Flow

```
Design a 5-step mobile wizard for requesting a construction estimate.

BRAND:
- Navy #1A2B4A
- Orange #E8793A
- Teal #2ABFBF
- Screen width: 375px (iPhone)

STEPS:
1. PROJECT INFO
   - Project name input
   - Project type dropdown (Residential, Commercial, Renovation)
   - Square footage input
   - Location (city/zip)

2. SCOPE DETAILS
   - Checkboxes for work types: Demolition, Framing, Electrical, Plumbing, HVAC, Finishes
   - Brief description textarea

3. UPLOAD PLANS
   - Drag & drop zone (or tap to upload)
   - Accepted formats: PDF, DWG, JPG
   - Show uploaded files with thumbnails

4. SELECT SERVICE
   - 4 tier cards (simplified for mobile)
   - Price and turnaround prominent
   - Radio selection

5. REVIEW & PAY
   - Summary of selections
   - Cost breakdown
   - Payment method selection
   - "Submit Request" orange button

UI REQUIREMENTS:
- Progress indicator at top (5 dots or steps)
- "Back" and "Continue" buttons at bottom
- Sticky bottom action bar
- Clean form inputs with floating labels
- Success state after submission

OUTPUT: 5 mobile screens showing complete flow
```

---

## PROMPT 10: Assembly Library Browser

```
Design an assembly library browser for construction estimating.

BRAND:
- Navy #1A2B4A
- Teal #2ABFBF (selected)
- Orange #E8793A (add button)
- Gray-50 background

LAYOUT:
- Left sidebar: Category filters (Concrete, Framing, Roofing, Finishes, MEP, etc.)
- Top: Search bar + Sort dropdown
- Main: Grid of assembly cards

ASSEMBLY CARD CONTENTS:
- Assembly code: "03-1000"
- Name: "Concrete Slab on Grade - 4""
- Unit: "SF"
- Productivity: "800 SF/day"
- Crew size: "4"
- Quick cost preview: "$X.XX/SF"
- "Add to Estimate" button (orange, small)
- "View Details" link

SAMPLE ASSEMBLIES:
1. 03-1000 - Concrete Slab on Grade - 4"
2. 06-1100 - Wood Stud Wall - 2x4 @ 16" OC
3. 07-3100 - Asphalt Shingles - Architectural
4. 09-2900 - Drywall - 1/2" Standard
5. 26-2700 - Duplex Receptacle

INTERACTIONS:
- Hover: Card lifts slightly
- Click card: Opens detail modal with full breakdown
- Add button: Adds to current estimate (show confirmation toast)

OUTPUT: Full browser view at 1280px width with sample assemblies
```

---

## PROMPT 11: Image Generation - Construction Professional

```
Professional construction estimator reviewing blueprints on large monitor in modern office, spreadsheet and cost data visible on screen, diverse female professional in business casual attire, clean organized desk with tablet and coffee, natural window lighting, shallow depth of field, photorealistic, editorial photography style, 16:9 aspect ratio, warm color temperature
```

---

## PROMPT 12: Image Generation - AI Technology

```
Abstract geometric illustration representing AI analyzing construction data, connected nodes forming building outline, flowing data streams in navy blue and teal colors, orange accent highlights on key nodes, clean minimal style, dark background with subtle grid, modern tech aesthetic, vector illustration style, 16:9 aspect ratio
```

---

## PROMPT 13: Image Generation - Team Collaboration

```
Construction project team meeting around conference table, architect showing tablet with 3D model to contractor and project owner, diverse group of four professionals engaged in discussion, modern glass-walled office with city view, warm natural lighting, shallow depth of field on foreground, photorealistic, editorial style, 16:9 aspect ratio
```

---

## PROMPT 14: Image Generation - Cost Analysis

```
Clean geometric illustration of cost estimation workflow, three horizontal layers showing: blueprints at bottom, AI processing in middle with neural network pattern, polished estimate document at top, navy blue primary with teal and orange accents, isometric perspective, minimal modern style, white background, vector art, 4:3 aspect ratio
```

---

## PROMPT 15: Illustration - Value Engineering

```
Simple geometric illustration showing cost optimization concept, downward trending cost line transforming into quality checkmark, dollar signs and building icons, navy blue and green color scheme with orange highlights, clean vector style, professional business illustration, transparent background, 1:1 aspect ratio for icon use
```

---

## PROMPT 16: Complete Sidebar Navigation Component

```
Design a complete sidebar navigation component for Kealee Platform.

BRAND:
- Navy #1A2B4A
- Teal #2ABFBF (active state)
- Orange #E8793A (badges)
- Icons: Lucide icon set

STRUCTURE (Homeowner View):
┌─────────────────────────────┐
│ [Logo] Kealee               │
├─────────────────────────────┤
│ ▢ Dashboard                 │
│ ▼ My Projects               │
│   ├ Active Projects         │
│   ├ Completed               │
│   └ Start New Project       │
│ ▼ Pre-Construction          │
│   ├ Project Pipeline        │
│   ├ Design Packages         │
│   └ Cost Estimates          │
│ ▼ Estimation        [NEW]   │
│   ├ Request Estimate        │
│   ├ My Estimates            │
│   └ Compare Estimates       │
│ ▼ Permits                   │
│   ├ Active Permits          │
│   ├ New Application         │
│   └ Inspections             │
│ ▼ Find Contractors          │
│   ├ Search Contractors      │
│   ├ Active Bids             │
│   └ Saved Contractors       │
│ ▼ Payments                  │
│   ├ Escrow Account          │
│   ├ Payment History         │
│   └ Payment Schedule        │
│ ▢ Documents                 │
│ ▢ Reports                   │
├─────────────────────────────┤
│ ⚙ Settings                  │
├─────────────────────────────┤
│ [Avatar] John Smith         │
│          john@email.com     │
└─────────────────────────────┘

STATES:
- Expanded: 240px width
- Collapsed: 64px width (icons only, tooltip on hover)
- Item states: default, hover, active, disabled
- Section states: collapsed (chevron right), expanded (chevron down)

STYLING:
- 14px text, 16px section headers
- 24px icons
- 8px border-radius on hover backgrounds
- "NEW" badge: Orange pill, white text, 10px font
- Active item: 3px teal left border

OUTPUT: Figma component with all variants and states
```

---

## PROMPT 17: Estimation Request Flow (Homeowner)

```
Design a 4-step estimation request wizard for residential homeowners.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF

STEP 1: PROJECT DETAILS
- Project name (text input)
- Project type (dropdown): Kitchen Remodel, Bathroom, Addition, Full Renovation, New Construction, Other
- Property address (address autocomplete)
- Square footage (number input)
- Target budget range (dropdown): <$25K, $25-50K, $50-100K, $100-250K, $250K+

STEP 2: SCOPE OF WORK
- Checkbox grid for work types:
  □ Demolition      □ Framing        □ Roofing
  □ Electrical      □ Plumbing       □ HVAC
  □ Drywall         □ Painting       □ Flooring
  □ Cabinets        □ Countertops    □ Tile
  □ Windows         □ Doors          □ Insulation
- Additional details textarea
- Timeline preference (dropdown): ASAP, 1-3 months, 3-6 months, 6+ months

STEP 3: UPLOAD DOCUMENTS
- Drag & drop zone with dashed border
- Accepted: PDF, DWG, JPG, PNG (up to 50MB)
- Show uploaded files as cards with thumbnail, name, size, delete button
- Optional: "I don't have plans" checkbox with alternate form

STEP 4: SELECT SERVICE & PAY
- 4 service tier cards (horizontal on desktop, vertical on mobile):
  Basic $299/24hrs | Standard $799/48hrs | Premium $1,999/3-5 days | Enterprise $4,999/Custom
- Recommended tier highlighted (Standard)
- Payment method: Credit card form or "Invoice me" option
- Terms checkbox
- "Submit Request" orange button

UI ELEMENTS:
- Progress bar at top showing 4 steps
- Step titles: Details → Scope → Documents → Confirm
- "Back" and "Continue" buttons at bottom
- Auto-save indicator
- Validation errors inline

OUTPUT: 4 desktop screens (1280px) + 4 mobile screens (375px)
```

---

## PROMPT 18: Estimate Results Dashboard

```
Design an estimate results page showing a completed construction estimate.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF, Green #38A169

HEADER:
- Project name: "Smith Kitchen Renovation"
- Status badge: "Completed" (green) or "In Progress" (teal)
- Estimate date and version
- Action buttons: Download PDF, Download Excel, Request Revision

SUMMARY CARD (top):
┌────────────────────────────────────────────────────────────┐
│ TOTAL ESTIMATE                                              │
│ $53,996                                    [AI Confidence]  │
│                                                92% ████████ │
│ Direct: $42,500 | Overhead: $4,250 | Profit: $4,675        │
│ Contingency: $2,571                                         │
│ ─────────────────────────────────────────────────────────── │
│ 300 SF | $180/SF | 6 CSI Divisions                         │
└────────────────────────────────────────────────────────────┘

COST BREAKDOWN TABLE:
| Division | Description | Material | Labor | Equipment | Total |
|----------|-------------|----------|-------|-----------|-------|
| 03       | Concrete    | $2,500   | $1,200| $300      | $4,000|
| 06       | Carpentry   | $8,000   | $4,500| $200      | $12,700|
| 09       | Finishes    | $6,000   | $3,000| -         | $9,000|
| 22       | Plumbing    | $3,500   | $2,500| -         | $6,000|
| 26       | Electrical  | $2,800   | $2,200| -         | $5,000|
| ...      | ...         | ...      | ...   | ...       | ...   |

VISUALIZATIONS:
- Pie chart: Cost by division
- Bar chart: Material vs Labor vs Equipment
- Timeline: Estimated project duration (8-10 weeks)

SIDEBAR (right):
- Estimator info (for Premium/Enterprise)
- Related estimates for comparison
- Request revision form
- Share/export options

TABS/SECTIONS:
1. Summary (default view)
2. Line Items (detailed breakdown)
3. Assemblies Used (with links to assembly details)
4. Assumptions & Exclusions
5. Value Engineering Options (if available)

OUTPUT: Full page at 1440px width with all sections
```

---

## PROMPT 19: Marketing Homepage with Services Grid

```
Design the Kealee Platform homepage showcasing all services.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF, Green #38A169

HERO SECTION:
- Headline: "Build Better, Build Smarter"
- Subheadline: "The complete construction platform. AI-powered tools + expert services for the DC-Baltimore corridor."
- Primary CTA: "Get Started Free" (orange)
- Secondary CTA: "See How It Works" (outline)
- Trust bar: 3,000+ jurisdictions | 85% approval rate | $50M+ managed
- Hero image: Dashboard screenshot or construction professional illustration

SERVICES GRID (6 cards, 3x2 on desktop):
1. PROJECT MANAGEMENT
   - Icon: FolderKanban
   - "Full visibility and control over your construction project"
   - Starting at $49/mo
   - CTA: Learn More →

2. PERMITS & INSPECTIONS
   - Icon: FileCheck (green accent)
   - "AI-powered permit processing. 85% first-try approval."
   - Starting at $495/permit
   - Badge: "Most Popular"
   - CTA: Learn More →

3. ESTIMATION SERVICES
   - Icon: Calculator (teal accent)
   - "Professional estimates in 24 hours. AI + expert review."
   - Starting at $299/estimate
   - Badge: "New"
   - CTA: Learn More →

4. PM SERVICES
   - Icon: Briefcase (orange accent)
   - "Let our experts manage your project. Remote PM services."
   - Starting at $1,750/mo
   - CTA: Learn More →

5. ARCHITECT PORTAL
   - Icon: PenTool (teal accent)
   - "Design project management built for architects."
   - Free for individuals
   - CTA: Learn More →

6. CONTRACTOR MARKETPLACE
   - Icon: Users
   - "Find verified contractors. Fair bidding, no pay-to-play."
   - Free to browse
   - CTA: Learn More →

HOW IT WORKS (3 steps):
1. Tell us about your project
2. Get AI-powered analysis + expert review
3. Build with confidence

TESTIMONIALS:
- 3 customer quotes with photos
- Mix of homeowners, contractors, architects

FINAL CTA SECTION:
- "Ready to build smarter?"
- "Get started in under 2 minutes"
- Email capture + "Start Free" button

FOOTER:
- Logo, tagline
- Navigation columns: Solutions, Services, Resources, Company
- Social links
- Legal: Privacy, Terms, Accessibility
- Copyright

OUTPUT: Full homepage at 1440px desktop + 375px mobile
```

---

## PROMPT 20: Figma Component Library Structure

```
Create a Figma component library structure for Kealee Platform.

FILE STRUCTURE:
📁 Kealee Design System
├── 📄 Cover
├── 📄 Getting Started (usage guidelines)
│
├── 📁 🎨 Foundations
│   ├── Colors (with light/dark mode)
│   ├── Typography (Clash Display, Plus Jakarta Sans, JetBrains Mono)
│   ├── Spacing (4px base grid)
│   ├── Icons (Lucide subset)
│   ├── Shadows & Effects
│   └── Grid System (12-column)
│
├── 📁 🧱 Components
│   ├── Buttons (primary, secondary, outline, ghost, sizes)
│   ├── Inputs (text, select, checkbox, radio, toggle)
│   ├── Cards (service card, pricing card, stat card)
│   ├── Badges (status, category, "NEW", "Popular")
│   ├── Navigation (sidebar, header, breadcrumbs, tabs)
│   ├── Tables (with sorting, pagination)
│   ├── Modals (dialog, drawer, sheet)
│   ├── Alerts (success, warning, error, info)
│   └── Loading (skeleton, spinner, progress)
│
├── 📁 📊 Estimation Components
│   ├── Estimate Summary Card
│   ├── Cost Breakdown Table
│   ├── CSI Division Selector
│   ├── Assembly Card
│   ├── AI Confidence Indicator
│   ├── Regional Cost Selector
│   └── Takeoff Measurement UI
│
├── 📁 🎯 Marketing Components
│   ├── Hero Section (variants)
│   ├── Feature Grid
│   ├── Pricing Table
│   ├── Testimonial Card
│   ├── FAQ Accordion
│   ├── CTA Section
│   └── Footer
│
├── 📁 📱 Templates
│   ├── Landing Page
│   ├── Dashboard (light + dark)
│   ├── Estimation Flow (4 steps)
│   ├── Auth (login, register)
│   └── Error Pages (404, 500)
│
└── 📁 📄 Pages (Production Designs)
    ├── Homepage
    ├── Permits Landing
    ├── Estimation Landing
    ├── Ops Services Landing
    ├── Pricing Overview
    ├── Homeowner Dashboard
    ├── Contractor Dashboard
    └── Estimate Results

NAMING CONVENTION:
- Components: PascalCase (e.g., "Button/Primary/Large")
- Variants: slash-separated (e.g., "Button/Primary/Hover")
- States: suffix (e.g., "Input/Text/Error")

AUTO-LAYOUT:
- All components use auto-layout
- Responsive variants for sm/md/lg breakpoints

TOKENS:
- Import from figma-tokens.json (Tokens Studio compatible)
- Light and Dark themes

OUTPUT: Figma file structure with empty frames ready for components
```

---

## PROMPT 21: Mobile App Navigation

```
Design mobile bottom navigation for Kealee Platform (Homeowner view).

BRAND:
- Background: White (light) / Navy 950 (dark)
- Active: Teal #2ABFBF icon + label
- Inactive: Gray 500 icons, no label
- Orange #E8793A for notification badges

BOTTOM TAB BAR (5 items):
┌─────────────────────────────────────────────────────────────┐
│   🏠        📁        🧮        📄        ⋯              │
│  Home    Projects  Estimate  Permits    More              │
└─────────────────────────────────────────────────────────────┘

ICONS (Lucide):
1. Home (LayoutDashboard)
2. Projects (FolderKanban)
3. Estimate (Calculator) - with notification dot for new estimates
4. Permits (FileCheck)
5. More (MoreHorizontal) - opens action sheet

"MORE" ACTION SHEET:
- Find Contractors
- Payments
- Documents
- Reports
- Settings
- Help & Support
- Log Out

SPECIFICATIONS:
- Tab bar height: 64px
- Icon size: 24px
- Label size: 10px
- Safe area padding: 34px bottom (iPhone notch)
- Touch target: 48x48px minimum

STATES:
- Default: Gray icon, no label
- Active: Teal icon, teal label, subtle background
- Pressed: Scale 0.95

OUTPUT: Mobile navigation at 375px width, light + dark mode
```

---

## PROMPT 22: Login Page Design

```
Design a login page for Kealee Platform client portals.

BRAND:
- Navy #1A2B4A (primary)
- Orange #E8793A (CTA)
- Teal #2ABFBF (links)
- White background

LAYOUT (Split screen):
LEFT SIDE (60%):
- Large hero image or illustration of construction professional
- Overlay with brand tagline: "Build Better, Build Smarter"
- Trust indicators at bottom

RIGHT SIDE (40%):
- Kealee logo at top
- "Welcome back" headline
- Portal selector tabs (if applicable): Homeowner | Contractor | Professional
- Email input field
- Password input field with show/hide toggle
- "Forgot password?" link (teal)
- "Sign In" button (orange, full width)
- Divider: "or continue with"
- Social login buttons: Google, Apple
- "Don't have an account? Sign up" link

MOBILE:
- Full width form
- Hero image as background with overlay
- Form card overlaid on bottom

STATES:
- Default
- Loading (spinner on button)
- Error (red border on invalid fields)
- Success (redirect)

OUTPUT: Desktop (1440px) and mobile (375px) versions
```

---

## PROMPT 23: Portal Selection / Account Type

```
Design a portal selection screen for new user signup.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF

HEADLINE: "Choose Your Portal"
SUBHEADLINE: "Select the option that best describes you"

3 PORTAL CARDS (horizontal on desktop, stacked on mobile):

1. HOMEOWNER PORTAL
   - Icon: Home (navy)
   - "For Homeowners"
   - Description: "Manage your residential construction project from start to finish"
   - Features: Project tracking, Contractor search, Payment protection, Permits
   - CTA: "Get Started" (orange)

2. CONTRACTOR PORTAL
   - Icon: HardHat (orange)
   - "For Contractors & Developers"
   - Description: "Manage projects, bids, and teams. For GCs, builders, and developers."
   - Features: Bid management, Estimation tools, Team collaboration, Scheduling
   - CTA: "Get Started" (orange)
   - Badge: "Most Popular" (if applicable)

3. PROFESSIONAL PORTAL
   - Icon: PenTool (teal)
   - "For Architects & Engineers"
   - Description: "Design project management for architects, designers, and engineers"
   - Features: Deliverable tracking, Client collaboration, Fee management, Permits
   - CTA: "Get Started" (orange)

CARD DESIGN:
- White cards with subtle shadow
- Icon at top (48px)
- Portal name (24px semibold)
- Description (16px gray-600)
- Feature list with checkmarks
- Full-width CTA at bottom

FOOTER:
- "Not sure which to choose? Contact us for help"

OUTPUT: Desktop and mobile with hover states
```

---

## PROMPT 24: Contractor Portal Dashboard

```
Design the contractor portal dashboard (contractor.kealee.com).

BRAND:
- Light mode: White background
- Dark mode: Navy 950 #0F1A2E
- Accent: Orange #E8793A (primary), Teal #2ABFBF (secondary)

HEADER (64px):
- Logo: "Kealee" with "Contractor" label
- Search bar
- Notifications bell with badge
- User avatar dropdown
- "Login" / "Sign Up" buttons (for public pages only)

SIDEBAR (240px) - See Contractor Navigation structure

MAIN DASHBOARD CONTENT:

STATS ROW (4 cards):
1. Active Projects: "12" with +2 vs last month
2. Open Bids: "8" opportunities
3. Won Projects: "$2.4M" this quarter
4. Team Members: "24" active

QUICK ACTIONS ROW:
- "New Estimate" (teal button)
- "Submit Bid" (orange button)
- "View Opportunities" (outline button)

PROJECTS TABLE:
| Project | Client | Status | Value | Due Date |
| Smith Reno | John Smith | In Progress | $125K | Feb 28 |
| Office Build | Acme Corp | Bidding | $450K | Mar 15 |
| ... | ... | ... | ... | ... |

SIDEBAR WIDGETS:
- Upcoming Inspections (3 items)
- Pending Approvals (2 items)
- Recent Activity feed

SERVICES ACCESS (bottom):
- Quick links to: Estimation, Permits, Marketplace

OUTPUT: Full dashboard at 1440x900px, light and dark mode
```

---

## PROMPT 25: Professional Portal Dashboard

```
Design the professional portal dashboard (professional.kealee.com).

BRAND:
- Light mode: White background
- Dark mode: Navy 950 #0F1A2E
- Accent: Teal #2ABFBF (primary), Orange #E8793A (CTA)

HEADER (64px):
- Logo: "Kealee" with "Professional" label
- Search bar
- Notifications bell
- User avatar dropdown

SIDEBAR (240px) - See Professional Navigation structure

MAIN DASHBOARD CONTENT:

STATS ROW (4 cards):
1. Active Projects: "8"
2. Deliverables Due: "5" this week
3. Pending Reviews: "3"
4. Revenue YTD: "$180K"

PHASE PROGRESS:
- Visual timeline showing project phases
- Current projects mapped to phases (Pre-Design, Schematic, DD, CD, Permit, CA)

PROJECTS TABLE:
| Project | Client | Phase | Fee | Next Deliverable |
| Smith Residence | John Smith | Design Dev | $45K | Floor Plans |
| Office Complex | Acme Corp | Schematic | $120K | Site Plan |

DELIVERABLES WIDGET:
- List of upcoming deliverables with due dates
- Status indicators (On Track, At Risk, Overdue)

CLIENT ACTIVITY:
- Recent client comments/approvals
- Pending client reviews

QUICK ACTIONS:
- "Upload Deliverable" (teal)
- "Request Estimate" (orange)
- "Create Invoice" (outline)

OUTPUT: Full dashboard at 1440x900px
```

---

## PROMPT 26: Marketplace Homepage with Portal Access

```
Design the marketplace homepage (marketplace.kealee.com) showing service access.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF

HEADER:
- Logo: "Kealee Marketplace"
- Navigation: Find Contractors | Post Project | Services | Pricing
- "Login" | "Sign Up" buttons (for visitors)
- User menu (for logged-in users)

HERO SECTION:
- Headline: "Find Trusted Contractors"
- Subheadline: "Fair bidding platform for verified contractors. No pay-to-play."
- Search bar: "What type of project?" + Location
- CTA: "Search Contractors" (orange)
- Trust stats: "500+ verified contractors" | "3.5% commission" | "$50M+ projects"

SERVICES ACCESS CARDS (for logged-in users):
Row of 4 service cards linking to integrated services:
1. Estimation - "Get accurate estimates" → /estimation
2. Permits - "Process permits faster" → /permits
3. Finance - "Secure payments" → /finance
4. PM Services - "Expert project management" → /pm-services

HOW IT WORKS:
1. Post your project → 2. Receive bids → 3. Choose contractor → 4. Build with confidence

FEATURED CONTRACTORS:
- Grid of contractor cards with ratings, specialties, projects completed

CATEGORIES:
- Browse by category: Kitchen, Bathroom, Addition, New Construction, Commercial

TESTIMONIALS:
- Homeowner success stories

FOOTER CTA:
- "Ready to find your contractor?"
- "Post Your Project" (orange) | "Browse Contractors" (outline)

OUTPUT: Full page at 1440px desktop + 375px mobile
```

---

## PROMPT 27: Service Access Cards Component

```
Design service access cards for displaying within client portal dashboards.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF

PURPOSE: Quick access to platform services from within any client portal dashboard

CARD GRID (4 cards, 2x2 or 4x1):

1. ESTIMATION SERVICES
   - Icon: Calculator (teal, 32px)
   - "Estimation"
   - "AI-powered cost estimates"
   - Status: "2 estimates pending" (if applicable)
   - CTA: "Request Estimate" →

2. PERMITS & INSPECTIONS
   - Icon: FileCheck (green, 32px)
   - "Permits"
   - "85% first-try approval"
   - Status: "1 permit in progress" (if applicable)
   - CTA: "View Permits" →

3. CONTRACTOR MARKETPLACE
   - Icon: Store (navy, 32px)
   - "Marketplace"
   - "Find verified contractors"
   - Status: "3 new bids" (if applicable)
   - CTA: "Browse Contractors" →

4. FINANCE & TRUST
   - Icon: Shield (green, 32px)
   - "Payments"
   - "Secure escrow protection"
   - Status: "$12,500 in escrow"
   - CTA: "Manage Payments" →

CARD DESIGN:
- White card, subtle shadow
- Hover: lift + shadow increase
- Icon + title row
- Description (gray-600)
- Status badge (if applicable)
- Arrow CTA at bottom right
- 16px padding

OUTPUT: Component at 280px width per card, with hover state
```

---

## PROMPT 28: Header with Login/Signup CTAs

```
Design a responsive header component with login CTAs for marketing pages.

BRAND: Navy #1A2B4A, Orange #E8793A, Teal #2ABFBF

DESKTOP HEADER (1440px, 72px height):

LEFT:
- Kealee logo (link to home)

CENTER:
- Navigation links: Solutions ▼ | Services ▼ | Pricing | Resources ▼
- Dropdowns on hover

RIGHT:
- "Login" (text link, navy)
- "Sign Up Free" (orange button, rounded)

MOBILE HEADER (375px, 64px height):
- Hamburger menu (left)
- Logo (center)
- "Sign Up" button (right, compact)

MOBILE MENU (slide-in from left):
- User section at top (if logged in) or Login/Sign Up buttons
- Navigation accordion
- Close button

STATES:
- Default (transparent or white background)
- Scrolled (solid white with shadow)
- Mobile menu open

LOGGED-IN VARIANT:
- Replace Login/Sign Up with:
  - Notifications bell
  - User avatar dropdown (Profile, Settings, Dashboard, Logout)

OUTPUT: Desktop and mobile with all states
```

---

*Generated for Kealee Platform v10 - February 2026*
*Includes 3-Portal Architecture with Full Service Integration*
