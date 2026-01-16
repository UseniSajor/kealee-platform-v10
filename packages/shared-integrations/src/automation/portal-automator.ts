// ============================================================
// PORTAL AUTOMATOR
// Puppeteer/Playwright automation for jurisdictions without API
// ============================================================

import puppeteer, { Browser, Page } from 'puppeteer';
import { IntegrationConfig, IntegrationResult, PermitSubmissionData, StatusCheckResult, AutomationConfig } from '../types';

export class PortalAutomator {
  private browser: Browser | null = null;
  private config: IntegrationConfig;
  private automationConfig: AutomationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
    this.automationConfig = config.automationConfig || {
      headless: true,
      timeout: 30000,
    };
  }

  /**
   * Initialize browser
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.automationConfig.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Submit permit via portal automation
   */
  async submitPermit(data: PermitSubmissionData): Promise<IntegrationResult> {
    const startTime = Date.now();

    try {
      await this.initialize();
      if (!this.browser) throw new Error('Browser not initialized');

      const page = await this.browser.newPage();
      page.setDefaultTimeout(this.automationConfig.timeout);

      // Navigate to portal
      await page.goto(this.config.portalUrl!);

      // Login if credentials provided
      if (this.config.loginCredentials) {
        await this.login(page);
      }

      // Navigate to permit application
      await this.navigateToApplication(page);

      // Fill form
      await this.fillForm(page, data);

      // Upload documents
      await this.uploadDocuments(page, data.documents || []);

      // Submit
      const confirmation = await this.submitApplication(page);

      await page.close();

      return {
        success: true,
        data: {
          permitNumber: confirmation.permitNumber,
          confirmationNumber: confirmation.confirmationNumber,
          submittedAt: new Date(),
        },
        tier: 'PORTAL',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Portal automation failed',
        tier: 'PORTAL',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Check status via portal scraping
   */
  async checkStatus(permitNumber: string): Promise<IntegrationResult<StatusCheckResult>> {
    const startTime = Date.now();

    try {
      await this.initialize();
      if (!this.browser) throw new Error('Browser not initialized');

      const page = await this.browser.newPage();
      page.setDefaultTimeout(this.automationConfig.timeout);

      // Navigate to status check page
      await page.goto(`${this.config.portalUrl}/status`);

      // Login if needed
      if (this.config.loginCredentials) {
        await this.login(page);
      }

      // Search for permit
      await page.type('input[name="permitNumber"]', permitNumber);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();

      // Scrape status
      const status = await page.$eval('.status', (el) => el.textContent?.trim() || '');
      const lastUpdated = await page.$eval('.last-updated', (el) => {
        const text = el.textContent?.trim() || '';
        return new Date(text);
      }).catch(() => new Date());

      await page.close();

      return {
        success: true,
        data: {
          permitNumber,
          status: this.parseStatus(status),
          lastUpdated,
        },
        tier: 'PORTAL',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Status check failed',
        tier: 'PORTAL',
        provider: this.config.provider,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Login to portal
   */
  private async login(page: Page): Promise<void> {
    if (!this.config.loginCredentials) return;

    const { username, password } = this.config.loginCredentials;

    // Wait for login form
    await page.waitForSelector('input[name="username"], input[type="email"]', { timeout: 5000 });

    // Fill credentials
    const usernameSelector = 'input[name="username"], input[type="email"], input[id*="user"], input[id*="email"]';
    const passwordSelector = 'input[name="password"], input[type="password"], input[id*="pass"]';

    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);

    // Submit
    await page.click('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
  }

  /**
   * Navigate to permit application
   */
  private async navigateToApplication(page: Page): Promise<void> {
    // Follow navigation steps if configured
    if (this.automationConfig.navigationSteps) {
      for (const step of this.automationConfig.navigationSteps) {
        switch (step.action) {
          case 'click':
            if (step.selector) {
              await page.click(step.selector);
              if (step.waitTime) await this.delay(step.waitTime);
            }
            break;
          case 'wait':
            await this.delay(step.waitTime || 1000);
            break;
        }
      }
    } else {
      // Default: look for "Apply" or "New Permit" link
      const applyLink = await page.$('a:has-text("Apply"), a:has-text("New Permit"), a:has-text("Application")');
      if (applyLink) {
        await applyLink.click();
        await page.waitForNavigation();
      }
    }
  }

  /**
   * Fill form with data
   */
  private async fillForm(page: Page, data: PermitSubmissionData): Promise<void> {
    if (!this.automationConfig.formSelectors) {
      // Auto-detect form fields
      await this.autoFillForm(page, data);
      return;
    }

    // Use configured selectors
    for (const [field, selector] of Object.entries(this.automationConfig.formSelectors)) {
      const value = this.getFieldValue(data, field);
      if (value !== undefined) {
        await page.type(selector, String(value));
      }
    }
  }

  /**
   * Auto-fill form by detecting fields
   */
  private async autoFillForm(page: Page, data: PermitSubmissionData): Promise<void> {
    // Try common field patterns
    const fieldMappings: Array<{ pattern: string; value: any }> = [
      { pattern: 'address|street|location', value: data.formData.address },
      { pattern: 'description|scope|work', value: data.formData.scope },
      { pattern: 'valuation|value|cost', value: data.formData.valuation },
      { pattern: 'applicant|name|contact', value: data.formData.applicantName },
      { pattern: 'email', value: data.formData.applicantEmail },
      { pattern: 'phone|telephone', value: data.formData.applicantPhone },
    ];

    for (const mapping of fieldMappings) {
      if (!mapping.value) continue;

      try {
        const selector = `input[name*="${mapping.pattern}"], input[id*="${mapping.pattern}"], textarea[name*="${mapping.pattern}"]`;
        const element = await page.$(selector);
        if (element) {
          await element.type(String(mapping.value));
        }
      } catch (error) {
        // Field not found, continue
      }
    }
  }

  /**
   * Upload documents
   */
  private async uploadDocuments(page: Page, documents: Array<{ url: string; type: string; name: string }>): Promise<void> {
    for (const doc of documents) {
      try {
        // Find file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          // Download file from URL and upload
          // In production, would download file first
          // await fileInput.uploadFile(downloadedFilePath);
        }
      } catch (error) {
        console.error('Document upload error:', error);
      }
    }
  }

  /**
   * Submit application
   */
  private async submitApplication(page: Page): Promise<{ permitNumber?: string; confirmationNumber?: string }> {
    // Click submit button
    await page.click('button[type="submit"]:has-text("Submit"), button:has-text("Submit Application"), input[type="submit"]');
    
    // Wait for confirmation
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Extract confirmation number
    const confirmation = await page.$eval(
      '.confirmation, .confirmation-number, [class*="confirmation"]',
      (el) => el.textContent?.trim() || ''
    ).catch(() => '');

    return {
      confirmationNumber: confirmation,
    };
  }

  /**
   * Get field value from data
   */
  private getFieldValue(data: PermitSubmissionData, field: string): any {
    return data.formData[field];
  }

  /**
   * Parse status text
   */
  private parseStatus(statusText: string): string {
    const lower = statusText.toLowerCase();
    
    if (lower.includes('approved') || lower.includes('issued')) return 'APPROVED';
    if (lower.includes('review')) return 'UNDER_REVIEW';
    if (lower.includes('submitted') || lower.includes('received')) return 'SUBMITTED';
    if (lower.includes('rejected') || lower.includes('denied')) return 'REJECTED';
    
    return statusText.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
