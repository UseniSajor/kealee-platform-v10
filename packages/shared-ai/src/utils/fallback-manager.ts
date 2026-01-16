// ============================================================
// FALLBACK MANAGER
// Graceful degradation when AI services unavailable
// ============================================================

import { AIResult } from '../types';

export class FallbackManager {
  private fallbackEnabled: boolean = true;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    primaryFn: () => Promise<AIResult<T>>,
    fallbackFn: () => Promise<AIResult<T>>,
    retries: number = 0
  ): Promise<AIResult<T>> {
    try {
      const result = await primaryFn();
      
      if (result.success) {
        return result;
      }

      // If primary failed and fallback enabled, try fallback
      if (this.fallbackEnabled && retries < this.maxRetries) {
        await this.delay(this.retryDelay * (retries + 1));
        return this.executeWithFallback(primaryFn, fallbackFn, retries + 1);
      }

      // Try fallback
      if (this.fallbackEnabled) {
        const fallbackResult = await fallbackFn();
        return {
          ...fallbackResult,
          fallbackUsed: true
        };
      }

      return result;
    } catch (error) {
      // Primary function threw error
      if (this.fallbackEnabled) {
        try {
          const fallbackResult = await fallbackFn();
          return {
            ...fallbackResult,
            fallbackUsed: true,
            error: error instanceof Error ? error.message : 'Primary function failed'
          };
        } catch (fallbackError) {
          return {
            success: false,
            error: `Both primary and fallback failed: ${error instanceof Error ? error.message : 'unknown'}`
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      };
    }
  }

  /**
   * Check if service is available
   */
  async checkAvailability(
    checkFn: () => Promise<boolean>,
    timeout: number = 5000
  ): Promise<boolean> {
    try {
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeout);
      });

      const result = await Promise.race([
        checkFn(),
        timeoutPromise
      ]);

      return result;
    } catch {
      return false;
    }
  }

  /**
   * Enable/disable fallback
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(maxRetries: number, retryDelay: number): void {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
