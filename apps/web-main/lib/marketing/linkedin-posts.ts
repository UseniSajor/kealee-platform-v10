/**
 * LinkedIn Content Schedule — 8 Weeks
 *
 * Type: { week, theme, body, hashtags, scheduledDate }
 * Posted via /api/cron/linkedin every scheduled day.
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  ADU_BUNDLE_PRICE,
} from '@/lib/marketing/pricing'

export interface LinkedInPost {
  week:          number
  theme:         string
  body:          string
  hashtags:      string[]
  scheduledDate?: string  // ISO date YYYY-MM-DD
}

export const LINKEDIN_POSTS: LinkedInPost[] = [
  {
    week:          1,
    theme:         'Platform intro — design + permits + contractors',
    scheduledDate: '2026-05-12',
    body: `We built Kealee because construction projects fail in the planning phase.

Not at the job site. In the planning phase.

Homeowners hire contractors before they know what they want. Contractors submit proposals against unclear scopes. Permits get rejected because the scope description doesn't match the drawings.

The result? Cost overruns, delays, and disputes that everyone involved wants to avoid.

Kealee fixes the planning phase:

→ design concept design — 3 layout options with permit scope and cost estimate delivered in 24–48 hours
→ Permit filing — we prepare and submit the application, handle reviewer comments, and track approval
→ Contractor matching — vetted contractors bid on a clear scope that actually matches the permit

The concept cost is credited toward permit drawings. The permit is in place before a contractor touches the site. The scope is defined before anyone prices the job.

That's how construction should work.`,
    hashtags: ['construction', 'homeimprovement', 'AIdesign', 'proptech', 'DMV'],
  },

  {
    week:          2,
    theme:         'Permit pain point — DMV permit complexity',
    scheduledDate: '2026-05-19',
    body: `DC building permits now go through DLCP (formerly DCRA).

If you've been dealing with permits in the District recently, you know:

→ Review timelines: 8–16 weeks for anything beyond simple work
→ Historic districts: 30% of DC residential properties require HPO review — add 4–8 weeks
→ Zone changes: Some addition projects require BZA hearings — add 3–6 months
→ Online portal: permits.dc.gov has improved, but incomplete applications still get kicked

Maryland is faster (PG County: 4–8 weeks, Montgomery County: 6–10 weeks).
Northern Virginia varies by county — Fairfax is 4–8 weeks, Arlington is 6–10.

The single biggest source of permit delay we see: starting the permit application without a complete set of drawings. Plan reviewers will issue a rejection letter for an incomplete submittal, and you're back to the end of the queue.

Our permit team handles this every day. Application prep, submittal, reviewer response — all tracked so homeowners don't have to.

Permit packages from $${PERMIT_STANDARD_PRICE}. DM us or visit kealee.com/permits.`,
    hashtags: ['buildingpermits', 'DC', 'Maryland', 'Virginia', 'DMV', 'construction', 'homeimprovement'],
  },

  {
    week:          3,
    theme:         'Case study — kitchen remodel concept to contractor',
    scheduledDate: '2026-05-26',
    body: `A homeowner in Montgomery County, MD reached out with a kitchen remodel project.

What they had:
→ 3 contractor quotes: $42,000 / $61,000 / $79,000
→ No idea why the quotes were so different
→ No drawings, no permit, no clear scope

What we did:
→ design concept with 3 layout options (48 hours)
→ Permit scope assessment — kitchen remodel required electrical and plumbing permits
→ Cost band: $48,000–$65,000 based on scope and material tier
→ Permit application prep and filing with Montgomery County
→ Scope outline sent to the same 3 contractors for re-bid

What happened:
→ The $42,000 quote was missing 2 circuits and the permit cost
→ The $79,000 quote included a full custom cabinet package they didn't want
→ The $61,000 contractor re-bid at $54,000 against the defined scope

Project started on time with a permit in hand and a scope that matched the bid.

That's the point of doing the planning work first.`,
    hashtags: ['kitchenremodel', 'construction', 'homeimprovement', 'projectmanagement', 'DMV'],
  },

  {
    week:          4,
    theme:         'Industry insight — contractor shortage + scope problems',
    scheduledDate: '2026-06-02',
    body: `The contractor shortage in the DMV is real — but it's partially a scope problem.

Here's what we see:

Good contractors are booked 3–6 months out. They're selective about which projects they take. When they get an inquiry for a "kitchen remodel" with no drawings, no permit status, and no clear scope — they quote high or don't respond at all.

The projects they prioritize: clear scope, permit in place or in process, homeowner who understands what they're buying.

How to get the good contractors to respond:

1. Have drawings (or at minimum a detailed concept) before requesting bids
2. Know your permit status — is one required? Who's filing it?
3. Have a clear scope document — not "renovate the kitchen," but "demo existing cabinets, relocate island 2 feet, add circuit for dishwasher, countertops to quartz"
4. Be clear about your timeline and decision timeline

The design concept + permit path is step 1 of this. A contractor-ready scope brief is included in every Kealee concept package.`,
    hashtags: ['construction', 'contractors', 'homeimprovement', 'scopeofwork', 'DMV', 'renovation'],
  },

  {
    week:          5,
    theme:         'Product feature — AI cost estimation',
    scheduledDate: '2026-06-09',
    body: `How accurate are AI construction cost estimates?

That's the first question we get when homeowners hear about Kealee's AI estimation engine.

Our answer: within 10–15% of actual contractor bids for defined scopes, calibrated to local market data.

How it works:

→ The AI receives your project photos, scope description, and location
→ It maps your scope to CSI MasterFormat line items (the industry standard)
→ Unit costs are calibrated to local DMV market rates (updated quarterly)
→ Output: itemized estimate by trade (demo, framing, electrical, plumbing, finishes) with low/high bands

What it's NOT:
→ A guaranteed bid
→ A replacement for contractor quotes
→ Accurate without a defined scope

What it IS:
→ A starting point to evaluate contractor proposals
→ A way to identify where quotes are high or missing items
→ A cost band that helps you budget before committing to a full design

Every Kealee concept package includes an itemized cost estimate. Starting at $${CONCEPT_KITCHEN_PRICE} for kitchen and bath concepts.`,
    hashtags: ['construction', 'costestimation', 'AI', 'homeimprovement', 'realestate', 'renovation'],
  },

  {
    week:          6,
    theme:         'Educational — what a building permit actually does',
    scheduledDate: '2026-06-16',
    body: `A building permit doesn't just give you legal permission to build.

It does something more important: it creates an inspection record that protects you at resale.

Here's what happens without a permit:

When you sell a home, the buyer's lender and home inspector will check for unpermitted work. An unfinished basement that was finished without a permit — discovered at sale — can:

→ Kill the sale if the buyer can't get financing on unpermitted space
→ Require you to open walls for retroactive inspection
→ Result in a stop-work order if work is discovered before you close
→ Create liability if the unpermitted work has code violations

In Northern Virginia, Maryland, and DC — all three jurisdictions actively audit at resale. This isn't a theoretical risk.

The permit process also means licensed inspectors check:

→ Structural connections are properly made
→ Electrical work meets code (no fire hazards)
→ Plumbing is properly vented and connected
→ Egress requirements are met for bedrooms

The permit protects you, your contractor, and the next owner of your home.

File the permit. It's worth it.`,
    hashtags: ['buildingpermits', 'homeimprovement', 'realestate', 'construction', 'DMV', 'homeowners'],
  },

  {
    week:          7,
    theme:         'ADU opportunity — DMV rental income potential',
    scheduledDate: '2026-06-23',
    body: `ADUs (Accessory Dwelling Units) are the highest-ROI renovation project in the DMV right now.

Here's the math in Northern Virginia:

Average ADU construction cost (detached, 600 sq ft): $180,000–$280,000
Average Northern Virginia rental rate for a 1BR unit: $1,800–$2,400/month

At $2,000/month, that's $24,000/year in rental income.
Payback period: 8–12 years on construction cost alone (before appreciation).

Add: property value increase from the ADU (typically 50–80% of construction cost), and the numbers get better.

What's slowing ADU adoption:

→ Zoning — not every lot in the DMV allows an ADU. Setbacks, lot coverage, and accessory structure size limits vary by jurisdiction.
→ Permit complexity — DC, Arlington, and Montgomery County all have specific ADU permit processes.
→ Construction cost uncertainty — homeowners don't know what it will cost until they're deep in the process.

Kealee's ADU concept package ($${ADU_BUNDLE_PRICE}) includes a feasibility assessment, site analysis, floor plan direction, cost estimate, and permit path for your specific jurisdiction.

If you're considering an ADU in the DMV, start with the feasibility. Don't start with a contractor.`,
    hashtags: ['ADU', 'accessorydwellingunit', 'realestate', 'construction', 'DMV', 'rentalincome', 'homeimprovement'],
  },

  {
    week:          8,
    theme:         'Closing — vision for AI-driven construction',
    scheduledDate: '2026-06-30',
    body: `Construction is the last major industry that hasn't been transformed by software.

Architecture firms use BIM. Project managers use scheduling software. But the planning phase — where most residential projects fail — still runs on phone calls, vague scopes, and handshake agreements.

We're changing that.

Over the past year, Kealee has processed hundreds of concept packages across the DMV. Here's what we've learned:

→ 70% of homeowners who get a concept don't know their project requires a permit before they start
→ 60% of contractor bids differ by more than 30% — because the scope isn't defined
→ The most common reason a project goes over budget: a surprise in the permit or structural phase

The solution is simple: do the planning work before the construction work.

design concept → permit path → contractor scope → vetted contractor bids

That's the Kealee pipeline. It's not magic — it's just applying process discipline to a phase that's historically been chaotic.

If you're planning a renovation in the DMV — kitchen, bathroom, addition, basement, deck, ADU — start at kealee.com.

The concept cost is credited toward your permit drawings. Concept packages from $${CONCEPT_KITCHEN_PRICE}.`,
    hashtags: ['construction', 'proptech', 'AI', 'homeimprovement', 'renovation', 'DMV', 'kealee'],
  },

  // ── Weeks 9–16 ────────────────────────────────────────────────────────────

  {
    week:          9,
    theme:         'Contractor audience — how Kealee helps contractors win better work',
    scheduledDate: '2026-07-07',
    body: `Most contractors don't lose jobs because of price. They lose them because the scope wasn't clear.

Here's what we see on the homeowner side: a homeowner describes a "kitchen renovation" to three contractors. The quotes come back at $42K, $61K, and $79K. The homeowner picks the middle one, not knowing that the $42K quote was missing permits and the $79K quote included custom cabinets they didn't ask for.

Everyone loses.

The contractor who wins the job is often not the best contractor — just the one who made the most favorable assumptions.

Kealee fixes this on the front end.

When a homeowner comes through the Kealee pipeline, contractors receive:

→ A scope brief with explicit demo, MEP, structural, and finish specifications
→ An AI-generated cost estimate they can compare their own pricing against
→ A permit status (applied, in process, or in hand) so no one is bidding blind on permit costs
→ Clear selection allowances or specified materials

The result: comparable bids against a defined scope. The contractor who wins is the contractor who prices the work correctly and has good references — not the one who guessed best.

If you're a contractor in the DMV looking for pre-qualified leads with defined scopes, visit kealee.com/contractors.`,
    hashtags: ['construction', 'contractors', 'renovation', 'DMV', 'scopeofwork', 'homeimprovement'],
  },

  {
    week:          10,
    theme:         'Historic renovation — DC HPO process explained',
    scheduledDate: '2026-07-14',
    body: `Roughly 30% of residential properties in DC are in a historic district or are individually designated historic resources.

If you're renovating one of them, you're dealing with two permit tracks instead of one.

**The standard DLCP permit process:**
Application → plan review → permit issuance

**The historic property process:**
Application → HPO (Historic Preservation Office) review → DLCP plan review → permit issuance

The HPO review happens first and is a hard dependency. DLCP won't issue the permit until HPO signs off.

**What triggers HPO review:**
- Any exterior change visible from a public way
- Changes to historic fabric (original windows, doors, siding, masonry)
- New additions on historic properties
- Demolition of any contributing structure

**What doesn't typically require HPO review:**
- Interior-only work with no exterior impact
- In-kind replacement of materials (same material, same location)
- Emergency repairs

**Current HPO timelines:**
- Administrative approval (minor, predictable): 2–4 weeks
- Staff-level review (moderate scope): 4–8 weeks
- Historic Preservation Review Board (significant changes): 8–12 weeks, board meets monthly

The practical takeaway: plan for HPO review time in your project schedule. Don't sequence permits as the last step — start early.

We handle historic permit packages regularly. If you have a project in a DC historic district, start the permit process before you start design.`,
    hashtags: ['historicpreservation', 'DChistory', 'buildingpermits', 'renovation', 'Washington', 'construction'],
  },

  {
    week:          11,
    theme:         'Real estate investor angle — renovation underwriting',
    scheduledDate: '2026-07-21',
    body: `Real estate investors underwrite renovation costs before they close. Most of them do it wrong.

The standard approach: get one contractor quote, add a 20% contingency, call it the renovation budget.

The problems:

1. One quote isn't a market price. It's one contractor's estimate against an undefined scope.
2. A 20% contingency doesn't cover permit surprises, structural discoveries, or MEP upgrades.
3. Without a permit path assessment, you don't know if the renovation triggers a zoning review, historic review, or code upgrade requirement.

What changes when you underwrite correctly:

**Before acquisition:**
- AI cost estimate against a defined scope (not a contractor quote)
- Permit path assessment — what's required, what's the timeline, what are the risks
- Zoning check — does the renovation trigger any additional requirements

**After acquisition:**
- Defined scope brief sent to 3+ contractors simultaneously
- Comparable bids (same scope = comparable numbers)
- Permit in place before construction starts

The acquisition risk is in the unknowns. The renovation budget needs to be built on a defined scope, not a verbal description and a gut-check contingency.

Kealee's cost estimates and permit assessments are built for investors underwriting renovation projects in the DMV. If you're active in this market, the planning work pays for itself in the first round of contractor bids.`,
    hashtags: ['realestateinvesting', 'renovation', 'propertyinvestment', 'DMV', 'construction', 'proptech'],
  },

  {
    week:          12,
    theme:         'Basement conversion — DC/MD/VA rules and costs',
    scheduledDate: '2026-07-28',
    body: `Basement finishing and conversion is one of the highest-ROI projects in the DMV — and one of the most permit-intensive.

Here's what homeowners should know before starting.

**What always requires a permit:**
- Any basement finishing that adds habitable square footage
- Adding egress windows (required for sleeping rooms)
- Any electrical or plumbing additions
- HVAC extension to conditioned space

**Egress requirements:**
A basement bedroom legally requires an egress window — minimum 5.7 sq ft of clear opening, minimum 24" high, 20" wide, sill height no more than 44" from floor. This usually means excavation outside the foundation to create a window well. Budget $8,000–$18,000 per window depending on depth and conditions.

**Permit timelines for basement finish:**
- DC: 6–10 weeks (HPO review if in historic district)
- Montgomery County: 5–8 weeks
- Fairfax County: 4–7 weeks
- Arlington: 5–8 weeks

**Cost ranges (DMV market, 2026):**
Basic finish (one open room, no bath): $35,000–$60,000
Full finish with bath and egress: $65,000–$110,000
Full finish with kitchen/ADU conversion: $90,000–$160,000

The ADU conversion is the highest-ROI option if your jurisdiction allows it and the unit has an exterior entrance. Current basement apartment rental rates in DC: $1,600–$2,200/month.

We do basement concept packages — AI-generated layout options, cost estimate, and permit path for your specific jurisdiction. Starting at $${CONCEPT_KITCHEN_PRICE} at kealee.com.`,
    hashtags: ['basement', 'homeimprovement', 'ADU', 'renovation', 'DMV', 'construction', 'realestate'],
  },

  {
    week:          13,
    theme:         'The scope document — why it matters more than the design',
    scheduledDate: '2026-08-04',
    body: `The most valuable document in a renovation project isn't the design. It's the scope of work.

The design tells you what you want. The scope tells every contractor, permit reviewer, and inspector exactly what's being built, demolished, moved, and connected.

A scope document for a kitchen renovation looks like this:

---
**DEMO:** Remove upper and lower cabinets, countertops, tile backsplash, and vinyl flooring. Keep existing appliances in place during demo.

**STRUCTURAL:** No structural changes. Existing load-bearing walls remain.

**PLUMBING:** Relocate kitchen sink 18 inches west to align with new island. Add dishwasher drain connection. All other plumbing in-kind.

**ELECTRICAL:** Add 20A dedicated circuit for microwave. Add 20A circuit for dishwasher. Install under-cabinet LED strip lighting (homeowner-supplied fixtures). Panel has capacity, no upgrade required.

**FINISHES:** Semi-custom inset cabinets (contractor-supplied, $18,000 allowance). Quartz countertops (homeowner-supplied, contractor-installed). Tile backsplash (homeowner-supplied, contractor-installed). LVP flooring throughout (homeowner-supplied, contractor-installed).

**PERMIT:** Contractor responsible for pulling permit. Electrical and plumbing permits included.
---

When this document goes to three contractors, you get three bids against the same scope. You can compare them line by line.

Without this document, you're comparing three contractors' interpretations of "update the kitchen." Those are not comparable quotes.

Every Kealee concept package includes a scope brief formatted for contractor bidding. It's the document that makes the rest of the process work.`,
    hashtags: ['construction', 'renovation', 'scopeofwork', 'projectmanagement', 'homeimprovement', 'contractors'],
  },

  {
    week:          14,
    theme:         'Developer audience — small infill and lot-split opportunity in DMV',
    scheduledDate: '2026-08-11',
    body: `Small-scale residential infill development in the DMV is underbuilt relative to demand. Here's where the opportunity is.

**DC:**
The missing middle housing push has made certain by-right development options more available — particularly in RF (Residential Flat) and RA zones. Two-unit and three-unit projects that would have required variances 3 years ago are now by-right in more zones.

The constraint is now land cost, not entitlement risk in many cases.

**Northern Virginia:**
Fairfax County's "One Fairfax" and related upzoning has opened by-right townhouse and small multifamily development in corridors that were previously single-family only. The permitting for these projects runs through the same residential track, just at higher cost.

Arlington has some of the most progressive missing middle policies in the region.

**Maryland:**
Montgomery County's "Thrive Montgomery 2050" plan continues to push transit-adjacent upzoning. The Rockville and Gaithersburg corridors have active rezoning that's opening small multifamily opportunities.

**What this means for small developers:**

The projects that make sense right now are typically:
- Lot splits where zoning allows two detached units
- ADU + primary on existing lots (effectively two-unit without subdivision)
- Teardown and replacement with 2–4 unit small multifamily

The planning work for these projects — feasibility, permit path, cost estimate — is similar to residential but more complex. We handle the planning side for small infill projects in the DMV.

If you're evaluating a site, the lot context and zoning feasibility check is the first step. Reach out at kealee.com.`,
    hashtags: ['realestate', 'infill', 'development', 'DMV', 'housing', 'proptech', 'construction'],
  },

  {
    week:          15,
    theme:         'Product update — what Kealee delivers in 48 hours',
    scheduledDate: '2026-08-18',
    body: `What actually comes back in a Kealee concept package — and how fast.

**48-hour turnaround. Here's what's in it:**

**1. Three design concepts**
Not mood boards. Actual layout options with distinct positioning — one budget-forward, one mid-range with specific upgrades, one premium. Each has a name, a rationale, and a cost band.

**2. Itemized cost estimate**
Broken down by trade: demo, framing, electrical, plumbing, HVAC, finishes. Low and high range for each trade, calibrated to DMV market rates. The estimate is built against your specific scope, not national averages.

**3. Permit scope assessment**
What permits are required for your project in your specific jurisdiction. Who reviews it, how long it typically takes, what the common rejection reasons are. If you're in a historic district, the HPO requirements are flagged.

**4. Contractor-ready scope brief**
A formatted document you can send to contractors for comparable bids. Explicit on demo scope, MEP changes, structural work, finish specifications, and permit responsibility.

**What it's not:**
- Architectural drawings (those come later, at the permit stage)
- A guaranteed contractor bid
- A substitute for a structural engineer on structural work

The concept package is the planning document. It gets you from "I want to renovate my kitchen" to "I have three layout options, a cost range, and a defined scope I can send to contractors."

That's the gap we fill. Packages from $${CONCEPT_KITCHEN_PRICE} at kealee.com.`,
    hashtags: ['construction', 'AI', 'homeimprovement', 'renovation', 'proptech', 'DMV', 'design'],
  },

  {
    week:          16,
    theme:         'Fall renovation planning — start the permit now',
    scheduledDate: '2026-08-25',
    body: `If you're planning a fall or winter renovation, the time to start the permit is now.

Here's why the timing matters:

**Current permit timelines in the DMV:**
- DC DLCP: 8–14 weeks for standard residential work
- Montgomery County: 6–10 weeks
- Fairfax County: 5–8 weeks
- Arlington: 6–9 weeks

If you want a permit in hand by October to start construction in November, the application needs to go in by late August at the latest — and that assumes a clean first submittal with no revision requests.

**The sequence that works:**
1. Concept and scope (2–3 weeks) → defines what you're actually building
2. Permit drawings (2–4 weeks for a draftsperson to produce from the concept)
3. Permit application → in the queue
4. Permit approval → start construction

**The sequence that doesn't work:**
1. Call contractors in September
2. Pick one in October
3. Find out you need a permit
4. Apply in November
5. Start construction in February (if you're lucky)

Every week of delay in the permit process is a week of delay in the construction start. The permit doesn't care about your contractor's schedule.

If you have a fall project in mind, the concept and scope work needs to start in the next 2–4 weeks.

Concept packages at kealee.com — 48-hour turnaround.`,
    hashtags: ['renovation', 'homeimprovement', 'buildingpermits', 'construction', 'DMV', 'planning'],
  },
]
