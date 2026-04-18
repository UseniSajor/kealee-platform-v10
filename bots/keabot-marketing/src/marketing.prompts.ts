/**
 * bots/keabot-marketing/src/marketing.prompts.ts
 */

export const MARKETING_BOT_SYSTEM_PROMPT = `You are MarketingBot, the autonomous marketing orchestrator for Kealee Platform.

Your role:
- Execute the 3-day marketing launch plan automatically
- Set up analytics, email automation, and lead scoring
- Generate high-quality marketing content (emails, social captions)
- Monitor KPIs and optimize continuously
- Route high-value leads to sales team

Capabilities:
- Google Search Console & Analytics setup coordination
- Email sequence generation (welcome, newsletter, notifications)
- Lead scoring algorithm implementation
- Social media content preparation and scheduling
- Email automation workflow configuration
- Real-time marketing metrics monitoring
- Social media copy generation with platform optimization

Core Responsibilities:
1. DAY 1 (Today): Set up search engines + analytics
   - Google Search Console verification
   - Google Analytics 4 configuration  
   - Sitemap submission
   - Initial SEO audit

2. DAY 2 (Tomorrow): Email marketing infrastructure
   - Welcome email sequence (3 emails over 10 days)
   - Newsletter template creation
   - Lead notification automation
   - Contractor bid alerts

3. DAY 3 (Day 3): Lead management automation
   - Lead scoring algorithm (budget, location, project type)
   - Automatic contractor routing
   - Quality tier classification
   - Performance tracking

Ongoing:
- Monitor leads/day, email open rates, conversion rates
- Optimize email templates based on engagement
- Scale social media distribution
- Generate weekly marketing performance reports

Constraints:
- Always use free/existing tools (Google, Resend, Vercel)
- No external APIs unless explicitly approved
- Email compliance (CAN-SPAM, GDPR)
- Brand voice consistency across all channels

For all tasks: Think like a fractional CMO. You decide what's needed, create it, implement it.`;

export function buildDay1SetupPrompt(params: any): string {
  return `
MARKETING LAUNCH - DAY 1: SEARCH & ANALYTICS SETUP

Context:
- Domain: ${params.domain}
- Email: ${params.businessEmail}
- DNS Provider: ${params.dnsProvider}

Task: Autonomously create step-by-step instructions for:
1. Google Search Console setup & domain verification
2. Google Analytics 4 property creation
3. Sitemap discovery
4. DNS TXT record setup (specific to ${params.dnsProvider})

Output: Detailed instructions that a non-technical person can follow in 15 minutes.
Include screenshots references, exact button clicks, and verification steps.

Also generate:
- Google Analytics 4 measurement ID installation code
- Sitemap URL: https://${params.domain}/sitemap.xml
- Search Console property URL for team bookmarking
  `;
}

export function buildDay2EmailPrompt(params: any): string {
  return `
MARKETING LAUNCH - DAY 2: EMAIL AUTOMATION SETUP

Context:
- Company: ${params.businessName}
- Sender: ${params.senderEmail}
- Templates needed: ${params.templates.join(', ')}
- Follow-up schedule: ${params.deliveryDays.join(', ')} days

Task: Generate complete email templates for:

1. WELCOME SEQUENCE (3 emails, days 0, 5, 10):
   - Email 1: Warm welcome + success story preview
   - Email 2: Educational: Budget guide for homeowners
   - Email 3: Social proof: Customer testimonial

2. NEWSLETTER TEMPLATE:
   - Weekly cadence (Tuesday 9am UTC)
   - Mix of tips, trends, case studies
   - 20% promotional, 80% educational

3. NOTIFICATION TEMPLATES:
   - Lead confirmation (instant)
   - Bid notification (instant)
   - Design complete (1 hour delay)
   - Payment receipt (instant)

Requirements:
- Mobile-optimized (Outlook + Gmail)
- Brand colors: #0066CC, #FF6B00
- Include unsubscribe link (CAN-SPAM)
- Personalization: {firstName}, {projectType}, {budget}
- Call-to-action buttons clearly visible

Output: HTML templates ready for Resend API
  `;
}

export function buildDay3LeadScoringPrompt(params: any): string {
  return `
MARKETING LAUNCH - DAY 3: LEAD SCORING & ROUTING

Context:
- Scoring strategy: ${params.routingStrategy}
- Quality threshold: ${params.qualityThreshold}/100
- Scoring factors: ${JSON.stringify(params.scoringFactors)}

Task: Create complete lead scoring implementation:

1. SCORING ALGORITHM:
   - Budget impact (weight 30%): $50K = 25 pts, $150K = 75 pts, $500K = 100 pts
   - Location match (weight 25%): Geographic contractor availability
   - Project type (weight 20%): Residential, multifamily, commercial
   - Urgency (weight 15%): Timeline signals in lead form
   - Conversion history (weight 10%): Historical project success rate

2. QUALITY TIERS:
   - HOT (80+): Immediate contractor assignment + urgent notification
   - WARM (60-79): Standard routing + routine notification
   - COOL (<60): Low priority + weekly digest

3. AUTO-ROUTING RULES:
   - Geographic matching: Find contractors in same zip/state
   - Specialty matching: Match contractor expertise to project type
   - Capacity matching: Route to contractors with available capacity

4. DATABASE QUERIES:
   - Get all open leads with missing scores
   - Apply scoring algorithm
   - Update Lead.quality_score field
   - Route via marketplace/permit-routing system

Output: 
- SQL migration for Lead table (if needed)
- TypeScript scoring function
- API endpoint: POST /api/leads/{id}/rescore
- Batch job: Daily lead scoring at 6am UTC
  `;
}
