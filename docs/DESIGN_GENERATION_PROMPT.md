# Kealee Platform - Design Generation Prompt

Use this prompt with AI design tools (Figma AI, Midjourney, DALL-E) or as a brief for designers.

---

## Brand Identity

**Company**: Kealee Platform
**Tagline**: "Build Better, Build Smarter"
**Core Differentiator**: Kealee provides SERVICE - Remote Project Management and Construction Operations, not just software.

**Target Market**: DC-Baltimore Corridor construction professionals
- Project owners & investors
- Architects & designers
- General contractors
- Specialty subcontractors
- Property developers

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
- **Teal**: Feature icons, technology sections, secondary highlights
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
- **JetBrains Mono** (Pricing/Numbers) - Technical precision for costs

### Hierarchy
```
Hero Headlines:     60-72px / Bold / -0.025em tracking
Section Headlines:  36-48px / Semibold / -0.025em tracking
Card Headlines:     24-30px / Semibold
Body Large:         18px / Regular / 1.6 line-height
Body:               16px / Regular / 1.5 line-height
Captions:           14px / Medium / 0.025em tracking (uppercase for labels)
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
- **Use cases**: Process flows, feature explanations, empty states
- **Don't**: Avoid cartoon/playful styles; stay professional

### Icons
- **Style**: Lucide icons (outline style, 24px standard)
- **Weight**: 1.5-2px stroke
- **Usage**: Feature lists, navigation, status indicators

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
- Price prominent with period (e.g., "$249/month")
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
- Arrow CTA (bottom-right)
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
│   └── Marketing/
│       ├── Hero
│       ├── Pricing
│       ├── Features
│       └── Testimonials
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
    ├── Pricing
    └── Dashboard
```

---

## Quick Reference: Product Offering

### Apps/Portals
| Portal | URL | Primary User |
|--------|-----|--------------|
| Project Owner | app.kealee.com | Homeowners, investors |
| Architect | architect.kealee.com | Design professionals |
| Permits | permits.kealee.com | Anyone needing permits |
| Ops/PM | ops.kealee.com | Contractors, GCs |
| Marketplace | marketplace.kealee.com | All users |

### Key Price Points
- **Permits**: $495 - $2,995 (one-time) or $7,500/mo (enterprise)
- **PM Software**: $99 - $499/mo
- **PM Services**: $1,750 - $16,500/mo
- **Architect**: Free - 3% of project value
- **Escrow**: 1% (max $500)
- **Platform Commission**: 3.5% (paid by contractor)

### Unique Selling Points
1. "TurboTax for Building Permits" - 85% first-try approval
2. Remote PM Services - We run your project, not just software
3. Fair Bidding Marketplace - No pay-to-play
4. Integrated Platform - Permits → Design → Bidding → Payment
5. DC-Baltimore Expertise - Local knowledge, 3,000+ jurisdictions

---

## Example Prompt for AI Image Generation

```
Professional construction project manager reviewing blueprints on tablet with contractor, modern office with glass walls overlooking active construction site, warm natural lighting, diverse team, photorealistic, editorial style, 16:9 aspect ratio
```

```
Clean geometric illustration of building permit approval workflow, three connected nodes with icons (document, review, checkmark), navy blue and orange accent colors, minimal style on white background, vector art
```

---

*Generated for Kealee Platform v10 - February 2026*
