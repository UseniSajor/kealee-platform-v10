/**
 * Twitter / X Organic Content Strategy — Kealee
 *
 * Account: @kealee or @kealeeDMV (check availability at x.com)
 * Auto-posting cron: /api/cron/twitter
 * Schedule: daily at 9am ET (14:00 UTC) — Twitter rewards daily posting
 *
 * Twitter content style vs other platforms:
 * - Short, punchy. Single tweets max 280 chars.
 * - Threads (2–8 tweets) outperform single posts for educational content
 * - Hook tweet is everything — rewrite until the first tweet is irresistible
 * - No fluff. Every word earns its place.
 * - Lists and numbered threads perform best in construction/proptech niche
 * - Reply to bigger accounts in adjacent spaces (home improvement, real estate,
 *   proptech) to build followers without paid promotion
 *
 * API note: Twitter API v2 requires Basic tier ($100/mo) for write access.
 * Free tier is read-only. Set up at developer.twitter.com.
 *
 * Required env vars:
 *   TWITTER_API_KEY             — from developer.twitter.com app
 *   TWITTER_API_SECRET          — from developer.twitter.com app
 *   TWITTER_ACCESS_TOKEN        — OAuth 1.0a user token
 *   TWITTER_ACCESS_TOKEN_SECRET — OAuth 1.0a user token secret
 *   CRON_SECRET                 — shared cron auth
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  ADU_BUNDLE_PRICE,
  ESTIMATION_PRICE,
  PERMIT_BASIC_PRICE,
} from '@/lib/marketing/pricing'

export interface TwitterPost {
  week:          number
  day:           'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  scheduledDate: string
  type:          'single' | 'thread'
  tweets:        string[]   // single item for 'single', multiple for 'thread'
  tags?:         string[]   // hashtags to append to last tweet only
}

// ─── Post schedule (daily) ────────────────────────────────────────────────────

export const TWITTER_POSTS: TwitterPost[] = [

  // ── Week 1 ────────────────────────────────────────────────────────────────

  {
    week: 1, day: 'mon', scheduledDate: '2026-05-25', type: 'thread',
    tweets: [
      `You got 3 contractor quotes: $42K, $61K, $79K.

You have no idea why they're $37K apart.

Here's exactly what's happening (thread) 🧵`,

      `The contractors aren't quoting the same project.

They're guessing.

Without a defined scope, every contractor fills in assumptions differently.`,

      `What each contractor assumed differently:

$42K → excluded the permit ($1,800) and missed a new circuit
$79K → included custom cabinets you never asked for (+$22K)
$61K → most complete, but included demo you can do yourself`,

      `The fix: a scope of work document before you request a single bid.

It specifies:
→ What's being demolished
→ What MEP changes (plumbing, electrical, HVAC)
→ Finish materials or allowances
→ Who pulls the permit`,

      `When all 3 contractors bid the same scope:

The $37K gap collapses to ~$8K.

The outlier either has something the others don't, or they'll adjust.

Same project. Much clearer choice.`,

      `We build this scope doc as part of every Kealee concept package.

It's the document that makes every other part of the process work.

Concept packages from $${CONCEPT_KITCHEN_PRICE}: kealee.com`,
    ],
    tags: ['renovation', 'homeimprovement', 'DMV'],
  },

  {
    week: 1, day: 'tue', scheduledDate: '2026-05-26', type: 'single',
    tweets: [
      `DC permit timelines right now (mid-2026):

Simple work → 3–5 weeks
Kitchen/bath MEP → 8–12 weeks
Addition → 12–18 weeks
Historic district → add 4–8 weeks

The #1 cause of delays: incomplete submittal on day 1.

You don't get a partial review. You restart.`,
    ],
    tags: ['DCpermits', 'renovation', 'DLCP'],
  },

  {
    week: 1, day: 'wed', scheduledDate: '2026-05-27', type: 'single',
    tweets: [
      `Unpermitted work doesn't appraise.

If you're financing a renovation or planning to sell in the next 10 years, the permit isn't bureaucratic overhead.

It's the document that makes your work count.`,
    ],
  },

  {
    week: 1, day: 'thu', scheduledDate: '2026-05-28', type: 'thread',
    tweets: [
      `ADU economics in Northern Virginia — actual numbers from real projects 🧵`,

      `Project 1: Detached studio ADU, Springfield (530 sq ft)

Construction cost: $198K all-in
Breakdown:
→ Site work + utilities: $28K
→ Foundation: $22K
→ Framing + envelope: $48K
→ MEP: $41K
→ Finishes: $38K
→ Permit + design: $21K`,

      `Rental income: $1,850/month
Annual: $22,200
Gross yield on construction: 11.2%

Estimated property value increase: $130K–$165K
(Appraisers typically use 65–80% of construction cost)`,

      `Project 2: Basement ADU conversion, Capitol Hill (620 sq ft)

Construction cost: $127K
Rental income: $1,950/month
Annual: $23,400
Gross yield: 18.4%

Lower upfront cost. Better yield. Less property value uplift.`,

      `The math works. The zoning is the variable.

Not every lot allows an ADU. Check before you spend on plans:
→ Zoning district
→ Minimum lot size
→ Setbacks
→ Lot coverage limits

Our ADU bundle ($${ADU_BUNDLE_PRICE}) starts with the feasibility check: kealee.com`,
    ],
    tags: ['ADU', 'realestate', 'NoVA', 'DMV'],
  },

  {
    week: 1, day: 'fri', scheduledDate: '2026-05-29', type: 'single',
    tweets: [
      `70% of homeowners starting a renovation don't know their project needs a permit.

It's not ignorance. The rules are genuinely confusing and vary by jurisdiction.

But "I didn't know" doesn't prevent a stop-work order or a flag at resale.

10 minutes of permit research before you start planning. Every time.`,
    ],
  },

  {
    week: 1, day: 'sat', scheduledDate: '2026-05-30', type: 'single',
    tweets: [
      `Hot take: the design is the least important part of the renovation planning phase.

The scope of work, the permit path, and the cost estimate matter more.

A beautiful design you can't build affordably or legally isn't a plan.`,
    ],
  },

  {
    week: 1, day: 'sun', scheduledDate: '2026-05-31', type: 'single',
    tweets: [
      `What we've learned from processing hundreds of DMV renovation projects:

The projects that go smoothest have one thing in common.

The permit is in place before the contractor touches the site.

Every time.`,
    ],
  },

  // ── Week 2 ────────────────────────────────────────────────────────────────

  {
    week: 2, day: 'mon', scheduledDate: '2026-06-01', type: 'thread',
    tweets: [
      `DC historic district renovation — the permit process nobody explains clearly 🧵

~30% of DC residential properties are in a historic district.

If yours is, you're running 2 permit tracks simultaneously.`,

      `Standard DC permit: DLCP application → plan review → permit

Historic property: HPO review → DLCP review → permit

HPO goes first. DLCP won't issue until HPO signs off.`,

      `What triggers HPO review:
→ Any exterior change visible from a public way
→ Changes to historic fabric (original windows, doors, masonry)
→ New additions
→ Any demolition of contributing structure

Interior-only work with no exterior impact: usually exempt.`,

      `Current HPO timelines:
• Administrative (minor): 2–4 weeks
• Staff review (moderate): 4–8 weeks
• HPRB board review (significant): 8–12 weeks

The board meets monthly. Miss the submission deadline, add 4 weeks.`,

      `Practical implication:

If your exterior project has an HPO component, start the permit process 4–6 months before you want to start construction.

Not 6 weeks.

We file historic district permits in DC. DM us or: kealee.com/products/permit-package`,
    ],
    tags: ['DChistory', 'historicpreservation', 'DCpermits', 'renovation'],
  },

  {
    week: 2, day: 'tue', scheduledDate: '2026-06-02', type: 'single',
    tweets: [
      `The "20% contingency" rule for renovation budgets is not a strategy.

It's an admission that the scope isn't defined.

Define the scope. The contingency drops to 5–8%.`,
    ],
  },

  {
    week: 2, day: 'wed', scheduledDate: '2026-06-03', type: 'single',
    tweets: [
      `Montgomery County permit timelines (mid-2026):

Simple permits: 2–4 weeks
Kitchen/bath with MEP: 5–8 weeks
Addition: 8–14 weeks
ADU: 10–16 weeks
Historic (MHT): add 4–8 weeks

Submit complete drawings on first attempt. Incomplete = back of the queue.`,
    ],
    tags: ['MontgomeryCounty', 'Maryland', 'buildingpermits'],
  },

  {
    week: 2, day: 'thu', scheduledDate: '2026-06-04', type: 'thread',
    tweets: [
      `3 things that cause renovation cost overruns — and none of them are the contractor's fault 🧵`,

      `1. The permit or structural phase reveals something nobody planned for.

Demo happens. Wall opens. Knob-and-tube wiring. Non-load-bearing wall that's actually load-bearing. Wrong-location drain rough-in.

These are discoveries, not contractor errors. But they cost money.

Mitigation: get a structural assessment and electrical inspection before finalizing scope on older homes.`,

      `2. Scope expansion mid-project.

"While we're in here, can we also..."

Every mid-project change adds mobilization cost, material premium, and schedule impact.

Mitigation: make all decisions before construction starts. 3 weeks of extra planning prevents 8 weeks of mid-project chaos.`,

      `3. The permit cost and timeline weren't in the original plan.

A $1,500 permit becomes a $6,000 problem when it delays contractor start by 8 weeks and they remobilize.

Mitigation: build the permit into the project plan before you hire anyone.`,

      `The common thread: surprises.

The Kealee pipeline eliminates surprises: concept → permit path → scope → construction.

Takes longer upfront. Saves more during construction. kealee.com`,
    ],
  },

  {
    week: 2, day: 'fri', scheduledDate: '2026-06-05', type: 'single',
    tweets: [
      `Quick contractor verification checklist before you sign anything in the DMV:

DC: dcra.dc.gov — LHIC license lookup
Maryland: dllr.state.md.us/license
Virginia: dpor.virginia.gov/LicenseLookup

Plus:
→ General liability cert ($1M min)
→ Workers' comp if they have employees
→ Name on license = name on contract

10 minutes. Every time.`,
    ],
    tags: ['contractors', 'homeimprovement', 'DMV'],
  },

  {
    week: 2, day: 'sat', scheduledDate: '2026-06-06', type: 'single',
    tweets: [
      `Renovation budget reality check for DC/MD/VA (2026 market):

Kitchen remodel: $45K–$95K
Bathroom: $25K–$65K
Basement finish: $55K–$110K
Addition (300–500 sqft): $150K–$280K
ADU detached: $120K–$220K
Deck (attached, 300 sqft): $35K–$65K

These ranges are wide because scope isn't defined.
Define the scope. The range narrows significantly.`,
    ],
    tags: ['renovation', 'DMV', 'homeimprovement', 'constructioncost'],
  },

  {
    week: 2, day: 'sun', scheduledDate: '2026-06-07', type: 'single',
    tweets: [
      `The projects that go over budget share a common pattern:

They started construction before the permit was in hand.

The permit timeline isn't a formality. It's part of the project schedule.`,
    ],
  },

  // ── Week 3 ────────────────────────────────────────────────────────────────

  {
    week: 3, day: 'mon', scheduledDate: '2026-06-08', type: 'thread',
    tweets: [
      `Basement finishing in the DMV — the complete guide in one thread 🧵`,

      `Always requires a permit:
→ Any finish that adds habitable square footage
→ Egress windows
→ Electrical or plumbing additions
→ HVAC extension to conditioned space

This isn't negotiable. An inspector signs off on every stage.`,

      `The egress requirement most people miss:

A basement *bedroom* legally requires an egress window.

Min: 5.7 sq ft clear opening, 24" high, 20" wide, sill ≤44" from floor.

This almost always means exterior excavation.
Budget: $8K–$18K per window including the window well.

Without egress, it's a rec room. Not a bedroom.`,

      `Cost ranges (DMV, 2026):

Basic finish, open room, no bath: $35K–$55K
Full finish + bath + egress: $65K–$95K
Full finish + kitchenette + separate entrance (ADU): $90K–$150K`,

      `The ADU conversion case:

If the basement has or can get a separate exterior entrance:
→ DC basement apt rental rate: $1,600–$2,200/mo
→ NoVA: $1,400–$1,900/mo

Construction cost $90K–$150K vs. $1,800/mo income = 5–7 year payback.

Basement concept packages from $${CONCEPT_KITCHEN_PRICE}: kealee.com`,
    ],
    tags: ['basement', 'ADU', 'DMV', 'renovation'],
  },

  {
    week: 3, day: 'tue', scheduledDate: '2026-06-09', type: 'single',
    tweets: [
      `Nobody talks about the sequence problem in renovation planning.

Homeowners call contractors before they know what they want.
Contractors bid before the scope is defined.
Permits get rejected because the scope doesn't match the drawings.

Do the planning work first. The construction work gets easier.`,
    ],
  },

  {
    week: 3, day: 'wed', scheduledDate: '2026-06-10', type: 'single',
    tweets: [
      `Fairfax County permit timelines (mid-2026):

Simple permits: 3–5 weeks
Kitchen/bath: 5–8 weeks
Addition: 8–12 weeks
ADU: 10–14 weeks

Faster than DC and MoCo. Still long enough that you can't start planning in September for a fall project start.`,
    ],
    tags: ['FairfaxCounty', 'NoVA', 'buildingpermits'],
  },

  {
    week: 3, day: 'thu', scheduledDate: '2026-06-11', type: 'thread',
    tweets: [
      `Real estate investors: here's how to underwrite renovation costs correctly in the DMV 🧵`,

      `Most investors use one of two approaches:
1. Get a contractor quote, add 20% contingency
2. Use $/sqft comps

Both have the same problem: they're not based on a defined scope.`,

      `What changes when you underwrite correctly:

Before acquisition:
→ AI cost estimate on defined scope (not a bid)
→ Permit path assessment — timeline, risk flags
→ Zoning check — does the reno trigger additional review?`,

      `After acquisition:
→ Scope brief to 3+ contractors simultaneously
→ Comparable bids (same scope)
→ Permit in place before construction starts

No surprises on permit cost or timeline at closing.`,

      `The number that matters most for BRRRR: permit timeline.

DC: 8–14 weeks carrying cost
MoCo: 6–10 weeks
Fairfax: 5–8 weeks

That difference changes your hold cost calculation.

Also: unpermitted work doesn't appraise. Every dollar of unpermitted work is a dollar that doesn't count toward your ARV refi.`,

      `Cost estimate from $${ESTIMATION_PRICE}. Permit assessment from $${PERMIT_BASIC_PRICE}.

Both at kealee.com — built for DMV renovation underwriting.`,
    ],
    tags: ['realestateinvesting', 'BRRRR', 'DMV', 'renovation'],
  },

  {
    week: 3, day: 'fri', scheduledDate: '2026-06-12', type: 'single',
    tweets: [
      `The deck permit question I get constantly:

"My contractor said I don't need a permit for my deck."

DMV reality:
→ Attached deck over 30" off grade: permit required everywhere
→ Ground-level freestanding under 200 sqft: often exempt
→ Covered structure attached to house: permit required everywhere

Get a second opinion before proceeding without one.`,
    ],
    tags: ['deck', 'buildingpermits', 'homeimprovement'],
  },

  {
    week: 3, day: 'sat', scheduledDate: '2026-06-13', type: 'single',
    tweets: [
      `The fastest way to get a permit in DC:

Submit complete drawings on the first attempt.

You don't get credit for a "close enough" submittal. Incomplete applications restart from the back of the queue.

The permit timeline starts when the application is complete.`,
    ],
  },

  {
    week: 3, day: 'sun', scheduledDate: '2026-06-14', type: 'single',
    tweets: [
      `Construction is the last major industry still running on phone calls and handshake agreements in the planning phase.

That's not how $150K decisions should be made.`,
    ],
  },

  // ── Week 4 ────────────────────────────────────────────────────────────────

  {
    week: 4, day: 'mon', scheduledDate: '2026-06-15', type: 'thread',
    tweets: [
      `Home addition planning in the DMV — timeline and cost reality in one thread 🧵`,

      `Why additions are the most complex residential permit:

They change the footprint + envelope of the home.
They almost always involve:
→ New foundation
→ New framing tied into existing structure
→ MEP extension to new space
→ Roof tie-in
→ Exterior work visible from the street`,

      `Permit timelines:
DC: 12–20 weeks (+HPO if historic)
Montgomery County: 10–16 weeks
Fairfax: 8–14 weeks
Arlington: 10–16 weeks

If you want to break ground in October, the permit application needs to be in by June.`,

      `Cost ranges (DMV, 2026):
Bump-out under 200 sqft: $80K–$140K
Bedroom + bath addition (300–500 sqft): $150K–$280K
Full second-story addition: $250K–$450K

What drives the range:
→ Foundation type (+$15K–$40K for basement vs. slab)
→ Roof tie-in complexity
→ Whether HVAC needs a new unit or just extension
→ Exterior finish match to existing house`,

      `The feasibility question first:

Before investing in design, verify:
→ Does your zoning allow the addition?
→ What are the setbacks?
→ Are you near your lot coverage limit?

These are the first questions we answer.

Addition concept packages from $${CONCEPT_KITCHEN_PRICE}: kealee.com`,
    ],
    tags: ['addition', 'DMV', 'homeimprovement', 'construction'],
  },

  {
    week: 4, day: 'tue', scheduledDate: '2026-06-16', type: 'single',
    tweets: [
      `The scope of work is the most important document in a renovation project.

Not the design.
Not the contract.
The scope.

The design tells you what you want.
The scope tells every contractor, inspector, and permit reviewer exactly what's being built.`,
    ],
  },

  {
    week: 4, day: 'wed', scheduledDate: '2026-06-17', type: 'single',
    tweets: [
      `Arlington County ADU policy — currently one of the most permissive in NoVA.

Detached ADUs allowed by-right in most residential zones.
Lot minimum: generally 6,000 sqft.
Height: max 1.5 stories.
Coverage: can't exceed impervious surface limits.

If you're in Arlington and your lot qualifies, the ADU economics work.`,
    ],
    tags: ['Arlington', 'ADU', 'NoVA'],
  },

  {
    week: 4, day: 'thu', scheduledDate: '2026-06-18', type: 'thread',
    tweets: [
      `What Kealee actually delivers — plain description, no marketing language 🧵`,

      `You submit: address, project type, photos of the space, what you want to change.

We deliver in 48 hours:`,

      `1. Three layout concepts
Not mood boards. Actual floor plan options with distinct positioning: one budget-forward, one mid-range, one premium. Each has a rationale and a cost band.`,

      `2. Itemized cost estimate
By trade: demo, framing, electrical, plumbing, HVAC, finishes. Low and high range per trade. Calibrated to DMV market rates. Built against your specific scope.`,

      `3. Permit scope assessment
What permits your project requires in your jurisdiction. Who reviews it, typical timeline, common rejection reasons. Historic district flags if applicable.`,

      `4. Contractor-ready scope brief
Formatted for sending to contractors. Explicit on demo scope, MEP changes, structural work, finish specs, and permit responsibility.

This is the document that makes quotes comparable.`,

      `What it's not: architectural drawings. Those come later at the permit stage.

What it is: the planning document that makes everything else work.

Kitchen/bath: $${CONCEPT_KITCHEN_PRICE}. ADU: $${ADU_BUNDLE_PRICE}. kealee.com`,
    ],
  },

  {
    week: 4, day: 'fri', scheduledDate: '2026-06-19', type: 'single',
    tweets: [
      `Fall renovation timeline math:

Want to start construction in October?

Concept + scope: start now (2–3 weeks)
Permit drawings: 2–4 weeks
Permit application: in queue
Permit approval: 6–14 weeks depending on jurisdiction

That's 10–21 weeks total.

Today is the right time to start.`,
    ],
    tags: ['renovation', 'DMV', 'homeimprovement'],
  },

  {
    week: 4, day: 'sat', scheduledDate: '2026-06-20', type: 'single',
    tweets: [
      `Best proptech building right now isn't in mortgage or listings.

It's in the planning phase — the part of construction that's still running on phone calls and guesswork.

That's where the leverage is.`,
    ],
    tags: ['proptech', 'construction', 'AI'],
  },

  {
    week: 4, day: 'sun', scheduledDate: '2026-06-21', type: 'single',
    tweets: [
      `One week of good renovation planning prevents one month of mid-construction decisions.

The ratio is roughly 4:1.

Every week you cut from planning adds a month of uncertainty to construction.`,
    ],
  },
]

// ─── Reply / engagement targets ───────────────────────────────────────────────
// Reply to posts from these accounts to build followers organically.
// Add genuine value — not pitches.

export const ENGAGEMENT_TARGETS = [
  { account: '@WSJ_RealEstate',      topic: 'Housing market / renovation trends' },
  { account: '@DCist',               topic: 'DC local news — reply to renovation/permit stories' },
  { account: '@GreaterGreaterWash',  topic: 'DC/MD/VA planning and development' },
  { account: '@NAHBhome',            topic: 'National home builders — construction cost data' },
  { account: '@remodelista',         topic: 'Renovation design — add permit/cost context' },
  { account: '@ThisOldHouse',        topic: 'Home improvement — add permit/process context' },
  { account: '@ProRemodeler',        topic: 'Trade publication — contractor audience' },
  { account: '@JLLnews',             topic: 'Real estate — investor audience' },
  { account: '@bisnow',              topic: 'CRE but covers DC development' },
  { account: '@PoPville',            topic: 'DC neighborhood blog — very local' },
]

// ─── Hashtag sets ─────────────────────────────────────────────────────────────

export const HASHTAG_SETS = {
  permits:    ['buildingpermits', 'DCpermits', 'renovation', 'homeimprovement'],
  adu:        ['ADU', 'accessorydwellingunit', 'realestate', 'DMV', 'rentalincome'],
  contractor: ['contractors', 'renovation', 'homeimprovement', 'scopeofwork'],
  investor:   ['realestateinvesting', 'BRRRR', 'proptech', 'DMV'],
  local:      ['WashingtonDC', 'NoVA', 'Maryland', 'DMV'],
  design:     ['AIdesign', 'interiordesign', 'renovation', 'homedesign'],
} as const

// ─── UTM links for Twitter ────────────────────────────────────────────────────

export function twitterUtmLink(path: string, content: string): string {
  const base = 'https://kealee.com'
  const params = new URLSearchParams({
    utm_source:   'twitter',
    utm_medium:   'organic',
    utm_campaign: 'organic-content',
    utm_content:  content,
  })
  return `${base}${path}?${params.toString()}`
}
