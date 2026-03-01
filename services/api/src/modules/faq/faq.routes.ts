/**
 * FAQ Routes
 * Public endpoints for retrieving FAQ content (no authentication required).
 *
 * Endpoints:
 *   GET /           - List FAQs (with optional section, tag, featured filters)
 *   GET /sections   - List unique sections with counts
 *   GET /search     - Full-text search across question and answer fields
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '@kealee/database';
import { sanitizeErrorMessage } from '../../utils/sanitize-error';

const p = prisma as any;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const faqListSchema = z.object({
  section: z.string().optional(),
  tag: z.string().optional(),
  featured: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

const faqSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

// ============================================================================
// ROUTES
// ============================================================================

export default async function faqRoutes(fastify: FastifyInstance) {
  // --------------------------------------------------------------------------
  // GET / - List all FAQs, ordered by number ASC
  // Optional filters: section (sectionSlug), tag, featured
  // --------------------------------------------------------------------------
  fastify.get('/', async (request, reply) => {
    try {
      const query = faqListSchema.parse(request.query);

      const where: any = {};

      if (query.section) {
        where.sectionSlug = query.section;
      }

      if (query.tag) {
        where.tags = { has: query.tag };
      }

      if (query.featured) {
        where.featured = true;
      }

      const [faqs, total] = await Promise.all([
        p.faq.findMany({
          where,
          orderBy: { number: 'asc' },
          take: 100,
        }),
        p.faq.count({ where }),
      ]);

      return reply.send({ data: faqs, total });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to list FAQs'),
      });
    }
  });

  // --------------------------------------------------------------------------
  // GET /sections - Unique sections with FAQ counts
  // --------------------------------------------------------------------------
  fastify.get('/sections', async (_request, reply) => {
    try {
      // groupBy on sectionSlug + section to get counts per section
      const groups = await p.faq.groupBy({
        by: ['sectionSlug', 'section'],
        _count: { id: true },
        orderBy: { section: 'asc' },
      });

      const data = groups.map((g: any) => ({
        section: g.section,
        slug: g.sectionSlug,
        count: g._count.id,
      }));

      return reply.send({ data });
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to list FAQ sections'),
      });
    }
  });

  // --------------------------------------------------------------------------
  // GET /search - Search FAQs by question and answer
  // Ranks results: question matches first, then answer-only matches
  // --------------------------------------------------------------------------
  fastify.get('/search', async (request, reply) => {
    try {
      const { q } = faqSearchSchema.parse(request.query);

      // Fetch FAQs matching in question OR answer (case-insensitive)
      const faqs = await p.faq.findMany({
        where: {
          OR: [
            { question: { contains: q, mode: 'insensitive' } },
            { answer: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { number: 'asc' },
        take: 100,
      });

      // Rank: question matches first, then answer-only matches
      const questionMatches: any[] = [];
      const answerOnlyMatches: any[] = [];
      const qLower = q.toLowerCase();

      for (const faq of faqs) {
        if (faq.question.toLowerCase().includes(qLower)) {
          questionMatches.push(faq);
        } else {
          answerOnlyMatches.push(faq);
        }
      }

      const ranked = [...questionMatches, ...answerOnlyMatches];

      return reply.send({ data: ranked, total: ranked.length });
    } catch (error: any) {
      // Validation errors (missing q) should return 400
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: 'Search query parameter "q" is required',
        });
      }
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: sanitizeErrorMessage(error, 'Failed to search FAQs'),
      });
    }
  });
}
