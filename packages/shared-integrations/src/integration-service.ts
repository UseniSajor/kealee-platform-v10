// ============================================================
// INTEGRATION SERVICE
// Unified service for managing all integration tiers
// ============================================================

import { 
  IntegrationConfig, 
  IntegrationResult, 
  IntegrationTier, 
  IntegrationProvider,
  PermitSubmissionData,
  StatusCheckResult,
  IntegrationHealth,
  IntegrationLog
} from './types';

import { BaseAPIClient } from './providers/base-client';
import { AccelaClient } from './providers/accela-client';
import { TylerClient } from './providers/tyler-client';
import { GovOSClient } from './providers/govos-client';
import { PortalAutomator } from './automation/portal-automator';
import { ManualEntryService } from './manual/manual-entry-service';
import { DocumentProcessor } from './ocr/document-processor';
import { EmailParser } from './email/email-parser';

interface IntegrationMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  totalProcessingTime: number;
  lastSuccessfulSync?: Date;
  lastError?: string;
  errorHistory: Array<{ timestamp: Date; error: string }>;
}

export class IntegrationService {
  private config: IntegrationConfig;
  private apiClient?: BaseAPIClient;
  private portalAutomator?: PortalAutomator;
  private manualService?: ManualEntryService;
  private documentProcessor?: DocumentProcessor;
  private emailParser?: EmailParser;
  private metrics: IntegrationMetrics;
  private healthStatus: IntegrationHealth;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      totalProcessingTime: 0,
      errorHistory: [],
    };

    this.healthStatus = {
      jurisdictionId: config.jurisdictionId,
      provider: config.provider,
      tier: config.tier,
      status: 'healthy',
      errorCount: 0,
      successRate: 1.0,
      avgResponseTime: 0,
      uptime: 100,
    };

    this.initializeComponents();
  }

  /**
   * Initialize integration components based on config
   */
  private initializeComponents(): void {
    // Initialize API client if Tier 1
    if (this.config.tier === 'API' && this.config.provider !== 'NONE') {
      this.apiClient = this.createAPIClient();
    }

    // Initialize portal automator if Tier 2
    if (this.config.tier === 'PORTAL' || this.config.fallbackTier === 'PORTAL') {
      this.portalAutomator = new PortalAutomator(this.config);
    }

    // Initialize manual service if Tier 3
    if (this.config.tier === 'MANUAL' || this.config.fallbackTier === 'MANUAL') {
      this.manualService = new ManualEntryService(this.config);
    }

    // Initialize OCR processor if enabled
    if (this.config.ocrEnabled) {
      this.documentProcessor = new DocumentProcessor(
        this.config.ocrConfig || {
          language: 'eng',
          psm: 6,
          confidenceThreshold: 0.7,
        }
      );
    }

    // Initialize email parser
    this.emailParser = new EmailParser();
  }

  /**
   * Create appropriate API client based on provider
   */
  private createAPIClient(): BaseAPIClient {
    switch (this.config.provider) {
      case 'ACCELA':
        return new AccelaClient(this.config);
      case 'TYLER':
        return new TylerClient(this.config);
      case 'GOVOS':
        return new GovOSClient(this.config);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Submit permit application with tier fallback
   */
  async submitPermit(
    data: PermitSubmissionData,
    options?: { retryCount?: number; skipFallback?: boolean }
  ): Promise<IntegrationResult> {
    const startTime = Date.now();
    const retryCount = options?.retryCount || 0;
    const maxRetries = this.config.maxRetries || 3;

    // Try primary tier first
    let result: IntegrationResult | null = null;

    try {
      // Tier 1: API Integration
      if (this.config.tier === 'API' && this.apiClient) {
        result = await this.attemptAPISubmission(data);
      }
      // Tier 2: Portal Automation
      else if (this.config.tier === 'PORTAL' && this.portalAutomator) {
        result = await this.attemptPortalSubmission(data);
      }
      // Tier 3: Manual Entry
      else if (this.config.tier === 'MANUAL' && this.manualService) {
        result = await this.attemptManualSubmission(data);
      }

      // If primary tier failed and retries available, retry
      if (!result?.success && retryCount < maxRetries && !options?.skipFallback) {
        await this.delay((this.config.retryDelay || 1000) * Math.pow(2, retryCount));
        return this.submitPermit(data, { retryCount: retryCount + 1 });
      }

      // If still failed, try fallback tier
      if (!result?.success && this.config.fallbackTier && !options?.skipFallback) {
        result = await this.attemptFallbackSubmission(data, this.config.fallbackTier);
      }

      // Provide default result if none available
      const finalResult = result || {
        success: false,
        error: 'No integration method available',
        tier: this.config.tier,
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
        retryCount,
      };

      // Log the attempt
      this.logIntegrationAttempt('submitPermit', finalResult, Date.now() - startTime, retryCount);

      return finalResult;
    } catch (error: any) {
      const errorResult: IntegrationResult = {
        success: false,
        error: error.message || 'Submission failed',
        tier: this.config.tier,
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
        retryCount,
      };

      this.logIntegrationAttempt('submitPermit', errorResult, Date.now() - startTime, retryCount);
      return errorResult;
    }
  }

  /**
   * Check permit status with tier fallback
   */
  async checkStatus(
    permitNumber: string,
    options?: { retryCount?: number; skipFallback?: boolean }
  ): Promise<IntegrationResult<StatusCheckResult>> {
    const startTime = Date.now();
    const retryCount = options?.retryCount || 0;
    const maxRetries = this.config.maxRetries || 3;

    let result: IntegrationResult<StatusCheckResult> | null = null;

    try {
      // Tier 1: API Integration
      if (this.config.tier === 'API' && this.apiClient) {
        result = await this.attemptAPIStatusCheck(permitNumber);
      }
      // Tier 2: Portal Automation
      else if (this.config.tier === 'PORTAL' && this.portalAutomator) {
        result = await this.attemptPortalStatusCheck(permitNumber);
      }
      // Tier 3: Manual Entry
      else if (this.config.tier === 'MANUAL' && this.manualService) {
        result = await this.attemptManualStatusCheck(permitNumber);
      }

      // Retry if failed
      if (!result?.success && retryCount < maxRetries && !options?.skipFallback) {
        await this.delay((this.config.retryDelay || 1000) * Math.pow(2, retryCount));
        return this.checkStatus(permitNumber, { retryCount: retryCount + 1 });
      }

      // Fallback tier
      if (!result?.success && this.config.fallbackTier && !options?.skipFallback) {
        result = await this.attemptFallbackStatusCheck(permitNumber, this.config.fallbackTier);
      }

      // Provide default result if none available
      const finalResult = result || {
        success: false,
        error: 'No integration method available',
        tier: this.config.tier,
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
        retryCount,
      };

      this.logIntegrationAttempt('checkStatus', finalResult, Date.now() - startTime, retryCount);

      return finalResult;
    } catch (error: any) {
      const errorResult: IntegrationResult<StatusCheckResult> = {
        success: false,
        error: error.message || 'Status check failed',
        tier: this.config.tier,
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
        retryCount,
      };

      this.logIntegrationAttempt('checkStatus', errorResult, Date.now() - startTime, retryCount);
      return errorResult;
    }
  }

  /**
   * Process email for status updates
   */
  async processEmail(emailBody: string, emailSubject: string): Promise<IntegrationResult<StatusCheckResult>> {
    const startTime = Date.now();

    try {
      if (!this.emailParser) {
        this.emailParser = new EmailParser();
      }

      const parsedResult = await this.emailParser.parseStatusEmail(emailBody, emailSubject);
      
      if (parsedResult.success && parsedResult.data) {
        const result: IntegrationResult<StatusCheckResult> = {
          success: true,
          data: {
            permitNumber: parsedResult.data.permitNumber,
            status: parsedResult.data.status || 'UNKNOWN',
            lastUpdated: parsedResult.data.dates?.approved || parsedResult.data.dates?.submitted || new Date(),
            comments: parsedResult.data.message ? [parsedResult.data.message] : undefined,
          },
          tier: 'MANUAL',
          provider: 'CUSTOM',
          processingTimeMs: Date.now() - startTime,
        };

        this.logIntegrationAttempt('processEmail', result, Date.now() - startTime, 0);
        return result;
      }

      return {
        success: false,
        error: parsedResult.error || 'Could not parse email',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      const errorResult: IntegrationResult<StatusCheckResult> = {
        success: false,
        error: error.message || 'Email processing failed',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: Date.now() - startTime,
      };

      this.logIntegrationAttempt('processEmail', errorResult, Date.now() - startTime, 0);
      return errorResult;
    }
  }

  /**
   * Process document with OCR
   */
  async processDocument(documentUrl: string): Promise<IntegrationResult<any>> {
    const startTime = Date.now();

    try {
      if (!this.documentProcessor) {
        if (!this.config.ocrEnabled) {
          return {
            success: false,
            error: 'OCR not enabled',
            tier: 'OCR',
            provider: this.config.provider,
            processingTimeMs: Date.now() - startTime,
          };
        }
        this.documentProcessor = new DocumentProcessor(
          this.config.ocrConfig || {
            language: 'eng',
            psm: 6,
            confidenceThreshold: 0.7,
          }
        );
      }

      const result = await this.documentProcessor.processDocument(documentUrl);
      
      const integrationResult: IntegrationResult = {
        success: true,
        data: result,
        tier: 'OCR',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };

      this.logIntegrationAttempt('processDocument', integrationResult, Date.now() - startTime, 0);
      return integrationResult;
    } catch (error: any) {
      const errorResult: IntegrationResult = {
        success: false,
        error: error.message || 'Document processing failed',
        tier: 'OCR',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };

      this.logIntegrationAttempt('processDocument', errorResult, Date.now() - startTime, 0);
      return errorResult;
    }
  }

  /**
   * Get integration health status
   */
  getHealth(): IntegrationHealth {
    this.updateHealthStatus();
    return { ...this.healthStatus };
  }

  /**
   * Get integration logs
   */
  getLogs(limit: number = 100): IntegrationLog[] {
    // In production, would fetch from database
    // For now, return mock logs based on metrics
    return [];
  }

  /**
   * Reset health metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      totalProcessingTime: 0,
      errorHistory: [],
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.portalAutomator) {
      await this.portalAutomator.close();
    }
    if (this.documentProcessor) {
      await this.documentProcessor.terminate();
    }
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Attempt API submission
   */
  private async attemptAPISubmission(data: PermitSubmissionData): Promise<IntegrationResult> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }

    // Ensure authenticated
    if (this.config.oauthConfig || this.config.apiKey) {
      const authenticated = await this.apiClient.authenticate();
      if (!authenticated) {
        return {
          success: false,
          error: 'Authentication failed',
          tier: 'API',
          provider: this.config.provider,
          processingTimeMs: 0,
        };
      }
    }

    return this.apiClient.submitPermit(data);
  }

  /**
   * Attempt portal submission
   */
  private async attemptPortalSubmission(data: PermitSubmissionData): Promise<IntegrationResult> {
    if (!this.portalAutomator) {
      throw new Error('Portal automator not initialized');
    }
    return this.portalAutomator.submitPermit(data);
  }

  /**
   * Attempt manual submission
   */
  private async attemptManualSubmission(data: PermitSubmissionData): Promise<IntegrationResult> {
    if (!this.manualService) {
      throw new Error('Manual service not initialized');
    }
    // In production, would get user ID from context
    return this.manualService.enterPermit(data, 'system');
  }

  /**
   * Attempt API status check
   */
  private async attemptAPIStatusCheck(permitNumber: string): Promise<IntegrationResult<StatusCheckResult>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized');
    }

    if (this.config.oauthConfig || this.config.apiKey) {
      const authenticated = await this.apiClient.authenticate();
      if (!authenticated) {
        return {
          success: false,
          error: 'Authentication failed',
          tier: 'API',
          provider: this.config.provider,
          processingTimeMs: 0,
        };
      }
    }

    return this.apiClient.checkStatus(permitNumber);
  }

  /**
   * Attempt portal status check
   */
  private async attemptPortalStatusCheck(permitNumber: string): Promise<IntegrationResult<StatusCheckResult>> {
    if (!this.portalAutomator) {
      throw new Error('Portal automator not initialized');
    }
    return this.portalAutomator.checkStatus(permitNumber);
  }

  /**
   * Attempt manual status check
   */
  private async attemptManualStatusCheck(permitNumber: string): Promise<IntegrationResult<StatusCheckResult>> {
    if (!this.manualService) {
      throw new Error('Manual service not initialized');
    }
    // In production, would get status from database
    return this.manualService.updateStatus(permitNumber, 'UNKNOWN', 'system');
  }

  /**
   * Attempt fallback submission
   */
  private async attemptFallbackSubmission(
    data: PermitSubmissionData,
    fallbackTier: IntegrationTier
  ): Promise<IntegrationResult> {
    if (fallbackTier === 'PORTAL' && this.portalAutomator) {
      return this.portalAutomator.submitPermit(data);
    }
    if (fallbackTier === 'MANUAL' && this.manualService) {
      return this.manualService.enterPermit(data, 'system');
    }
    throw new Error(`Fallback tier ${fallbackTier} not available`);
  }

  /**
   * Attempt fallback status check
   */
  private async attemptFallbackStatusCheck(
    permitNumber: string,
    fallbackTier: IntegrationTier
  ): Promise<IntegrationResult<StatusCheckResult>> {
    if (fallbackTier === 'PORTAL' && this.portalAutomator) {
      return this.portalAutomator.checkStatus(permitNumber);
    }
    if (fallbackTier === 'MANUAL' && this.manualService) {
      return this.manualService.updateStatus(permitNumber, 'UNKNOWN', 'system');
    }
    throw new Error(`Fallback tier ${fallbackTier} not available`);
  }

  /**
   * Log integration attempt
   */
  private logIntegrationAttempt(
    action: string,
    result: IntegrationResult,
    processingTime: number,
    retryCount: number
  ): void {
    this.metrics.totalAttempts++;
    this.metrics.totalProcessingTime += processingTime;

    if (result.success) {
      this.metrics.successfulAttempts++;
      this.metrics.lastSuccessfulSync = new Date();
      this.healthStatus.lastSuccessfulSync = new Date();
    } else {
      this.metrics.failedAttempts++;
      const error = result.error || 'Unknown error';
      this.metrics.lastError = error;
      this.metrics.errorHistory.push({
        timestamp: new Date(),
        error,
      });
      this.healthStatus.lastError = error;
      this.healthStatus.errorCount++;

      // Keep only last 100 errors
      if (this.metrics.errorHistory.length > 100) {
        this.metrics.errorHistory.shift();
      }
    }

    // Update health status
    this.updateHealthStatus();

    // In production, would persist to database
    // await this.db.integrationLog.create({ data: { ... } });
  }

  /**
   * Update health status based on metrics
   */
  private updateHealthStatus(): void {
    if (this.metrics.totalAttempts === 0) {
      return;
    }

    this.healthStatus.successRate = this.metrics.successfulAttempts / this.metrics.totalAttempts;
    this.healthStatus.avgResponseTime = this.metrics.totalProcessingTime / this.metrics.totalAttempts;

    // Determine status
    if (this.healthStatus.successRate >= 0.95) {
      this.healthStatus.status = 'healthy';
    } else if (this.healthStatus.successRate >= 0.80) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'down';
    }

    // Calculate uptime (simplified - in production would track downtime periods)
    this.healthStatus.uptime = this.healthStatus.successRate * 100;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
