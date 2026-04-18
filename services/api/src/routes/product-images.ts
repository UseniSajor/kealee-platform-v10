import { Router, Request, Response } from 'express';
import { prisma } from '@kealee/database';

const router = Router();

/**
 * GET /api/product-images
 * Fetch all images for a specific product, organized by type
 * 
 * Query params:
 *   - productId (required): ID of the product
 *   - type (optional): Filter by image type (before, after, hero, trend, detail)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { productId, type } = req.query;

    if (!productId) {
      return res.status(400).json({
        error: 'productId query parameter is required',
      });
    }

    const whereClause: any = {
      productId: String(productId),
    };

    if (type) {
      whereClause.type = String(type);
    }

    const images = await prisma.productImage.findMany({
      where: whereClause,
      select: {
        id: true,
        productId: true,
        type: true,
        url: true,
        prompt: true,
        style: true,
        generatedAt: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    // Organize by type for easier frontend consumption
    const organized = {
      all: images,
      before: images.filter((i) => i.type === 'before'),
      after: images.filter((i) => i.type === 'after'),
      hero: images.filter((i) => i.type === 'hero'),
      trend: images.filter((i) => i.type === 'trend'),
      detail: images.filter((i) => i.type === 'detail'),
    };

    res.json(organized);
  } catch (error) {
    console.error('[productImages] Error fetching images:', error);
    res.status(500).json({
      error: 'Failed to fetch product images',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/product-images/:id
 * Fetch a single image by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const image = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      return res.status(404).json({
        error: 'Image not found',
      });
    }

    res.json(image);
  } catch (error) {
    console.error('[productImages] Error fetching image:', error);
    res.status(500).json({
      error: 'Failed to fetch image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/product-images/all/summary
 * Get image counts for all products
 * Used for homepage stats, dashboard, etc
 */
router.get('/all/summary', async (req: Request, res: Response) => {
  try {
    const summary = await prisma.productImage.groupBy({
      by: ['productId'],
      _count: {
        id: true,
      },
    });

    const totalImages = await prisma.productImage.count();
    const totalProducts = summary.length;

    res.json({
      totalImages,
      totalProducts,
      averagePerProduct: Math.round(totalImages / totalProducts),
      byProduct: summary.map((s) => ({
        productId: s.productId,
        imageCount: s._count.id,
      })),
    });
  } catch (error) {
    console.error('[productImages] Error fetching summary:', error);
    res.status(500).json({
      error: 'Failed to fetch image summary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
