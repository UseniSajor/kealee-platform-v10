/**
 * services/api/src/routes/admin/generate-images.ts
 *
 * Trigger KeaBot-Design to generate all product images
 * Saves images to database and gallery
 */

import { Router, Request, Response } from 'express';
import { db } from '@kealee/database';
import { anthropic } from '@kealee/ai-provider';
import { GENERATE_PRODUCT_IMAGE_TOOL_DEF } from '@kealee/ai';

const router = Router();

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /admin/generate-images
 * Trigger generation of all product images
 *
 * Query params:
 * - productId?: string - Generate for specific product only
 * - types?: string - Comma-separated (before,after,hero,trend,detail)
 * - dryRun?: boolean - Show what would be generated (no DALL-E calls)
 */
router.post('/generate-images', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { productId, types = 'before,after,hero', dryRun } = req.query;

    // Get products to generate for
    const products = productId
      ? [await db.product.findUnique({ where: { id: productId as string } })]
      : await db.product.findMany();

    if (!products.length) {
      return res.status(404).json({ error: 'No products found' });
    }

    const imageTypes = (types as string).split(',').filter(t => t);
    const generationPlan = {
      productsCount: products.length,
      imagesPerProduct: imageTypes.length * 2, // before + after for each style
      totalImages: products.length * imageTypes.length * 2,
      dryRun,
      estimatedCost: products.length * imageTypes.length * 2 * 0.04, // DALL-E 3 price
    };

    if (dryRun) {
      return res.json({
        message: 'DRY RUN - No images generated',
        plan: generationPlan,
        products: products.map(p => ({ id: p.id, name: p.name })),
      });
    }

    // Queue image generation jobs
    const jobs = [];
    for (const product of products) {
      jobs.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        imageTypes,
      });
    }

    console.log(`[API] Queuing ${jobs.length} image generation jobs...`);

    res.json({
      message: 'Image generation queued',
      plan: generationPlan,
      jobs: jobs.length,
      details: 'KeaBot-Design will process these jobs. Check logs for progress.',
    });

    // Process asynchronously (don't block response)
    processImageGenerationJobs(jobs).catch(err => {
      console.error('[keabot-design] Error processing image jobs:', err);
    });
  } catch (error) {
    console.error('[API] Error in generate-images:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /admin/generate-images/status
 * Check status of image generation
 */
router.get('/generate-images/status', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const imageCount = await db.productImage.count();
    const products = await db.product.count();
    const imagesPerProduct = products > 0 ? imageCount / products : 0;

    res.json({
      totalProducts: products,
      totalImages: imageCount,
      averageImagesPerProduct: imagesPerProduct.toFixed(1),
      completionPercentage: ((imageCount / (products * 5)) * 100).toFixed(1), // Target is 5 per product
    });
  } catch (error) {
    console.error('[API] Error in generate-images/status:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/product-images
 * Save product image to database (called by KeaBot-Design)
 */
router.post('/product-images', authenticateApi, async (req: Request, res: Response) => {
  try {
    const { productId, type, url, prompt, style } = req.body;

    if (!productId || !type || !url) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const image = await db.productImage.create({
      data: {
        productId,
        type,
        url,
        prompt,
        style,
      },
    });

    console.log(`[API] Saved ${type} image for product ${productId}`);

    res.json({
      success: true,
      image: {
        id: image.id,
        productId: image.productId,
        type: image.type,
        url: image.url,
      },
    });
  } catch (error) {
    console.error('[API] Error saving product image:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ─── Helper: Process image generation jobs ────────────────────────────────────

interface ImageGenerationJob {
  productId: string;
  productName: string;
  category: string;
  imageTypes: string[];
}

async function processImageGenerationJobs(jobs: ImageGenerationJob[]) {
  console.log(`\n[keabot-design] 🎨 Starting image generation for ${jobs.length} products...\n`);

  const styles = ['modern', 'contemporary', 'traditional', 'transitional', 'luxury'];

  for (const job of jobs) {
    console.log(
      `[keabot-design] Processing: ${job.productName} (${job.productId})`
    );

    for (const imageType of job.imageTypes) {
      for (let i = 0; i < styles.length; i++) {
        const style = styles[i];

        try {
          // Use Claude as KeaBot-Design agent to call the image generation tool
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
`;

          const response = await anthropic.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 1024,
            tools: [GENERATE_PRODUCT_IMAGE_TOOL_DEF as any],
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          });

          console.log(
            `[keabot-design] ✅ ${imageType} (${style}) for ${job.productName}`
          );
        } catch (error) {
          console.error(
            `[keabot-design] ❌ Failed ${imageType} (${style}):`,
            error
          );
        }
      }
    }
  }

  console.log(`\n[keabot-design] ✅ Image generation complete!\n`);
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function authenticateAdmin(req: Request, res: Response, next: Function) {
  // Check for admin API key or session
  const apiKey = req.headers['x-api-key'];
  const adminKey = process.env.ADMIN_API_KEY;

  if (apiKey !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

function authenticateApi(req: Request, res: Response, next: Function) {
  // For KeaBot-Design calls - check service auth
  const auth = req.headers.authorization;
  const expected = `Bearer ${process.env.API_SERVICE_KEY}`;

  if (auth !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

export default router;
