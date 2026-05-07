/**
 * Kealee Email Templates
 *
 * All templates return HTML strings (inline CSS, max-width 600px).
 * Prices imported from @kealee/core-rules — never hardcoded.
 * Unsubscribe links use a signed token via the unsubscribe route.
 */

import {
  CONCEPT_KITCHEN_PRICE,
  CONCEPT_WHOLE_HOME_PRICE,
  PERMIT_STANDARD_PRICE,
  PERMIT_BASIC_PRICE,
  CONCEPT_START_PRICE,
} from '@/lib/marketing/pricing'
import { signUnsubscribeToken } from '@/app/api/marketing/unsubscribe/route'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kealee.com'

// ── Shared styles ─────────────────────────────────────────────────────────────

const BASE_STYLES = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #4A5568;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
`

const HEADING_STYLE  = 'color: #1A2B4A; font-size: 22px; font-weight: 700; margin-bottom: 12px;'
const SUBHEAD_STYLE  = 'color: #1A2B4A; font-size: 17px; font-weight: 600; margin: 20px 0 8px;'
const BODY_STYLE     = 'color: #4A5568; line-height: 1.7; margin-bottom: 14px;'
const CTA_STYLE      = `
  display: inline-block;
  background: #2ABFBF;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  font-size: 16px;
  padding: 14px 32px;
  border-radius: 12px;
  margin: 24px 0;
`
const FOOTER_STYLE   = 'color: #A0AEC0; font-size: 12px; border-top: 1px solid #E2E8F0; margin-top: 32px; padding-top: 16px;'
const BADGE_STYLE    = 'background: rgba(42,191,191,0.1); color: #2ABFBF; border-radius: 999px; padding: 3px 12px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 16px;'

function footer(contactId: string, email: string): string {
  const token = signUnsubscribeToken(contactId, email)
  const unsubUrl = `${SITE_URL}/api/marketing/unsubscribe?token=${token}`
  return `
<div style="${FOOTER_STYLE}">
  Kealee · hello@kealee.com<br>
  <a href="${SITE_URL}" style="color:#2ABFBF">kealee.com</a> ·
  <a href="${unsubUrl}" style="color:#A0AEC0">Unsubscribe</a>
</div>`
}

// ── 1. Concept Welcome Email ──────────────────────────────────────────────────

export interface ConceptWelcomeParams {
  firstName:    string
  email:        string
  contactId:    string
  projectType:  string   // e.g. "Kitchen Remodel"
  funnelUrl:    string
}

export function conceptWelcomeEmail(p: ConceptWelcomeParams): string {
  return `
<div style="${BASE_STYLES}">
  <span style="${BADGE_STYLE}">Welcome to Kealee</span>
  <h1 style="${HEADING_STYLE}">Hi ${p.firstName}!</h1>
  <p style="${BODY_STYLE}">
    Thanks for your interest in a <strong>${p.projectType}</strong> concept from Kealee.
    Our AI-powered design engine generates floor plan direction, permit scope, a cost estimate,
    and material palette — all in one digital package delivered in 24–48 hours.
  </p>
  <p style="${BODY_STYLE}">
    <strong style="color:#1A2B4A">Best part:</strong> your concept cost is
    <em>credited in full</em> toward permit drawings when you're ready to build.
  </p>

  <h2 style="${SUBHEAD_STYLE}">What's included in your concept package</h2>
  <ul style="${BODY_STYLE}">
    <li>3+ AI-generated floor plan options</li>
    <li>Permit scope identification (what you'll need and why)</li>
    <li>Itemized cost estimate with material tier options</li>
    <li>Material and finish palette direction</li>
    <li>Contractor-ready scope outline</li>
  </ul>

  <div style="text-align:center;margin:32px 0">
    <a href="${p.funnelUrl}" style="${CTA_STYLE}">
      Start My ${p.projectType} Concept →
    </a>
  </div>

  <p style="color:#718096;font-size:13px">
    Packages start at $${CONCEPT_START_PRICE}. No subscription required.
    Concept cost is credited toward permit drawings.
  </p>

  ${footer(p.contactId, p.email)}
</div>`
}

// ── 2. Permit Checklist Email ─────────────────────────────────────────────────

export interface PermitChecklistParams {
  firstName:    string
  email:        string
  contactId:    string
  projectType:  string
  jurisdiction: string   // e.g. "Montgomery County, MD"
}

export function permitChecklistEmail(p: PermitChecklistParams): string {
  return `
<div style="${BASE_STYLES}">
  <span style="${BADGE_STYLE}">Permit Guide</span>
  <h1 style="${HEADING_STYLE}">Your ${p.projectType} Permit Checklist</h1>
  <p style="${BODY_STYLE}">
    Hi ${p.firstName}, here's what you'll typically need to obtain a building permit
    for a <strong>${p.projectType}</strong> project in <strong>${p.jurisdiction}</strong>.
  </p>

  <h2 style="${SUBHEAD_STYLE}">Standard permit requirements</h2>
  <ul style="${BODY_STYLE}">
    <li><strong>Permit application</strong> — jurisdiction-specific form with property details</li>
    <li><strong>Scope of work description</strong> — written summary of all work being done</li>
    <li><strong>Floor plan / site plan</strong> — may require stamped engineer drawings</li>
    <li><strong>Contractor license</strong> — required in all DMV jurisdictions</li>
    <li><strong>Insurance certificates</strong> — general liability + workers' comp</li>
    <li><strong>HOA approval letter</strong> — if applicable to your property</li>
  </ul>

  <h2 style="${SUBHEAD_STYLE}">Common delays to avoid</h2>
  <ul style="${BODY_STYLE}">
    <li>Incomplete scope descriptions (most common reason for rejection)</li>
    <li>Missing structural details for load-bearing changes</li>
    <li>Wrong zoning classification on application</li>
    <li>Starting work before permit approval (illegal in all DMV jurisdictions)</li>
  </ul>

  <p style="${BODY_STYLE}">
    <strong>Our permit team handles all of this for you.</strong>
    Kealee permit packages start at $${PERMIT_BASIC_PRICE} and include application prep,
    filing, and status tracking through approval.
  </p>

  <div style="text-align:center;margin:32px 0">
    <a href="${SITE_URL}/permits" style="${CTA_STYLE}">
      Start My Permit Package — from $${PERMIT_STANDARD_PRICE} →
    </a>
  </div>

  ${footer(p.contactId, p.email)}
</div>`
}

// ── 3. Case Study Email ───────────────────────────────────────────────────────

export interface CaseStudyParams {
  firstName:     string
  email:         string
  contactId:     string
  projectType:   string
  location:      string
  beforeCost?:   string
  afterCost?:    string
  turnaround?:   string
}

export function caseStudyEmail(p: CaseStudyParams): string {
  return `
<div style="${BASE_STYLES}">
  <span style="${BADGE_STYLE}">Client Story</span>
  <h1 style="${HEADING_STYLE}">${p.projectType} in ${p.location}: From Concept to Contractor in 2 Weeks</h1>
  <p style="${BODY_STYLE}">
    Hi ${p.firstName}, here's how a recent client in ${p.location} used Kealee to go from
    "thinking about a renovation" to signed contractor in under 2 weeks.
  </p>

  <h2 style="${SUBHEAD_STYLE}">The situation</h2>
  <p style="${BODY_STYLE}">
    The homeowner wanted a ${p.projectType.toLowerCase()} but had no idea what it would cost,
    whether permits were required, or how to find a reliable contractor.
    Three contractor quotes ranged from $${p.beforeCost ?? '45,000'} to $${p.afterCost ?? '82,000'} — with no explanation for the difference.
  </p>

  <h2 style="${SUBHEAD_STYLE}">What Kealee delivered</h2>
  <ul style="${BODY_STYLE}">
    <li>AI concept with 3 floor plan options — delivered in ${p.turnaround ?? '36 hours'}</li>
    <li>Permit scope identified — confirmed permit required, flagged load-bearing wall</li>
    <li>Cost estimate: $52,000–$68,000 (matched mid-range contractor bid)</li>
    <li>Permit filed and approved in 3 weeks</li>
    <li>Matched with 2 contractors — selected one within 5 days</li>
  </ul>

  <h2 style="${SUBHEAD_STYLE}">The result</h2>
  <p style="${BODY_STYLE}">
    Construction started on schedule with a clear scope and a permit in hand.
    No surprises, no budget overruns on scope definition.
  </p>

  <div style="text-align:center;margin:32px 0">
    <a href="${SITE_URL}/concept" style="${CTA_STYLE}">
      Start My ${p.projectType} Concept →
    </a>
  </div>

  ${footer(p.contactId, p.email)}
</div>`
}

// ── 4. Upsell Email ───────────────────────────────────────────────────────────

export interface UpsellParams {
  firstName:      string
  email:          string
  contactId:      string
  purchasedItem:  string   // e.g. "Kitchen Remodel Concept"
  nextStep:       'permits' | 'contractor' | 'advanced_design'
}

const UPSELL_CONTENT = {
  permits: {
    headline: 'Ready for permits? We handle the entire process.',
    body:     `Now that you have your concept, the next step is your building permit. Our team handles the entire application — from prep to approval tracking. Permit packages start at $${PERMIT_STANDARD_PRICE}.`,
    cta:      'Start My Permit Package',
    url:      `${SITE_URL}/permits`,
  },
  contractor: {
    headline: 'Find a vetted contractor for your project.',
    body:     'Contractor matching is included in your Kealee account. We\'ll send your concept scope to 2–3 verified contractors in your area and get you competitive bids within 3 business days.',
    cta:      'Start Contractor Match',
    url:      `${SITE_URL}/contractors`,
  },
  advanced_design: {
    headline: 'Want more design detail?',
    body:     `Upgrade to an Advanced Design package for 3D views, detailed material selections, and full room-by-room finish direction. Priced from $${CONCEPT_WHOLE_HOME_PRICE}.`,
    cta:      'Upgrade My Design',
    url:      `${SITE_URL}/concept`,
  },
}

export function upsellEmail(p: UpsellParams): string {
  const content = UPSELL_CONTENT[p.nextStep]
  return `
<div style="${BASE_STYLES}">
  <span style="${BADGE_STYLE}">Your next step with Kealee</span>
  <h1 style="${HEADING_STYLE}">${content.headline}</h1>
  <p style="${BODY_STYLE}">
    Hi ${p.firstName}! Your <strong>${p.purchasedItem}</strong> has been delivered.
    Here's what most clients do next:
  </p>
  <p style="${BODY_STYLE}">${content.body}</p>

  <div style="text-align:center;margin:32px 0">
    <a href="${content.url}" style="${CTA_STYLE}">
      ${content.cta} →
    </a>
  </div>

  <p style="color:#718096;font-size:13px">
    Questions? Reply to this email or reach us at hello@kealee.com
  </p>

  ${footer(p.contactId, p.email)}
</div>`
}

// ── 5. Monthly Newsletter Email ───────────────────────────────────────────────

export interface NewsletterParams {
  firstName:     string
  email:         string
  contactId:     string
  month:         string   // e.g. "May 2026"
  articles:      Array<{ title: string; excerpt: string; url: string }>
  featuredTip:   string
}

export function monthlyNewsletterEmail(p: NewsletterParams): string {
  const articleHtml = p.articles
    .map(a => `
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #E2E8F0">
        <h3 style="${SUBHEAD_STYLE};margin-top:0">${a.title}</h3>
        <p style="${BODY_STYLE};margin-bottom:8px">${a.excerpt}</p>
        <a href="${a.url}" style="color:#2ABFBF;font-weight:600;font-size:14px">Read more →</a>
      </div>`)
    .join('')

  return `
<div style="${BASE_STYLES}">
  <span style="${BADGE_STYLE}">Kealee Newsletter · ${p.month}</span>
  <h1 style="${HEADING_STYLE}">Construction insights for ${p.month}</h1>
  <p style="${BODY_STYLE}">Hi ${p.firstName}, here's what's new in the world of home construction, permits, and design.</p>

  <div style="background:#F7FAFC;border-radius:12px;padding:20px;margin:24px 0">
    <h2 style="${SUBHEAD_STYLE};margin-top:0">Pro Tip of the Month</h2>
    <p style="${BODY_STYLE};margin:0">${p.featuredTip}</p>
  </div>

  <h2 style="${SUBHEAD_STYLE}">Latest from the Kealee Blog</h2>
  ${articleHtml}

  <div style="background:#1A2B4A;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
    <p style="color:#E2E8F0;margin:0 0 16px;font-size:15px">
      Ready to start your next project? Concept packages from $${CONCEPT_START_PRICE}.
    </p>
    <a href="${SITE_URL}/concept" style="${CTA_STYLE};margin:0">
      Start a Concept →
    </a>
  </div>

  ${footer(p.contactId, p.email)}
</div>`
}
