/**
 * KXL Integration Adapter — base class for external service adapters
 */

export interface AdapterConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface AdapterHealthCheck {
  name: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

export abstract class IntegrationAdapter {
  protected config: Required<AdapterConfig>;

  constructor(config: AdapterConfig) {
    this.config = {
      name: config.name,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey ?? '',
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
    };
  }

  abstract healthCheck(): Promise<AdapterHealthCheck>;

  get name(): string {
    return this.config.name;
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { 'Authorization': `Bearer ${this.config.apiKey}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`${this.config.name} API error: ${response.status} ${response.statusText}`);
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
