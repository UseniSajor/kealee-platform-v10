import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@kealee/database';

async function productImagesRoutes(fastify: FastifyInstance) {
  /**
   * GET /product-images
   * Fetch all images for a specific product, organized by type
   *
   * Query params:
   *   - productId (required): ID of the product
   *   - type (optional): Filter by image type (before, after, hero, trend, detail)
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { productId, type } = request.query as any;

      if (!productId) {
        return reply.status(400).send({
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

      reply.send(organized);
    } catch (error) {
      console.error('[productImages] Error fetching images:', error);
      reply.status(500).send({
        error: 'Failed to fetch product images',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /product-images/:id
   * Fetch a single image by ID
   */
  fastify.get<{ Params: { id: string } }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const image = await prisma.productImage.findUnique({
        where: { id },
      });

      if (!image) {
        return reply.status(404).send({
          error: 'Image not found',
        });
      }

      reply.send(image);
    } catch (error) {
      console.error('[productImages] Error fetching image:', error);
      reply.status(500).send({
        error: 'Failed to fetch image',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /product-images/all/summary
   * Get image counts for all products
   * Used for homepage stats, dashboard, etc
   */
  fastify.get('/all/summary', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const summary = await prisma.productImage.groupBy({
        by: ['productId'],
        _count: {
          id: true,
        },
      });

      const totalImages = await prisma.productImage.count();
      const totalProducts = summary.length;

      reply.send({
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
      reply.status(500).send({
        error: 'Failed to fetch image summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

export default productImagesRoutes;
