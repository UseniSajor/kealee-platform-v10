/**
 * YouTube Organic Content Strategy — Kealee
 *
 * Channel: youtube.com/@kealee (claim at studio.youtube.com)
 * Auto-publish cron: /api/cron/youtube
 * Schedule: Wednesdays at 10am ET (long-form) + Fridays at 10am ET (Shorts)
 *
 * YouTube is different from every other platform:
 * - It's a search engine, not a social feed. SEO matters more than posting cadence.
 * - Videos live forever and compound traffic. A video posted today drives
 *   leads 3 years from now if optimized correctly.
 * - Thumbnails + titles determine click-through rate (CTR). Write those first.
 * - Average view duration matters more than view count. Target 50%+ retention.
 *
 * Cron workflow:
 * 1. Record and upload video to YouTube Studio as PRIVATE
 * 2. Note the video ID from the URL (youtube.com/watch?v=VIDEO_ID)
 * 3. Add the video ID and scheduledDate to YOUTUBE_VIDEOS below
 * 4. Cron will set it to PUBLIC on the scheduled date
 *
 * Required env vars:
 *   YOUTUBE_API_KEY       — for read operations
 *   YOUTUBE_OAUTH_TOKEN   — OAuth 2.0 token for write operations
 *   YOUTUBE_CHANNEL_ID    — your channel ID
 *   CRON_SECRET
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  ADU_BUNDLE_PRICE,
  ESTIMATION_PRICE,
  PERMIT_BASIC_PRICE,
} from '@/lib/marketing/pricing'

// ─── Channel setup ────────────────────────────────────────────────────────────

export const CHANNEL_CONFIG = {
  name:        'Kealee',
  handle:      '@kealee',
  description: `Construction planning for DC, Maryland, and Virginia homeowners.

We cover:
→ Building permit guides for DC, Montgomery County, Fairfax, Arlington
→ Renovation cost breakdowns for the DMV market
→ How to evaluate contractor quotes
→ ADU feasibility and design
→ AI-powered design concepts

Videos every Wednesday. Shorts every Friday.

Start a project: kealee.com`,
  keywords: [
    'DC building permits', 'home renovation DMV', 'kitchen remodel cost DC',
    'ADU Northern Virginia', 'Montgomery County permits', 'how to hire a contractor DC',
    'Fairfax County building permit', 'renovation planning Washington DC',
    'basement finish permit DC', 'construction planning',
  ],
  links: [
    { title: 'Start a project', url: 'https://kealee.com' },
    { title: 'Permit packages', url: 'https://kealee.com/products/permit-package' },
    { title: 'ADU bundle',      url: 'https://kealee.com/products/adu-bundle' },
  ],
  defaultTags: [
    'home renovation', 'building permits', 'DMV', 'Washington DC',
    'home improvement', 'construction', 'contractor', 'kitchen remodel',
    'bathroom remodel', 'ADU',
  ],
  watermark:      'kealee.com',
  endScreenSec:   20,   // end screen duration in seconds
  branding: {
    primaryColor:   '#3A7D52',  // forest green
    accentColor:    '#C8521A',  // burnt orange
    fontHeading:    'Syne',
    fontBody:       'DM Sans',
  },
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export const PLAYLISTS = [
  {
    title:       'DMV Permit Guides',
    description: 'Building permit process for DC, Maryland, and Northern Virginia. Timelines, requirements, and what to expect.',
    videos:      ['dc-permit-guide', 'moco-permit-guide', 'nova-permit-guide', 'historic-district-hpo'],
  },
  {
    title:       'Renovation Cost Guides',
    description: 'What renovations actually cost in the DC/MD/VA market — by project type.',
    videos:      ['kitchen-cost-dmv', 'bathroom-cost-dmv', 'addition-cost-dmv', 'basement-cost-dmv'],
  },
  {
    title:       'Contractor Selection',
    description: 'How to find, vet, and hire a contractor in the DMV. License verification, quotes, contracts.',
    videos:      ['contractor-quotes-explained', 'contractor-verification', 'scope-of-work-guide'],
  },
  {
    title:       'ADU Planning',
    description: 'Accessory Dwelling Unit feasibility, design, and permitting in DC, Maryland, and Northern Virginia.',
    videos:      ['adu-feasibility-dmv', 'adu-economics', 'adu-permit-process'],
  },
  {
    title:       'YouTube Shorts — Quick Tips',
    description: 'One-minute renovation and permit tips for DMV homeowners.',
    videos:      [],  // populated as Shorts are added
  },
]

// ─── Video schedule ───────────────────────────────────────────────────────────

export interface YouTubeVideo {
  id:             string           // slug for internal reference
  youtubeId?:     string           // YouTube video ID once uploaded (e.g. 'dQw4w9WgXcQ')
  type:           'long-form' | 'short'
  scheduledDate:  string           // YYYY-MM-DD — when cron makes it public
  title:          string           // SEO-optimized title (60 chars max)
  description:    string           // Full video description with timestamps and CTAs
  tags:           string[]         // YouTube tags (up to 500 chars total)
  thumbnailText:  string           // Bold text for thumbnail graphic
  scriptOutline:  ScriptSection[]  // Full script / outline
  targetKeyword:  string           // Primary SEO keyword
  targetLength:   string           // target video duration
}

export interface ScriptSection {
  section:   string
  timestamp: string   // e.g. '0:00'
  script:    string   // full spoken script for this section
}

export const YOUTUBE_VIDEOS: YouTubeVideo[] = [

  // ── Long-form #1 ──────────────────────────────────────────────────────────
  {
    id:            'dc-permit-guide',
    type:          'long-form',
    scheduledDate: '2026-06-03',
    targetKeyword: 'DC building permit guide 2026',
    targetLength:  '10–14 min',
    title:         'DC Building Permit Guide 2026 — DLCP Process, Timelines & Tips',
    thumbnailText: 'DC PERMIT GUIDE 2026',
    tags: [
      'DC building permit', 'DLCP permit', 'Washington DC renovation',
      'DC home improvement permit', 'building permit DC 2026',
      'how to get a permit in DC', 'DCRA permit', 'DC permit timeline',
    ],
    description: `Everything you need to know about pulling a building permit in Washington DC in 2026.

DCRA has transitioned to DLCP (Department of Licensing and Consumer Protection). This video covers the new process, current timelines, and the most common mistakes that delay permits.

TIMESTAMPS:
0:00 — Introduction
1:20 — What changed when DCRA became DLCP
3:00 — What projects require a permit in DC
5:00 — How to submit: permits.dc.gov walkthrough
7:00 — Current timelines by project type
9:00 — Historic districts and HPO review
11:30 — Most common rejection reasons
13:00 — How to avoid delays

PERMIT TIMELINES COVERED:
• Simple permits: 3–5 weeks
• Kitchen/bath with MEP: 8–12 weeks
• Additions: 12–18 weeks
• Historic district: +4–8 weeks

Need help with your DC permit? We file permits for homeowners across DC, MD, and VA.
Permit packages from $${PERMIT_STANDARD_PRICE}: https://kealee.com/products/permit-package

#DCpermits #buildingpermit #WashingtonDC #renovation #homeimprovement`,
    scriptOutline: [
      {
        section:   'Hook + intro',
        timestamp: '0:00',
        script:    `If you're planning a renovation in Washington DC and you need a building permit, this video is going to save you months of frustration. DC's permit process has changed significantly in the last two years, and most of the information online is out of date. I'm going to walk you through exactly what the process looks like today, what timelines to expect, and the most common mistakes that cause delays. Let's get into it.`,
      },
      {
        section:   'DCRA to DLCP transition',
        timestamp: '1:20',
        script:    `First, the name change. DCRA — the Department of Consumer and Regulatory Affairs — is now DLCP, the Department of Licensing and Consumer Protection. The agency changed names and reorganized some functions in 2024. The permit portal is now at permits.dc.gov. If you're looking up information and you see references to DCRA, that's still the same agency — just an old name. The permit process itself has some meaningful changes we'll cover.`,
      },
      {
        section:   'What requires a permit',
        timestamp: '3:00',
        script:    `Before you start any renovation, the first question is whether your project requires a permit. In DC, you need a permit for anything structural — opening walls, adding beams, changing the roof line. You need a permit for plumbing changes — moving a sink, relocating a toilet, adding a fixture. You need a permit for electrical changes — panel work, new circuits, adding a subpanel. You need a permit for any addition to the house — a bump-out, a deck, an ADU. And you need a permit for finishing a basement, which adds habitable square footage. What typically doesn't require a permit: cosmetic work like paint, flooring, and cabinets that stay in the same location. But when in doubt, call the permit office. A 10-minute conversation now prevents a stop-work order later.`,
      },
      {
        section:   'Submittal walkthrough',
        timestamp: '5:00',
        script:    `Now let's walk through how you actually submit a permit application in DC. Go to permits.dc.gov and create an account. You'll link your account to your property address. For most residential work, you'll be submitting a building permit application. You'll need to upload: a floor plan with dimensions, a scope of work description, an elevation drawing for any exterior work, and the contractor's DC license number if a contractor is pulling the permit. The scope description needs to match your drawings exactly. This is where most people trip up — reviewers compare your written scope to your drawings line by line.`,
      },
      {
        section:   'Timelines',
        timestamp: '7:00',
        script:    `Here are current timelines as of mid-2026. Simple permits — single trade, straightforward scope — are running 3 to 5 weeks if the submittal is complete. Kitchen or bathroom renovations with plumbing and electrical changes: 8 to 12 weeks. Room additions and structural work: 12 to 18 weeks. And I want to be clear — these are timelines for complete submittals. If your application is incomplete, it doesn't get partially reviewed. It goes back to the end of the queue. A complete submittal is the single most important thing you can do to get a permit quickly.`,
      },
      {
        section:   'Historic districts + HPO',
        timestamp: '9:00',
        script:    `About 30% of residential properties in DC are in a historic district or are individually listed historic resources. If yours is, you have an additional review process on top of the standard permit. Any exterior change visible from a public way — any change to the street-facing facade, roof, windows, or doors — requires Historic Preservation Office review before DLCP will issue the permit. HPO review adds 4 to 8 weeks for standard staff review, or 8 to 12 weeks if your project goes to the Historic Preservation Review Board. The board meets monthly, so missing a submission deadline adds another 4 weeks. If you're in Georgetown, Capitol Hill, LeDroit Park, or any of the other historic districts, plan for this time in your schedule.`,
      },
      {
        section:   'Common rejection reasons',
        timestamp: '11:30',
        script:    `The most common reasons permits get rejected in DC: incomplete drawings with missing dimensions, a scope description that doesn't match the drawings, no engineer's stamp on structural work, missing contractor license number, and incorrect property information on the application. All of these are avoidable. Before you submit, do a checklist review: does every page of drawings have dimensions? Does your written scope match every drawing? Is the contractor's current DC license number included? Is there an engineer's stamp if you're touching structure?`,
      },
      {
        section:   'CTA + close',
        timestamp: '13:00',
        script:    `If you're navigating a DC permit application, or if you just want someone to handle the whole process for you — drawings, submittal, reviewer responses — that's what we do at Kealee. Permit packages start at $${PERMIT_STANDARD_PRICE}. Link is in the description. If this video was helpful, subscribe — we post permit guides for Montgomery County, Fairfax County, and Arlington, plus renovation cost guides for the DC area. See you next Wednesday.`,
      },
    ],
  },

  // ── Long-form #2 ──────────────────────────────────────────────────────────
  {
    id:            'contractor-quotes-explained',
    type:          'long-form',
    scheduledDate: '2026-06-10',
    targetKeyword: 'why contractor quotes vary so much',
    targetLength:  '8–11 min',
    title:         'Why Your Contractor Quotes Are $40,000 Apart (And How to Fix It)',
    thumbnailText: '$42K vs $79K\nSAME PROJECT?',
    tags: [
      'contractor quotes', 'home renovation cost', 'how to hire contractor',
      'renovation planning', 'scope of work', 'contractor bids', 'home improvement',
      'DMV renovation', 'renovation tips',
    ],
    description: `Getting wildly different contractor quotes for the same renovation? This video explains exactly why it happens and gives you the tool to fix it.

TIMESTAMPS:
0:00 — The $37,000 question
1:30 — Why contractors quote different amounts
3:30 — The assumptions that drive the gap
5:00 — The scope of work: the document that fixes this
7:00 — What to put in your scope document
9:00 — How to use it to get comparable bids

SCOPE OF WORK TEMPLATE (mentioned in video): available at kealee.com

Concept packages (includes scope brief): from $${CONCEPT_KITCHEN_PRICE}
https://kealee.com

#renovation #contractorquotes #homeimprovement #scopeofwork`,
    scriptOutline: [
      {
        section:   'Hook',
        timestamp: '0:00',
        script:    `You got three quotes for your kitchen renovation: $42,000, $61,000, and $79,000. You have no idea why they're $37,000 apart. You're thinking about picking the middle one and hoping for the best. I'm going to tell you exactly why that's a mistake, what's actually driving that gap, and give you a simple tool that collapses it.`,
      },
      {
        section:   'Why quotes vary',
        timestamp: '1:30',
        script:    `The reason your quotes are so different is almost never that one contractor is dishonest. It's that they're quoting three different projects. When you describe a "kitchen renovation" verbally or in a one-paragraph email, you're giving contractors a blank canvas. They fill in the blanks differently based on their experience, their default materials, and their assumptions about what you want. Those assumptions are worth tens of thousands of dollars.`,
      },
      {
        section:   'The assumptions breakdown',
        timestamp: '3:30',
        script:    `Let me break down a real example. Three quotes on a kitchen renovation: $42K, $61K, $79K. Here's what we found when we looked at each one. The $42K contractor assumed existing cabinets were being refaced, not replaced. He excluded the permit cost. He assumed you'd do your own demo. Add those back in and his real number is closer to $54K. The $79K contractor included a full custom cabinet package — $22,000 more than semi-custom — that the homeowner never asked for. The $61K contractor was the most accurate, but included demo that the homeowner could have done themselves for free. Same project. Three interpretations. $37,000 difference.`,
      },
      {
        section:   'Scope of work intro',
        timestamp: '5:00',
        script:    `The fix is a scope of work document. This is a written specification of exactly what's being done in the project. It's not an architectural drawing. It's a clear, explicit list that eliminates assumptions. When every contractor bids the same scope, the $37,000 gap collapses to $8,000. The outliers either have something the others don't — which you can now ask about — or they'll adjust.`,
      },
      {
        section:   'What to include',
        timestamp: '7:00',
        script:    `Here's what your scope of work needs to cover. Demo: what's being removed? All cabinets, just uppers, the flooring, the backsplash? Be specific. Structural: are you opening any walls, adding a header, moving a doorway? Or no structural changes? Plumbing: is the sink staying in the same location? Are you adding a dishwasher connection? Moving the gas line? Electrical: are you adding circuits? Installing recessed lighting? Do you need an electrical permit? Finishes: cabinets — stock, semi-custom, or custom? Countertops — quartz, granite, laminate? Are you supplying them or is the contractor? And finally: permit — who's responsible for pulling it, and is the permit cost included in the bid?`,
      },
      {
        section:   'How to use it',
        timestamp: '9:00',
        script:    `Once you have this document, send it to all three contractors simultaneously and ask them to re-bid against the scope. Tell them to flag any items they see as unclear or missing. The responses will tell you a lot about each contractor's process. A good contractor will ask clarifying questions. A bad one will just send another number. We build this scope document as part of every Kealee concept package — it's formatted for contractor bidding and specific to your project. Link in the description if you want to see what that looks like. Subscribe for more renovation planning content every Wednesday.`,
      },
    ],
  },

  // ── Long-form #3 ──────────────────────────────────────────────────────────
  {
    id:            'adu-feasibility-dmv',
    type:          'long-form',
    scheduledDate: '2026-06-17',
    targetKeyword: 'ADU feasibility Northern Virginia',
    targetLength:  '12–15 min',
    title:         'ADU Feasibility in DC, MD & Northern Virginia — Complete Guide 2026',
    thumbnailText: 'CAN YOU BUILD\nAN ADU?',
    tags: [
      'ADU', 'accessory dwelling unit', 'Northern Virginia ADU', 'DC ADU',
      'Maryland ADU', 'ADU feasibility', 'backyard cottage', 'ADU permit',
      'Arlington ADU', 'Fairfax ADU', 'rental income',
    ],
    description: `Is your lot eligible for an ADU in DC, Maryland, or Northern Virginia? This video covers the zoning rules, setback requirements, and lot coverage limits for every major DMV jurisdiction.

TIMESTAMPS:
0:00 — What is an ADU?
1:30 — Why ADUs are worth considering in the DMV
3:00 — The 4 feasibility variables
5:00 — DC ADU rules
7:00 — Northern Virginia (Arlington, Fairfax)
9:30 — Maryland (Montgomery County, PG County)
11:30 — The economics: real project numbers
13:30 — Next steps and how to check your lot

ADU bundle ($${ADU_BUNDLE_PRICE}) — feasibility, floor plan, cost estimate, permit path:
https://kealee.com/products/adu-bundle

#ADU #accessorydwellingunit #DMV #NorthernVirginia #realestate`,
    scriptOutline: [
      {
        section:   'Intro',
        timestamp: '0:00',
        script:    `An ADU — accessory dwelling unit — is a secondary residential unit on your property. That could be a detached backyard cottage, a garage apartment, or a basement unit with a separate entrance. In the DC metro area right now, ADUs are getting serious attention because the math actually works. But not every lot qualifies. In this video I'm going to walk you through the feasibility variables for every major DMV jurisdiction, give you real construction cost numbers, and tell you exactly how to find out if your lot qualifies.`,
      },
      {
        section:   'Why DMV ADUs work',
        timestamp: '1:30',
        script:    `The DMV rental market makes ADU economics work better here than in most of the country. Current 1-bedroom rental rates in Northern Virginia: $1,600 to $2,300 a month depending on location. In DC proper, basement apartments are renting for $1,600 to $2,200. A detached ADU costs $120,000 to $220,000 to build depending on size and complexity. At $1,800 a month, that's $21,600 a year in rental income. Payback period: 8 to 12 years on construction cost alone, before you count the property value increase. And most appraisers credit 65 to 80% of the ADU construction cost as property value increase.`,
      },
      {
        section:   '4 feasibility variables',
        timestamp: '3:00',
        script:    `Before any of that math matters, you need to check 4 things. First: does your zoning district allow an ADU? Not all zones do. Second: minimum lot size — most jurisdictions require a minimum lot area. Third: setbacks — the ADU needs to maintain required distances from property lines. Fourth: lot coverage — your total impervious surface can't exceed the jurisdiction's limit. All four of these vary by jurisdiction and sometimes by specific zoning district within a jurisdiction. Let me walk through each one by area.`,
      },
      {
        section:   'DC ADU rules',
        timestamp: '5:00',
        script:    `In DC, ADUs are allowed in most residential zones under the updated zoning regulations. The rules: minimum lot area of 1,800 square feet for attached ADUs, 3,000 for detached. Detached ADUs are limited to one story or 20 feet in height. The ADU can't exceed 50% of the gross floor area of the main house. DC has a relatively permissive ADU framework for an urban jurisdiction. The permit process runs through DLCP and typically takes 12 to 16 weeks for an ADU permit.`,
      },
      {
        section:   'Northern Virginia',
        timestamp: '7:00',
        script:    `Northern Virginia is more variable. Arlington County is the most permissive — they allow detached ADUs by-right in most residential zones with a minimum lot size around 6,000 square feet. Fairfax County is more restrictive and depends heavily on your specific zoning district — R-1 through R-4 have different rules and the minimum lot sizes vary. Always check your specific Fairfax zoning district before assuming you qualify. For both Arlington and Fairfax, setbacks are typically 5 feet from side property lines and 25 feet from any rear street. And you need to be within the impervious surface limits for your lot.`,
      },
      {
        section:   'Maryland',
        timestamp: '9:30',
        script:    `Montgomery County has been expanding ADU allowances under its Thrive Montgomery 2050 plan. ADUs are now allowed in more zones than they were 3 years ago. The specific rules depend on whether you're in an Agricultural Reserve zone, a residential zone, or a transit-adjacent zone. Prince George's County has its own framework. In general, expect minimum lot sizes of 6,000 to 10,000 square feet and standard setback requirements.`,
      },
      {
        section:   'Economics with real numbers',
        timestamp: '11:30',
        script:    `Let me give you real project numbers. We recently delivered an ADU concept for a 530-square-foot detached studio in Springfield, Virginia. Total construction cost: $198,000 all-in. That broke down as: $28K for site work and utilities, $22K for foundation, $48K for framing and envelope, $41K for MEP, $38K for interior finishes, and $21K for permit and design. Current rental rate in that market: $1,850 a month. Annual income: $22,200. Gross yield: 11.2%. Estimated property value increase: $130,000 to $165,000.`,
      },
      {
        section:   'Next steps + CTA',
        timestamp: '13:30',
        script:    `To check your lot: DC uses the DC Zone Map at maps.dcoz.dc.gov. Fairfax County has a GIS portal at gis.fairfaxcounty.gov. Montgomery County has an online zoning lookup. Enter your address, find your zoning district, then look up that district's ADU rules. If it looks feasible on paper, the next step is a site plan to confirm setbacks and coverage before spending on design. Our ADU bundle at kealee.com is $${ADU_BUNDLE_PRICE} and includes the feasibility assessment, three floor plan concepts, cost estimate, and permit path for your jurisdiction. Link in the description. See you next Wednesday.`,
      },
    ],
  },

  // ── Long-form #4 ──────────────────────────────────────────────────────────
  {
    id:            'kitchen-cost-dmv',
    type:          'long-form',
    scheduledDate: '2026-06-24',
    targetKeyword: 'kitchen remodel cost Northern Virginia DC Maryland',
    targetLength:  '9–12 min',
    title:         'Kitchen Remodel Cost in DC, MD & Virginia — Real 2026 Numbers',
    thumbnailText: 'KITCHEN REMODEL\nCOST 2026',
    tags: [
      'kitchen remodel cost', 'kitchen renovation cost', 'DC kitchen remodel',
      'Northern Virginia kitchen remodel', 'Maryland kitchen renovation',
      'how much does kitchen remodel cost', 'DMV renovation cost',
      'kitchen remodel budget', 'kitchen renovation tips',
    ],
    description: `What does a kitchen remodel actually cost in the DC, Maryland, and Virginia area? Real 2026 numbers by scope tier, with trade-by-trade breakdowns.

TIMESTAMPS:
0:00 — Why kitchen costs vary so much
1:30 — The 3 cost tiers
3:00 — Trade-by-trade breakdown
6:30 — What drives the range: the variables
8:30 — What you can DIY to reduce cost
10:00 — Permit costs and timeline

KITCHEN CONCEPT PACKAGE — 3 AI concepts + cost estimate + permit scope: $${CONCEPT_KITCHEN_PRICE}
https://kealee.com

#kitchenremodel #kitchenrenovation #homeimprovement #DMV #renovation`,
    scriptOutline: [
      {
        section:   'Hook',
        timestamp: '0:00',
        script:    `A kitchen remodel in the DC area costs anywhere from $35,000 to $120,000. That's a $85,000 range and it's not very useful for budgeting. In this video I'm going to break down exactly what drives that range, give you real 2026 numbers for three different scope tiers, and help you understand what your specific project should cost.`,
      },
      {
        section:   'The 3 tiers',
        timestamp: '1:30',
        script:    `Let me define three tiers. Tier 1 is a cosmetic update: new cabinets and countertops in the same layout, no structural changes, no plumbing relocation, updated electrical fixtures. Cost range: $35,000 to $60,000. Tier 2 is a standard remodel: same scope as Tier 1 but with a layout change — the island moves, the sink relocates, a wall opens up. Requires plumbing and electrical permits. Cost range: $55,000 to $85,000. Tier 3 is a full renovation: structural changes, high-end finishes, custom cabinets, range hood that requires new ductwork, significant MEP work. Cost range: $80,000 to $140,000+.`,
      },
      {
        section:   'Trade breakdown',
        timestamp: '3:00',
        script:    `Here's what each trade costs in the DMV market right now. Demo: $3,000 to $8,000 depending on what's being removed and whether you do it yourself. Cabinets: this is the biggest variable. Stock cabinets run $4,000 to $12,000 for a standard kitchen. Semi-custom: $12,000 to $25,000. Custom: $25,000 to $60,000+. Countertops: quartz is the most popular right now — $3,500 to $8,000 installed for a standard kitchen. Granite is similar. Butcher block is cheaper. Marble is more. Electrical: $3,000 to $8,000 for a typical remodel with updated lighting and circuit additions. Plumbing: $2,000 to $6,000 if you're just doing fixture work. Add $4,000 to $10,000 if you're relocating the sink or adding a gas line. Flooring: $3,000 to $8,000 for LVP or tile in a standard kitchen. Backsplash: $1,500 to $5,000 for tile. Labor and general conditions: $8,000 to $18,000 depending on project complexity and contractor overhead.`,
      },
      {
        section:   'What drives the range',
        timestamp: '6:30',
        script:    `The three things that move you from the bottom to the top of any range: cabinets (custom vs. stock is a $25,000 difference), layout changes (plumbing relocation adds $4,000 to $10,000 and increases permit complexity), and finish tier (quartz vs. marble countertops, LVP vs. Zellige tile backsplash). The single most effective way to control cost: make all decisions before construction starts. Mid-project changes typically cost 30 to 50% more than the same decision made before demo.`,
      },
      {
        section:   'DIY opportunities',
        timestamp: '8:30',
        script:    `What can you reasonably DIY to reduce cost? Demo: completely reasonable for most homeowners — rent a dumpster, budget a weekend, save $3,000 to $5,000. Painting: definitely DIY if you have any aptitude for it. Appliance installation: for plug-in appliances, yes. For gas range connections, no — needs a licensed plumber. Flooring: LVP is DIY-friendly. Tile requires more skill. Backsplash tile: intermediate DIY — doable with patience.`,
      },
      {
        section:   'Permits + CTA',
        timestamp: '10:00',
        script:    `On permits: if your kitchen remodel involves moving plumbing or adding electrical circuits, you need a permit. In the DMV that's 5 to 12 weeks depending on jurisdiction. Budget $800 to $2,500 for the permit itself. Make sure your contractor's quote includes the permit cost — not all of them do. If you want an AI-generated concept for your specific kitchen with an itemized cost estimate and permit scope for your jurisdiction, that's what we do at Kealee. Kitchen concepts are $${CONCEPT_KITCHEN_PRICE} and we deliver in 48 hours. Link in the description.`,
      },
    ],
  },

  // ── Shorts ────────────────────────────────────────────────────────────────

  {
    id:            'short-permit-required-or-not',
    type:          'short',
    scheduledDate: '2026-05-29',
    targetKeyword: 'do I need a building permit',
    targetLength:  '45–60 sec',
    title:         'Do You Need a Permit? Quick DMV Guide #renovationtips #buildingpermit',
    thumbnailText: 'PERMIT OR NO\nPERMIT?',
    tags: ['building permit', 'renovation', 'home improvement', 'DMV', 'shorts'],
    description: `Do you need a building permit for your renovation project in DC, Maryland, or Virginia? Quick 60-second guide.

Full permit guide: kealee.com`,
    scriptOutline: [
      {
        section:   'Full short script',
        timestamp: '0:00',
        script:    `Do you need a permit for your renovation project? Here's the quick guide for DC, Maryland, and Northern Virginia.

Always yes: moving plumbing, adding electrical circuits, opening walls, finishing a basement, building a deck attached to your house, any addition.

Usually no: painting, replacing flooring, cabinets in the same location, replacing fixtures in-kind.

The gray zone: replacing windows, adding recessed lighting, fences over 6 feet — check your local jurisdiction.

When in doubt, a 10-minute call to your permit office is faster than a stop-work order.

Link in bio for the full guide.`,
      },
    ],
  },

  {
    id:            'short-contractor-quotes',
    type:          'short',
    scheduledDate: '2026-06-05',
    targetKeyword: 'contractor quotes vary',
    targetLength:  '45–60 sec',
    title:         'Why Your 3 Contractor Quotes Are $40K Apart #renovation #contractor',
    thumbnailText: '$42K vs $79K\nWHY?',
    tags: ['contractor quotes', 'renovation tips', 'home improvement', 'shorts'],
    description: `Getting wildly different contractor quotes? Here's why in 60 seconds.`,
    scriptOutline: [
      {
        section:   'Full short script',
        timestamp: '0:00',
        script:    `You got three contractor quotes and they're $40,000 apart. Here's exactly why.

The contractors aren't quoting the same project. They're filling in your missing details with different assumptions.

One assumed stock cabinets. One quoted custom. That's a $15,000 difference right there.

One included the permit cost. Two didn't. Another $2,000.

One assumes you're moving the sink. Two don't. Another $6,000.

The fix: a scope of work document before you get any quotes. Specify exactly what's being demolished, what MEP changes are involved, what materials, and who handles the permit.

Same scope for everyone. Quotes compress by 80%.

Full guide linked in bio.`,
      },
    ],
  },

  {
    id:            'short-adu-math',
    type:          'short',
    scheduledDate: '2026-06-12',
    targetKeyword: 'ADU rental income',
    targetLength:  '45–60 sec',
    title:         'ADU Math in Northern Virginia — Does It Actually Work? #ADU #realestate',
    thumbnailText: '$1,850/MO\nFROM YOUR BACKYARD',
    tags: ['ADU', 'real estate investing', 'rental income', 'Northern Virginia', 'shorts'],
    description: `Does building an ADU in Northern Virginia actually pencil out? Real numbers in 60 seconds.`,
    scriptOutline: [
      {
        section:   'Full short script',
        timestamp: '0:00',
        script:    `Does an ADU in Northern Virginia actually make financial sense? Here are real numbers from a project we did in Springfield.

530-square-foot detached studio ADU. Total construction cost: $198,000.

Current rental rate in that market: $1,850 a month. That's $22,200 a year.

Gross yield on construction cost: 11.2%.

Estimated property value increase: $130,000 to $165,000. Most appraisers credit 65 to 80% of construction cost.

Payback period: 9 to 12 years — and you still own the asset.

The caveat: not every lot qualifies. Check your zoning, setbacks, and lot coverage before you spend on plans. That's step one.

Link in bio for the full feasibility guide.`,
      },
    ],
  },

  {
    id:            'short-dc-permit-timeline',
    type:          'short',
    scheduledDate: '2026-06-19',
    targetKeyword: 'DC building permit timeline',
    targetLength:  '30–45 sec',
    title:         'DC Permit Timelines in 30 Seconds #DCpermits #renovation',
    thumbnailText: 'DC PERMIT\nTIMELINES',
    tags: ['DC permits', 'DLCP', 'building permit', 'renovation', 'shorts'],
    description: `Current DC building permit timelines — mid-2026. Fast facts.`,
    scriptOutline: [
      {
        section:   'Full short script',
        timestamp: '0:00',
        script:    `DC building permit timelines right now.

Simple work — 3 to 5 weeks.
Kitchen or bath with plumbing and electrical — 8 to 12 weeks.
Addition or structural work — 12 to 18 weeks.
Historic district — add 4 to 8 weeks on top of everything.

The number one way to get to the fast end of that range: submit a complete set of drawings on day one.

Incomplete submittals don't get partially reviewed. They restart from the back of the queue.

Full DC permit guide linked in bio.`,
      },
    ],
  },
]

// ─── SEO keyword targets ──────────────────────────────────────────────────────
// These are the search queries people use on YouTube before reaching out.

export const SEO_KEYWORDS = [
  // High intent, local
  'DC building permit 2026',
  'how to get building permit DC',
  'Montgomery County permit process',
  'Fairfax County building permit',
  'Arlington VA ADU permit',
  'kitchen remodel cost Northern Virginia',
  'bathroom renovation cost DC Maryland',
  'basement finishing cost DMV',
  'home addition cost Northern Virginia',

  // Problem-aware
  'why contractor quotes vary so much',
  'how to compare contractor bids',
  'scope of work for renovation',
  'do I need a permit for kitchen remodel',
  'DC historic district permit requirements',
  'HPO review DC renovation',

  // ADU specific
  'ADU feasibility Northern Virginia',
  'ADU permit process DC',
  'backyard cottage Arlington VA',
  'ADU rental income DMV',
  'can I build ADU Fairfax County',
]

// ─── Description template ─────────────────────────────────────────────────────

export function buildDescription(video: YouTubeVideo): string {
  return `${video.description}

─────────────────────────────
KEALEE — Construction planning for DC, Maryland, and Virginia homeowners.

AI design concepts, permit filing, cost estimates, and contractor-ready scope documents.
→ https://kealee.com

Products:
→ AI Design Concept (48-hour turnaround): https://kealee.com/products/ai-design
→ Permit Package: https://kealee.com/products/permit-package
→ ADU Bundle: https://kealee.com/products/adu-bundle
→ Cost Estimate: https://kealee.com/products/cost-estimate
─────────────────────────────`
}
