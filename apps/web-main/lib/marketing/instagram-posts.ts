/**
 * Instagram Organic Content Schedule — Kealee
 *
 * Platform: Instagram (Feed + Stories + Reels)
 * Account: @kealee.dmv (or @kealeedmv — register at instagram.com)
 * Auto-posting cron: /api/cron/instagram
 * Schedule: Tuesdays + Thursdays + Saturdays at 11am ET
 *
 * Instagram content strategy:
 * - Feed posts: educational carousels, before/after concepts, product explainers
 * - Stories: polls, Q&A, behind-the-scenes, swipe-up CTAs
 * - Reels: 15–30 sec tips, design concept process, permit walkthroughs
 *
 * Instagram Graph API requires:
 *   - Facebook Page connected to your Instagram Business Account
 *   - INSTAGRAM_BUSINESS_ACCOUNT_ID (from Meta Business Suite)
 *   - INSTAGRAM_ACCESS_TOKEN (long-lived page token)
 *
 * Note: Instagram API only supports image/video posts — caption only posts
 * are not supported. Each post needs an image_url or video_url.
 * Use the Kealee service photos from /public/media/service-photos/ or
 * generate AI images via Replicate for each post.
 */

import {
  PERMIT_STANDARD_PRICE,
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_BATH_PRICE,
  CONCEPT_LANDSCAPE_PRICE,
  ADU_BUNDLE_PRICE,
  ESTIMATION_PRICE,
} from '@/lib/marketing/pricing'

export type InstagramPostType = 'feed' | 'reel' | 'carousel'
export type InstagramFormat = 'educational' | 'concept-reveal' | 'tip' | 'stat' | 'cta' | 'case-study'

export interface InstagramPost {
  week:           number
  day:            'tue' | 'thu' | 'sat'
  type:           InstagramPostType
  format:         InstagramFormat
  scheduledDate:  string           // YYYY-MM-DD
  caption:        string
  hashtags:       string[]
  imagePrompt:    string           // Prompt for Replicate/DALL-E if no real photo
  imageFallback?: string           // Path to fallback image in /public/media/
  storyText?:     string           // Companion story copy (manual post)
  altText:        string           // Accessibility alt text
}

// ─── Hashtag sets ─────────────────────────────────────────────────────────────

const CORE_TAGS   = ['kealee', 'DMVrenovation', 'homeremodel', 'constructionplanning', 'AIdesign']
const PERMIT_TAGS = ['buildingpermits', 'DCpermits', 'permithelp', 'renovation', 'homeimprovement']
const LOCAL_TAGS  = ['WashingtonDC', 'NoVA', 'Maryland', 'DMV', 'DCcontractors']
const ADU_TAGS    = ['ADU', 'accessorydwellingunit', 'backyard cottage', 'rentalincome', 'realestate']
const DESIGN_TAGS = ['interiordesign', 'kitchendesign', 'bathroomdesign', 'homeconcept', 'homerenovation']

// ─── Post schedule ────────────────────────────────────────────────────────────

export const INSTAGRAM_POSTS: InstagramPost[] = [

  // ── Week 1 ────────────────────────────────────────────────────────────────

  {
    week: 1, day: 'tue', type: 'feed', format: 'educational',
    scheduledDate: '2026-05-26',
    caption: `Your renovation quote shouldn't be a guessing game. 🏠

Most homeowners get 3 quotes and have no idea why they're $40K apart.

The reason: contractors are quessing at what you want.

Here's the fix — a defined scope before you ask anyone to bid:
→ What's being demo'd
→ What plumbing or electrical changes
→ Finish materials or allowances
→ Who pulls the permit

When every contractor bids the same scope, quotes become comparable.

We build this scope document for you as part of every concept package.

Concept packages from $${CONCEPT_KITCHEN_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, ...LOCAL_TAGS, 'contractorquotes', 'homeimprovement', 'renovation'],
    imagePrompt: 'Split image: left side shows three wildly different price tags ($42K, $61K, $79K) on a kitchen renovation drawing; right side shows organized contractor bids on a clean desk. Modern, minimal graphic style.',
    imageFallback: '/media/service-photos/product-kitchen.jpg',
    altText: 'Three contractor quotes showing different prices for the same kitchen renovation',
    storyText: 'Getting wildly different quotes? Tap to find out why 👆',
  },

  {
    week: 1, day: 'thu', type: 'feed', format: 'tip',
    scheduledDate: '2026-05-28',
    caption: `DC permit tip 📋

DCRA → DLCP transition is complete.

Current timelines for residential permits:
• Simple work: 3–5 weeks
• Kitchen/bath with MEP: 8–12 weeks
• Additions/ADUs: 12–18 weeks
• Historic district: add 4–8 weeks

The #1 cause of delays: incomplete submittals.

A complete set of drawings on the first attempt is the fastest path through review.

We file permits in DC, MD, and NoVA. → link in bio`,
    hashtags: [...CORE_TAGS, ...PERMIT_TAGS, ...LOCAL_TAGS, 'DLCP', 'DCpermits'],
    imagePrompt: 'Clean infographic on warm white background showing DC permit timeline: simple (3-5 wks), kitchen/bath (8-12 wks), addition (12-18 wks), historic (+4-8 wks). Kealee brand colors — forest green and burnt orange.',
    imageFallback: '/media/service-photos/home-permits.jpg',
    altText: 'Infographic showing DC building permit timelines for different project types',
    storyText: 'DC permit timelines 2026 — swipe up for full guide',
  },

  {
    week: 1, day: 'sat', type: 'carousel', format: 'educational',
    scheduledDate: '2026-05-30',
    caption: `5 things to do before hiring a contractor 👇 (save this)

Swipe through → each step saves time and money.

1️⃣ Know your permit status
2️⃣ Get a cost estimate first
3️⃣ Write a scope of work
4️⃣ Verify license + insurance
5️⃣ Get 3 comparable bids

The order matters. Don't skip to step 5.

Full guide at kealee.com → link in bio`,
    hashtags: [...CORE_TAGS, ...LOCAL_TAGS, 'homeimprovement', 'renovation', 'firsttimehomebuyer', 'contractors'],
    imagePrompt: 'Series of 5 clean, numbered slide graphics on warm white background. Each shows one step with a bold number, short title, and 2-line explanation. Forest green headers, DM Sans typography.',
    imageFallback: '/media/service-photos/home-build.jpg',
    altText: 'Five steps to take before hiring a renovation contractor',
    storyText: 'Save this before you hire anyone 💾',
  },

  // ── Week 2 ────────────────────────────────────────────────────────────────

  {
    week: 2, day: 'tue', type: 'feed', format: 'concept-reveal',
    scheduledDate: '2026-06-02',
    caption: `Kitchen concept drop 🔥

Three layout options for a Capitol Hill rowhouse kitchen:

Option A — Open galley: remove peninsula, create straight run, maximize counter space
Option B — Island plan: relocate sink to island, open to dining
Option C — L-shape: keep existing footprint, upgrade finishes and lighting

All three generated in 48 hours. Cost estimate and permit scope included.

design concepts from $${CONCEPT_KITCHEN_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, ...DESIGN_TAGS, 'kitchenrenovation', 'kitchenremodel', 'capitolhill', 'DCdesign'],
    imagePrompt: 'Three side-by-side kitchen floor plan concepts in architectural drawing style: galley layout, island layout, L-shape layout. Clean line drawings with room labels. Below each: a rendered concept photo of the finished kitchen.',
    imageFallback: '/media/service-photos/product-kitchen.jpg',
    altText: 'Three generated using AI tools kitchen layout concepts for a DC rowhouse',
    storyText: '3 kitchen concepts in 48 hours — tap to see them 👀',
  },

  {
    week: 2, day: 'thu', type: 'reel', format: 'tip',
    scheduledDate: '2026-06-04',
    caption: `Do you need a permit for this? 🤔

The real answer for the DMV 👇

✅ Moving a sink or toilet: YES
✅ Adding a circuit: YES
✅ Opening a wall: YES
✅ Finishing a basement: YES
✅ Building a deck: YES (usually)

❌ Replacing cabinets (same location): No
❌ New flooring: No
❌ Painting: No
❌ Replacing fixtures in-kind: No

When in doubt: call your local permit office before you start.

DM us for DMV-specific permit questions.`,
    hashtags: [...CORE_TAGS, ...PERMIT_TAGS, 'DIY', 'homeimprovement', 'renovation'],
    imagePrompt: 'Vertical Reels-format graphic with bold YES/NO checklist items appearing one by one. Green checkmarks for permit required, red X for no permit needed. Clean, high-contrast design for mobile.',
    imageFallback: '/media/service-photos/home-permits.jpg',
    altText: 'Checklist of home renovation tasks that do and do not require permits',
    storyText: 'Do you need a permit? Quick answer 👆',
  },

  {
    week: 2, day: 'sat', type: 'feed', format: 'stat',
    scheduledDate: '2026-06-06',
    caption: `70% of homeowners who start a renovation don't know their project needs a permit.

We see this constantly.

It's not ignorance — the rules are genuinely confusing and vary by jurisdiction.

But the cost of not knowing:
→ Stop-work order mid-project
→ Unpermitted work flagged at resale
→ Retroactive inspections (opening walls)
→ Lender flags on the appraisal

The easiest fix: 10 minutes of permit research before you start planning.

Or DM us — we'll tell you what your project needs.`,
    hashtags: [...CORE_TAGS, ...PERMIT_TAGS, ...LOCAL_TAGS, 'homeowner', 'renovation'],
    imagePrompt: 'Bold stat graphic: large "70%" in forest green, supporting text in dark slate. Minimal background with subtle construction texture. Clean, credible design.',
    imageFallback: '/media/service-photos/home-permits.jpg',
    altText: '70% of homeowners starting renovations are unaware of permit requirements',
    storyText: 'Did you know this? 👆 (most people don\'t)',
  },

  // ── Week 3 ────────────────────────────────────────────────────────────────

  {
    week: 3, day: 'tue', type: 'carousel', format: 'case-study',
    scheduledDate: '2026-06-09',
    caption: `Real project: Montgomery County kitchen → from 3 quotes to a winning bid 🏆

Swipe to see how a defined scope changed everything.

Before Kealee: $42K / $61K / $79K quotes — no idea why.
After Kealee: scope defined, permit filed, re-bid at $54K with permit included.

Same project. Same contractors. Better outcome.

Full story →`,
    hashtags: [...CORE_TAGS, ...LOCAL_TAGS, 'kitchenremodel', 'MontgomeryCounty', 'casestudy', 'renovation'],
    imagePrompt: 'Before/after style carousel: Slide 1 shows three confusing quote sheets. Slide 2 shows a clean scope of work document. Slide 3 shows permit approval stamp. Slide 4 shows a beautiful finished kitchen. Professional documentary style.',
    imageFallback: '/media/service-photos/product-kitchen.jpg',
    altText: 'Case study showing how a defined renovation scope reduced contractor quote variance',
    storyText: 'How we turned 3 wildly different quotes into 1 clear winner 👆',
  },

  {
    week: 3, day: 'thu', type: 'feed', format: 'tip',
    scheduledDate: '2026-06-11',
    caption: `NoVA ADU reality check 🏡

Can you build a backyard cottage in Northern Virginia?

It depends on 4 things:
1️⃣ Your zoning district (Fairfax: R-1–R-20; Arlington: R-5/R-6/R-10; codes vary by jurisdiction)
2️⃣ Lot size (most jurisdictions need 6,000–8,000 sq ft min)
3️⃣ Setbacks (typically 5 ft sides, 25 ft rear from a street)
4️⃣ Lot coverage (impervious surface limits, usually 25–35%)

Arlington is the most permissive. Fairfax is more restrictive.

The zoning check is step 1 — before you spend on plans.

Our ADU bundle ($${ADU_BUNDLE_PRICE}) includes feasibility + floor plan + cost estimate + permit path → link in bio`,
    hashtags: [...CORE_TAGS, ...ADU_TAGS, 'NoVA', 'NorthernVirginia', 'Arlington', 'Fairfax', 'realestate'],
    imagePrompt: 'Aerial view illustration of a suburban lot with a small backyard cottage/ADU drawn in. Overlaid zoning checklist text. Warm, editorial illustration style.',
    imageFallback: '/media/service-photos/product-addition.jpg',
    altText: 'Illustration of an ADU in a Northern Virginia backyard with zoning feasibility checklist',
    storyText: 'Can you build an ADU on your lot? Quick check 👆',
  },

  {
    week: 3, day: 'sat', type: 'feed', format: 'concept-reveal',
    scheduledDate: '2026-06-13',
    caption: `Bathroom concept: Bethesda master bath refresh 🛁

Three directions:
A — Spa minimal: freestanding tub, frameless shower, large format tile
B — Classic white: subway tile, pedestal sink, period-correct fixtures
C — Bold contrast: black fixtures, zellige tile, statement vanity

All three: same footprint, no plumbing relocation, permit-ready scope.

AI bath concepts from $${CONCEPT_BATH_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, ...DESIGN_TAGS, 'bathroomremodel', 'bathroomdesign', 'Bethesda', 'masterbath'],
    imagePrompt: 'Three bathroom design concept images side by side: minimal spa style, classic white subway tile, bold black and zellige. Each is a photorealistic render of a master bathroom. Clean composition, natural lighting.',
    imageFallback: '/media/service-photos/product-bathroom.jpg',
    altText: 'Three generated using AI tools bathroom design concepts showing different aesthetic directions',
    storyText: 'Which one would you pick? A, B, or C? 👇',
  },

  // ── Week 4 ────────────────────────────────────────────────────────────────

  {
    week: 4, day: 'tue', type: 'reel', format: 'educational',
    scheduledDate: '2026-06-16',
    caption: `What is a scope of work and why does every contractor need one? 📄

30-second explainer 👆

A scope of work is the document that makes renovation quotes comparable.

Without it: contractors guess. Quotes vary wildly.
With it: everyone bids the same project. Quotes compress.

Every Kealee concept package includes one. → link in bio`,
    hashtags: [...CORE_TAGS, 'scopeofwork', 'contractors', 'renovation', 'homeimprovement', 'projectmanagement'],
    imagePrompt: 'Animated-style Reel showing a vague description transforming into a clear, organized scope of work document. Text appears line by line. Clean, satisfying animation feel.',
    imageFallback: '/media/service-photos/home-build.jpg',
    altText: 'Explainer showing how a scope of work document compares to a vague project description',
    storyText: 'This document saves thousands on every renovation 📄',
  },

  {
    week: 4, day: 'thu', type: 'feed', format: 'stat',
    scheduledDate: '2026-06-18',
    caption: `The average kitchen renovation in the DMV: $55,000–$95,000.

The range is wide because "kitchen renovation" means different things to different contractors.

Semi-custom cabinets vs. stock: $15,000 difference.
Moving the sink 18 inches: $4,000–$8,000.
Permit included vs. not: $1,500–$3,000.

These aren't contractor dishonesty — they're assumption differences.

A defined scope collapses the range.

Concept + scope + estimate → kealee.com`,
    hashtags: [...CORE_TAGS, ...LOCAL_TAGS, 'kitchenrenovation', 'renovationcost', 'homeimprovement'],
    imagePrompt: 'Cost breakdown bar chart graphic for a kitchen renovation. Shows how each variable (cabinets, plumbing, permits, demo) contributes to the total. Clean data visualization, brand colors.',
    imageFallback: '/media/service-photos/home-estimate.jpg',
    altText: 'Bar chart showing cost breakdown components of a DMV kitchen renovation',
    storyText: 'Why kitchen quotes vary so much 👆',
  },

  {
    week: 4, day: 'sat', type: 'carousel', format: 'educational',
    scheduledDate: '2026-06-20',
    caption: `Historic district renovation in DC: what you need to know 🏛️

~30% of DC residential properties are in a historic district.

Swipe for the HPO review process + what it affects.

Short version:
→ Any exterior change visible from the street = HPO review
→ HPO review happens BEFORE DLCP permit review
→ Add 4–8 weeks for standard HPO review
→ Board review (significant changes): 8–12 weeks

Interior-only work with no exterior impact: HPO review usually not required.

DM us for project-specific questions.`,
    hashtags: [...CORE_TAGS, ...PERMIT_TAGS, 'historicpreservation', 'DC', 'Georgetown', 'CapitolHill', 'DChistory'],
    imagePrompt: 'Carousel showing: Slide 1 - map of DC historic districts highlighted. Slide 2 - HPO review process flowchart. Slide 3 - examples of exterior changes that trigger review. Slide 4 - timeline comparison chart. Clean editorial design.',
    imageFallback: '/media/service-photos/home-permits.jpg',
    altText: 'Guide to DC historic district renovation permit requirements and HPO review process',
    storyText: 'In a DC historic district? Read this first 🏛️',
  },

  // ── Week 5 ────────────────────────────────────────────────────────────────

  {
    week: 5, day: 'tue', type: 'feed', format: 'concept-reveal',
    scheduledDate: '2026-06-23',
    caption: `ADU concept: Arlington detached studio 🏡

600 sq ft detached ADU on an R-6 lot.

What we delivered in 48 hours:
→ 3 floor plan options (studio, 1BR, live-work)
→ Setback and coverage feasibility confirmed
→ Cost estimate: $145K–$195K all-in
→ Permit path: Arlington County residential, 8–10 weeks
→ Estimated rental income: $1,750–$2,100/month

ADU bundle → link in bio ($${ADU_BUNDLE_PRICE})`,
    hashtags: [...CORE_TAGS, ...ADU_TAGS, 'Arlington', 'NoVA', 'backyard', 'rentalincome'],
    imagePrompt: 'Architectural concept image of a small modern detached backyard studio/ADU with cedar siding and large windows, surrounded by a mature suburban yard. Photorealistic render, warm afternoon light.',
    imageFallback: '/media/service-photos/product-addition.jpg',
    altText: 'Photorealistic concept render of a detached ADU studio in an Arlington backyard',
    storyText: '$1,800/month from your backyard. Here\'s how 👆',
  },

  {
    week: 5, day: 'thu', type: 'feed', format: 'tip',
    scheduledDate: '2026-06-25',
    caption: `Planning a deck or patio this summer? Here's the permit reality 🌿

DC/MD/VA quick guide:

✅ Attached deck over 30" off grade: PERMIT
✅ Freestanding deck over 200 sq ft: usually PERMIT
✅ Covered patio attached to house: PERMIT
✅ In-ground pool: PERMIT (always)

❌ Ground-level paver patio: usually no permit
❌ Pergola freestanding under size limit: varies
❌ Above-ground pool under size limit: usually no permit

The exact rules vary by jurisdiction and lot coverage limits.

10-minute call with your permit office = certainty.

We do landscape concepts from $${CONCEPT_LANDSCAPE_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, 'deck', 'patio', 'landscaping', 'outdoorliving', 'homeimprovement', 'DMV'],
    imagePrompt: 'Summer outdoor deck scene with a beautiful attached deck on a suburban home. Overlaid permit checklist. Warm golden hour light, inviting atmosphere.',
    imageFallback: '/media/service-photos/product-deck.jpg',
    altText: 'Guide to deck and patio permit requirements in the DC, Maryland, and Virginia area',
    storyText: 'Building a deck this summer? Check this first 👆',
  },

  {
    week: 5, day: 'sat', type: 'carousel', format: 'educational',
    scheduledDate: '2026-06-27',
    caption: `Basement finish checklist — before you call a contractor 📋

Swipe through all 6 steps.

The most important one people skip: egress.

A basement bedroom LEGALLY requires an egress window — minimum 5.7 sq ft of clear opening. Budget $8K–$18K per window including excavation.

Basement finish with egress + bath: $65K–$110K in DMV.
With ADU conversion: $90K–$160K.

Basement concepts from $${CONCEPT_KITCHEN_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, 'basement', 'basementfinish', 'ADU', 'homeimprovement', 'renovation', 'DMV'],
    imagePrompt: 'Six-slide carousel: each shows one step in basement finishing planning with an icon and short description. Steps: Egress check, Permit assessment, Waterproofing, MEP plan, Layout concept, Cost estimate. Clean graphic design.',
    imageFallback: '/media/service-photos/home-build.jpg',
    altText: 'Six-step checklist for planning a basement finish project',
    storyText: 'Finishing your basement? Don\'t skip step 1 👆',
  },

  // ── Week 6 ────────────────────────────────────────────────────────────────

  {
    week: 6, day: 'tue', type: 'feed', format: 'cta',
    scheduledDate: '2026-06-30',
    caption: `What you get in 48 hours with Kealee 📦

1. Three generated using AI tools layout concepts
2. Itemized cost estimate by trade
3. Permit scope for your jurisdiction
4. Contractor-ready scope brief

What it's not: architectural drawings.
What it is: the planning document that makes everything else work.

Kitchen concepts from $${CONCEPT_KITCHEN_PRICE}.
Bathroom from $${CONCEPT_BATH_PRICE}.
ADU bundle from $${ADU_BUNDLE_PRICE}.

→ link in bio to order`,
    hashtags: [...CORE_TAGS, ...DESIGN_TAGS, ...LOCAL_TAGS, 'AIdesign', 'renovation', 'homeimprovement'],
    imagePrompt: 'Flat lay product photo style: printed concept drawings, cost estimate sheet, scope document, and permit checklist arranged on a clean white desk. Professional, organized, aspirational.',
    imageFallback: '/media/service-photos/product-design-services.jpg',
    altText: 'Kealee concept package deliverables showing design concepts, cost estimate, and scope document',
    storyText: '48 hours. Here\'s everything you get 👆',
  },

  {
    week: 6, day: 'thu', type: 'reel', format: 'tip',
    scheduledDate: '2026-07-02',
    caption: `The only 3 things that slow down a permit application in DC 🐢

1️⃣ Incomplete drawings
2️⃣ Scope description that doesn't match the drawings
3️⃣ Missing contractor license number

Fix those three things and you're at the fast end of the timeline.

We handle all of this. Permit packages from $${PERMIT_STANDARD_PRICE} → link in bio`,
    hashtags: [...CORE_TAGS, ...PERMIT_TAGS, 'DC', 'DLCP', 'renovation', 'construction'],
    imagePrompt: 'Vertical Reel format: three items appear one by one with animated check-off. Bold typography, Kealee brand colors, fast pacing for Reels.',
    imageFallback: '/media/service-photos/home-permits.jpg',
    altText: 'Three common causes of DC building permit application delays',
    storyText: 'Avoid these 3 permit mistakes 👆',
  },

  {
    week: 6, day: 'sat', type: 'feed', format: 'concept-reveal',
    scheduledDate: '2026-07-04',
    caption: `Exterior concept: whole-home refresh in Chevy Chase 🏡

Three directions for a 1960s colonial:

A — Classic white: Benjamin Moore Chantilly Lace, black shutters, updated hardware
B — Warm modern: greige body, natural wood accents, board-and-batten gable
C — Soft contrast: sage green body, cream trim, black windows

No structural changes. Permit scope: paint and shutters = no permit. New windows = permit required in most jurisdictions.

Exterior concepts from $${Math.round(CONCEPT_LANDSCAPE_PRICE)} → link in bio`,
    hashtags: [...CORE_TAGS, ...DESIGN_TAGS, 'exteriordesign', 'curbappeal', 'ChevyChase', 'colonial', 'homemakeover'],
    imagePrompt: 'Three photorealistic exterior concept renders of a 1960s colonial home: one in classic white with black shutters, one in warm greige with wood accents, one in sage green with black windows. Side-by-side comparison layout.',
    imageFallback: '/media/service-photos/product-facade.jpg',
    altText: 'Three exterior color and style concept options for a Chevy Chase colonial home',
    storyText: 'Which exterior would you choose? Comment below 👇',
  },
]

// ─── Story templates (manual — posted separately) ─────────────────────────────

export const STORY_SERIES = [
  {
    series: 'Permit or No Permit?',
    frequency: 'weekly',
    format: 'poll',
    description: 'Show a renovation scenario, ask followers to vote. Reveal the answer. Build permit literacy.',
    examples: [
      { scenario: 'Replacing kitchen sink in same location', answer: 'No permit needed in most jurisdictions' },
      { scenario: 'Moving kitchen sink 18 inches to a new island', answer: 'Permit required — plumbing change' },
      { scenario: 'Finishing an unfinished basement', answer: 'Permit required — adding habitable square footage' },
      { scenario: 'Installing recessed lighting', answer: 'Permit required — new electrical circuit' },
    ],
  },
  {
    series: 'Concept Reveal',
    frequency: 'biweekly',
    format: 'image-sequence',
    description: 'Teaser → brief → 3 concepts → cost estimate. Drives saves and shares.',
  },
  {
    series: 'Ask Us Anything',
    frequency: 'biweekly',
    format: 'Q&A sticker',
    description: 'Open Q&A on permits, renovation costs, contractor selection in DMV. Answer in subsequent Stories.',
  },
  {
    series: 'Cost Check',
    frequency: 'weekly',
    format: 'slider or poll',
    description: 'Ask followers to guess the cost of a renovation project. Reveal actual DMV market cost.',
  },
]

// ─── Hashtag strategy ─────────────────────────────────────────────────────────

export const HASHTAG_STRATEGY = {
  perPost:     30,  // Instagram allows up to 30
  inCaption:   5,   // Most specific, highest intent
  inFirstComment: 25,  // Remaining tags go in first comment to keep caption clean
  rotate: true,  // Don't use the exact same set every post (algorithm penalizes)
  avoid: [
    'like4like', 'follow4follow', 'likeforlike',  // low-quality engagement bait
    '#love', '#instagood', '#beautiful',           // too broad, no intent
  ],
}

// ─── UTM links for Instagram ──────────────────────────────────────────────────

export function instagramUtmLink(path: string, postFormat: string): string {
  const base = 'https://kealee.com'
  const params = new URLSearchParams({
    utm_source: 'instagram',
    utm_medium: 'organic',
    utm_campaign: 'organic-content',
    utm_content: postFormat,
  })
  return `${base}${path}?${params.toString()}`
}

// Bio link (update in Instagram profile)
export const INSTAGRAM_BIO_LINK = instagramUtmLink('/', 'bio')

// Use a link-in-bio tool (Linktree or similar) pointing to:
export const BIO_LINK_DESTINATIONS = [
  { label: 'design concept',  url: instagramUtmLink('/products/ai-design', 'bio') },
  { label: 'Permit Package',     url: instagramUtmLink('/products/permit-package', 'bio') },
  { label: 'ADU Bundle',         url: instagramUtmLink('/products/adu-bundle', 'bio') },
  { label: 'Cost Estimate',      url: instagramUtmLink('/products/cost-estimate', 'bio') },
  { label: 'Get started',        url: instagramUtmLink('/', 'bio') },
]
