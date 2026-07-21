/**
 * Nextdoor Organic Content Strategy — Kealee
 *
 * Nextdoor organic is hyperlocal and neighborhood-specific.
 * Unlike Reddit (topical communities), Nextdoor content appears in
 * neighbor feeds based on geographic proximity.
 *
 * Setup: business.nextdoor.com → create a free Business Page
 * Account type: Local Business
 * Category: Home Services > General Contractor / Design Services
 *
 * Core tactics:
 * 1. Business Posts — appear in neighborhood feeds (limited to ~1/week per neighborhood)
 * 2. Recommendations — get clients to leave recommendations; 10+ = "Neighborhood Fave"
 * 3. Reply to Recommendation Requests — when neighbors ask for contractor referrals
 * 4. Local Deals — Nextdoor has a Deals section; free for businesses
 * 5. Event Posts — for any DMV open house / project tours
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  ADU_BUNDLE_PRICE,
  CONCEPT_LANDSCAPE_PRICE,
} from '@/lib/marketing/pricing'

// ─── Target neighborhoods ─────────────────────────────────────────────────────
// Focus on high-renovation-activity zip codes in the DMV.
// Nextdoor business posts reach neighbors within a configurable radius.

export const TARGET_NEIGHBORHOODS = {
  DC: [
    { name: 'Capitol Hill', zip: '20003', notes: 'High renovation activity, many historic row houses' },
    { name: 'Petworth',     zip: '20011', notes: 'Active renovation market, permit complexity' },
    { name: 'Columbia Heights', zip: '20009', notes: 'High condo/rowhouse renovation volume' },
    { name: 'Cleveland Park',   zip: '20008', notes: 'High-income, addition and ADU interest' },
    { name: 'Chevy Chase DC',   zip: '20015', notes: 'Kitchen/bath + addition renovations' },
    { name: 'Georgetown',       zip: '20007', notes: 'Historic district — HPO permit angle' },
    { name: 'Glover Park',      zip: '20007', notes: 'High home value, significant renovation budgets' },
    { name: 'Brookland',        zip: '20017', notes: 'Growing renovation market' },
  ],
  NoVA: [
    { name: 'Old Town Alexandria', zip: '22314', notes: 'Historic district, active renovation' },
    { name: 'Clarendon / Arlington', zip: '22201', notes: 'ADU interest, addition permits' },
    { name: 'McLean',              zip: '22101', notes: 'High-end renovation, addition/ADU' },
    { name: 'Vienna',              zip: '22180', notes: 'Active renovation market' },
    { name: 'Falls Church',        zip: '22046', notes: 'Kitchen/bath + ADU' },
    { name: 'Reston',              zip: '20190', notes: 'HOA-heavy — permit + HOA angle' },
    { name: 'Herndon',             zip: '20170', notes: 'Growing market' },
    { name: 'Annandale',           zip: '22003', notes: 'High renovation volume' },
  ],
  Maryland: [
    { name: 'Bethesda',         zip: '20814', notes: 'High-income, kitchen/bath/addition' },
    { name: 'Chevy Chase MD',   zip: '20815', notes: 'Historic + renovation activity' },
    { name: 'Silver Spring',    zip: '20901', notes: 'Diverse renovation market' },
    { name: 'Rockville',        zip: '20850', notes: 'Active permit market' },
    { name: 'Takoma Park',      zip: '20912', notes: 'Renovation + sustainability angle' },
    { name: 'Potomac',          zip: '20854', notes: 'High-end, addition/whole house reno' },
    { name: 'Gaithersburg',     zip: '20877', notes: 'Growing renovation market' },
  ],
} as const

// ─── Business post schedule ───────────────────────────────────────────────────

export interface NextdoorPost {
  week: number
  type: 'business-post' | 'local-deal' | 'recommendation-request-reply' | 'event'
  targetArea: 'DC' | 'NoVA' | 'Maryland' | 'all'
  title: string
  body: string
  callToAction?: string
  scheduledDate?: string
}

export const NEXTDOOR_POSTS: NextdoorPost[] = [

  // ── Week 1 — Intro post ───────────────────────────────────────────────────
  {
    week: 1,
    type: 'business-post',
    targetArea: 'all',
    scheduledDate: '2026-05-27',
    title: 'We help DMV homeowners plan renovations before hiring a contractor',
    body: `Hi neighbors — Kealee is a DC-based construction planning service. We work with homeowners in DC, Maryland, and Northern Virginia who are planning a renovation or addition.

What we do:

→ AI-generated design concepts for kitchen, bath, addition, and ADU projects
→ Permit research and filing (DC DLCP, Montgomery County, Fairfax, Arlington)
→ Cost estimates before you hire anyone
→ Scope of work preparation so contractor quotes are actually comparable

Why this matters: most renovation projects go over budget because the scope wasn't defined before contractors started bidding. We fix the planning phase before the construction phase starts.

If you're thinking about a renovation in the next 6–12 months, happy to answer questions about what your project will need — permits, timeline, expected cost range.

Design concepts start at $${CONCEPT_KITCHEN_PRICE}. Permit packages from $${PERMIT_STANDARD_PRICE}.

Visit kealee.com or reply here with questions.`,
    callToAction: 'kealee.com',
  },

  // ── Week 2 — Permit angle ─────────────────────────────────────────────────
  {
    week: 2,
    type: 'business-post',
    targetArea: 'DC',
    scheduledDate: '2026-06-03',
    title: 'DC permit process update — what neighbors should know before starting renovation work',
    body: `For anyone planning renovation work in DC: DCRA has transitioned to DLCP (Department of Licensing and Consumer Protection) and the permit process has some important updates.

What's changed and what to know:

**Current DC permit timelines:**
- Simple permits (single trade work): 3–5 weeks if submittal is complete
- Standard renovation with MEP changes: 8–12 weeks
- Additions and ADUs: 12–18 weeks
- Historic districts (Georgetown, Capitol Hill, many others): add 4–8 weeks for HPO review

**The most common mistake we see:**
Starting work before the permit is in hand — or worse, skipping the permit entirely. At resale, unpermitted work can kill a sale or require expensive retroactive inspections.

**What typically requires a permit in DC:**
- Any structural changes (opening walls, adding beams)
- Electrical panel work, new circuits, subpanel additions
- Plumbing changes (moving fixtures, adding drains)
- Basement finishing
- Decks, additions, ADUs

If you're not sure whether your project requires a permit, the DLCP permit portal is at permits.dc.gov. You can also reply here — we navigate this daily and happy to help.`,
  },

  // ── Week 2 — NoVA ADU ─────────────────────────────────────────────────────
  {
    week: 2,
    type: 'business-post',
    targetArea: 'NoVA',
    scheduledDate: '2026-06-04',
    title: 'ADU feasibility in Northern Virginia — what neighbors are asking us about',
    body: `We've been getting a lot of questions from NoVA homeowners about ADUs (Accessory Dwelling Units) — backyard cottages, garage apartments, or basement units. Here's what actually matters for feasibility.

**The first question: does your lot allow it?**

Northern Virginia ADU rules vary by jurisdiction and zoning district. Key variables:
- Minimum lot size (most jurisdictions require 6,000–8,000+ sq ft)
- Setbacks from property lines (typically 5 ft sides, 25 ft rear from any street)
- Lot coverage limits (impervious surface cap, usually 25–35%)
- Height restrictions for accessory structures

**Arlington County** has one of the more permissive ADU policies in Virginia. **Fairfax County** is more restrictive and depends heavily on your specific zoning district.

**The economics:**
Detached ADU (400–600 sq ft): $120,000–$220,000 construction cost
Current NoVA 1BR rental rate: $1,600–$2,300/month depending on area
Payback: 8–12 years on construction cost, plus significant property value increase

**If you're interested:**
Step 1 is a zoning feasibility check — we do this as part of our ADU concept package ($${ADU_BUNDLE_PRICE}) which includes site feasibility, floor plan direction, cost estimate, and permit path.

Happy to answer questions about your specific zip code or lot situation.`,
  },

  // ── Week 3 — Maryland permit guide ───────────────────────────────────────
  {
    week: 3,
    type: 'business-post',
    targetArea: 'Maryland',
    scheduledDate: '2026-06-10',
    title: 'Montgomery County permits — what homeowners need to know in 2026',
    body: `For neighbors doing renovation work in Montgomery County — here's a current overview of the permit process and timelines.

**Current Montgomery County permit timelines:**
- Simple permits: 2–4 weeks
- Kitchen/bath with MEP changes: 5–8 weeks
- Room addition: 8–14 weeks
- ADU (new construction): 10–16 weeks
- Historic properties (MHT review): add 4–8 weeks

**Submitting online:**
Most residential permits go through Accela Citizen Access (the MontgomeryCountyMD.gov permit portal). Complete, well-organized submittals get processed faster — incomplete applications restart the clock.

**What causes delays:**
- Missing dimensions or notes on drawings
- No structural engineer stamp when required
- Scope description doesn't match the drawings
- Contractor license number not included

**For additions and ADUs specifically:**
You'll need a site plan showing lot dimensions, all existing structures, the proposed structure, setback measurements, and an impervious surface calculation. This is separate from the building drawings.

If you're in a flood zone (check FEMA's flood map for your address), expect additional review.

We file permits in Montgomery County regularly. Happy to answer specific questions about your project or scope.

Permit packages from $${PERMIT_STANDARD_PRICE} — kealee.com/products/permit-package`,
  },

  // ── Week 4 — Contractor selection ────────────────────────────────────────
  {
    week: 4,
    type: 'business-post',
    targetArea: 'all',
    scheduledDate: '2026-06-17',
    title: 'Why renovation quotes vary so much (and how to get comparable bids)',
    body: `One of the most common questions we get from neighbors: "I got three quotes and they're $40,000 apart. What's going on?"

The answer is almost always an undefined scope.

When contractors quote from a verbal description or a vague brief ("update the kitchen"), they fill in different assumptions:
- One includes custom cabinets, one includes stock
- One includes the permit cost, two don't
- One assumes you're moving the sink, two don't
- One includes demo, one assumes the homeowner does demo

**The fix: a scope of work document before you request bids.**

You don't need architectural drawings. You need a written document that specifies:
1. What's being removed/demolished
2. What MEP (plumbing, electrical, HVAC) changes are involved
3. Whether there's any structural work
4. What finish materials or allowances you're using
5. Who's responsible for the permit

When all three contractors bid the same scope, the quotes compress. The outliers either have something the others don't, or they'll adjust when you ask.

**Before hiring any contractor in the DMV, also verify:**
- License active and in good standing (each state has an online lookup)
- General liability insurance (ask for certificate, minimum $1M)
- Workers' comp if they have employees

We include a contractor-ready scope brief with every Kealee concept package — specifically so you can get comparable bids. Concepts from $${CONCEPT_KITCHEN_PRICE} at kealee.com.`,
  },

  // ── Week 5 — Local deal post ──────────────────────────────────────────────
  {
    week: 5,
    type: 'local-deal',
    targetArea: 'all',
    scheduledDate: '2026-06-24',
    title: 'Neighbor discount — $50 off any Kealee concept package',
    body: `For Nextdoor neighbors in the DC/MD/VA area: use code NEIGHBOR50 at checkout for $50 off any Kealee concept or permit package.

What's included in a concept package:
→ 3 AI-generated layout concepts for your space (kitchen, bath, addition, ADU, basement, or deck)
→ Itemized cost estimate by trade (demo, framing, electrical, plumbing, finishes)
→ Permit scope assessment for your jurisdiction
→ Contractor-ready scope brief for getting comparable bids

Concepts start at $${CONCEPT_KITCHEN_PRICE - 50} after the neighbor discount.

Valid through end of June. Limit one per household. Visit kealee.com to order.`,
    callToAction: 'kealee.com — use code NEIGHBOR50',
  },

  // ── Week 6 — Outdoor/landscape ────────────────────────────────────────────
  {
    week: 6,
    type: 'business-post',
    targetArea: 'all',
    scheduledDate: '2026-07-01',
    title: 'Deck, patio, and landscape planning — what requires a permit in the DMV',
    body: `With summer here, a lot of neighbors are thinking about outdoor projects. Here's a quick guide to what requires permits in our area for decks, patios, and landscaping.

**Decks:**
- Decks attached to the house and over 30 inches off grade: permit required in all three jurisdictions
- Freestanding decks under 200 sq ft at grade: often exempt but check your jurisdiction
- Rooftop decks: always require a permit

**Patios and hardscape:**
- Ground-level patios (pavers, concrete): usually no permit if below impervious surface limits
- Covered patios / pergolas attached to house: permit required in most jurisdictions
- Impervious surface limits matter — if you're adding a lot of hardscape, you may be close to your lot coverage cap

**Fences:**
- Over 6 feet: permit required in most DMV jurisdictions
- Corner lots often have height restrictions near the street

**Pools:**
- All in-ground pools require permits
- Above-ground pools: varies by jurisdiction and size

**Retaining walls:**
- Over 4 feet: permit required in most jurisdictions

The fastest way to verify: call or check your local permit office website before you start. 10-minute verification prevents a stop-work order later.

We do landscape concepts starting at $${CONCEPT_LANDSCAPE_PRICE} — kealee.com/products if you want a design before you hire.`,
  },
]

// ─── Recommendation request reply templates ───────────────────────────────────
// When a neighbor posts "Can anyone recommend a contractor?" or
// "Looking for someone to help with permits" — reply with these.
// Always personalize to their specific situation.

export const RECOMMENDATION_REPLY_TEMPLATES = {
  general_contractor: `Hi [Name] — we may be able to help. Kealee is a DC-based construction planning service — we help homeowners prepare for renovation projects before hiring a contractor.

For your [project type], that would include a design concept with 3 layout options, an itemized cost estimate, permit scope assessment, and a scope brief you can send to contractors for comparable bids.

The reason we recommend doing this first: most of the time when contractors quote significantly different prices, it's because the scope wasn't defined before bidding. A clear scope brief gets you comparable quotes and helps identify if any contractor is missing work items.

If you'd like to talk through your project first, feel free to DM me. kealee.com if you want to see what we do.`,

  permit_help: `Hi [Name] — permit work in [jurisdiction] is something we handle regularly. For [project type], you're looking at [timeline estimate] with [jurisdiction].

The most important thing for a smooth permit process is a complete submittal on the first attempt — incomplete applications go to the back of the queue. We handle the drawings, application prep, and submittal.

Permit packages start at $${PERMIT_STANDARD_PRICE}. DM me if you'd like to talk through what your project needs — kealee.com/products/permit-package.`,

  adu_interest: `Hi [Name] — ADU feasibility in [jurisdiction] depends mostly on your lot's zoning, size, and existing coverage. Some NoVA lots qualify easily; others have setback or coverage constraints that make it difficult.

The first step is a zoning and feasibility check — we include this in our ADU concept package ($${ADU_BUNDLE_PRICE}), which also covers floor plan direction, cost estimate, and permit path for your jurisdiction.

Happy to tell you more about what's typically allowed in your area. DM me with your zip code and I can give you a quick read on feasibility.`,

  contractor_recommendation: `For [project type] in [area], I'd suggest a few things before hiring:

1. Verify license through [state] contractor board (all have online lookups)
2. Ask for general liability certificate — minimum $1M
3. Get at least 3 quotes, but make sure they're all quoting the same scope

The scope part is where people get in trouble — if you want, we help homeowners build a scope brief before they go to bid, which makes quotes comparable. Happy to point you in the right direction.`,
}

// ─── Nextdoor Business Page setup checklist ───────────────────────────────────

export const SETUP_CHECKLIST = [
  'Create business page at business.nextdoor.com',
  'Business name: Kealee',
  'Category: Home Services > Contractor (General)',
  'Service area: Set to DC/MD/VA metro (can set radius in miles from zip)',
  'Description: 150-char max — "AI-powered design concepts, permit filing, and construction planning for DC, Maryland, and Virginia homeowners."',
  'Website: kealee.com',
  'Phone: Add business phone',
  'Upload logo (square, min 256x256px)',
  'Upload 3–5 project photos to gallery',
  'Request recommendations from past clients (email them the direct link)',
  'Goal: 10 recommendations = "Neighborhood Fave" badge',
  'Verify your business address to unlock full posting features',
  'Enable "Nextdoor for Business" notifications for recommendation requests in your service area',
]

// ─── UTM links for Nextdoor ───────────────────────────────────────────────────

export function nextdoorUtmLink(path: string, neighborhood: string, postType: string): string {
  const base = 'https://kealee.com'
  const params = new URLSearchParams({
    utm_source: 'nextdoor',
    utm_medium: 'organic',
    utm_campaign: neighborhood.toLowerCase().replace(/\s+/g, '-'),
    utm_content: postType,
  })
  return `${base}${path}?${params.toString()}`
}

// ─── Promo code for neighbor discount ────────────────────────────────────────

export const NEXTDOOR_PROMO_CODE = 'NEIGHBOR50'
export const NEXTDOOR_PROMO_DISCOUNT = 50  // dollars off
