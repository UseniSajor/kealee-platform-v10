/**
 * Shared HTTP client for KeaBot tool handlers.
 * All bots use this to call OS service APIs instead of accessing DB directly.
 */

export interface ServiceClientConfig {
  /** Base URL of the OS API service (e.g. http://localhost:4000) */
  baseUrl: string;
  /** Auth token for service-to-service calls */
  authToken?: string;
  /** Default timeout in ms (default: 15000) */
  timeout?: number;
  /** Max retries on transient failures (default: 3) */
  maxRetries?: number;
}

export interface ServiceResponse<T = unknown> {
  ok: true;
  data: T;
  status: number;
}

export interface ServiceError {
  ok: false;
  error: string;
  status: number;
  retryable: boolean;
}

type ServiceResult<T = unknown> = ServiceResponse<T> | ServiceError;

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class ServiceClient {
  private baseUrl: string;
  private authToken: string | undefined;
  private timeout: number;
  private maxRetries: number;

  constructor(config: ServiceClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.authToken = config.authToken;
    this.timeout = config.timeout ?? 15_000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  async get<T = unknown>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<ServiceResult<T>> {
    const url = this.buildUrl(path, query);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<ServiceResult<T>> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<ServiceResult<T>> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(path: string): Promise<ServiceResult<T>> {
    const url = this.buildUrl(path);
    return this.request<T>(url, { method: 'DELETE' });
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      for (const [key, val] of Object.entries(query)) {
        if (val !== undefined) url.searchParams.set(key, String(val));
      }
    }
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<ServiceResult<T>> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> ?? {}),
      'X-Bot-Client': 'keabot-service-client/1.0',
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    let lastError: ServiceError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1s, 2s
        await sleep(500 * Math.pow(2, attempt - 1));
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...init,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          const data = await response.json() as T;
          return { ok: true, data, status: response.status };
        }

        const errorBody = await response.text().catch(() => 'Unknown error');
        const isRetryable = RETRYABLE_STATUS_CODES.has(response.status);

        lastError = {
          ok: false,
          error: tryParseErrorMessage(errorBody) || `HTTP ${response.status}`,
          status: response.status,
          retryable: isRetryable,
        };

        if (!isRetryable) {
          return lastError;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isAbort = message.includes('abort');
        lastError = {
          ok: false,
          error: isAbort ? `Request timeout after ${this.timeout}ms` : message,
          status: 0,
          retryable: true,
        };
      }
    }

    return lastError!;
  }
}

function tryParseErrorMessage(body: string): string | null {
  try {
    const parsed = JSON.parse(body);
    return parsed.error || parsed.message || null;
  } catch {
    return body.length < 200 ? body : null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Factory that reads config from environment variables:
 *   KEALEE_API_URL — base URL (required)
 *   KEALEE_BOT_TOKEN — service auth token (optional)
 */
export function createServiceClient(overrides?: Partial<ServiceClientConfig>): ServiceClient {
  const baseUrl = overrides?.baseUrl ?? process.env.KEALEE_API_URL;
  if (!baseUrl) {
    throw new Error('KEALEE_API_URL environment variable is required (or pass baseUrl in config)');
  }
  return new ServiceClient({
    baseUrl,
    authToken: overrides?.authToken ?? process.env.KEALEE_BOT_TOKEN,
    timeout: overrides?.timeout,
    maxRetries: overrides?.maxRetries,
  });
}
