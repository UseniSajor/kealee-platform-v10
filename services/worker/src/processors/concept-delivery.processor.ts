import { Worker, Job } from 'bullmq'
import { redis } from '../config/redis.config'
import { ConceptDeliveryJobData } from '../queues/concept-delivery.queue'
import { emailQueue } from '../queues/email.queue'

// Lazy import prisma to avoid circular deps
async function getPrisma() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    return new PrismaClient() as any
  } catch {
    console.warn('Prisma client not available in worker — using direct import')
    return null
  }
}

/**
 * Process concept delivery job
 * 1. Update order status to 'generating'
 * 2. Fetch funnel session data for page-builder input
 * 3. Call buildPage() from @kealee/page-builder
 * 4. Store result and update deliveryUrl + deliveryStatus to 'ready'
 * 5. Queue email notification to customer
 * 6. Create in-app notification
 */
async function processConceptDeliveryJob(job: Job<ConceptDeliveryJobData>) {
  const { orderId, userId, packageTier, packageName, funnelSessionId, customerEmail, customerName } = job.data
  const prisma = await getPrisma()

  if (!prisma) {
    throw new Error('Database connection unavailable')
  }

  try {
    console.log(`[concept-delivery] Starting generation for order ${orderId}`)

    // 1. Update order status to 'generating'
    await prisma.conceptPackageOrder.update({
      where: { id: orderId },
      data: { deliveryStatus: 'generating' },
    })

    await job.updateProgress(10)

    // 2. Fetch funnel session data if available
    let pageData: any = null
    let funnelData: any = null

    if (funnelSessionId) {
      try {
        funnelData = await prisma.funnelSession.findUnique({
          where: { id: funnelSessionId },
        })
      } catch {
        console.warn(`[concept-delivery] Could not fetch funnel session ${funnelSessionId}`)
      }
    }

    await job.updateProgress(20)

    // 3. Generate concept page using page-builder
    try {
      const { buildPage } = await import('@kealee/page-builder')

      // Build request from funnel session data or defaults
      const buildRequest = {
        sessionId: funnelSessionId || orderId,
        userType: funnelData?.userType || 'HOMEOWNER',
        projectType: funnelData?.projectType || 'KITCHEN_REMODEL',
        city: funnelData?.city || 'Washington',
        state: funnelData?.state || 'DC',
        budget: funnelData?.budget || '$50K',
        timeline: funnelData?.timeline || '3MONTHS',
      }

      console.log(`[concept-delivery] Calling buildPage for order ${orderId}`)
      pageData = await buildPage(buildRequest as any)
      console.log(`[concept-delivery] Page built successfully for order ${orderId}`)
    } catch (buildErr: any) {
      console.error(`[concept-delivery] buildPage failed for order ${orderId}:`, buildErr.message)
      // Still proceed — mark as ready with a dashboard URL instead
      pageData = null
    }

    await job.updateProgress(70)

    // 4. Determine delivery URL
    // If page was built, the delivery URL points to the generated page
    // Otherwise, fallback to the dashboard order page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.kealee.com'
    const deliveryUrl = pageData
      ? `${appUrl}/your-plan/${funnelSessionId || orderId}`
      : `${appUrl}/dashboard/orders/${orderId}`

    // Update order with delivery info
    await prisma.conceptPackageOrder.update({
      where: { id: orderId },
      data: {
        deliveryStatus: 'ready',
        deliveryUrl,
        deliveredAt: new Date(),
        metadata: {
          customerEmail,
          customerName,
          generatedAt: new Date().toISOString(),
          hasPageData: !!pageData,
          sections: pageData?.sections?.length || 0,
        },
      },
    })

    await job.updateProgress(85)

    // 5. Create in-app notification
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: 'ORDER_STATUS_UPDATE',
          title: 'Your concept package is ready!',
          message: `${packageName} is ready for download.`,
          channels: ['email', 'push'],
          status: 'PENDING',
          data: {
            orderId,
            deliveryStatus: 'ready',
            deliveryUrl,
            actionUrl: `/dashboard/orders/${orderId}`,
            source: 'ConceptDelivery',
          },
        },
      })
    } catch (notifErr: any) {
      console.warn(`[concept-delivery] In-app notification failed: ${notifErr.message}`)
    }

    // 6. Queue delivery email to customer
    try {
      await emailQueue.sendEmail({
        to: customerEmail,
        subject: `Your ${packageName} is ready!`,
        template: 'order_status_update',
        metadata: {
          customerName: customerName || customerEmail.split('@')[0],
          packageName,
          orderId,
          newStatus: 'ready',
          deliveryUrl,
        },
      })
    } catch (emailErr: any) {
      console.warn(`[concept-delivery] Delivery email queue failed: ${emailErr.message}`)
    }

    await job.updateProgress(100)

    console.log(`[concept-delivery] Order ${orderId} delivered successfully`)

    return {
      success: true,
      orderId,
      deliveryUrl,
      hasPageData: !!pageData,
      generatedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error(`[concept-delivery] Failed for order ${orderId}:`, error.message)

    // Mark order as failed generation (but don't change from 'generating' to error —
    // keep it as 'generating' so the retry picks it up)
    if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
      // Final attempt failed — revert to pending for manual intervention
      try {
        await prisma.conceptPackageOrder.update({
          where: { id: orderId },
          data: {
            deliveryStatus: 'pending',
            metadata: {
              customerEmail,
              customerName,
              generationError: error.message,
              failedAt: new Date().toISOString(),
              attempts: job.attemptsMade + 1,
            },
          },
        })
      } catch {
        // ignore
      }
    }

    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Create concept delivery worker
 */
export function createConceptDeliveryWorker(): Worker<ConceptDeliveryJobData> {
  const worker = new Worker<ConceptDeliveryJobData>(
    'concept-delivery',
    async (job) => {
      return processConceptDeliveryJob(job)
    },
    {
      connection: redis,
      concurrency: 3, // Process up to 3 concept generations concurrently
      limiter: {
        max: 10,
        duration: 60000, // Max 10 per minute (AI rate limiting)
      },
    }
  )

  worker.on('completed', (job) => {
    console.log(`[concept-delivery] Job ${job.id} completed for order ${job.data.orderId}`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[concept-delivery] Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('[concept-delivery] Worker error:', err)
  })

  return worker
}
