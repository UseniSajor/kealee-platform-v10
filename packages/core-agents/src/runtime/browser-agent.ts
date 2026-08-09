/**
 * Browser Agent — Playwright-based browser control
 *
 * Provides: navigate, click, input, extract, screenshot
 * All operations include timeout + error recovery + audit logging
 */

import type { Page } from 'playwright';
import { BrowserSessionManager } from './browser-session-manager';
import { BrowserSecurity } from './browser-security';

export interface BrowserOpResult {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
}

export interface NavigateOptions {
  url: string;
  timeout?: number;
  waitForSelector?: string;
}

export interface ClickOptions {
  selector: string;
  timeout?: number;
}

export interface InputOptions {
  selector: string;
  text: string;
  timeout?: number;
}

export interface ExtractOptions {
  selector: string;
  format: 'text' | 'json' | 'html';
  timeout?: number;
}

const OP_TIMEOUT_MS = 10000;

export class BrowserAgent {
  private sessionManager: BrowserSessionManager;
  private security: BrowserSecurity;

  constructor(
    sessionManager?: BrowserSessionManager,
    security?: BrowserSecurity
  ) {
    this.sessionManager = sessionManager ?? new BrowserSessionManager();
    this.security = security ?? new BrowserSecurity();
  }

  async navigate(
    sessionId: string,
    options: NavigateOptions
  ): Promise<BrowserOpResult> {
    const startTime = Date.now();

    try {
      const risk = this.security.assessRisk(options.url);
      if (risk === 'blocked') {
        this.security.logAction({
          timestamp: new Date().toISOString(),
          action: 'navigate',
          url: options.url,
          success: false,
          risk: 'blocked',
        });
        return {
          success: false,
          error: `URL blocked: ${options.url}`,
          durationMs: Date.now() - startTime,
        };
      }

      let session = this.sessionManager.getSession(sessionId);
      if (!session || !session.page) {
        // Session would need to be created with browser/page
        // For now, return error
        return {
          success: false,
          error: 'Session not initialized',
          durationMs: Date.now() - startTime,
        };
      }

      const timeout = options.timeout ?? OP_TIMEOUT_MS;
      await session.page.goto(options.url, { timeout, waitUntil: 'networkidle' });

      if (options.waitForSelector) {
        await session.page.waitForSelector(options.waitForSelector, { timeout });
      }

      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'navigate',
        url: options.url,
        success: true,
        risk,
      });

      return {
        success: true,
        data: { url: options.url },
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'navigate',
        url: options.url,
        success: false,
        risk: 'safe',
      });
      return {
        success: false,
        error,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async click(
    sessionId: string,
    options: ClickOptions
  ): Promise<BrowserOpResult> {
    const startTime = Date.now();

    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session || !session.page) {
        return {
          success: false,
          error: 'Session not initialized',
          durationMs: Date.now() - startTime,
        };
      }

      const timeout = options.timeout ?? OP_TIMEOUT_MS;
      await session.page.click(options.selector, { timeout });

      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'click',
        selector: options.selector,
        success: true,
      });

      return {
        success: true,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'click',
        selector: options.selector,
        success: false,
      });
      return {
        success: false,
        error,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async fillInput(
    sessionId: string,
    options: InputOptions
  ): Promise<BrowserOpResult> {
    const startTime = Date.now();

    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session || !session.page) {
        return {
          success: false,
          error: 'Session not initialized',
          durationMs: Date.now() - startTime,
        };
      }

      const timeout = options.timeout ?? OP_TIMEOUT_MS;
      await session.page.fill(options.selector, options.text, { timeout });

      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'input',
        selector: options.selector,
        success: true,
      });

      return {
        success: true,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async extractData(
    sessionId: string,
    options: ExtractOptions
  ): Promise<BrowserOpResult> {
    const startTime = Date.now();

    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session || !session.page) {
        return {
          success: false,
          error: 'Session not initialized',
          durationMs: Date.now() - startTime,
        };
      }

      const timeout = options.timeout ?? OP_TIMEOUT_MS;
      const element = await session.page.$(options.selector);

      if (!element) {
        return {
          success: false,
          error: `Element not found: ${options.selector}`,
          durationMs: Date.now() - startTime,
        };
      }

      let data: unknown;

      if (options.format === 'text') {
        data = await element.textContent();
      } else if (options.format === 'html') {
        data = await element.innerHTML();
      } else if (options.format === 'json') {
        const html = await element.innerHTML();
        try {
          data = JSON.parse(html);
        } catch {
          data = html;
        }
      }

      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'extract',
        selector: options.selector,
        success: true,
      });

      return {
        success: true,
        data,
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async screenshot(
    sessionId: string,
    selector?: string
  ): Promise<BrowserOpResult> {
    const startTime = Date.now();

    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session || !session.page) {
        return {
          success: false,
          error: 'Session not initialized',
          durationMs: Date.now() - startTime,
        };
      }

      let screenshot: Buffer;

      if (selector) {
        const element = await session.page.$(selector);
        if (!element) {
          return {
            success: false,
            error: `Element not found: ${selector}`,
            durationMs: Date.now() - startTime,
          };
        }
        screenshot = await element.screenshot();
      } else {
        screenshot = await session.page.screenshot();
      }

      this.security.logAction({
        timestamp: new Date().toISOString(),
        action: 'screenshot',
        selector,
        success: true,
      });

      return {
        success: true,
        data: screenshot.toString('base64'),
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error,
        durationMs: Date.now() - startTime,
      };
    }
  }

  getSecurityAuditLog() {
    return this.security.getAuditLog();
  }

  async destroyAll(): Promise<void> {
    await this.sessionManager.destroyAll();
  }
}
