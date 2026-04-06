# keabot-marketing: Autonomous Marketing Launch Orchestration

Marketing automation bot that executes the complete 3-day launch plan autonomously.

## Features

✅ **Day 1: Search Visibility**
- Google Search Console setup & verification
- Google Analytics 4 configuration
- Sitemap discovery and submission
- SEO foundational setup

✅ **Day 2: Email Marketing**
- Welcome sequence generation (3 emails)
- Newsletter template creation
- Lead notification automation
- Contractor bid alert system

✅ **Day 3: Lead Intelligence**
- Lead scoring algorithm implementation
- Automatic contractor routing
- Quality tier classification
- Performance baseline metrics

✅ **Ongoing:**
- Marketing KPI monitoring
- Email engagement tracking
- Lead quality optimization
- Weekly performance reports

## Tools

| Tool | Purpose | Autonomous |
|------|---------|-----------|
| `setup_search_console_analytics` | Google Search Console + GA4 | Yes |
| `create_email_sequences` | Email templates + workflows | Yes |
| `implement_lead_scoring` | Lead quality scoring algorithm | Yes |
| `prepare_social_media_assets` | Export + resize product images | Yes |
| `configure_email_automation` | Resend trigger workflows | Yes |
| `monitor_launch_metrics` | KPI tracking + alerts | Yes |
| `generate_social_copy` | Platform-optimized captions | Yes |
| `submit_sitemap` | Search engine submissions | Yes |

## Quick Start

```bash
# Install
cd bots/keabot-marketing
pnpm install

# Run locally
pnpm dev

# Build for production
pnpm build
```

## Launch Command (Start Now!)

Run the complete 3-day automation:

```bash
# Via direct script
pnpm run start-launch

# Via API
curl -X POST https://api.kealee.com/bots/keabot-marketing/launch \
  -H "X-API-Key: $ADMIN_API_KEY" \
  -d '{
    "daysPerWeek": 3,
    "socialPlatforms": ["instagram", "facebook", "linkedin"],
    "emailFrequency": "weekly"
  }'
```

## Configuration

Environment variables (set in Railway):

```
RESEND_API_KEY=re_xxx...
GOOGLE_GA4_PROPERTY_ID=G-XXXXXX
GOOGLE_SEARCH_CONSOLE_DOMAIN=kealee.com
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=https://api.kealee.com
```

## Launch Timeline (Autonomous)

| Phase | Duration | Actions | Status |
|-------|----------|---------|--------|
| **Day 1** | 15 min | Google Search Console + Analytics setup | Ready |
| **Day 2** | 2 hours | Email sequences + automation workflows | Ready |
| **Day 3** | 2 hours | Lead scoring + metrics baseline | Ready |
| **Week 1** | Ongoing | Social media posting (3-5x/day) | Ready |
| **Week 2+** | Continuous | Lead quality optimization + reporting | Ready |

## Expected Results (After 7 Days)

- ✅ 10-20 qualified leads captured
- ✅ Google rankings improving
- ✅ 100+ email subscribers
- ✅ Lead quality averaging 65+ score
- ✅ 4-6 active contractor relationships
- ✅ $1,600+ estimated revenue pipeline

## Monitoring

Check bot status and metrics:

```bash
# View active tasks
curl https://api.kealee.com/bots/keabot-marketing/status

# View generated assets
curl https://api.kealee.com/bots/keabot-marketing/assets

# View metrics
curl https://api.kealee.com/bots/keabot-marketing/metrics
```

## Integration Points

- **Email:** Resend API (free tier)
- **Analytics:** Vercel + Google Analytics
- **Lead Routing:** `/marketplace/permit-routing`
- **Database:** Prisma Lead model
- **Social Media:** Scheduled via Vercel deployment

## Author

Kealee Platform v20 - AI-Powered Construction Platform
