/**
 * Compliance Controller
 * Handles regulatory compliance and monitoring endpoints
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { complianceService } from './compliance.service';
import { z } from 'zod';

// Request schemas
const stateRulesSchema = z.object({
  state: z.string().length(2).toUpperCase(),
});

const complianceCheckSchema = z.object({
  userId: z.string(),
});

const validateLicenseSchema = z.object({
  userId: z.string(),
  licenseNumber: z.string(),
  state: z.string().length(2).toUpperCase(),
});

const validateInsuranceSchema = z.object({
  userId: z.string(),
  policyNumber: z.string(),
});

const bondRequirementsSchema = z.object({
  contractId: z.string(),
});

const complianceReportSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

export class ComplianceController {
  /**
   * GET /api/compliance/rules/:state
   * Get state-specific compliance rules
   */
  async getStateRules(
    request: FastifyRequest<{
      Params: { state: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { state } = stateRulesSchema.parse(request.params);

      const rules = await complianceService.getStateEscrowRules(state);

      return reply.status(200).send({
        success: true,
        data: rules,
        state,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to fetch compliance rules',
      });
    }
  }

  /**
   * POST /api/compliance/check
   * Run comprehensive compliance check
   */
  async runComplianceCheck(
    request: FastifyRequest<{
      Body: { userId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = complianceCheckSchema.parse(request.body);

      const results = await complianceService.runComplianceCheck(userId);

      const summary = {
        total: results.length,
        passed: results.filter(r => r.checkStatus === 'PASS').length,
        failed: results.filter(r => r.checkStatus === 'FAIL').length,
        pending: results.filter(r => r.checkStatus === 'PENDING').length,
      };

      return reply.status(200).send({
        success: true,
        data: results,
        summary,
        overallStatus: summary.failed === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to run compliance check',
      });
    }
  }

  /**
   * POST /api/compliance/validate-license
   * Validate contractor license
   */
  async validateLicense(
    request: FastifyRequest<{
      Body: { userId: string; licenseNumber: string; state: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, licenseNumber, state } = validateLicenseSchema.parse(request.body);

      const validation = await complianceService.validateLicense(userId, licenseNumber, state);

      return reply.status(200).send({
        success: true,
        data: validation,
        isValid: validation.status === 'ACTIVE',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to validate license',
      });
    }
  }

  /**
   * POST /api/compliance/validate-insurance
   * Validate insurance certificate
   */
  async validateInsurance(
    request: FastifyRequest<{
      Body: { userId: string; policyNumber: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId, policyNumber } = validateInsuranceSchema.parse(request.body);

      const validation = await complianceService.validateInsurance(userId, policyNumber);

      return reply.status(200).send({
        success: true,
        data: validation,
        isValid: validation.status === 'ACTIVE' && validation.coverageAmount >= 1000000,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to validate insurance',
      });
    }
  }

  /**
   * POST /api/compliance/check-bond-requirements
   * Check bond requirements for contract
   */
  async checkBondRequirements(
    request: FastifyRequest<{
      Body: { contractId: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { contractId } = bondRequirementsSchema.parse(request.body);

      const bondCheck = await complianceService.checkBondRequirements(contractId);

      return reply.status(200).send({
        success: true,
        data: bondCheck,
        alert: !bondCheck.isSufficient && bondCheck.required
          ? `Bond amount insufficient. Required: $${bondCheck.minimumAmount}, Current: $${bondCheck.currentAmount}`
          : null,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to check bond requirements',
      });
    }
  }

  /**
   * GET /api/compliance/alerts
   * Get active compliance alerts
   */
  async getActiveAlerts(
    request: FastifyRequest<{
      Querystring: { userId?: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { userId } = request.query;

      const alerts = await complianceService.getActiveAlerts(userId);

      const summary = {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length,
        medium: alerts.filter(a => a.severity === 'MEDIUM').length,
        low: alerts.filter(a => a.severity === 'LOW').length,
      };

      return reply.status(200).send({
        success: true,
        data: alerts,
        summary,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to fetch alerts',
      });
    }
  }

  /**
   * GET /api/compliance/report
   * Generate compliance report
   */
  async generateComplianceReport(
    request: FastifyRequest<{
      Querystring: { startDate: string; endDate: string };
    }>,
    reply: FastifyReply
  ) {
    try {
      const { startDate, endDate } = complianceReportSchema.parse(request.query);

      const report = await complianceService.generateComplianceReport(startDate, endDate);

      return reply.status(200).send({
        success: true,
        data: report,
        generated: new Date(),
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to generate compliance report',
      });
    }
  }
}

export const complianceController = new ComplianceController();

