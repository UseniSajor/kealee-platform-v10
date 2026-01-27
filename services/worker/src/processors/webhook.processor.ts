import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { WebhookJobData, WebhookResponse, WebhookDeliveryResult } from '../types/webhook.types'

/**
 * Default timeout for webhook delivery (30 seconds)
 */
const DEFAULT_TIMEOUT = 30000

/**
 * Default headers for webhook requests
 */
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'User-Agent': 'Kealee-Platform/1.0',
}

/**
 * Deliver webhook to external endpoint
 */
async function deliverWebhook(job: Job<WebhookJobData>): Promise<WebhookDeliveryResult> {
  const { url, method = 'POST', headers = {}, body, timeout = DEFAULT_TIMEOUT } = job.data
  const attempt = job.attemptsMade + 1

  const startTime = Date.now()

  try {
    // Prepare request
    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...headers,
    }

    // Add webhook signature if secret is provided
    if (process.env.WEBHOOK_SECRET) {
      // In production, you'd want to add HMAC signature here
      // For now, we'll just add a header
      requestHeaders['X-Kealee-Webhook-Secret'] = process.env.WEBHOOK_SECRET
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    }

    // Add body for methods that support it
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    // Make HTTP request
    const response = await fetch(url, fetchOptions)
    const duration = Date.now() - startTime

    // Read response body
    let responseBody: any = null
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      try {
        responseBody = await response.json()
      } catch {
        // Ignore JSON parse errors
      }
    } else {
      try {
        responseBody = await response.text()
      } catch {
        // Ignore text parse errors
      }
    }

    // Collect response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const webhookResponse: WebhookResponse = {
      statusCode: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      duration,
    }

    // Consider 2xx and 3xx as success
    const success = response.status >= 200 && response.status < 400

    if (success) {
      console.log(`✅ Webhook delivered successfully: ${job.id}`, {
        url,
        statusCode: response.status,
        attempt,
        duration: `${duration}ms`,
      })

      return {
        success: true,
        response: webhookResponse,
        attempt,
        deliveredAt: new Date(),
      }
    } else {
      // Non-2xx/3xx responses are considered failures
      const error = `Webhook returned status ${response.status}: ${response.statusText}`
      console.warn(`⚠️ Webhook delivery failed: ${job.id}`, {
        url,
        statusCode: response.status,
        attempt,
        error,
      })

      throw new Error(error)
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    const errorMessage = error.message || 'Unknown error'

    // Handle timeout errors
    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      console.error(`⏱️ Webhook timeout: ${job.id}`, {
        url,
        attempt,
        duration: `${duration}ms`,
        timeout: `${timeout}ms`,
      })
      throw new Error(`Webhook delivery timeout after ${timeout}ms`)
    }

    // Handle network errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      console.error(`🌐 Webhook network error: ${job.id}`, {
        url,
        attempt,
        error: errorMessage,
      })
      throw new Error(`Network error: ${errorMessage}`)
    }

    // Generic error
    console.error(`❌ Webhook delivery error: ${job.id}`, {
      url,
      attempt,
      error: errorMessage,
      duration: `${duration}ms`,
    })

    throw new Error(`Webhook delivery failed: ${errorMessage}`)
  }
}

/**
 * Process webhook job
 */
async function processWebhookJob(job: Job<WebhookJobData>): Promise<WebhookDeliveryResult> {
  try {
    return await deliverWebhook(job)
  } catch (error: any) {
    // Re-throw to trigger retry logic
    throw error
  }
}

/**
 * Create webhook worker
 */
export function createWebhookWorker(): Worker<WebhookJobData> {
  const worker = new Worker<WebhookJobData>(
    'webhook',
    async (job) => {
      return processWebhookJob(job)
    },
    {
      connection: redis as any,
      concurrency: 20, // Process up to 20 webhooks concurrently
      limiter: {
        max: 1000, // Max 1000 webhooks per
        duration: 60000, // 1 minute
      },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`✅ Webhook job ${job.id} completed`, {
      url: job.data.url,
      attempt: result.attempt,
    })
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Webhook job ${job?.id} failed:`, {
      url: job?.data.url,
      error: err.message,
      attempts: job?.attemptsMade,
    })
  })

  worker.on('error', (err) => {
    console.error('❌ Webhook worker error:', err)
  })

  return worker
}
