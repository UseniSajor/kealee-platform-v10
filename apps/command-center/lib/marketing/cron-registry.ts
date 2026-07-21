/** Vercel crons on web-main — manual triggers use CRON_SECRET via ops UI. */

export interface MarketingCronJob {
  id: string
  path: string
  schedule: string
  description: string
  method?: 'GET' | 'POST'
}

export const MARKETING_CRON_JOBS: MarketingCronJob[] = [
  {
    id: 'marketing-drip',
    path: '/api/cron/marketing-drip',
    schedule: '0 14 * * *',
    description: 'Resend nurture drip (welcome + day 1/3/7)',
  },
  {
    id: 'generate-weekly-campaigns',
    path: '/api/cron/generate-weekly-campaigns',
    schedule: '0 13 * * 1',
    description: 'Generate weekly product email content (MarketingBot)',
  },
  {
    id: 'send-daily-campaigns',
    path: '/api/cron/send-daily-campaigns',
    schedule: '0 14 * * *',
    description: "Send today's campaign email via Resend",
  },
  {
    id: 'marketing-ad-spend-sync',
    path: '/api/cron/marketing-ad-spend-sync',
    schedule: '0 6 * * *',
    description: 'Sync Meta/Google/SaaS spend into marketing_channel_spend',
  },
  {
    id: 'lead-scoring',
    path: '/api/cron/lead-scoring',
    schedule: '0 */6 * * *',
    description: 'Score public_intake_leads (tier + route)',
    method: 'GET',
  },
  {
    id: 'sequences',
    path: '/api/cron/sequences',
    schedule: '0 15 * * *',
    description: 'Process GHL-style sequence queue (legacy)',
    method: 'GET',
  },
  {
    id: 'linkedin',
    path: '/api/cron/linkedin',
    schedule: '0 14 * * 1',
    description: 'LinkedIn organic post slot',
  },
  {
    id: 'instagram',
    path: '/api/cron/instagram',
    schedule: '0 16 * * 2,4,6',
    description: 'Instagram organic post slot',
  },
  {
    id: 'facebook',
    path: '/api/cron/facebook',
    schedule: '0 15 * * 1,3,5',
    description: 'Facebook organic post slot',
  },
]

export function cronTriggerUrl(siteBase: string, path: string): string {
  return `${siteBase.replace(/\/$/, '')}${path}`
}
