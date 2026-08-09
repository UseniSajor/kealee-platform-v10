import cron from 'node-cron'
import { prisma } from '@kealee/database'
import { recordTaskExecution, getHealthStatus } from './monitoring'
import { initializeJobQueues, addJobToQueue } from './job-queue'
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
    schedule: '0 10 * * 1,3,5',
    handler: facebookHandler,
  },
  {
    name: 'Twitter Posts',
    schedule: '0 9 * * *',
    handler: twitterHandler,
  },
  {
    name: 'LinkedIn Posts',
    schedule: '0 11 * * 2,4',
    handler: linkedinHandler,
  },
  {
    name: 'YouTube Posts',
    schedule: '0 8 * * 0',
    handler: youtubeHandler,
  },
  {
    name: 'Send Daily Campaigns',
    schedule: '0 6 * * *',
    handler: sendDailyCampaignsHandler,
  },
  {
    name: 'Generate Weekly Campaigns',
    schedule: '0 3 * * 1',
    handler: generateWeeklyCampaignsHandler,
  },
  {
    name: 'Email Sequences',
    schedule: '0 7 * * *',
    handler: sequencesHandler,
  },
  {
    name: 'Marketing Drip',
    schedule: '0 5 * * *',
    handler: marketingDripHandler,
  },
  {
    name: 'Lead Scoring',
    schedule: '0 2 * * *',
    handler: leadScoringHandler,
  },
  {
    name: 'Parcel Outreach',
    schedule: '0 4 * * *',
    handler: parcelOutreachHandler,
  },
  {
    name: 'Parcel Enrichment',
    schedule: '0 1 * * *',
    handler: parcelEnrichmentHandler,
  },
  {
    name: 'Marketing Ad Spend Sync',
    schedule: '0 12 * * *',
    handler: marketingAdSpendSyncHandler,
  },
  {
    name: 'Instagram Posts',
    schedule: '0 10 * * 2,5',
    handler: instagramHandler,
  },
  {
    name: 'Requalify Cold',
    schedule: '0 3 * * 0',
    handler: requalifyColdHandler,
  },
]

async function initializeCronJobs() {
  console.log(`\n${LOG_PREFIX} Starting marketing cron service...\n`)

  // Initialize job queues (optional BullMQ for persistence)
  const taskNames = CRON_JOBS.map(j => j.name)
  await initializeJobQueues(taskNames)

  for (const job of CRON_JOBS) {
    try {
      cron.validate(job.schedule)
    } catch (e) {
      console.error(`${LOG_PREFIX} Invalid cron schedule for ${job.name}: ${job.schedule}`)
      process.exit(1)
    }

    cron.schedule(job.schedule, async () => {
      const startTime = Date.now()
      console.log(`${LOG_PREFIX} ▶️  Running: ${job.name}`)

      try {
        // Queue job for persistence (if Redis available)
        await addJobToQueue(job.name, {
          taskName: job.name,
          schedule: job.schedule,
          handlerName: job.handler.name,
        })

        // Execute handler
        await job.handler()

        const duration = Date.now() - startTime

        // Record success
        recordTaskExecution(job.name, job.schedule, 'success', duration)
        console.log(`${LOG_PREFIX} ✅ Completed: ${job.name} (${duration}ms)`)
      } catch (error) {
        const duration = Date.now() - startTime
        const msg = error instanceof Error ? error.message : String(error)

        // Record failure
        recordTaskExecution(job.name, job.schedule, 'failed', duration, msg)
        console.error(`${LOG_PREFIX} ❌ Failed: ${job.name} — ${msg}`)
      }
    })

    console.log(`${LOG_PREFIX} 📌 Scheduled: ${job.name} (${job.schedule})`)
  }

  console.log(`\n${LOG_PREFIX} All ${CRON_JOBS.length} cron jobs initialized\n`)

  // Log health status every hour
  setInterval(() => {
    const health = getHealthStatus()
    const rate = health.successRate.toFixed(1)
    console.log(
      `${LOG_PREFIX} Health: ${health.status} | Tasks: ${health.activeTasks} | Success rate: ${rate}%`
    )
  }, 60 * 60 * 1000)
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

process.on('SIGINT', async () => {
  console.log(`\n${LOG_PREFIX} Shutting down gracefully...`)
  const health = getHealthStatus()
  console.log(`${LOG_PREFIX} Final stats: ${health.activeTasks} tasks, ${health.successRate.toFixed(1)}% success rate`)
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

export { getHealthStatus }
