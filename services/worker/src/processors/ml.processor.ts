import { Worker, Job } from 'bullmq'
import Anthropic from '@anthropic-ai/sdk'
import { redis } from '../config/redis.config'
import { MLJobData, MLJobResult } from '../types/ml.types'

// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY
let anthropic: Anthropic | null = null

if (anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  })
} else {
  console.warn('⚠️ ANTHROPIC_API_KEY not set. ML processing will fail.')
}

// Default model
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_TEMPERATURE = 0.7

/**
 * Process ML job with Claude API
 */
async function processMLJob(job: Job<MLJobData>): Promise<MLJobResult> {
  const {
    type,
    prompt,
    systemPrompt,
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
  } = job.data

  try {
    if (!anthropic) {
      // In development, log instead of processing
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [DEV MODE] ML job would be processed:', {
          type,
          model,
          promptLength: prompt.length,
        })
        return {
          success: true,
          content: '[DEV MODE] This is a mock response. Set ANTHROPIC_API_KEY to process real ML jobs.',
          usage: {
            inputTokens: prompt.length / 4, // Rough estimate
            outputTokens: 100,
            totalTokens: prompt.length / 4 + 100,
          },
          model,
          processedAt: new Date(),
        }
      }
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const startTime = Date.now()

    // Prepare messages
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt,
      },
    ]

    // Make API call to Claude
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages,
    })

    const duration = Date.now() - startTime

    // Extract content from response
    const content = response.content
      .map((block) => {
        if (block.type === 'text') {
          return block.text
        }
        return ''
      })
      .join('\n')

    // Extract usage information
    const usage = response.usage
      ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined

    console.log(`✅ ML job processed successfully: ${job.id}`, {
      type,
      model,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      duration: `${duration}ms`,
    })

    return {
      success: true,
      content,
      usage,
      model: response.model,
      processedAt: new Date(),
    }
  } catch (error: any) {
    console.error(`❌ Failed to process ML job ${job.id}:`, error)

    // Handle rate limiting
    if (error.status === 429 || error.message?.includes('rate limit')) {
      throw new Error(`Rate limit exceeded. Please retry later.`)
    }

    // Handle invalid API key
    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error(`Invalid API key. Please check ANTHROPIC_API_KEY.`)
    }

    // Handle model errors
    if (error.status === 400 || error.message?.includes('model')) {
      throw new Error(`Invalid model or request: ${error.message}`)
    }

    // Generic error
    throw new Error(`ML processing failed: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Create ML worker
 */
export function createMLWorker(): Worker<MLJobData> {
  const worker = new Worker<MLJobData>(
    'ml',
    async (job) => {
      return processMLJob(job)
    },
    {
      connection: redis,
      concurrency: 5, // Process up to 5 ML jobs concurrently (API rate limits)
      limiter: {
        max: 50, // Max 50 ML jobs per
        duration: 60000, // 1 minute (Anthropic rate limits)
      },
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`✅ ML job ${job.id} completed`, {
      type: job.data.type,
      model: result.model,
      tokens: result.usage?.totalTokens,
    })
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ ML job ${job?.id} failed:`, {
      type: job?.data.type,
      error: err.message,
      attempts: job?.attemptsMade,
    })
  })

  worker.on('error', (err) => {
    console.error('❌ ML worker error:', err)
  })

  return worker
}
