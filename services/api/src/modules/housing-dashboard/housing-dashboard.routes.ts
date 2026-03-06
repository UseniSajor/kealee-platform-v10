import { FastifyInstance } from 'fastify';
import { housingDashboardService } from './housing-dashboard.service';
import { authenticateUser } from '../../middleware/auth';
import { sanitizeErrorMessage } from '../../lib/errors';

/**
 * Housing Dashboard Routes — Phase 4
 * Municipal housing pipeline, metrics, pattern book adoption, CDBG reporting.
 */
export async function housingDashboardRoutes(fastify: FastifyInstance) {
  // Pipeline overview for a jurisdiction
  fastify.get('/:jurisdictionId/overview', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const overview = await housingDashboardService.getPipelineOverview(jurisdictionId);
        return reply.send(overview);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Housing metrics with period filter
  fastify.get('/:jurisdictionId/metrics', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const { period } = request.query as { period?: 'month' | 'quarter' | 'year' };
        const metrics = await housingDashboardService.getHousingMetrics(jurisdictionId, period);
        return reply.send(metrics);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Pattern book adoption stats
  fastify.get('/:jurisdictionId/pattern-book-adoption', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const adoption = await housingDashboardService.getPatternBookAdoption(jurisdictionId);
        return reply.send(adoption);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Permit trends over time
  fastify.get('/:jurisdictionId/permit-trends', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const { months } = request.query as { months?: string };
        const trends = await housingDashboardService.getPermitTrends(jurisdictionId, months ? parseInt(months) : 12);
        return reply.send(trends);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // CDBG report export
  fastify.get('/:jurisdictionId/export/cdbg', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const { year } = request.query as { year?: string };
        const reportYear = year ? parseInt(year) : new Date().getFullYear();
        const report = await housingDashboardService.exportCDBGReport(jurisdictionId, reportYear);
        return reply.send(report);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Create/update pipeline entry
  fastify.post('/:jurisdictionId/pipeline', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const { jurisdictionId } = request.params as { jurisdictionId: string };
        const body = request.body as {
          projectName: string;
          housingType: string;
          totalUnits: number;
          affordableUnits?: number;
          currentStage: string;
          usesPatternBook?: boolean;
          grantFunding?: number;
        };
        const entry = await housingDashboardService.upsertPipelineEntry({
          jurisdictionId,
          ...body,
        });
        return reply.status(201).send(entry);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });
}
