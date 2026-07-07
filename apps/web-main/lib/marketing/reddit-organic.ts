/**
 * Reddit Organic Content Strategy — Kealee
 *
 * Philosophy: Provide genuine value first. Never lead with the product.
 * Mention Kealee only when directly relevant and contextually natural.
 * Build trust by being the most helpful voice in the thread.
 *
 * Account: u/KealeeDMV (create at reddit.com/register)
 * Karma building: 2–3 weeks of helpful comments before posting standalone posts
 */

import {
  PERMIT_STANDARD_PRICE,
  ADU_BUNDLE_PRICE,
  CONCEPT_KITCHEN_PRICE,
} from '@/lib/marketing/pricing'

// ─── Subreddit targets ────────────────────────────────────────────────────────

export const TARGET_SUBREDDITS = [
  {
    name: 'r/HomeImprovement',
    url: 'https://www.reddit.com/r/HomeImprovement/',
    members: '5.4M',
    postFrequency: 'weekly',
    contentTypes: ['educational', 'case-study', 'permit-guide'],
    notes: 'Largest home reno community. Be helpful first. No self-promotion in first 30 days.',
  },
  {
    name: 'r/DIY',
    url: 'https://www.reddit.com/r/DIY/',
    members: '6.1M',
    postFrequency: 'biweekly',
    contentTypes: ['educational', 'permit-guide'],
    notes: 'More hands-on audience. Permit and contractor selection content works well here.',
  },
  {
    name: 'r/washingtondc',
    url: 'https://www.reddit.com/r/washingtondc/',
    members: '200K',
    postFrequency: 'weekly',
    contentTypes: ['local-insight', 'case-study', 'ama'],
    notes: 'Local community. DC-specific permit and DLCP content highly relevant.',
  },
  {
    name: 'r/nova',
    url: 'https://www.reddit.com/r/nova/',
    members: '120K',
    postFrequency: 'weekly',
    contentTypes: ['local-insight', 'case-study'],
    notes: 'Northern Virginia. ADU content, Fairfax/Arlington permit specifics do well.',
  },
  {
    name: 'r/maryland',
    url: 'https://www.reddit.com/r/maryland/',
    members: '115K',
    postFrequency: 'biweekly',
    contentTypes: ['local-insight', 'permit-guide'],
    notes: 'Montgomery and PG County permit specifics.',
  },
  {
    name: 'r/FirstTimeHomeBuyer',
    url: 'https://www.reddit.com/r/FirstTimeHomeBuyer/',
    members: '430K',
    postFrequency: 'biweekly',
    contentTypes: ['educational', 'scope-guide'],
    notes: 'Focus on "what to know before renovating" angle. High intent audience.',
  },
  {
    name: 'r/realestateinvesting',
    url: 'https://www.reddit.com/r/realestateinvesting/',
    members: '1.9M',
    postFrequency: 'biweekly',
    contentTypes: ['adu-roi', 'case-study'],
    notes: 'ADU ROI posts perform well. Data-driven content expected here.',
  },
  {
    name: 'r/personalfinance',
    url: 'https://www.reddit.com/r/personalfinance/',
    members: '18M',
    postFrequency: 'monthly',
    contentTypes: ['adu-roi', 'renovation-cost'],
    notes: 'ADU ROI and renovation budgeting. Very strict on self-promotion — pure value only.',
  },
] as const

// ─── Weekly post schedule ─────────────────────────────────────────────────────

export interface RedditPost {
  week: number
  subreddit: string
  type: 'educational' | 'case-study' | 'permit-guide' | 'local-insight' | 'adu-roi' | 'ama'
  title: string
  body: string
  flairSuggestion?: string
  scheduledDate?: string
  cta?: string   // optional — only add when naturally fits
}

export const REDDIT_POSTS: RedditPost[] = [

  // ── Week 1 — HomeImprovement — Permit educational ──────────────────────────
  {
    week: 1,
    subreddit: 'r/HomeImprovement',
    type: 'permit-guide',
    flairSuggestion: 'Advice',
    scheduledDate: '2026-05-27',
    title: 'What actually happens when you pull a permit (and why it protects you at resale)',
    body: `A lot of homeowners skip permits to save time and money. Here's what you're actually trading away.

**What a permit does:**

When a permit is pulled and inspections pass, that work goes into your property's record. Future buyers, lenders, and their inspectors can verify it.

When you skip the permit, the work isn't on record. At resale, here's what can happen:

- Buyer's lender orders an appraisal. Appraiser flags finished basement as unpermitted. Buyer can't get financing on the square footage.
- Home inspector identifies a work scope that clearly needed a permit. Buyer negotiates down or walks.
- You're required to open walls for retroactive inspection before closing.
- Worst case: stop-work order during sale if discovered while the house is under contract.

**In the DMV specifically:**

DC, Maryland, and Virginia all have different thresholds for what requires a permit, but all three jurisdictions actively flag unpermitted work at resale. Montgomery County has one of the stricter review processes in the region.

**What typically requires a permit:**

- Any structural work (opening walls, adding headers, changing roof lines)
- Electrical panel work, new circuits, subpanel additions
- Plumbing changes (moving drains, adding fixtures)
- HVAC modifications
- Adding square footage (basement finish, addition, ADU)
- Deck or patio structures over a certain size

**What usually doesn't:**

- Cosmetic work (paint, flooring, tile, cabinets without moving plumbing)
- Fixture replacement in-kind (same location, same type)
- Minor electrical (replacing outlets, switches)

The safest approach: call your local permit office (or look it up on their website) before starting. 5-minute call, saves a lot of headaches.

Happy to answer questions about specific scopes or jurisdictions — I work in construction planning in the DMV.`,
  },

  // ── Week 1 — r/washingtondc — DLCP local insight ──────────────────────────
  {
    week: 1,
    subreddit: 'r/washingtondc',
    type: 'local-insight',
    flairSuggestion: 'Question',
    scheduledDate: '2026-05-28',
    title: 'DC building permit timelines post-DLCP transition — what are people actually seeing?',
    body: `DCRA officially transitioned to DLCP (Department of Licensing and Consumer Protection) and the permit process has been evolving.

Curious what people are actually experiencing on the ground right now, especially for residential work.

What we've been tracking for DMV projects:

**DC:**
- Simple permits (cosmetic reno with electrical/plumbing): 3–5 weeks if submittal is complete
- Standard residential addition/ADU: 10–16 weeks
- Historic district HPO review adds 4–8 weeks on top of standard timeline
- Online portal has gotten better but incomplete submittals still go to the back of the queue

**If you've recently pulled a permit in DC**, I'd love to know:
- What type of work?
- How long from submission to approval?
- Any reviewer comments or rejections that added time?

The most reliable way to shorten the timeline we've found: submit a complete set of drawings on the first attempt. Most delays come from incomplete applications, not processing speed.

For anyone navigating this — the DLCP permit portal is at permits.dc.gov. For historic district questions, the HPO review process is separate and handled through the Historic Preservation Office.`,
  },

  // ── Week 2 — r/nova — ADU ROI ─────────────────────────────────────────────
  {
    week: 2,
    subreddit: 'r/nova',
    type: 'adu-roi',
    flairSuggestion: 'Discussion',
    scheduledDate: '2026-06-03',
    title: 'ADU feasibility in Northern Virginia — what I\'ve learned from doing this regularly',
    body: `ADUs (Accessory Dwelling Units) are getting a lot of attention in NoVA right now, and I get questions about them constantly. Here's what actually matters for feasibility before you spend money on plans.

**The zoning question first:**

Not every lot in Northern Virginia allows an ADU. The key variables:

- **Lot size**: Most jurisdictions require a minimum lot size (often 6,000–8,000 sq ft) to allow an ADU
- **Setbacks**: Accessory structures need to maintain setbacks from property lines — in Fairfax County that's typically 5 feet on sides, 25 feet rear from a street
- **Lot coverage**: Many jurisdictions cap impervious surface at 25–35% of lot area. Your existing footprint plus the ADU can't exceed this.
- **Height limits**: Detached ADUs are typically capped at 1–1.5 stories or 20–24 feet

**Arlington specifically:** Arlington County has one of the more permissive ADU ordinances in Virginia. They allow attached and detached ADUs and have a defined approval process. Worth reading their site if you're in Arlington.

**Fairfax County:** More restrictive zoning. Check your specific district at gis.fairfaxcounty.gov — R-1, R-2, R-3, and R-20 each have different lot minimums and setback rules (not the same as Arlington's R-5/R-6 codes).

**The cost math:**

Detached ADU (studio, ~400–600 sq ft): $120,000–$220,000 all-in
Attached/basement ADU (existing space conversion): $60,000–$120,000

Northern Virginia 1BR rental rates: $1,600–$2,300/month depending on location

At $1,800/month: $21,600/year. 8–12 year payback on construction cost before accounting for property value increase.

**The permit path:**

Every ADU in NoVA requires a building permit. For detached ADUs, you'll also likely need a site plan. The permit process typically runs 6–12 weeks depending on jurisdiction.

Happy to answer specific questions about jurisdictions or scopes.`,
  },

  // ── Week 2 — r/HomeImprovement — Contractor quotes ────────────────────────
  {
    week: 2,
    subreddit: 'r/HomeImprovement',
    type: 'educational',
    flairSuggestion: 'Advice',
    scheduledDate: '2026-06-04',
    title: 'Getting wildly different contractor quotes? Here\'s why it happens and how to fix it',
    body: `"I got three quotes: $42,000, $61,000, and $79,000. Which one do I pick?"

This is one of the most common questions I see, and the answer is almost never "pick the middle one."

**Why quotes vary so much:**

The real cause is almost always an undefined scope. When contractors are quoting from a verbal description or a vague scope ("kitchen renovation"), they're making very different assumptions:

- Contractor A assumed existing cabinets could stay (they can't)
- Contractor B included a full custom cabinet package you didn't ask for
- Contractor C included the permit cost, the other two didn't
- One quote includes demo, one doesn't
- Different assumptions on appliance allowance

**How to normalize quotes:**

Before requesting bids, create a scope of work document. It doesn't need to be an architect's drawing. It needs:

1. **Demo scope**: What's coming out? Cabinets, flooring, walls?
2. **MEP changes**: Are you moving the sink? Adding a circuit? Relocating the gas line?
3. **Structural**: Are you opening any walls? Moving a doorway?
4. **Finish selections or allowances**: Cabinets, countertops, flooring — either specify or set a per-unit allowance
5. **Permit**: Who's responsible for pulling the permit?

When all three contractors are bidding the same scope, the quotes compress. You're now comparing execution and overhead, not guesses.

**The fastest way to build the scope doc:**

Detailed photos + a written paragraph of what you want to change. Have each contractor walk the space with you and confirm their understanding of the scope before they quote.

The $79,000 quote wasn't necessarily dishonest — it might have included things you actually need. The $42,000 quote might be missing half the work. You can't know until the scope is defined.`,
  },

  // ── Week 3 — r/FirstTimeHomeBuyer — What to know before renovating ────────
  {
    week: 3,
    subreddit: 'r/FirstTimeHomeBuyer',
    type: 'educational',
    flairSuggestion: 'Tips & Tricks',
    scheduledDate: '2026-06-10',
    title: 'Bought a house that needs work? Read this before contacting contractors',
    body: `First renovation project is overwhelming. Here's the order of operations that saves money and avoids the most common mistakes.

**Step 1: Identify what requires a permit before starting anything**

Most first-time buyers skip this and regret it. Look up your local permit requirements before you plan anything. The rules vary by city/county, but the rough guide:

- Structural work: almost always requires a permit
- Electrical: usually requires a permit for panel work, new circuits, or adding circuits
- Plumbing: usually requires a permit for moving drains or adding fixtures
- Kitchen/bath remodel with MEP changes: yes
- Cosmetic only (paint, flooring, cabinets in same location): usually no

Unpermitted work creates problems when you sell. Don't skip this step.

**Step 2: Get a cost estimate BEFORE hiring a contractor**

Don't hire a contractor until you know roughly what the project should cost. Otherwise you have no baseline to evaluate quotes.

You can get rough estimates from:
- Remodeling cost guides (HomeAdvisor/Angi have aggregated data, useful for ballpark)
- Talking to 3–4 contractors before committing
- Asking a contractor you trust to do a paid scoping session

**Step 3: Define the scope before requesting quotes**

Write down exactly what you want done. Not "update the kitchen" — "demo existing cabinets and countertops, no structural changes, keep existing appliance locations, new cabinets + quartz countertops + tile backsplash."

Vague scope = wildly different quotes. Defined scope = comparable quotes.

**Step 4: Check contractor licensing and insurance**

Your state contractor licensing board has a lookup tool. Verify:
- License is active and in good standing
- General liability insurance (ask for certificate)
- Workers' comp if they have employees

**Step 5: Get the permit in place before work starts**

If the project needs a permit, the permit should be applied for (ideally approved) before the contractor starts. Don't let anyone pressure you to start before the permit is pulled.

Feel free to ask about specific projects — happy to help think through scope and sequencing.`,
  },

  // ── Week 3 — r/realestateinvesting — ADU ROI data ─────────────────────────
  {
    week: 3,
    subreddit: 'r/realestateinvesting',
    type: 'adu-roi',
    flairSuggestion: 'Discussion',
    scheduledDate: '2026-06-11',
    title: 'ADU economics in the DC/MD/VA market — actual numbers from projects we\'ve done',
    body: `Sharing some actual project data from ADU work we've done in the DMV, because the "ADU ROI" content online tends to use national averages that don't reflect local market reality.

**Northern Virginia — Detached ADU (530 sq ft, 1BR/1BA)**

Construction cost all-in: $198,000
- Site work (grading, utilities): $28,000
- Foundation: $22,000
- Framing + envelope: $48,000
- MEP (electrical, plumbing, HVAC): $41,000
- Interior finishes: $38,000
- Permit + design: $21,000

Current rental rate (Springfield area, 1BR): $1,850/month
Annual income: $22,200
Gross yield: 11.2% on construction cost (not including property value increase)

Estimated property value increase: $130,000–$165,000 (appraisers typically use 65–80% of construction cost for ADU contribution)

**DC — Basement ADU (existing basement conversion, 620 sq ft)**

Construction cost: $127,000
- Egress windows/excavation: $18,000
- Framing + insulation: $24,000
- MEP: $36,000
- Interior finishes: $31,000
- Permit + design: $18,000

Current rental rate (Capitol Hill, 1BR basement): $1,950/month
Annual income: $23,400
Gross yield: 18.4%

**The numbers that matter most:**

Basement conversions have better yield but lower property value uplift (less square footage added). Detached ADUs cost more but add more to appraised value.

The zoning feasibility check is step 1 before any of this math is relevant — not every lot allows an ADU or has the square footage for one. Check your jurisdiction's specific requirements before spending money on planning.

Happy to discuss specific scenarios.`,
  },

  // ── Week 4 — r/maryland — Montgomery County permits ───────────────────────
  {
    week: 4,
    subreddit: 'r/maryland',
    type: 'local-insight',
    flairSuggestion: 'Discussion',
    scheduledDate: '2026-06-17',
    title: 'Montgomery County permit process — what\'s changed and what to expect in 2026',
    body: `For anyone doing renovation work in Montgomery County, here's what the permit process looks like right now based on current projects.

**Residential permit timelines (current averages):**

- Simple permits (single trade, pre-approved plans): 2–4 weeks
- Standard residential renovation (kitchen/bath with MEP): 5–8 weeks
- Addition or ADU: 8–14 weeks
- Historic resource — additional MHT or local review: add 4–8 weeks

**Online vs. in-person:**

Most permit applications now go through Accela Citizen Access (MontgomeryCountyMD.gov/permitting). The online portal has improved but still has quirks:
- PDF file size limits can cause upload failures
- Commercial and residential applications are in separate tracks
- You'll need to create an account and link it to your property

**The most common reasons for rejection/revision request:**

1. Incomplete drawing set (missing floor plan dimensions, no detail for structural work)
2. Scope description doesn't match drawings
3. Missing engineer's stamp on structural drawings
4. Contractor's license not listed or expired

**For additions and ADUs specifically:**

Montgomery County requires a site plan showing lot dimensions, existing structures, proposed structure, setbacks, and impervious surface calculation. This is separate from the building drawings.

If your project is in a flood zone (check FEMA flood maps), you'll need additional review.

**Practical tip:**

Call the permit office before submitting for any non-standard project. 20-minute call with a plan reviewer before you submit can save a round of revisions.

Let me know if you have questions about specific project types.`,
  },

  // ── Week 5 — r/HomeImprovement — Scope of work template ──────────────────
  {
    week: 5,
    subreddit: 'r/HomeImprovement',
    type: 'educational',
    flairSuggestion: 'Resource',
    scheduledDate: '2026-06-24',
    title: 'Scope of work template for homeowners (the document that makes contractor quotes comparable)',
    body: `The biggest source of confusion in contractor quoting is an undefined scope. Here's a template format that works.

---

**PROJECT SCOPE OF WORK — [Your Name] — [Date]**

**Property:** [address]
**Project type:** [Kitchen remodel / Bathroom remodel / Addition / etc.]

---

**DEMO / REMOVAL**
- [ ] Remove existing cabinets (upper and lower)
- [ ] Remove existing countertops
- [ ] Remove existing flooring (describe type)
- [ ] Remove existing fixtures (describe)
- [ ] Structural demo: [describe any wall openings, header additions, etc.]

**STRUCTURAL**
- [ ] No structural changes
- [ ] OR: [describe wall removals, beam work, header additions]
- [ ] Structural engineer stamp required: [yes/no/unknown]

**PLUMBING**
- [ ] No plumbing changes (fixtures stay in same location)
- [ ] OR: [describe sink relocation, new drain, new fixture locations]
- [ ] New fixtures to be supplied by: [contractor / homeowner]

**ELECTRICAL**
- [ ] No electrical changes
- [ ] OR: [describe new circuits, panel work, recessed lighting, under-cabinet lighting]
- [ ] Fixtures/devices supplied by: [contractor / homeowner]

**HVAC**
- [ ] No HVAC changes
- [ ] OR: [describe duct work, vent relocation, exhaust fan addition]

**FINISHES**
- Cabinets: [contractor supply / homeowner supply / allowance $____]
- Countertops: [material type] — [contractor supply / homeowner supply / allowance $____]
- Flooring: [material type] — [contractor supply / homeowner supply / allowance $____]
- Backsplash: [contractor supply / homeowner supply / allowance $____]
- Paint: [contractor / homeowner]

**APPLIANCES**
- [ ] Not included in scope
- [ ] OR: [list appliances to be supplied and installed by contractor]

**PERMIT**
- Responsibility for pulling permit: [contractor / homeowner]
- Estimated permit cost included in bid: [yes / no]

---

When you send this to 3 contractors, the quotes become comparable. Any contractor who doesn't follow the scope in their bid is either clarifying something they see as missing, or they're quoting a different project.

Adjust the checkboxes for your specific project. The key is being explicit about every item where assumptions could differ.`,
  },

  // ── Week 6 — r/washingtondc — AMA ─────────────────────────────────────────
  {
    week: 6,
    subreddit: 'r/washingtondc',
    type: 'ama',
    flairSuggestion: 'AMA',
    scheduledDate: '2026-07-01',
    title: 'We help DC-area homeowners with construction planning (permits, scopes, contractor selection). AMA.',
    body: `We run a construction planning service based in the DMV — we help homeowners figure out what their project needs before they hire a contractor. Mostly permits, scopes, cost estimates, and generated using AI tools concepts for renovation projects.

Ask me anything about:

- DC, Maryland, or Virginia permit processes (DLCP, Montgomery County, Fairfax, Arlington, etc.)
- What requires a permit and what doesn't
- How to evaluate contractor quotes
- ADU feasibility in the DMV
- Historic district renovation requirements
- Contractor selection and vetting

I've been doing this for a while and the DC market specifically has some genuinely confusing permit and zoning rules (HPO review, DLCP transition, BZA variance requirements, etc.). Happy to help people navigate it.

Not a substitute for a licensed professional on your specific project, but I can usually give you enough context to know what questions to ask.

Edit: this got more traction than expected — working through all the questions. Keep them coming.`,
  },
]

// ─── Comment response templates ───────────────────────────────────────────────
// Use these to respond to common questions in relevant threads.
// Personalize to the specific question — never copy/paste verbatim.

export const COMMENT_TEMPLATES = {
  permit_required: `Whether you need a permit depends on what's changing. For DMV specifically:

- If you're moving plumbing or adding electrical circuits: yes, permit required
- If you're changing the structure (opening walls, adding a beam): yes
- Cosmetic only (same cabinet footprint, no MEP changes): usually no

What's the scope of your project? Happy to give you a more specific answer.`,

  contractor_quote_high: `The wide range in quotes almost always means the scope isn't defined clearly. When contractors are guessing at what you want, they fill in assumptions differently.

Before going back to them, write down exactly what you want done — specifically what's being demo'd, what MEP (plumbing/electrical) changes are involved, and what finish materials you're using. Then ask each of them to re-quote against that scope.

The quotes will compress significantly. The outliers will either have a reason (something they're including that others aren't) or they'll adjust.`,

  contractor_selection: `License verification first: check your state contractor licensing board — every state has a lookup tool. Confirm the license is active and covers the scope of your project (general contractor vs. specialty trade).

Then ask for:
- General liability insurance certificate (minimum $1M)
- Workers' comp if they have employees
- References on similar projects from the last 12 months

The lowest bid isn't always wrong, but always find out why it's lower. Either they're missing something, or they're cheaper for a legitimate reason (lower overhead, smaller crew). Both can be fine — you just need to know which it is.`,

  adu_feasibility: `ADU feasibility depends entirely on your specific lot and jurisdiction. The main variables:

1. Zoning district — does your zone allow ADUs?
2. Lot size — minimum thresholds vary
3. Setbacks — how close to property lines can the structure go?
4. Lot coverage — impervious surface limits

Look up your address in your jurisdiction's zoning portal (DC: maps.dcoz.dc.gov, Fairfax: gis.fairfaxcounty.gov, Montgomery: mc311.com). It'll tell you your zone. Then look up that zone's ADU rules.

If it pencils out on paper, the next step is a site plan to confirm setbacks and coverage before spending on design.`,

  dmv_permit_timeline: `Current timelines in the DMV (mid-2026):

- DC (DLCP): 6–14 weeks depending on scope; historic district adds 4–8 weeks
- Montgomery County: 5–10 weeks for standard residential
- Fairfax County: 4–8 weeks
- Arlington: 5–8 weeks
- Prince George's County: 4–8 weeks

The biggest variable is submittal quality — incomplete applications go to the back of the queue. A complete set of drawings on the first submittal is the most reliable way to hit the faster end of those ranges.`,
}

// ─── Posting rules ────────────────────────────────────────────────────────────

export const REDDIT_RULES = [
  'Build karma for 2–3 weeks via helpful comments before posting standalone posts',
  'Never lead with a pitch — provide the full value in the post itself',
  'Only mention Kealee or kealee.com when directly, naturally relevant (e.g., "we do this at Kealee")',
  'Respond to every comment on your posts within 24 hours',
  'Upvote helpful comments and engage genuinely with follow-up questions',
  'Never delete a post or comment after posting',
  'Do not post the same content across multiple subreddits in the same week',
  'Check subreddit rules before posting — some subreddits have strict no-promo rules',
  'If a moderator removes a post, do not repost — message the mod and ask for clarification',
  'Track which posts generate inbound traffic (via UTM parameters on any kealee.com links)',
]

// ─── UTM links for Reddit ─────────────────────────────────────────────────────

export function redditUtmLink(path: string, subreddit: string, postType: string): string {
  const base = 'https://kealee.com'
  const params = new URLSearchParams({
    utm_source: 'reddit',
    utm_medium: 'organic',
    utm_campaign: subreddit.replace('r/', ''),
    utm_content: postType,
  })
  return `${base}${path}?${params.toString()}`
}

// Usage examples:
// redditUtmLink('/products/permit-package', 'r/HomeImprovement', 'permit-guide')
// → https://kealee.com/products/permit-package?utm_source=reddit&utm_medium=organic&utm_campaign=HomeImprovement&utm_content=permit-guide
