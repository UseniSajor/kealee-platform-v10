# Kealee Preconstruction Services Marketing Plan

**Campaign:** Build With Clarity  
**Primary page:** `/campaigns/preconstruction`  
**Offer:** A scope review that routes the prospect to design concepts, catalogue-based estimating, permit planning, or a connected preconstruction plan.

## Positioning

Kealee helps project owners answer three questions before construction begins:

1. What are we actually building?
2. What does the defined scope cost based on quantities and documented assumptions?
3. What must be prepared for the applicable permit process?

The campaign does not advertise generic cost-per-square-foot pricing or promise an exact estimate before scope and quantities exist. Exact pricing belongs in the platform's catalogue-based estimating workflow.

## Priority Audiences

| Audience | Trigger | Primary concern | Entry service |
|---|---|---|---|
| Property owner | Renovation, addition, or new build is being considered | Turning an idea into a practical scope | Design concepts |
| Small developer | Site or unit concept needs feasibility review | Scope, unit assumptions, and early cost exposure | Connected preconstruction |
| Contractor or designer | Client needs an organized decision package | Reducing unclear scope before pricing or drawings | Estimate or permit planning |
| Commercial owner | Improvement or build-out is approaching approval | Budget basis and submission dependencies | Estimate and permit planning |

## Message Framework

**Promise:** Know what you are building before construction begins.

**Proof pillars:**

- Catalogue-referenced labor, material, and equipment pricing
- Documented quantities and assumptions
- Project and jurisdiction-specific inputs
- One connected record from concept through permit planning

**Primary CTA:** Request a scope review  
**Secondary CTA:** Explore preconstruction services

## Funnel

| Stage | Prospect action | Kealee action | KPI |
|---|---|---|---|
| Awareness | Views educational content | Explain one expensive early-stage mistake | Qualified sessions |
| Consideration | Visits campaign page | Show connected services and methodology | CTA click rate |
| Qualification | Submits project details | Save attribution and route to platform lifecycle | Form completion rate |
| Scope review | Supplies plans, units, size, or jurisdiction data | Identify missing inputs and recommended service | Qualified lead rate |
| Conversion | Starts a paid platform workflow | Generate project-specific deliverables | Lead-to-paid rate |
| Expansion | Completes first service | Offer the next relevant preconstruction service | Multi-service adoption |

## Channel Plan

1. **Search content:** High-intent pages around construction estimate assumptions, permit-readiness checklists, and concept-to-budget workflows.
2. **LinkedIn:** Educational posts for developers, contractors, architects, and owner representatives.
3. **Email:** Six-message qualification and education sequence in `campaigns/preconstruction-drip.json`.
4. **Partner referrals:** A single-page referral path for contractors, designers, real estate professionals, and lenders.
5. **Project proof:** Anonymized examples showing inputs, assumptions, division breakdowns, and permit-path outputs without publishing unsupported pricing claims.

## Measurement

Launch targets are operating assumptions, not historical benchmarks:

- Campaign-page CTA click rate: 8%
- Form completion after form start: 45%
- Qualified lead rate: 35%
- Scope-review-to-paid conversion: 20%
- Attribution coverage: 90% of captured leads
- Response-time target: one business day

Report weekly by service, project type, jurisdiction, source, and funnel stage. Replace targets with rolling four-week actuals after the first 30 qualified leads.

## Implementation

- Campaign UI: `apps/marketing/pages/campaigns/[slug].tsx`
- Lead capture: `apps/marketing/pages/api/leads/capture.ts`
- Canonical lead lifecycle: `apps/web-main/app/api/leads/marketing/route.ts`
- Launch specification: `plans/preconstruction-services-2026.json`
- Content calendar: `campaigns/preconstruction-launch.json`
- Nurture sequence: `campaigns/preconstruction-drip.json`
- Replicate media command: `pnpm --filter web-main generate:preconstruction-media`
- Generated media manifest: `apps/marketing/public/media/generated/manifest.json`

## Campaign Media

The campaign uses the platform's Replicate integration:

- Flux 1.1 Pro Ultra generates project-specific design, estimating, and permit-planning images.
- Kling 2.5 Turbo Pro turns the design image into the restrained hero background video.
- Prompts avoid unsupported project claims, visible brands, people, and fake readable construction data.
- Generated files are committed under the marketing app so the landing page does not depend on temporary Replicate URLs.
