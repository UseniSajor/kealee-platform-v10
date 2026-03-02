import { redis } from './config/redis.config'
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
import { cronManager } from './cron/cron.manager'
import type { Worker } from 'bullmq'

console.log('🚀 Starting Kealee Platform Worker Service...')

// Workers
let emailWorker: Worker | null = null
let webhookWorker: Worker | null = null
let mlWorker: Worker | null = null
let reportsWorker: Worker | null = null
let salesWorker: Worker | null = null
let mlPredictionWorker: Worker | null = null
let spatialVerificationWorker: Worker | null = null
let conceptDeliveryWorker: Worker | null = null

// Test Redis connection
async function testRedisConnection() {
  try {
    await redis.ping()
    console.log('✅ Redis connection successful')
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    process.exit(1)
  }
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
  await testRedisConnection()
  await initializeEmailQueue()
  await initializeWebhookQueue()
  await initializeMLQueue()
  await initializeReportsQueue()
  await initializeSalesQueue()
  await initializeMLPredictionQueue()
  await initializeSpatialVerificationQueue()
  await initializeConceptDeliveryQueue()
  await initializeCronJobs()

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

start().catch((error) => {
  console.error('❌ Failed to start worker service:', error)
  process.exit(1)
})
