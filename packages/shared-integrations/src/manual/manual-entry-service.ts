// ============================================================
// MANUAL ENTRY SERVICE
// Manual data entry interface for staff
// ============================================================

import { IntegrationConfig, IntegrationResult, PermitSubmissionData, StatusCheckResult } from '../types';
import { prisma } from '@kealee/database';

export class ManualEntryService {
  private config: IntegrationConfig;
  private db: any; // Prisma client

  constructor(config: IntegrationConfig) {
    this.config = config;
    // Initialize database client
    // this.db = createClient();
  }

  /**
   * Manual permit entry
   */
  async enterPermit(
    data: PermitSubmissionData,
    enteredBy: string
  ): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      // Create permit record manually
      // In production, would use Prisma client
      const permit = {
        id: `manual-${Date.now()}`,
        permitNumber: data.formData.permitNumber,
        submittedAt: new Date(),
        submittedVia: 'MANUAL',
        enteredBy,
      };

      return {
        success: true,
        data: permit,
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Manual entry failed',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Manual status update
   */
  async updateStatus(
    permitNumber: string,
    status: string,
    updatedBy: string
  ): Promise<IntegrationResult<StatusCheckResult>> {
    const startTime = Date.now();

    try {
      return {
        success: true,
        data: {
          permitNumber,
          status,
          lastUpdated: new Date(),
        },
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status update failed',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }
}
