/**
 * services/api/src/routes/admin/generate-images.ts
 *
 * Trigger KeaBot-Design to generate all product images
 * Saves images to database and gallery
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@kealee/database'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GENERATE_PRODUCT_IMAGE_TOOL_DEF = {
  name: 'generate_product_image',
  description:
    'Generate professional before/after images for renovation products using DALL-E 3.',
  input_schema: {
    type: 'object',
    properties: {
      product_id:  { type: 'string' },
      image_type:  { type: 'string', enum: ['before', 'after', 'hero', 'trend', 'detail'] },
      description: { type: 'string' },
      style: {
        type: 'string',
        enum: ['modern', 'contemporary', 'traditional', 'transitional', 'minimalist', 'luxury', 'rustic', 'industrial'],
      },
      room_type: { type: 'string' },
    },
    required: ['product_id', 'image_type', 'description', 'style'],
  },
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

function assertAdminKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const apiKey   = request.headers['x-api-key'] as string | undefined
  const adminKey = process.env.ADMIN_API_KEY

  if (apiKey !== adminKey) {
    reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  return true
}

function assertServiceKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const auth     = request.headers.authorization as string | undefined
  const expected = `Bearer ${process.env.API_SERVICE_KEY}`

  if (auth !== expected) {
    reply.code(401).send({ error: 'Unauthorized' })
    return false
  }
  return true
}

// ─── Plugin ────────────────────────────────────────────────────────────────────

export async function adminGenerateImagesRoutes(fastify: FastifyInstance) {

  /**
   * POST /admin/generate-images
   * Trigger generation of all product images
   *
   * Query params:
   * - productId?: string — Generate for a specific product only
   * - types?: string     — Comma-separated: before,after,hero,trend,detail
   * - dryRun?: boolean   — Show what would be generated (no DALL-E calls)
   */
  fastify.post('/generate-images', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!assertAdminKey(request, reply)) return

    try {
      const { productId, types = 'before,after,hero', dryRun } = request.query as {
        productId?: string
        types?:     string
        dryRun?:    string
      }

      const products = productId
        ? [await prisma.product.findUnique({ where: { id: productId } })]
        : await prisma.product.findMany()

      const found = products.filter(Boolean)
      if (!found.length) {
        return reply.code(404).send({ error: 'No products found' })
      }

      const imageTypes = types.split(',').filter(Boolean)
      const generationPlan = {
        productsCount:      found.length,
        imagesPerProduct:   imageTypes.length * 2,
        totalImages:        found.length * imageTypes.length * 2,
        dryRun:             !!dryRun,
        estimatedCost:      found.length * imageTypes.length * 2 * 0.04,
      }

      if (dryRun) {
        return reply.send({
          message:  'DRY RUN - No images generated',
          plan:     generationPlan,
          products: found.map((p: any) => ({ id: p!.id, name: p!.name })),
        })
      }

      const jobs = found.map((product: any) => ({
        productId:   product!.id,
        productName: product!.name,
        category:    product!.category,
        imageTypes,
      }))

      console.log(`[API] Queuing ${jobs.length} image generation jobs...`)

      // Process asynchronously — don't block the response
      processImageGenerationJobs(jobs).catch((err: any) => {
        console.error('[keabot-design] Error processing image jobs:', err)
      })

      return reply.send({
        message: 'Image generation queued',
        plan:    generationPlan,
        jobs:    jobs.length,
        details: 'KeaBot-Design will process these jobs. Check logs for progress.',
      })
    } catch (error) {
      console.error('[API] Error in generate-images:', error)
      return reply.code(500).send({ error: String(error) })
    }
  })

  /**
   * GET /admin/generate-images/status
   * Check current image generation coverage
   */
  fastify.get('/generate-images/status', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!assertAdminKey(request, reply)) return

    try {
      const imageCount        = await prisma.productImage.count()
      const products          = await prisma.product.count()
      const imagesPerProduct  = products > 0 ? imageCount / products : 0

      return reply.send({
        totalProducts:            products,
        totalImages:              imageCount,
        averageImagesPerProduct:  imagesPerProduct.toFixed(1),
        completionPercentage:     ((imageCount / (products * 5)) * 100).toFixed(1),
      })
    } catch (error) {
      console.error('[API] Error in generate-images/status:', error)
      return reply.code(500).send({ error: String(error) })
    }
  })

  /**
   * POST /admin/product-images
   * Save a product image to the database (called by KeaBot-Design)
   */
  fastify.post('/product-images', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!assertServiceKey(request, reply)) return

    try {
      const { productId, type, url, prompt, style } = request.body as {
        productId?: string
        type?:      string
        url?:       string
        prompt?:    string
        style?:     string
      }

      if (!productId || !type || !url) {
        return reply.code(400).send({ error: 'Missing required fields' })
      }

      const image = await prisma.productImage.create({
        data: { productId, type, url, prompt, style },
      })

      console.log(`[API] Saved ${type} image for product ${productId}`)

      return reply.send({
        success: true,
        image: {
          id:        image.id,
          productId: image.productId,
          type:      image.type,
          url:       image.url,
        },
      })
    } catch (error) {
      console.error('[API] Error saving product image:', error)
      return reply.code(500).send({ error: String(error) })
    }
  })
}

// ─── Image generation job processor ───────────────────────────────────────────

interface ImageGenerationJob {
  productId:   string
  productName: string
  category:    string
  imageTypes:  string[]
}

async function processImageGenerationJobs(jobs: ImageGenerationJob[]) {
  console.log(`\n[keabot-design] 🎨 Starting image generation for ${jobs.length} products...\n`)

  const styles = ['modern', 'contemporary', 'traditional', 'transitional', 'luxury']

  for (const job of jobs) {
    console.log(`[keabot-design] Processing: ${job.productName} (${job.productId})`)

    for (const imageType of job.imageTypes) {
      for (const style of styles) {
        try {
          const prompt = `
You are KeaBot-Design, responsible for creating product showcase images.

Generate a ${imageType} image for the product: "${job.productName}"
Category: ${job.category}

Use the generate_product_image tool with these parameters:
- product_id: "${job.productId}"
- image_type: "${imageType}"
- style: "${style}"
- description: Create a professional ${imageType === 'before' ? 'before' : 'after'} image of a ${job.productName.toLowerCase()} renovation in ${style} style. Make it magazine-quality photography.
- room_type: ${job.category}

Generate this image now.
`

          await anthropic.messages.create({
            model:      'claude-opus-4-6',
            max_tokens: 1024,
            tools:      [GENERATE_PRODUCT_IMAGE_TOOL_DEF as any],
            messages:   [{ role: 'user', content: prompt }],
          })

          console.log(`[keabot-design] ✅ ${imageType} (${style}) for ${job.productName}`)
        } catch (error) {
          console.error(`[keabot-design] ❌ Failed ${imageType} (${style}):`, error)
        }
      }
    }
  }

  console.log(`\n[keabot-design] ✅ Image generation complete!\n`)
}
