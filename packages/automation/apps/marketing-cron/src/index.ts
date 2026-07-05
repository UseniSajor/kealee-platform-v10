/**
 * Marketing Cron Service
 * 
 * Standalone Node.js service for scheduled marketing tasks.
 * Runs independently from web-main to avoid build-time dependency issues.
 * 
 * Scheduled tasks:
 * - Facebook posts: Mon/Wed/Fri 10am ET
 * - Twitter posts: Daily 9am ET
 * - LinkedIn posts: Tue/Thu 11am ET
 * - YouTube posts: Sun 8am ET
 * - Email sequences: Daily 6am ET
 * - Lead scoring: Daily 2am ET
 * - Campaign generation: Weekly Mon 3am ET
 */

import cron from 'node-cron'
import { prisma } from '@kealee/database'
import { facebookHandler } from './handlers/facebook'
import { twitterHandler } from './handlers/twitter'
import { linkedinHandler } from './handlers/linkedin'
import { youtubeHandler } from './handlers/youtube'
import { sendDailyCampaignsHandler } from './handlers/send-daily-campaigns'
import { generateWeeklyCampaignsHandler } from './handlers/generate-weekly-campaigns'
import { sequencesHandler } from './handlers/sequences'
import { marketingDripHandler } from './handlers/marketing-drip'
import { leadScoringHandler } from './handlers/lead-scoring'
import { parcelOutreachHandler } from './handlers/parcel-outreach'
import { parcelEnrichmentHandler } from './handlers/parcel-enrichment'
import { marketingAdSpendSyncHandler } from './handlers/marketing-ad-spend-sync'
import { instagramHandler } from './handlers/instagram'
import { requalifyColdHandler } from './handlers/requalify-cold'

const LOG_PREFIX = '📅 [marketing-cron]'

interface CronJob {
  name: string
  schedule: string
  handler: () => Promise<void>
}

const CRON_JOBS: CronJob[] = [
  {
    name: 'Facebook Posts',
    schedule: '0 10 * * 1,3,5', // Mon/Wed/Fri 10am ET (15:00 UTC)
    handler: facebookHandler,
  },
  {
    name: 'Twitter Posts',
    schedule: '0 9 * * *', // Daily 9am ET (14:00 UTC)
    handler: twitterHandler,
  },
  {
    name: 'LinkedIn Posts',
    schedule: '0 11 * * 2,4', // Tue/Thu 11am ET (16:00 UTC)
    handler: linkedinHandler,
  },
  {
    name: 'YouTube Posts',
    schedule: '0 8 * * 0', // Sun 8am ET (13:00 UTC)
    handler: youtubeHandler,
  },
  {
    name: 'Send Daily Campaigns',
    schedule: '0 6 * * *', // Daily 6am ET (11:00 UTC)
    handler: sendDailyCampaignsHandler,
  },
  {
    name: 'Generate Weekly Campaigns',
    schedule: '0 3 * * 1', // Mon 3am ET (08:00 UTC)
    handler: generateWeeklyCampaignsHandler,
  },
  {
    name: 'Email Sequences',
    schedule: '0 7 * * *', // Daily 7am ET (12:00 UTC)
    handler: sequencesHandler,
  },
  {
    name: 'Marketing Drip',
    schedule: '0 5 * * *', // Daily 5am ET (10:00 UTC)
    handler: marketingDripHandler,
  },
  {
    name: 'Lead Scoring',
    schedule: '0 2 * * *', // Daily 2am ET (07:00 UTC)
    handler: leadScoringHandler,
  },
  {
    name: 'Parcel Outreach',
    schedule: '0 4 * * *', // Daily 4am ET (09:00 UTC)
    handler: parcelOutreachHandler,
  },
  {
    name: 'Parcel Enrichment',
    schedule: '0 1 * * *', // Daily 1am ET (06:00 UTC)
    handler: parcelEnrichmentHandler,
  },
  {
    name: 'Marketing Ad Spend Sync',
    schedule: '0 12 * * *', // Daily 12pm ET (17:00 UTC)
    handler: marketingAdSpendSyncHandler,
  },
  {
    name: 'Instagram Posts',
    schedule: '0 10 * * 2,5', // Tue/Fri 10am ET (15:00 UTC)
    handler: instagramHandler,
  },
  {
    name: 'Requalify Cold',
    schedule: '0 3 * * 0', // Sun 3am ET (08:00 UTC)
    handler: requalifyColdHandler,
  },
]

async function initializeCronJobs() {
  console.log(`\n${LOG_PREFIX} Starting marketing cron service...\n`)

  for (const job of CRON_JOBS) {
    // Validate cron expression (basic check)
    try {
      cron.validate(job.schedule)
    } catch (e) {
      console.error(`${LOG_PREFIX} Invalid cron schedule for ${job.name}: ${job.schedule}`)
      process.exit(1)
    }

    // Schedule the job
    cron.schedule(job.schedule, async () => {
      const startTime = Date.now()
      console.log(`${LOG_PREFIX} ▶️  Running: ${job.name}`)

      try {
        await job.handler()
        const duration = Date.now() - startTime
        console.log(`${LOG_PREFIX} ✅ Completed: ${job.name} (${duration}ms)`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`${LOG_PREFIX} ❌ Failed: ${job.name} — ${msg}`)
      }
    })

    console.log(`${LOG_PREFIX} 📌 Scheduled: ${job.name} (${job.schedule})`)
  }

  console.log(`\n${LOG_PREFIX} All ${CRON_JOBS.length} cron jobs initialized\n`)
}

async function main() {
  try {
    await initializeCronJobs()
    console.log(`${LOG_PREFIX} Service running. Press Ctrl+C to stop.`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Fatal error:`, error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${LOG_PREFIX} Shutting down gracefully...`)
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log(`\n${LOG_PREFIX} Received SIGTERM, shutting down...`)
  await prisma.$disconnect()
  process.exit(0)
})

main().catch((error) => {
  console.error(`${LOG_PREFIX} Initialization error:`, error)
  process.exit(1)
})
