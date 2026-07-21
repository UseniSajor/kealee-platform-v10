/**
 * LinkedIn Company Page Setup — Kealee
 *
 * This file documents the manual setup steps and env vars needed
 * to activate the automated LinkedIn posting cron job.
 *
 * Auto-posting cron: /api/cron/linkedin
 * Schedule: Mondays at 10:00 AM ET (0 14 * * 1 UTC)
 * Posts from: lib/marketing/linkedin-posts.ts (weeks 1–16)
 *
 * ─── STEP 1: Create a LinkedIn Company Page ──────────────────────────────────
 *
 * 1. Go to linkedin.com/company/setup/new
 * 2. Company name: Kealee
 * 3. Website: kealee.com
 * 4. Industry: Real Estate / Construction
 * 5. Company size: 1–10 employees
 * 6. Company type: Privately Held
 * 7. Upload logo (400x400px minimum, square crop)
 * 8. Write company description (see COMPANY_DESCRIPTION below)
 * 9. Add tagline: "AI-powered design, permits, and construction planning for the DMV"
 *
 * ─── STEP 2: Get the Organization ID ────────────────────────────────────────
 *
 * After creating the page, go to your company page URL.
 * It will look like: linkedin.com/company/12345678/
 * The number (12345678) is your Organization ID.
 * Set as env var: LINKEDIN_ORGANIZATION_ID=12345678
 * (The cron will prepend "urn:li:organization:" automatically)
 *
 * ─── STEP 3: Create a LinkedIn App ──────────────────────────────────────────
 *
 * 1. Go to linkedin.com/developers/apps → Create App
 * 2. App name: Kealee Publisher
 * 3. LinkedIn Page: select your Kealee company page
 * 4. Privacy policy URL: https://kealee.com/privacy
 * 5. App logo: upload Kealee logo
 * 6. Check "I have read and agree to these terms"
 * 7. Click Create App
 *
 * ─── STEP 4: Request API permissions ─────────────────────────────────────────
 *
 * In your app settings → Products tab:
 * Request access to: "Share on LinkedIn" and "Marketing Developer Platform"
 *
 * Under Auth tab → OAuth 2.0 scopes, ensure you have:
 * - w_organization_social   (post on behalf of your company page)
 * - r_organization_social   (read company page posts)
 * - rw_organization_admin   (admin access — may be needed)
 *
 * ─── STEP 5: Generate an Access Token ───────────────────────────────────────
 *
 * Option A (simplest — 60-day token):
 * 1. In your app → Auth tab → OAuth 2.0 tools → "Token generator"
 * 2. Select scopes: w_organization_social, r_organization_social
 * 3. Click "Request access token"
 * 4. Complete LinkedIn OAuth flow
 * 5. Copy the access token
 * Set as env var: LINKEDIN_ACCESS_TOKEN=<token>
 *
 * Note: This token expires in 60 days. Set a calendar reminder to refresh it.
 *
 * Option B (longer-lived — recommended for production):
 * Use LinkedIn's OAuth 2.0 refresh token flow. The refresh token lasts 365 days
 * and can generate new access tokens. Requires more setup.
 * See: learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 *
 * ─── STEP 6: Set Vercel environment variables ────────────────────────────────
 *
 * In Vercel dashboard → kealee-web-main → Settings → Environment Variables:
 *
 * LINKEDIN_ACCESS_TOKEN      = <60-day OAuth token from Step 5>
 * LINKEDIN_ORGANIZATION_ID   = <numeric ID from Step 2>
 * CRON_SECRET                = <any random string, e.g. output of: openssl rand -hex 32>
 *
 * The cron job at /api/cron/linkedin is already configured in vercel.json.
 * It runs every Monday at 10am ET automatically.
 *
 * ─── STEP 7: Test the integration ────────────────────────────────────────────
 *
 * Trigger a manual test post from your terminal:
 *
 * curl -X GET https://kealee.com/api/cron/linkedin \
 *   -H "Authorization: Bearer <your-CRON_SECRET>"
 *
 * If successful you'll see: { "success": true, "postId": "...", "week": N }
 * If no post is scheduled for today: { "skipped": true }
 *
 * To force a test on a day with no scheduled post, temporarily change one post's
 * scheduledDate to today's date in linkedin-posts.ts.
 */

export const COMPANY_DESCRIPTION = `Kealee is a construction planning platform for homeowners, contractors, and developers in Washington DC, Maryland, and Virginia.

We help you plan your renovation or development project before you hire a contractor — AI-generated design concepts, permit filing, cost estimation, and contractor-ready scope documents.

Our pipeline: AI concept → permit path → scope brief → vetted contractor bids.

The concept cost is credited toward permit drawings. Concept packages from $395.`

export const PROFILE_TAGLINE = 'AI-powered design, permits, and construction planning for the DMV'

export const FEATURED_CONTENT_LINKS = [
  { title: 'AI Design Concepts', url: 'https://kealee.com/products/ai-design' },
  { title: 'Permit Packages',    url: 'https://kealee.com/products/permit-package' },
  { title: 'ADU Bundle',         url: 'https://kealee.com/products/adu-bundle' },
  { title: 'Cost Estimates',     url: 'https://kealee.com/products/cost-estimate' },
]

// ─── Hashtags to follow on LinkedIn ──────────────────────────────────────────
// Follow these on the company page to surface relevant content for engagement.

export const HASHTAGS_TO_FOLLOW = [
  '#HomeImprovement',
  '#BuildingPermits',
  '#Construction',
  '#DMVRealEstate',
  '#WashingtonDC',
  '#NoVA',
  '#Maryland',
  '#ADU',
  '#Renovation',
  '#RealEstateInvesting',
  '#Proptech',
  '#AIDesign',
]

// ─── Engagement targets ───────────────────────────────────────────────────────
// Comment on posts from these types of accounts to build company page visibility.

export const ENGAGEMENT_TARGETS = [
  'DC-area real estate agents and teams',
  'DMV home improvement contractors',
  'DC area architecture firms',
  'DMV real estate investors and syndicators',
  'Local home builders and developers',
  'DC-area interior designers',
  'Montgomery County and Fairfax County local news pages',
  'NARI (National Association of the Remodeling Industry) chapters',
]
