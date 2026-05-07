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
} from '@kealee/core-rules'

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
    theme:         'Platform intro — AI design + permits + contractors',
    scheduledDate: '2026-05-12',
    body: `We built Kealee because construction projects fail in the planning phase.

Not at the job site. In the planning phase.

Homeowners hire contractors before they know what they want. Contractors submit proposals against unclear scopes. Permits get rejected because the scope description doesn't match the drawings.

The result? Cost overruns, delays, and disputes that everyone involved wants to avoid.

Kealee fixes the planning phase:

→ AI concept design — 3 layout options with permit scope and cost estimate delivered in 24–48 hours
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
→ AI concept with 3 layout options (48 hours)
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

The AI concept + permit path is step 1 of this. A contractor-ready scope brief is included in every Kealee concept package.`,
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

AI concept → permit path → contractor scope → vetted contractor bids

That's the Kealee pipeline. It's not magic — it's just applying process discipline to a phase that's historically been chaotic.

If you're planning a renovation in the DMV — kitchen, bathroom, addition, basement, deck, ADU — start at kealee.com.

The concept cost is credited toward your permit drawings. Concept packages from $${CONCEPT_KITCHEN_PRICE}.`,
    hashtags: ['construction', 'proptech', 'AI', 'homeimprovement', 'renovation', 'DMV', 'kealee'],
  },
]
