import { FastifyInstance } from 'fastify';
import { hudFinancingService } from './hud-financing.service';
import { authenticateUser } from '../../middleware/auth';
import { sanitizeErrorMessage } from '../../lib/errors';

/**
 * HUD Financing Routes — Phase 5
 * FHA, HOME, Innovation Fund, CDBG eligibility + pro forma generation.
 */
export async function hudFinancingRoutes(fastify: FastifyInstance) {
  // FHA eligibility check
  fastify.post('/fha-check', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const body = request.body as any;
        const result = await hudFinancingService.checkFHAEligibility(body, userId);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // HOME program eligibility
  fastify.post('/home-check', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const body = request.body as any;
        const result = await hudFinancingService.checkHOMEEligibility(body, userId);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Innovation Fund (Sec 209) eligibility
  fastify.post('/innovation-fund', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const body = request.body as any;
        const result = await hudFinancingService.checkInnovationFundEligibility(body, userId);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // CDBG eligibility
  fastify.post('/cdbg-check', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = request.body as any;
        const result = await hudFinancingService.checkCDBGEligibility(body);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Generate pro forma
  fastify.post('/pro-forma', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const body = request.body as any;
        const result = await hudFinancingService.generateProForma(body);
        return reply.send(result);
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // Comprehensive eligibility check (all programs)
  fastify.post('/eligibility', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const body = request.body as any;

        const [fha, home, innovationFund, cdbg, proForma] = await Promise.all([
          hudFinancingService.checkFHAEligibility(body, userId),
          hudFinancingService.checkHOMEEligibility(body, userId),
          hudFinancingService.checkInnovationFundEligibility(body, userId),
          hudFinancingService.checkCDBGEligibility(body),
          hudFinancingService.generateProForma(body),
        ]);

        return reply.send({ fha, home, innovationFund, cdbg, proForma });
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });

  // User's check history
  fastify.get('/my-checks', {
    preHandler: [authenticateUser],
    handler: async (request, reply) => {
      try {
        const userId = (request as any).userId;
        const checks = await hudFinancingService.getUserChecks(userId);
        return reply.send({ checks });
      } catch (error) {
        return reply.status(500).send({ error: sanitizeErrorMessage(error) });
      }
    },
  });
}
