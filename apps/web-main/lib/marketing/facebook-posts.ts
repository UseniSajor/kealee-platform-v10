/**
 * Facebook Organic Content Schedule — Kealee
 *
 * Platform: Facebook Page + Groups
 * Page: facebook.com/kealee (create at facebook.com/pages/create)
 * Auto-posting cron: /api/cron/facebook
 * Schedule: Mon/Wed/Fri at 10am ET (15:00 UTC)
 *
 * Facebook vs Instagram differences:
 * - Longer text performs well (Facebook rewards 150–400 word posts)
 * - Link previews work — include kealee.com links directly in posts
 * - Groups are a major organic channel — post to local groups manually
 * - Demographic skews 35–65: homeowners with purchasing power
 * - Shares > likes: write content people want to send to their neighbors
 *
 * Graph API: POST /{page-id}/feed
 * Token: long-lived Page access token (same as Instagram flow, different scope)
 * Required scopes: pages_manage_posts, pages_read_engagement
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  CONCEPT_LANDSCAPE_PRICE,
  ADU_BUNDLE_PRICE,
  ESTIMATION_PRICE,
  PERMIT_BASIC_PRICE,
} from '@/lib/marketing/pricing'

export type FacebookPostFormat = 'educational' | 'tip' | 'case-study' | 'stat' | 'community' | 'cta' | 'link'

export interface FacebookPost {
  week:          number
  day:           'mon' | 'wed' | 'fri'
  format:        FacebookPostFormat
  scheduledDate: string
  message:       string           // Full post text — can be long
  link?:         string           // URL for link preview (optional)
  imageUrl?:     string           // Full URL to hosted image (optional)
  imageFallback?: string          // Local path for fallback
}

// ─── Post schedule ────────────────────────────────────────────────────────────

export const FACEBOOK_POSTS: FacebookPost[] = [

  // ── Week 1 ────────────────────────────────────────────────────────────────

  {
    week: 1, day: 'mon', format: 'educational',
    scheduledDate: '2026-05-25',
    message: `If you're planning a home renovation in the DC, Maryland, or Virginia area, this is worth reading before you call a contractor.

The most common mistake we see: homeowners call contractors before they've defined what they want to build.

Here's what happens next:

You get three quotes — maybe $42,000, $61,000, and $79,000. You have no idea why they're so different. You pick the middle one, hoping it's the right call.

Here's the problem: those three contractors quoted three different projects. One included custom cabinets you didn't ask for. One excluded the permit. One assumed you weren't moving the sink (you are).

The solution is a scope of work document. It specifies exactly what's being done — what gets demolished, what electrical or plumbing changes are happening, what finishes you want, and who handles the permit.

When all three contractors bid the same scope, the quotes become comparable. The $37,000 range collapses to $8,000. The outliers either have a legitimate reason or they'll adjust.

We build this scope document for every Kealee client as part of the concept package. It's the document that makes everything else in the process work.

If you're planning a renovation in the DMV — kitchen, bathroom, addition, basement, or ADU — visit kealee.com. Concept packages start at $${CONCEPT_KITCHEN_PRICE} and include the cost estimate, permit scope, and contractor-ready scope brief.

📌 Save this post if you're planning a renovation in the next 12 months.`,
    link: 'https://kealee.com',
  },

  {
    week: 1, day: 'wed', format: 'tip',
    scheduledDate: '2026-05-27',
    message: `DC permit update — if you're doing renovation work in the District, here's what you need to know about the current process.

DCRA has fully transitioned to DLCP (Department of Licensing and Consumer Protection). The permit portal is at permits.dc.gov.

Current timelines for residential permits (mid-2026):

✅ Simple permits (single-trade, straightforward work): 3–5 weeks
✅ Kitchen or bathroom renovation with plumbing/electrical: 8–12 weeks
✅ Room addition or structural work: 12–18 weeks
✅ Historic district (HPO review required): add 4–8 weeks on top

The single biggest cause of delays: an incomplete submittal on the first attempt. When plan reviewers identify missing information, your application goes back to the end of the queue. You don't get a partial review — you restart.

What makes a complete submittal:
→ Full floor plan drawings with dimensions
→ Scope description that matches the drawings
→ Contractor's license number
→ Engineer's stamp if structural work is involved

If you're planning a renovation that needs a DC permit, the time to start is 3–4 months before you want to begin construction.

We file permits in DC, Maryland, and Northern Virginia. Permit packages from $${PERMIT_STANDARD_PRICE}. DM us or visit kealee.com/products/permit-package.

Share this with a neighbor who's planning renovation work 👇`,
    link: 'https://kealee.com/products/permit-package',
  },

  {
    week: 1, day: 'fri', format: 'community',
    scheduledDate: '2026-05-29',
    message: `Quick question for DMV homeowners 🏠

If you've done a renovation project recently (or are planning one), what was the most confusing or frustrating part of the process?

We hear a few things consistently:
- Not knowing what requires a permit
- Getting wildly different contractor quotes with no way to compare them
- Not knowing what anything should cost before committing to a contractor
- Permit timelines that delayed the project start

Drop your answer in the comments — we read every one.

And if you're currently navigating any of these, feel free to DM us or ask in the comments. We answer renovation and permit questions for the DMV area every day.`,
  },

  // ── Week 2 ────────────────────────────────────────────────────────────────

  {
    week: 2, day: 'mon', format: 'educational',
    scheduledDate: '2026-06-01',
    message: `ADU update for Northern Virginia homeowners — here's what's changed and what it means for your property.

ADUs (Accessory Dwelling Units) — backyard cottages, garage apartments, basement units with separate entrances — are getting a lot of attention in NoVA right now. Here's the ground-level reality.

NOT every lot qualifies. The key variables:

1. Zoning district: Codes vary by jurisdiction — Fairfax uses R-1/R-2/R-3, Arlington uses R-5/R-6/R-10, DC uses R-2/R-3/RF-1, Montgomery uses R-60/R-90. Look up your specific district; not all zones allow ADUs by-right.

2. Lot size: Most jurisdictions require a minimum lot size — usually 6,000–8,000+ square feet — for a detached ADU.

3. Setbacks: The structure needs to maintain required distances from property lines. Typically 5 feet from side property lines, 25 feet from a rear street.

4. Lot coverage: The combined footprint of all structures on your lot (house + ADU) can't exceed the jurisdiction's impervious surface limit (usually 25–35% of lot area).

Arlington County is currently the most permissive jurisdiction in NoVA for ADUs. Fairfax County is more restrictive and varies by specific zoning district.

The economics when it works:
→ Detached ADU (400–600 sq ft): $120,000–$220,000 to build
→ Current NoVA 1BR rental rate: $1,600–$2,300/month
→ Payback: 8–12 years on construction cost
→ Property value increase: typically 50–80% of construction cost

The zoning feasibility check is step 1 — before you spend on design or plans. Our ADU bundle ($${ADU_BUNDLE_PRICE}) includes feasibility assessment, floor plan concepts, cost estimate, and permit path.

Comment your zip code if you want a quick read on ADU feasibility in your area.`,
    link: 'https://kealee.com/products/adu-bundle',
  },

  {
    week: 2, day: 'wed', format: 'case-study',
    scheduledDate: '2026-06-03',
    message: `Real project: how a Montgomery County homeowner got from "3 confusing quotes" to a permitted kitchen renovation — and saved $7,000 in the process.

Here's what they started with:
→ A verbal description of what they wanted ("open up the kitchen, new cabinets, new countertops")
→ Three contractor quotes: $42,000 / $61,000 / $79,000
→ No idea why the quotes were so different

Here's what we found when we looked at the project:

The $42,000 quote was missing the electrical work (a new 20A circuit for the island) and didn't include the permit.
The $79,000 quote included a full custom cabinet package they hadn't asked for — $22,000 more than a semi-custom option.
The $61,000 quote was the most complete, but included demo they could do themselves to bring costs down.

What Kealee did:
1. design concept with 3 layout options — they chose the island configuration
2. Permit scope assessment — kitchen renovation required electrical and plumbing permits in Montgomery County
3. Itemized cost estimate: $48,000–$58,000 for the scope they actually wanted
4. Scope brief sent to all 3 contractors for re-bid

Re-bid results:
The $42,000 contractor re-bid at $51,000 with permit included.
The $61,000 contractor re-bid at $54,000 with demo credit.
The $79,000 contractor declined to re-bid (the custom cabinet package was their standard approach).

They went with the $54,000 bid — permit in hand, scope defined, contractor who understood what they were building.

Final cost vs. original middle quote: $61,000 → $54,000. $7,000 saved on a project that was already underway.

The concept + permit package: $${CONCEPT_KITCHEN_PRICE + PERMIT_STANDARD_PRICE}.

kealee.com → link in bio`,
    link: 'https://kealee.com',
  },

  {
    week: 2, day: 'fri', format: 'stat',
    scheduledDate: '2026-06-05',
    message: `A number that surprises most homeowners: 70%.

That's the percentage of homeowners who start a renovation without knowing their project requires a building permit.

It's not carelessness — the rules genuinely vary by jurisdiction and by scope of work. What requires a permit in DC might not require one in Fairfax County, and vice versa.

But the consequences of unpermitted work are real:

🏠 At resale: Buyers' lenders flag unpermitted additions or improvements. You may be required to open walls for retroactive inspection — at your expense — before closing.

🔨 During construction: A stop-work order mid-project freezes everything until the permit is in place. Contractors typically charge for the delay.

📋 Insurance: Homeowner's insurance policies can deny claims for damage related to unpermitted work.

The fastest way to know: a 10-minute call to your local permit office, or a permit scope assessment from us (included in every Kealee concept package).

Save this and share it with a neighbor who's planning home improvement work.`,
  },

  // ── Week 3 ────────────────────────────────────────────────────────────────

  {
    week: 3, day: 'mon', format: 'educational',
    scheduledDate: '2026-06-08',
    message: `Historic district renovation in DC — what it means for your project timeline.

About 30% of residential properties in DC are in a historic district or are individually listed historic resources. If your home is one of them, you're navigating two review processes instead of one.

The standard DC permit process: DLCP application → plan review → permit issuance.

The historic property process: HPO (Historic Preservation Office) review → DLCP plan review → permit issuance.

HPO review happens first. DLCP won't issue a permit until HPO has signed off.

What triggers HPO review:
→ Any exterior change visible from a public way (street, alley, public space)
→ Changes to historic fabric — original windows, doors, masonry, siding
→ New additions on a designated property
→ Demolition of any contributing structure

What typically does NOT trigger HPO review:
→ Interior-only work with no exterior impact
→ In-kind replacement (same material, same location)
→ Emergency structural repairs

Current HPO review timelines:
• Minor/administrative approval: 2–4 weeks
• Standard staff review: 4–8 weeks
• Historic Preservation Review Board (significant changes): 8–12 weeks (board meets monthly — missing a meeting adds 4 weeks)

Practical implication: if your project has an exterior component in a historic district, start the permit process 4–6 months before your target construction start. Not 6–8 weeks.

If you're not sure whether your property is in a historic district, you can check at historicpreservation.dc.gov. Or DM us with your address and we'll tell you.

We handle historic district permit packages — HPO and DLCP. Permit packages from $${PERMIT_STANDARD_PRICE}.`,
    link: 'https://kealee.com/products/permit-package',
  },

  {
    week: 3, day: 'wed', format: 'educational',
    scheduledDate: '2026-06-10',
    message: `The real reason your renovation goes over budget — and it's not the contractor's fault.

Most renovation budget overruns happen in one of three places:

1. The permit or structural phase reveals something that wasn't in the original scope.
The demo happens, the walls open up, and suddenly there's knob-and-tube wiring, or a non-load-bearing wall that's actually load-bearing, or a plumbing rough-in that's in the wrong location. These aren't contractor errors — they're discoveries. But they cost money because they weren't in the quote.

How to reduce this risk: get a structural assessment before finalizing scope on anything that involves walls. For older homes, get an electrical inspection.

2. The scope expands mid-project.
"While we're in here, can we also..." This is the single most common source of cost overruns. Every mid-project change adds mobilization cost, material premium, and schedule impact.

How to reduce this risk: make all decisions before construction starts. Spend 2–4 weeks in planning to prevent 4–8 weeks of mid-project decisions.

3. The permit cost and timeline weren't in the original plan.
A $1,500 permit becomes a $4,000 problem when it delays the contractor start by 8 weeks and they have to remobilize.

How to reduce this risk: build the permit into the project plan before construction, not after.

The Kealee pipeline is built around reducing all three of these: concept first, then permit, then contractor scope, then construction. It takes longer upfront and saves more during construction.

Questions about your specific project? DM us or visit kealee.com.`,
    link: 'https://kealee.com',
  },

  {
    week: 3, day: 'fri', format: 'community',
    scheduledDate: '2026-06-12',
    message: `For DMV homeowners: what renovation project have you been putting off?

Kitchen? Bathroom? Basement? Addition? Deck?

We see a few that come up constantly:
- The kitchen that's been "on the list" for 5 years
- The basement that's used for storage but could be a bedroom or rental unit
- The addition that gets discussed every time the family visits

The most common reason these projects get delayed: not knowing what they'll actually cost, or not knowing what the permit process involves.

If you've got a project that's been on the list, drop it in the comments. We'll give you a quick read on what it typically involves in the DMV — permits, cost range, timeline.

No sales pitch. Just useful information.`,
  },

  // ── Week 4 ────────────────────────────────────────────────────────────────

  {
    week: 4, day: 'mon', format: 'educational',
    scheduledDate: '2026-06-15',
    message: `Basement finishing in the DMV — what it costs, what it needs, and what most people get wrong.

Finishing a basement is one of the highest-ROI renovations you can do in the DC area, and also one of the most misunderstood permit-wise. Here's the full picture.

PERMITS (always required for basement finishing):
Any basement finish that adds habitable square footage requires a building permit in DC, Maryland, and Virginia. This is not optional. An inspector will need to sign off on framing, electrical, plumbing, and HVAC.

THE EGRESS REQUIREMENT most people miss:
A basement "bedroom" legally requires an egress window — minimum 5.7 square feet of clear opening, max 44 inches sill height from floor. This almost always requires exterior excavation. Budget $8,000–$18,000 per window including digging and window well.

Without egress, the space can be a "rec room" but not a bedroom. This matters for rental income (you can't legally rent a bedroom without egress) and for resale value.

COST RANGES (DMV market, 2026):
• Basic finish, one open room, no bath: $35,000–$55,000
• Full finish with bathroom and egress window: $65,000–$95,000
• Full finish with kitchenette + separate entrance (ADU): $90,000–$150,000

THE ADU CONVERSION:
If your basement has or can get a separate exterior entrance, converting it to a legal ADU is one of the best investments in this market. Current DC basement apartment rental rates: $1,600–$2,200/month. Montgomery County and NoVA: $1,400–$1,900/month.

PERMIT TIMELINES:
DC: 6–10 weeks for a basement finish permit
Montgomery County: 5–8 weeks
Fairfax/Arlington: 4–7 weeks

Our basement concept package includes 3 layout options, cost estimate, egress assessment, and permit path. Starting at $${CONCEPT_KITCHEN_PRICE} → kealee.com.

Tag a neighbor who's thinking about finishing their basement 👇`,
    link: 'https://kealee.com',
  },

  {
    week: 4, day: 'wed', format: 'tip',
    scheduledDate: '2026-06-17',
    message: `How to verify a contractor's license in DC, Maryland, and Virginia — quick guide.

Before signing any contract, verify the license is active. Here's where to look:

🔵 DC: dcra.dc.gov/service/contractor-license-lookup
→ Licensed Home Improvement Contractor (LHIC) — required for residential work
→ Check the license is active and not suspended

🟢 Maryland: dllr.state.md.us/license/homimpr.shtml
→ Home Improvement Commission license lookup
→ Verify license number matches what's on their contract

🟠 Virginia: dpor.virginia.gov/LicenseLookup
→ Check Contractor's license under "Businesses"
→ Verify class (Class A handles projects over $120K, Class B $10K–$120K)

For all three:
→ Ask for their Certificate of Insurance (general liability minimum $1M)
→ Ask for Workers' Compensation certificate if they have employees
→ Verify the name on the license matches the name on the contract

Takes 10 minutes. Worth it every time.

Share this with anyone who's hiring a contractor soon 👇`,
  },

  {
    week: 4, day: 'fri', format: 'cta',
    scheduledDate: '2026-06-19',
    message: `If you're planning a renovation in the next 6 months, this is when to start.

Permit timelines in the DMV run 6–16 weeks depending on scope and jurisdiction. If you want to break ground in the fall, the permit application needs to go in by mid-summer — and that means the concept and scope work needs to happen now.

The sequence:
1️⃣ Concept + scope (2–3 weeks) — defines what you're building
2️⃣ Permit drawings (2–4 weeks) — from the concept
3️⃣ Permit application — submitted and in queue
4️⃣ Permit approval — construction starts

If you start this sequence today, you can realistically begin construction in October.

If you start in September, you're looking at a January or February start.

Concept packages at kealee.com — 48-hour turnaround on your concepts, scope, and cost estimate.

Packages from $${CONCEPT_KITCHEN_PRICE} for kitchen and bath → $${ADU_BUNDLE_PRICE} for ADU projects.`,
    link: 'https://kealee.com',
  },

  // ── Week 5 ────────────────────────────────────────────────────────────────

  {
    week: 5, day: 'mon', format: 'educational',
    scheduledDate: '2026-06-22',
    message: `Deck and outdoor structure permits in the DMV — what actually requires a permit and what doesn't.

With summer here, a lot of homeowners are thinking about decks, patios, and outdoor structures. Here's the permit reality for DC, Maryland, and Northern Virginia.

ALWAYS requires a permit:
✅ Attached deck over 30 inches above grade
✅ Any in-ground pool
✅ Covered patio or pergola attached to the house
✅ Fence over 6 feet (varies by jurisdiction)
✅ Retaining wall over 4 feet

Usually does NOT require a permit:
✅ Ground-level paver patio (if below your lot coverage limits)
✅ Freestanding pergola under local size thresholds
✅ Above-ground pool under certain sizes (varies by jurisdiction)

The lot coverage factor:
Even if a structure doesn't require a permit, adding impervious surface (concrete, pavers, decking) can push you over your lot coverage limit. Check your jurisdiction's impervious surface cap before adding any large paved area.

Fairfax County and Montgomery County have specific impervious surface rules that catch people off guard when they've added a patio, driveway extension, and shed in the same year.

For deck builds specifically:
Get drawings before you hire. Deck permit applications in most DMV jurisdictions require a site plan and structural details. Contractors who quote without drawings are guessing on the permit cost and process.

Landscape and deck concepts from $${CONCEPT_LANDSCAPE_PRICE} at kealee.com. Includes permit scope for your jurisdiction.`,
    link: 'https://kealee.com',
  },

  {
    week: 5, day: 'wed', format: 'educational',
    scheduledDate: '2026-06-24',
    message: `For homeowners considering a home addition in the DMV — here's the realistic timeline and what drives costs.

A room addition is the most complex residential permit in terms of process. Here's why and what to expect.

WHY IT'S COMPLEX:
An addition changes the footprint and envelope of your home. It almost always involves structural work (new foundation, new framing, roof tie-in), MEP extensions (HVAC, electrical, plumbing to the new space), and exterior work that's visible and inspectable.

PERMIT TIMELINE:
• DC: 12–20 weeks (add 4–8 weeks for historic district)
• Montgomery County: 10–16 weeks
• Fairfax County: 8–14 weeks
• Arlington: 10–16 weeks

COST RANGES (DMV, 2026):
• Simple bump-out under 200 sq ft: $80,000–$140,000
• Full addition (bedroom + bath, 300–500 sq ft): $150,000–$280,000
• Full second-story addition: $250,000–$450,000

WHAT DRIVES COST VARIATION:
Foundation type (slab vs. crawl vs. basement adds $15,000–$40,000)
Roof tie-in complexity (simple hip vs. complex ridge line)
Whether you're adding HVAC capacity or extending existing
Quality of exterior finishes to match existing house

THE FEASIBILITY QUESTION:
Before investing in design, verify: does your zoning allow the addition? What are the setback requirements? Are you close to your lot coverage limit?

These are the first questions we answer in every addition concept package.

Addition concepts from $${CONCEPT_KITCHEN_PRICE} at kealee.com → comment or DM with questions.`,
    link: 'https://kealee.com',
  },

  {
    week: 5, day: 'fri', format: 'community',
    scheduledDate: '2026-06-26',
    message: `Friday renovation Q&A — ask us anything about home improvement projects in the DMV.

Open questions welcome. Here are a few we've answered recently:

"Do I need a permit to add a bathroom to my basement?"
→ Yes. Plumbing addition + new habitable space = permit required. In DC, budget 6–10 weeks.

"We got a quote for $180K to add a bedroom and bath. Is that normal?"
→ For Northern Virginia, that's in range for a 300–400 sq ft addition with full bath and HVAC extension. The range runs $150K–$280K depending on complexity and finishes.

"Our contractor said we don't need a permit for the deck. Should we trust that?"
→ An attached deck over 30 inches off grade requires a permit in all three DMV jurisdictions. Get a second opinion before proceeding without one.

"How do I know if my property is in a DC historic district?"
→ Check historicpreservation.dc.gov — enter your address and it'll tell you your designation status.

Drop your questions below. We'll answer in the comments.`,
  },

  // ── Week 6 ────────────────────────────────────────────────────────────────

  {
    week: 6, day: 'mon', format: 'educational',
    scheduledDate: '2026-06-29',
    message: `For real estate investors in the DMV — how to underwrite renovation costs before you close.

Most investors underwrite renovation costs one of two ways:
1. Get one contractor quote, add 20% contingency
2. Estimate $/sq ft based on comp renovations

Both approaches have the same problem: they're not based on a defined scope.

HERE'S WHAT CHANGES WHEN YOU UNDERWRITE CORRECTLY:

Before acquisition:
→ AI cost estimate based on defined scope (not contractor quote)
→ Permit path assessment — what's required, what's the timeline, what triggers extra review
→ Zoning check — does the renovation trigger any additional requirements (historic, BZA, etc.)

After acquisition:
→ Scope brief to 3+ contractors simultaneously — same scope, comparable bids
→ Permit in place (or in process) before construction starts
→ No surprises on permit cost or timeline at closing

The number that matters most: the permit timeline. A permit that takes 12 weeks in DC vs. 6 weeks in Montgomery County changes your carrying cost calculation meaningfully on a renovation hold.

For BRRRR investors specifically: the post-renovation appraisal depends on what's permitted and inspected. Unpermitted work doesn't appraise. If you're refinancing based on the ARV, every dollar of unpermitted work is a dollar that doesn't count.

We do cost estimates and permit assessments for investors underwriting DMV renovation projects. Cost estimate from $${ESTIMATION_PRICE} → kealee.com/products/cost-estimate`,
    link: 'https://kealee.com/products/cost-estimate',
  },

  {
    week: 6, day: 'wed', format: 'tip',
    scheduledDate: '2026-07-01',
    message: `Fall renovation planning starts now — here's why.

If you want a permitted renovation to start in October or November 2026, you need to start the planning process in the next 2–4 weeks.

Here's the math:

Permit timeline (DC): 8–14 weeks
Permit timeline (Montgomery County): 6–10 weeks
Permit timeline (Fairfax/Arlington): 5–8 weeks

To submit a permit application, you need permit-ready drawings. To produce permit-ready drawings, you need a defined scope. To define the scope, you need to know what you're building.

That's 3–6 weeks of pre-permit work before the clock even starts on the permit.

Start today → concept + scope in 2–3 weeks → permit drawings in 2–4 more weeks → permit submission in July → permit in hand by September → construction starts October.

Start in September → permit submitted in October → permit in hand in December at earliest → construction starts January.

Every week of planning delay is a week of construction delay.

If you have a fall project in mind, visit kealee.com this week. 48-hour concept turnaround — we can move fast if you need to.

Concept packages from $${CONCEPT_KITCHEN_PRICE}. Permit packages from $${PERMIT_STANDARD_PRICE}.`,
    link: 'https://kealee.com',
  },

  {
    week: 6, day: 'fri', format: 'cta',
    scheduledDate: '2026-07-03',
    message: `What Kealee delivers and what it costs — plain summary for anyone who's been curious.

WHAT WE DO:
We help DMV homeowners plan renovation projects before hiring a contractor. That means design concepts, cost estimates, permit filing, and scope documents.

CONCEPT PACKAGES (48-hour turnaround):
• Kitchen or bathroom concept: $${CONCEPT_KITCHEN_PRICE}
• Whole-home or addition concept: starts at $585
• ADU bundle (feasibility + concept + permit path): $${ADU_BUNDLE_PRICE}
• Landscape/deck concept: $${CONCEPT_LANDSCAPE_PRICE}

WHAT'S INCLUDED:
→ 3 generated using AI tools layout options for your space
→ Itemized cost estimate by trade (demo, framing, MEP, finishes)
→ Permit scope assessment for your jurisdiction (DC, MD, or VA)
→ Contractor-ready scope brief for comparable bids

PERMIT PACKAGES:
→ Permit path assessment only: $${PERMIT_BASIC_PRICE}
→ Full permit filing and management: from $${PERMIT_STANDARD_PRICE}

COST ESTIMATE (standalone):
→ Itemized estimate without design: $${ESTIMATION_PRICE}

THE CONCEPT COST is credited toward permit drawings if you move forward with a permit package.

All of this is at kealee.com. DM us with questions about your specific project.

Share this with anyone in the DMV who's planning home improvement work this year 🏠`,
    link: 'https://kealee.com',
  },
]

// ─── Facebook Group strategy ──────────────────────────────────────────────────

export const TARGET_FACEBOOK_GROUPS = [
  {
    name: 'DC Area Homeowners',
    focus: 'General homeowner advice, renovation tips, contractor recommendations',
    postFrequency: 'weekly',
    bestContent: ['educational', 'tip', 'community Q&A'],
    notes: 'High engagement on permit and contractor topics. Genuine helpfulness required.',
  },
  {
    name: 'Home Improvement DC/MD/VA',
    focus: 'Renovation projects across the DMV',
    postFrequency: 'weekly',
    bestContent: ['case-study', 'tip'],
    notes: 'Post project stories and cost breakdowns. Very receptive.',
  },
  {
    name: 'Northern Virginia Real Estate',
    focus: 'REI, homeowners, market discussion',
    postFrequency: 'biweekly',
    bestContent: ['ADU ROI', 'investor underwriting', 'cost estimates'],
    notes: 'Investor and agent audience. Data-driven posts perform well.',
  },
  {
    name: 'Montgomery County MD Homeowners',
    focus: 'Local homeowner community',
    postFrequency: 'weekly',
    bestContent: ['MoCo permit guide', 'contractor tips', 'educational'],
    notes: 'Very active. MoCo permit content highly relevant.',
  },
  {
    name: 'Capitol Hill Community',
    focus: 'Capitol Hill neighborhood',
    postFrequency: 'biweekly',
    bestContent: ['historic district permits', 'HPO guide', 'rowhouse renovation'],
    notes: 'HPO and historic renovation content extremely relevant here.',
  },
  {
    name: 'Petworth / Columbia Heights Neighbors',
    focus: 'DC neighborhood group',
    postFrequency: 'biweekly',
    bestContent: ['DC permits', 'contractor recs', 'renovation'],
    notes: 'Active renovation market. Community tone — be a neighbor first.',
  },
  {
    name: 'Arlington VA Community',
    focus: 'Arlington neighborhood',
    postFrequency: 'biweekly',
    bestContent: ['ADU in Arlington', 'addition permits', 'contractor selection'],
    notes: 'High ADU interest. Arlington-specific content performs well.',
  },
  {
    name: 'Bethesda / Chevy Chase Community',
    focus: 'High-income suburban community',
    postFrequency: 'biweekly',
    bestContent: ['kitchen/bath concepts', 'addition costs', 'high-end renovation'],
    notes: 'Higher budget range. Whole-home and addition content.',
  },
]

// ─── Group post rules ─────────────────────────────────────────────────────────

export const GROUP_POSTING_RULES = [
  'Always read group rules before posting — many groups prohibit business promotion',
  'Lead with genuine value: tips, answers, educational content',
  'Only mention Kealee when directly, naturally relevant ("we do this at kealee.com")',
  'Respond to every comment within 24 hours',
  'Never post the same content in multiple groups on the same day',
  'Join as the business page where possible; join as personal + mention Kealee affiliation where required',
  'Answer contractor recommendation requests with helpful criteria, not a pitch',
  'If a group admin removes a post, message them to ask about the rules before re-posting',
]

// ─── Facebook Page setup checklist ───────────────────────────────────────────

export const PAGE_SETUP_CHECKLIST = [
  'Create Page at facebook.com/pages/create → category: Home Improvement / Contractor',
  'Page name: Kealee',
  'Username (vanity URL): @kealee or @kealeeDMV',
  'Cover photo: 820×312px — hero image of a renovation concept or before/after',
  'Profile photo: Kealee logo square crop (minimum 180×180px)',
  'About section: fill out fully — address (DC area), website (kealee.com), phone',
  'Add services: list all product offerings from kealee.com/products',
  'Enable Messenger for direct inquiries',
  'Set up Page FAQ responses for common questions',
  'Pin a post: pin the intro / what we do post permanently',
  'Add a CTA button: "Learn More" → kealee.com',
  'Connect Instagram account to the Page (required for cross-posting and Graph API)',
]

// ─── UTM links for Facebook ───────────────────────────────────────────────────

export function facebookUtmLink(path: string, postFormat: string): string {
  const base = 'https://kealee.com'
  const params = new URLSearchParams({
    utm_source:   'facebook',
    utm_medium:   'organic',
    utm_campaign: 'organic-content',
    utm_content:  postFormat,
  })
  return `${base}${path}?${params.toString()}`
}
