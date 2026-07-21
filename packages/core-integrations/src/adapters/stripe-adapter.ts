/**
 * Stripe Adapter — Payment integration
 * Wraps Stripe API for unified KXL interface
 */

import { IntegrationAdapter, type AdapterHealthCheck } from '../adapter';

export class StripeAdapter extends IntegrationAdapter {
  constructor() {
    super({
      name: 'stripe',
      baseUrl: 'https://api.stripe.com/v1',
      apiKey: process.env.STRIPE_SECRET_KEY,
      timeout: 30000,
    });
  }

  async healthCheck(): Promise<AdapterHealthCheck> {
    const start = Date.now();
    try {
      await this.request('GET', '/balance');
      return {
        name: this.name,
        healthy: true,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
      };
    } catch (err) {
      return {
        name: this.name,
        healthy: false,
        latencyMs: Date.now() - start,
        lastChecked: new Date().toISOString(),
        error: String(err),
      };
    }
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
      };

      let fetchBody: string | undefined;
      if (body && typeof body === 'object') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        fetchBody = new URLSearchParams(body as Record<string, string>).toString();
      }

      const response = await fetch(url, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.status}`);
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
