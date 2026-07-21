/**
 * Compliance Routes
 * API endpoints for regulatory compliance and monitoring
 */

import { FastifyInstance } from 'fastify';
import { complianceController } from '../modules/compliance/compliance.controller';
import { authenticateRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

export async function complianceRoutes(fastify: FastifyInstance) {
  // All compliance routes require authentication
  fastify.addHook('onRequest', authenticateRequest);

  /**
   * GET /api/compliance/rules/:state
   * Get state-specific compliance rules
   */
  fastify.get(
    '/rules/:state',
    {
      schema: {
        description: 'Get state-specific compliance rules',
        tags: ['Compliance'],
        params: {
          type: 'object',
          required: ['state'],
          properties: {
            state: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    complianceController.getStateRules.bind(complianceController)
  );

  /**
   * POST /api/compliance/check
   * Run comprehensive compliance check
   */
  fastify.post(
    '/check',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Run comprehensive compliance check for a user',
        tags: ['Compliance'],
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
          },
        },
      },
    },
    complianceController.runComplianceCheck.bind(complianceController)
  );

  /**
   * POST /api/compliance/validate-license
   * Validate contractor license
   */
  fastify.post(
    '/validate-license',
    {
      schema: {
        description: 'Validate contractor license with state board',
        tags: ['Compliance'],
        body: {
          type: 'object',
          required: ['userId', 'licenseNumber', 'state'],
          properties: {
            userId: { type: 'string' },
            licenseNumber: { type: 'string' },
            state: { type: 'string', minLength: 2, maxLength: 2 },
          },
        },
      },
    },
    complianceController.validateLicense.bind(complianceController)
  );

  /**
   * POST /api/compliance/validate-insurance
   * Validate insurance certificate
   */
  fastify.post(
    '/validate-insurance',
    {
      schema: {
        description: 'Validate insurance certificate',
        tags: ['Compliance'],
        body: {
          type: 'object',
          required: ['userId', 'policyNumber'],
          properties: {
            userId: { type: 'string' },
            policyNumber: { type: 'string' },
          },
        },
      },
    },
    complianceController.validateInsurance.bind(complianceController)
  );

  /**
   * POST /api/compliance/check-bond-requirements
   * Check bond requirements for contract
   */
  fastify.post(
    '/check-bond-requirements',
    {
      schema: {
        description: 'Check bond requirements for a contract',
        tags: ['Compliance'],
        body: {
          type: 'object',
          required: ['contractId'],
          properties: {
            contractId: { type: 'string' },
          },
        },
      },
    },
    complianceController.checkBondRequirements.bind(complianceController)
  );

  /**
   * GET /api/compliance/alerts
   * Get active compliance alerts
   */
  fastify.get(
    '/alerts',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Get active compliance alerts',
        tags: ['Compliance'],
        querystring: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
        },
      },
    },
    complianceController.getActiveAlerts.bind(complianceController)
  );

  /**
   * GET /api/compliance/report
   * Generate compliance report
   */
  fastify.get(
    '/report',
    {
      preHandler: requireRole(['ADMIN', 'COMPLIANCE']),
      schema: {
        description: 'Generate compliance report for auditors',
        tags: ['Compliance'],
        querystring: {
          type: 'object',
          required: ['startDate', 'endDate'],
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
      },
    },
    complianceController.generateComplianceReport.bind(complianceController)
  );

  fastify.log.info('✅ Compliance routes registered');
}

