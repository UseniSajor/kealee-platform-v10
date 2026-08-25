import { createServer } from 'http'
import { logger } from './lib/logger'
import { initWorkerSentry, captureWorkerError } from './lib/sentry'
import { redis } from './config/redis.config'
import { getWorkerHealth, setHealthStartTime, setRedisHealth, setDatabaseHealth, isWorkerReadyForProduction, getWorkerAlerts } from './lib/worker-health'
import { emailQueue } from './queues/email.queue'
import { webhookQueue } from './queues/webhook.queue'
import { mlQueue } from './queues/ml.queue'
import { reportsQueue } from './queues/reports.queue'
import { salesQueue } from './queues/sales.queue'
import { mlPredictionQueue } from './queues/ml-prediction.queue'
import { createEmailWorker } from './processors/email.processor'
import { createWebhookWorker } from './processors/webhook.processor'
import { createMLWorker } from './processors/ml.processor'
import { createReportsWorker } from './processors/reports.processor'
import { createSalesWorker } from './processors/sales.processor'
import { createMLPredictionWorker } from './processors/ml-prediction.processor'
import { spatialVerificationQueue } from './queues/spatial-verification.queue'
import { createSpatialVerificationWorker } from './processors/spatial-verification.processor'
import { conceptDeliveryQueue } from './queues/concept-delivery.queue'
import { createConceptDeliveryWorker } from './processors/concept-delivery.processor'
import { intakeProcessingQueue } from './queues/intake-processing.queue'
import { createIntakeProcessingWorker } from './processors/intake-processing.processor'
import { conceptEngineQueue } from './queues/concept-engine.queue'
import { createConceptEngineWorker } from './processors/concept-engine.processor'
import { captureAnalysisQueue } from './queues/capture-analysis.queue'
import { createCaptureVisionWorker, pollAndAnalyzePending } from './processors/capture-vision.processor'
import { createVoiceTranscriptionWorker, pollAndTranscribePending } from './processors/voice-transcription.processor'
import { projectExecutionQueue } from './queues/project-execution.queue'
import { createProjectExecutionWorker } from './processors/project-execution.processor'
import { leadFollowupQueue } from './queues/lead-followup.queue'
import { createLeadFollowupWorker } from './processors/lead-followup.processor'
import { cronManager } from './cron/cron.manager'
import cron from 'node-cron'
import { drainSitePlanQueue } from './siteplan/processor'
import type { Worker } from 'bullmq'
import { createBotJobsWorker, createChainJobsWorker } from './processors/bot-jobs.processor'

logger.info('Starting Kealee Platform Worker Service')

// Initialize Sentry error tracking
initWorkerSentry()

// Workers
let emailWorker: Worker | null = null
let webhookWorker: Worker | null = null
let mlWorker: Worker | null = null
let reportsWorker: Worker | null = null
let salesWorker: Worker | null = null
let mlPredictionWorker: Worker | null = null
let spatialVerificationWorker: Worker | null = null
let conceptDeliveryWorker: Worker | null = null
let intakeProcessingWorker: Worker | null = null
let conceptEngineWorker: Worker | null = null
let captureVisionWorker: Worker | null = null
let voiceTranscriptionWorker: Worker | null = null
let projectExecutionWorker: Worker | null = null
let leadFollowupWorker: Worker | null = null
let botJobsWorker: Worker | null = null
let chainJobsWorker: Worker | null = null

// Track queues and workers for health monitoring
const allQueues = new Map<string, typeof emailQueue>()
const allWorkers = new Map<string, Worker | null>()

// Validate required environment variables at startup (fail fast, not at first query)
function validateRequiredEnv() {
  const required = ['DATABASE_URL', 'REDIS_URL'] as const
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:', missing.join(', '))
    console.error('   Worker cannot start without DATABASE_URL and REDIS_URL.')
    process.exit(1)
  }
  console.log('✅ Required environment variables present: DATABASE_URL, REDIS_URL')
}

// Test Redis connection
async function testRedisConnection() {
  try {
    await redis.ping()
    console.log('✅ Redis connection successful')
    setRedisHealth(true)
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    setRedisHealth(false)
    process.exit(1)
  }
}

// Monitor Redis connection
function monitorRedisConnection() {
  redis.on('connect', () => {
    logger.info('Redis connection established')
    setRedisHealth(true)
  })

  redis.on('error', (error) => {
    logger.error({ error }, 'Redis connection error')
    setRedisHealth(false)
  })

  redis.on('close', () => {
    logger.warn('Redis connection closed')
    setRedisHealth(false)
  })
}

// Initialize email queue and worker
async function initializeEmailQueue() {
  try {
    console.log('📧 Initializing email queue...')
    
    // Create email worker
    emailWorker = createEmailWorker()
    console.log('✅ Email worker started')
    
    // Test email queue (only in development)
    if (process.env.NODE_ENV === 'development' && process.env.TEST_EMAIL !== 'false') {
      const testEmail = await emailQueue.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email from Kealee Worker',
        html: '<h1>Test Email</h1><p>This is a test email from the Kealee Platform worker service.</p>',
        text: 'This is a test email from the Kealee Platform worker service.',
        metadata: {
          eventType: 'test',
        },
      })
      console.log(`✅ Test email job added: ${testEmail.id}`)
    }
    
    console.log('✅ Email queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize email queue:', error)
    throw error
  }
}

// Initialize webhook queue and worker
async function initializeWebhookQueue() {
  try {
    console.log('🔗 Initializing webhook queue...')
    
    // Create webhook worker
    webhookWorker = createWebhookWorker()
    console.log('✅ Webhook worker started')
    
    // Test webhook queue (only in development)
    if (process.env.NODE_ENV === 'development' && process.env.TEST_WEBHOOK !== 'false') {
      // Use a test webhook service like webhook.site or httpbin
      const testWebhookUrl = process.env.TEST_WEBHOOK_URL || 'https://httpbin.org/post'
      const testWebhook = await webhookQueue.deliverWebhook({
        url: testWebhookUrl,
        method: 'POST',
        body: {
          event: 'test',
          message: 'Test webhook from Kealee Platform worker service',
          timestamp: new Date().toISOString(),
        },
        metadata: {
          eventType: 'test',
        },
      })
      console.log(`✅ Test webhook job added: ${testWebhook.id}`)
    }
    
    console.log('✅ Webhook queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize webhook queue:', error)
    throw error
  }
}

// Initialize ML queue and worker
async function initializeMLQueue() {
  try {
    console.log('🤖 Initializing ML queue...')
    
    // Create ML worker
    mlWorker = createMLWorker()
    console.log('✅ ML worker started')
    
    // Test ML queue (only in development)
    if (process.env.NODE_ENV === 'development' && process.env.TEST_ML !== 'false') {
      const testMLJob = await mlQueue.processMLJob({
        type: 'analyze_text',
        prompt: 'Analyze this test prompt and provide a brief summary.',
        systemPrompt: 'You are a helpful assistant.',
        metadata: {
          eventType: 'test',
        },
      })
      console.log(`✅ Test ML job added: ${testMLJob.id}`)
    }
    
    console.log('✅ ML queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize ML queue:', error)
    throw error
  }
}

// Initialize reports queue and worker
async function initializeReportsQueue() {
  try {
    console.log('📄 Initializing reports queue...')
    
    // Create reports worker
    reportsWorker = createReportsWorker()
    console.log('✅ Reports worker started')
    
    // Test reports queue (only in development)
    if (process.env.NODE_ENV === 'development' && process.env.TEST_REPORTS !== 'false') {
      const testReport = await reportsQueue.generateReport({
        type: 'weekly_summary',
        title: 'Test Weekly Summary Report',
        data: {
          summary: 'This is a test report generated by the Kealee Platform worker service.',
          metrics: {
            'Projects Active': 5,
            'Tasks Completed': 23,
            'Revenue': '$12,450',
          },
        },
        format: 'pdf',
        metadata: {
          eventType: 'test',
          generatedAt: new Date(),
        },
      })
      console.log(`✅ Test report job added: ${testReport.id}`)
    }
    
    console.log('✅ Reports queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize reports queue:', error)
    throw error
  }
}

// Initialize sales queue and worker
async function initializeSalesQueue() {
  try {
    console.log('💼 Initializing sales queue...')
    
    // Create sales worker
    salesWorker = createSalesWorker()
    console.log('✅ Sales worker started')
    
    console.log('✅ Sales queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize sales queue:', error)
    throw error
  }
}

// Initialize ML prediction queue and worker
async function initializeMLPredictionQueue() {
  try {
    console.log('🔮 Initializing ML prediction queue...')
    
    // Create ML prediction worker
    mlPredictionWorker = createMLPredictionWorker()
    console.log('✅ ML prediction worker started')
    
    console.log('✅ ML prediction queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize ML prediction queue:', error)
    throw error
  }
}

// Initialize spatial verification queue and worker
async function initializeSpatialVerificationQueue() {
  try {
    console.log('Initializing spatial verification queue...')
    spatialVerificationWorker = createSpatialVerificationWorker()
    console.log('Spatial verification worker started')
    console.log('Spatial verification queue initialized')
  } catch (error) {
    console.error('Failed to initialize spatial verification queue:', error)
    throw error
  }
}

// Initialize concept delivery queue and worker
async function initializeConceptDeliveryQueue() {
  try {
    console.log('Initializing concept delivery queue...')
    conceptDeliveryWorker = createConceptDeliveryWorker()
    console.log('Concept delivery worker started')
    console.log('Concept delivery queue initialized')
  } catch (error) {
    console.error('Failed to initialize concept delivery queue:', error)
    throw error
  }
}

// Initialize intake processing queue and worker
async function initializeIntakeProcessingQueue() {
  try {
    console.log('Initializing intake processing queue...')
    intakeProcessingWorker = createIntakeProcessingWorker()
    console.log('Intake processing worker started')
  } catch (error) {
    console.error('Failed to initialize intake processing queue:', error)
    throw error
  }
}

// Initialize concept engine queue and worker
async function initializeConceptEngineQueue() {
  try {
    console.log('Initializing concept engine queue...')
    conceptEngineWorker = createConceptEngineWorker()
    console.log('Concept engine worker started (floorplan, package, architect review)')
  } catch (error) {
    console.error('Failed to initialize concept engine queue:', error)
    throw error
  }
}

// Initialize capture analysis workers (vision + voice transcription)
async function initializeCaptureAnalysisWorkers() {
  try {
    console.log('Initializing capture analysis workers...')
    captureVisionWorker = createCaptureVisionWorker()
    voiceTranscriptionWorker = createVoiceTranscriptionWorker()
    console.log('Capture vision + voice transcription workers started')

    // Register polling cron (every 2 minutes)
    cron.schedule('*/2 * * * *', async () => {
      try { await pollAndAnalyzePending() } catch (e: any) {
        console.error('[cron] pollAndAnalyzePending failed:', e.message)
      }
      try { await pollAndTranscribePending() } catch (e: any) {
        console.error('[cron] pollAndTranscribePending failed:', e.message)
      }
    }, { scheduled: true, timezone: 'UTC' })

    console.log('Capture analysis poll cron registered (every 2 min)')

    // ── Site plan ────────────────────────────────────────────────────────
    // The Stripe webhook records intent in JobQueue rather than pushing to
    // Redis, so a Redis outage delays a plan instead of losing a paid order.
    // This drains those rows. Every stage runs through Workflow.runStage, so
    // the transition guard and the persistence contract cannot be bypassed.
    //
    // Bounded per tick: a stage enqueues its successor, so an unbounded drain
    // would run a whole workflow behind one long-held tick and hide failures.
    cron.schedule('* * * * *', async () => {
      try {
        const r = await drainSitePlanQueue(10)
        if (r.claimed > 0) {
          console.log(
            `[siteplan] claimed=${r.claimed} completed=${r.completed} ` +
            `blocked=${r.blocked} failed=${r.failed} enqueued=${r.enqueued}`,
          )
          for (const d of r.details) {
            console.log(`[siteplan]   ${d.job} ${d.disposition} — ${d.summary}`)
          }
        }
      } catch (e: any) {
        console.error('[siteplan] drain failed:', e.message)
      }
    }, { scheduled: true, timezone: 'UTC' })

    console.log('Site-plan queue drain registered (every 1 min)')
  } catch (error) {
    console.error('Failed to initialize capture analysis workers:', error)
    throw error
  }
}

// Initialize project execution queue and worker
async function initializeProjectExecutionQueue() {
  try {
    console.log('Initializing project execution queue...')
    projectExecutionWorker = createProjectExecutionWorker()
    console.log('Project execution worker started')
    console.log('Project execution queue initialized')
  } catch (error) {
    console.error('Failed to initialize project execution queue:', error)
    throw error
  }
}

// Initialize lead followup queue and worker
async function initializeLeadFollowupQueue() {
  try {
    console.log('📧 Initializing lead followup queue...')
    leadFollowupWorker = createLeadFollowupWorker()
    console.log('✅ Lead followup worker started')
    console.log('✅ Lead followup queue initialized')
  } catch (error) {
    console.error('❌ Failed to initialize lead followup queue:', error)
    throw error
  }
}

async function initializeSystemCBotWorkers() {
  console.log('Initializing System C bot workers...')
  botJobsWorker = createBotJobsWorker()
  chainJobsWorker = createChainJobsWorker()
  console.log('System C bot-jobs and chain-jobs workers started')
}

// Graceful shutdown
async function shutdown() {
  console.log('\n⚠️ Shutting down worker service...')
  
  try {
    // Stop cron jobs
    cronManager.stopAllJobs()
    console.log('✅ Cron jobs stopped')
    
    // Close workers
    if (emailWorker) {
      await emailWorker.close()
      console.log('✅ Email worker closed')
    }
    
    if (webhookWorker) {
      await webhookWorker.close()
      console.log('✅ Webhook worker closed')
    }
    
    if (mlWorker) {
      await mlWorker.close()
      console.log('✅ ML worker closed')
    }
    
    if (reportsWorker) {
      await reportsWorker.close()
      console.log('✅ Reports worker closed')
    }
    
    if (salesWorker) {
      await salesWorker.close()
      console.log('✅ Sales worker closed')
    }
    
    if (mlPredictionWorker) {
      await mlPredictionWorker.close()
      console.log('✅ ML prediction worker closed')
    }

    if (spatialVerificationWorker) {
      await spatialVerificationWorker.close()
      console.log('✅ Spatial verification worker closed')
    }

    if (conceptDeliveryWorker) {
      await conceptDeliveryWorker.close()
      console.log('✅ Concept delivery worker closed')
    }

    if (intakeProcessingWorker) {
      await intakeProcessingWorker.close()
      console.log('✅ Intake processing worker closed')
    }

    if (conceptEngineWorker) {
      await conceptEngineWorker.close()
      console.log('✅ Concept engine worker closed')
    }

    if (captureVisionWorker) {
      await captureVisionWorker.close()
      console.log('✅ Capture vision worker closed')
    }

    if (voiceTranscriptionWorker) {
      await voiceTranscriptionWorker.close()
      console.log('✅ Voice transcription worker closed')
    }

    if (projectExecutionWorker) {
      await projectExecutionWorker.close()
      console.log('✅ Project execution worker closed')
    }

    if (leadFollowupWorker) {
      await leadFollowupWorker.close()
      console.log('✅ Lead followup worker closed')
    }

    if (botJobsWorker) {
      await botJobsWorker.close()
      console.log('System C bot jobs worker closed')
    }

    if (chainJobsWorker) {
      await chainJobsWorker.close()
      console.log('System C chain jobs worker closed')
    }

    // Close queues
    await emailQueue.close()
    console.log('✅ Email queue closed')
    
    await webhookQueue.close()
    console.log('✅ Webhook queue closed')
    
    await mlQueue.close()
    console.log('✅ ML queue closed')
    
    await reportsQueue.close()
    console.log('✅ Reports queue closed')
    
    await salesQueue.close()
    console.log('✅ Sales queue closed')
    
    await mlPredictionQueue.close()
    console.log('✅ ML prediction queue closed')

    await spatialVerificationQueue.close()
    console.log('✅ Spatial verification queue closed')

    await conceptDeliveryQueue.close()
    console.log('✅ Concept delivery queue closed')

    await intakeProcessingQueue.close()
    console.log('✅ Intake processing queue closed')

    await conceptEngineQueue.close()
    console.log('✅ Concept engine queue closed')

    await captureAnalysisQueue.close()
    console.log('✅ Capture analysis queue closed')

    await projectExecutionQueue.close()
    console.log('✅ Project execution queue closed')

    await leadFollowupQueue.close()
    console.log('✅ Lead followup queue closed')

    // Close Redis
    await redis.quit()
    console.log('✅ Redis connection closed')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Initialize cron jobs
async function initializeCronJobs() {
  try {
    console.log('📅 Initializing cron jobs...')
    
    // Register all cron jobs
    cronManager.registerAllJobs()
    
    // Display cron job status
    const status = cronManager.getStatus()
    console.log('📋 Cron jobs status:')
    status.forEach((job) => {
      console.log(`   ${job.running ? '✅' : '⏸️'} ${job.name} (${job.schedule})`)
    })
    
    console.log('✅ Cron jobs initialized')
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error)
    throw error
  }
}

// Initialize
async function start() {
  setHealthStartTime()
  validateRequiredEnv()
  await testRedisConnection()
  monitorRedisConnection()

  // Test database connection
  try {
    // Import Prisma to test database
    const { prisma } = await import('./lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    setDatabaseHealth(true)
    console.log('✅ Database connection successful')
  } catch (error) {
    logger.error({ error }, 'Database connection failed')
    setDatabaseHealth(false)
  }

  await initializeEmailQueue()
  await initializeWebhookQueue()
  await initializeMLQueue()
  await initializeReportsQueue()
  await initializeSalesQueue()
  await initializeMLPredictionQueue()
  await initializeSpatialVerificationQueue()
  await initializeConceptDeliveryQueue()
  await initializeIntakeProcessingQueue()
  await initializeConceptEngineQueue()
  await initializeCaptureAnalysisWorkers()
  await initializeProjectExecutionQueue()
  await initializeLeadFollowupQueue()
  await initializeSystemCBotWorkers()
  await initializeCronJobs()

  // Populate health tracking maps
  allQueues.set('email', emailQueue)
  allQueues.set('webhook', webhookQueue)
  allQueues.set('ml', mlQueue)
  allQueues.set('reports', reportsQueue)
  allQueues.set('sales', salesQueue)
  allQueues.set('mlPrediction', mlPredictionQueue)
  allQueues.set('spatialVerification', spatialVerificationQueue)
  allQueues.set('conceptDelivery', conceptDeliveryQueue)
  allQueues.set('intakeProcessing', intakeProcessingQueue)
  allQueues.set('conceptEngine', conceptEngineQueue)
  allQueues.set('captureAnalysis', captureAnalysisQueue)
  allQueues.set('projectExecution', projectExecutionQueue)
  allQueues.set('leadFollowup', leadFollowupQueue)

  allWorkers.set('email', emailWorker)
  allWorkers.set('webhook', webhookWorker)
  allWorkers.set('ml', mlWorker)
  allWorkers.set('reports', reportsWorker)
  allWorkers.set('sales', salesWorker)
  allWorkers.set('mlPrediction', mlPredictionWorker)
  allWorkers.set('spatialVerification', spatialVerificationWorker)
  allWorkers.set('conceptDelivery', conceptDeliveryWorker)
  allWorkers.set('intakeProcessing', intakeProcessingWorker)
  allWorkers.set('conceptEngine', conceptEngineWorker)
  allWorkers.set('captureVision', captureVisionWorker)
  allWorkers.set('voiceTranscription', voiceTranscriptionWorker)
  allWorkers.set('projectExecution', projectExecutionWorker)
  allWorkers.set('leadFollowup', leadFollowupWorker)
  allWorkers.set('botJobs', botJobsWorker)
  allWorkers.set('chainJobs', chainJobsWorker)

  console.log('✅ Worker service ready')
  console.log('📧 Email queue operational')
  console.log('🔗 Webhook queue operational')
  console.log('🤖 ML queue operational')
  console.log('📄 Reports queue operational')
  console.log('💼 Sales queue operational')
  console.log('🔮 ML prediction queue operational')
  console.log('🛰️ Spatial verification queue operational')
  console.log('📦 Concept delivery queue operational')
  console.log('📅 Cron jobs operational')
  
  // Keep process alive
  setInterval(() => {
    // Keep process alive
  }, 1000 * 60 * 60) // 1 hour
}

// Unhandled Promise rejection handler
process.on('unhandledRejection', (reason: Error | unknown) => {
  const error = reason instanceof Error ? reason : new Error(String(reason))
  logger.error({ err: error }, 'Unhandled Promise Rejection')
  captureWorkerError(error, { type: 'unhandledRejection' })
})

// Uncaught Exception handler
process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, 'Uncaught Exception')
  captureWorkerError(err, { type: 'uncaughtException' })
  process.exit(1)
})

start()
  .then(() => {
    // Health check HTTP server — required for Railway healthcheck probes
    const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 3099
    const healthServer = createServer(async (req, res) => {
      try {
        // Get comprehensive health status
        const health = await getWorkerHealth(allQueues, allWorkers)
        const ready = isWorkerReadyForProduction(health)
        const alerts = getWorkerAlerts(health)

        // Set HTTP status code based on health
        const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 202 : 503

        res.writeHead(statusCode, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: health.status,
          ready,
          service: 'worker',
          timestamp: health.timestamp,
          uptime: health.uptime,
          checks: health.checks,
          queues: health.queues,
          metrics: health.metrics,
          alerts: alerts.length > 0 ? alerts : undefined,
        }, null, 2))
      } catch (error) {
        logger.error({ error }, 'Health check failed')
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }))
      }
    })
    healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
      logger.info({ port: HEALTH_PORT }, 'Worker health endpoint listening')
    })
  })
  .catch((error) => {
    logger.error({ err: error }, 'Failed to start worker service')
    captureWorkerError(error as Error, { type: 'startupError' })
    process.exit(1)
  })
