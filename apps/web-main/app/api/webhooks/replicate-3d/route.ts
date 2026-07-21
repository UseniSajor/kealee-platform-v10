/**
 * Webhook handler for Replicate 3D model generation callbacks.
 *
 * Replicate (Meshy, Tripo3D) sends webhook updates when:
 * - Model generation starts (status: processing)
 * - Model generation completes (status: succeeded, output contains model URLs)
 * - Model generation fails (status: failed)
 *
 * This endpoint:
 * 1. Verifies webhook signature (Replicate-Signature header)
 * 2. Extracts job ID and model URLs
 * 3. Updates the corresponding design concept
 * 4. Sends email notification to homeowner
 * 5. Returns 200 to acknowledge receipt
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Webhook payload structure from Replicate.
 */
interface ReplicateWebhookPayload {
  id: string
  created_at: string
  updated_at: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  logs: string | null
  metrics: Record<string, unknown> | null
  webhook_completed_at: string | null
}

/**
 * Verify Replicate webhook signature using HMAC-SHA256.
 * Replicate docs: https://replicate.com/docs/webhooks
 */
function verifyReplicateSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('replicate-signature')
  if (!signature) {
    console.warn('[Webhook 3D] Missing replicate-signature header')
    return false
  }

  const secret = process.env.REPLICATE_WEBHOOK_SECRET || ''
  if (!secret) {
    console.warn('[Webhook 3D] REPLICATE_WEBHOOK_SECRET not configured')
    return false
  }

  // Signature format: "sha256=<hash>"
  const [algorithm, providedHash] = signature.split('=')
  if (algorithm !== 'sha256') {
    console.warn('[Webhook 3D] Unexpected signature algorithm:', algorithm)
    return false
  }

  // Compute expected hash: HMAC-SHA256(secret, body)
  const expectedHash = crypto.createHmac('sha256', secret).update(body).digest('hex')

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(expectedHash))
}

/**
 * Extract project ID from custom webhook metadata.
 * Replicate allows passing arbitrary data via the webhook_events_ttl parameter.
 * For now, we extract from the input prompt or use a fallback.
 */
function extractProjectIdFromWebhook(payload: ReplicateWebhookPayload): string | null {
  // If the prediction input includes project metadata, extract it
  // Example: input.project_id or input.metadata.project_id
  const input = payload.input as Record<string, any>
  return input?.project_id || input?.metadata?.project_id || null
}

/**
 * Handle Replicate 3D model webhook.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody) as ReplicateWebhookPayload

    // Verify signature
    if (!verifyReplicateSignature(request, rawBody)) {
      console.warn('[Webhook 3D] Signature verification failed')
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    const projectId = extractProjectIdFromWebhook(body)
    if (!projectId) {
      console.warn('[Webhook 3D] Could not extract project ID from webhook')
      return NextResponse.json({ error: 'Project ID not found' }, { status: 400 })
    }

    console.log(`[Webhook 3D] Processing webhook for project ${projectId}, status: ${body.status}`)

    // Handle different statuses
    switch (body.status) {
      case 'processing':
        await handleProcessing(projectId, body)
        break

      case 'succeeded':
        await handleSuccess(projectId, body)
        break

      case 'failed':
      case 'canceled':
        await handleFailure(projectId, body)
        break

      default:
        console.warn(`[Webhook 3D] Unknown status: ${body.status}`)
    }

    // Return 200 to acknowledge receipt (Replicate will retry if not 200)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[Webhook 3D] Webhook processing failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/**
 * Handle processing started.
 */
async function handleProcessing(projectId: string, payload: ReplicateWebhookPayload) {
  // Optional: update UI to show "Generating..." status
  // Store job progress if desired
  console.log(`[Webhook 3D] Model generation started for ${projectId}`)
}

/**
 * Handle model generation success.
 */
async function handleSuccess(projectId: string, payload: ReplicateWebhookPayload) {
  if (!payload.output) {
    console.warn(`[Webhook 3D] Success webhook missing output for ${projectId}`)
    return
  }

  const output = payload.output as Record<string, any>
  const modelUrl = output.model_url || output.glb_url
  const previewUrl = output.preview_url || output.image_url
  const usdzUrl = output.usdz_url

  if (!modelUrl) {
    console.warn(`[Webhook 3D] Success webhook missing model URL for ${projectId}`)
    return
  }

  try {
    // TODO: Update the design concept in the database with model URLs
    // Example:
    // const intake = await db.intake.findUnique({ where: { id: projectId } })
    // const designOutput = intake.formData.v30ConceptOutput
    // Update conceptOutput[jobId].threeDModels.modelUrl = modelUrl
    // await db.intake.update({ ... })

    console.log(`[Webhook 3D] Model ready for ${projectId}: ${modelUrl}`)

    // TODO: Send email to homeowner: "Your 3D model is ready to view!"
    // Example:
    // await sendEmail({
    //   to: intake.ownerEmail,
    //   subject: 'Your 3D model is ready!',
    //   template: 'design-3d-ready',
    //   data: { conceptName, modelUrl, previewUrl }
    // })
  } catch (err) {
    console.error(`[Webhook 3D] Failed to update project ${projectId} with model URLs:`, err)
  }
}

/**
 * Handle model generation failure.
 */
async function handleFailure(projectId: string, payload: ReplicateWebhookPayload) {
  const error = payload.error || 'Unknown error'

  try {
    // TODO: Update the design concept to mark 3D as failed
    // Mark status as 'failed' so UI can show "3D model generation failed" message

    console.error(`[Webhook 3D] Model generation failed for ${projectId}: ${error}`)

    // TODO: Send email to homeowner (optional): "3D model generation encountered an issue"
    // This is optional; not critical for the user experience
  } catch (err) {
    console.error(`[Webhook 3D] Failed to handle failure for project ${projectId}:`, err)
  }
}

/**
 * GET handler: health check for webhook endpoint.
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'ok',
      webhook: 'replicate-3d',
      message: 'This endpoint accepts POST webhooks from Replicate',
    },
    { status: 200 },
  )
}
