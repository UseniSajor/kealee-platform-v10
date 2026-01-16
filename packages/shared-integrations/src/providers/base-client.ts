// ============================================================
// BASE API CLIENT
// Common functionality for all API providers
// ============================================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import { IntegrationConfig, IntegrationResult } from '../types';

export abstract class BaseAPIClient {
  protected client: AxiosInstance;
  protected config: IntegrationConfig;
  protected accessToken?: string;
  protected tokenExpiresAt?: Date;

  constructor(config: IntegrationConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        if (this.accessToken && (!this.tokenExpiresAt || this.tokenExpiresAt > new Date())) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        } else if (this.config.apiKey) {
          config.headers['X-API-Key'] = this.config.apiKey;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Handle 401 - refresh token
        if (error.response?.status === 401 && this.config.oauthConfig) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry original request
            return this.client.request(error.config!);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate and get access token
   */
  abstract authenticate(): Promise<boolean>;

  /**
   * Refresh access token (OAuth2)
   */
  abstract refreshToken(): Promise<boolean>;

  /**
   * Submit permit application
   */
  abstract submitPermit(data: any): Promise<IntegrationResult>;

  /**
   * Check permit status
   */
  abstract checkStatus(permitNumber: string): Promise<IntegrationResult>;

  /**
   * Get permit documents
   */
  abstract getDocuments(permitNumber: string): Promise<IntegrationResult>;

  /**
   * Handle rate limiting
   */
  protected async handleRateLimit(): Promise<void> {
    if (this.config.rateLimit) {
      // Simple rate limiting - in production use a proper rate limiter
      const delay = 60000 / this.config.rateLimit.requestsPerMinute;
      await this.delay(delay);
    }
  }

  /**
   * Retry with exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.handleRateLimit();
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Delay helper
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Transform Kealee data to jurisdiction format
   */
  abstract transformToJurisdiction(data: any): any;

  /**
   * Transform jurisdiction data to Kealee format
   */
  abstract transformFromJurisdiction(data: any): any;
}
