/**
 * Integration Adapter Tests
 * Tests IntegrationAdapter base, AdapterRegistry, GHLAdapter, StripeAdapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntegrationAdapter, type AdapterConfig, type AdapterHealthCheck } from '../adapter';
import { AdapterRegistry } from '../adapter-registry';
import { GHLAdapter } from '../adapters/ghl-adapter';
import { StripeAdapter } from '../adapters/stripe-adapter';

// ── Mock global fetch ────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock env vars ────────────────────────────────────────────

const originalEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GHL_BASE_URL = 'https://services.leadconnectorhq.com';
  process.env.GHL_API_KEY = 'ghl_test_key_123';
  process.env.GHL_LOCATION_ID = 'loc_test_123';
  process.env.GHL_PIPELINE_ID = 'pipe_test_123';
  process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key_456';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

// ── Concrete test adapter ────────────────────────────────────

class TestAdapter extends IntegrationAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }

  async healthCheck(): Promise<AdapterHealthCheck> {
    const start = Date.now();
    try {
      await this.request('GET', '/health');
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

  // Expose protected request for testing
  async testRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>(method, path, body, headers);
  }
}

// ── IntegrationAdapter Base ──────────────────────────────────

describe('IntegrationAdapter', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    adapter = new TestAdapter({
      name: 'test-service',
      baseUrl: 'https://api.test-service.com',
      apiKey: 'test_api_key',
      timeout: 5000,
      retries: 2,
    });
  });

  describe('constructor', () => {
    it('sets config with defaults for optional fields', () => {
      const minimalAdapter = new TestAdapter({
        name: 'minimal',
        baseUrl: 'https://api.minimal.com',
      });

      expect(minimalAdapter.name).toBe('minimal');
      // Defaults: apiKey='', timeout=30000, retries=3
      const config = (minimalAdapter as any).config;
      expect(config.apiKey).toBe('');
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
    });
  });

  describe('healthCheck', () => {
    it('returns healthy=true when endpoint responds successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      });

      const result = await adapter.healthCheck();

      expect(result.name).toBe('test-service');
      expect(result.healthy).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.lastChecked).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('returns healthy=false when endpoint responds with error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const result = await adapter.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('test-service API error');
      expect(result.error).toContain('503');
    });

    it('returns healthy=false when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('request method', () => {
    it('sends GET request with proper headers and auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'result' }),
      });

      const result = await adapter.testRequest('GET', '/resources/123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test-service.com/resources/123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test_api_key',
          }),
          body: undefined,
        }),
      );
      expect(result).toEqual({ data: 'result' });
    });

    it('sends POST request with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'new_001' }),
      });

      await adapter.testRequest('POST', '/resources', { name: 'New Resource', value: 42 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test-service.com/resources',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Resource', value: 42 }),
        }),
      );
    });

    it('does not include Authorization header when no apiKey', async () => {
      const noAuthAdapter = new TestAdapter({
        name: 'no-auth',
        baseUrl: 'https://api.open.com',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await noAuthAdapter.testRequest('GET', '/public');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });

    it('merges custom headers with default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await adapter.testRequest('GET', '/custom', undefined, {
        'X-Custom-Header': 'custom-value',
      });

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['X-Custom-Header']).toBe('custom-value');
      expect(callHeaders['Authorization']).toBe('Bearer test_api_key');
    });

    it('throws on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(
        adapter.testRequest('GET', '/not-found'),
      ).rejects.toThrow('test-service API error: 404 Not Found');
    });

    it('uses abort controller for timeout', async () => {
      mockFetch.mockImplementationOnce((_url: string, options: any) => {
        // Verify signal is passed
        expect(options.signal).toBeInstanceOf(AbortSignal);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      await adapter.testRequest('GET', '/timeout-test');
    });
  });
});

// ── AdapterRegistry ──────────────────────────────────────────

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;
  let adapter1: TestAdapter;
  let adapter2: TestAdapter;

  beforeEach(() => {
    registry = new AdapterRegistry();
    adapter1 = new TestAdapter({ name: 'service-a', baseUrl: 'https://a.com' });
    adapter2 = new TestAdapter({ name: 'service-b', baseUrl: 'https://b.com' });
  });

  it('registers and retrieves adapters by name', () => {
    registry.register(adapter1);
    registry.register(adapter2);

    expect(registry.get('service-a')).toBe(adapter1);
    expect(registry.get('service-b')).toBe(adapter2);
  });

  it('returns undefined for unregistered adapter name', () => {
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('getRequired throws for unregistered adapter', () => {
    expect(() => registry.getRequired('nonexistent')).toThrow(
      'Integration adapter not found: nonexistent',
    );
  });

  it('getRequired returns adapter when registered', () => {
    registry.register(adapter1);
    expect(registry.getRequired('service-a')).toBe(adapter1);
  });

  it('lists all registered adapter names', () => {
    registry.register(adapter1);
    registry.register(adapter2);

    const names = registry.list();
    expect(names).toContain('service-a');
    expect(names).toContain('service-b');
    expect(names).toHaveLength(2);
  });

  it('healthCheckAll returns health for all adapters', async () => {
    // adapter1 healthy
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      })
      // adapter2 unhealthy
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

    registry.register(adapter1);
    registry.register(adapter2);

    const results = await registry.healthCheckAll();

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('service-a');
    expect(results[0].healthy).toBe(true);
    expect(results[1].name).toBe('service-b');
    expect(results[1].healthy).toBe(false);
  });

  it('healthCheckAll catches adapter healthCheck exceptions', async () => {
    const throwingAdapter = new TestAdapter({
      name: 'crasher',
      baseUrl: 'https://crash.com',
    });
    // Override healthCheck to throw
    vi.spyOn(throwingAdapter, 'healthCheck').mockRejectedValueOnce(
      new Error('Unexpected crash'),
    );

    registry.register(throwingAdapter);
    const results = await registry.healthCheckAll();

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('crasher');
    expect(results[0].healthy).toBe(false);
    expect(results[0].error).toContain('Unexpected crash');
  });
});

// ── GHL Adapter ──────────────────────────────────────────────

describe('GHLAdapter', () => {
  let ghl: GHLAdapter;

  beforeEach(() => {
    ghl = new GHLAdapter();
  });

  it('initializes with correct config from env vars', () => {
    const config = (ghl as any).config;
    expect(config.name).toBe('ghl');
    expect(config.baseUrl).toBe('https://services.leadconnectorhq.com');
    expect(config.apiKey).toBe('ghl_test_key_123');
    expect(config.timeout).toBe(15000);
  });

  it('createContact sends POST with locationId from env', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'contact_001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        }),
    });

    const result = await ghl.createContact({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+15551234567',
    });

    expect(result.id).toBe('contact_001');
    expect(result.email).toBe('john@example.com');

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://services.leadconnectorhq.com/contacts/');
    expect(fetchCall[1].method).toBe('POST');

    const body = JSON.parse(fetchCall[1].body);
    expect(body.locationId).toBe('loc_test_123');
    expect(body.firstName).toBe('John');
    expect(body.email).toBe('john@example.com');
  });

  it('updateContact sends PUT to contact endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'contact_001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
        }),
    });

    const result = await ghl.updateContact('contact_001', {
      lastName: 'Smith',
      tags: ['vip', 'kealee-user'],
    });

    expect(result.lastName).toBe('Smith');

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://services.leadconnectorhq.com/contacts/contact_001');
    expect(fetchCall[1].method).toBe('PUT');

    const body = JSON.parse(fetchCall[1].body);
    expect(body.lastName).toBe('Smith');
    expect(body.tags).toEqual(['vip', 'kealee-user']);
  });

  it('healthCheck returns healthy on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ contacts: [] }),
    });

    const health = await ghl.healthCheck();

    expect(health.name).toBe('ghl');
    expect(health.healthy).toBe(true);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('healthCheck returns unhealthy on failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const health = await ghl.healthCheck();

    expect(health.healthy).toBe(false);
    expect(health.error).toContain('401');
  });

  it('syncContactFromUser adds kealee-user tag', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'contact_synced',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          tags: ['lead', 'kealee-user'],
        }),
    });

    const result = await ghl.syncContactFromUser({
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      tags: ['lead'],
    });

    expect(result.id).toBe('contact_synced');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.tags).toContain('kealee-user');
    expect(body.tags).toContain('lead');
  });
});

// ── Stripe Adapter ───────────────────────────────────────────

describe('StripeAdapter', () => {
  let stripe: StripeAdapter;

  beforeEach(() => {
    stripe = new StripeAdapter();
  });

  it('initializes with Stripe API base URL', () => {
    const config = (stripe as any).config;
    expect(config.name).toBe('stripe');
    expect(config.baseUrl).toBe('https://api.stripe.com/v1');
    expect(config.apiKey).toBe('sk_test_stripe_key_456');
  });

  it('uses form-urlencoded content type for POST requests with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'cus_test123',
          email: 'test@example.com',
        }),
    });

    // Access the overridden request method via protected access
    await (stripe as any).request('POST', '/customers', {
      email: 'test@example.com',
      name: 'Test User',
    });

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.stripe.com/v1/customers');
    expect(fetchCall[1].method).toBe('POST');

    const headers = fetchCall[1].headers;
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(headers['Authorization']).toBe('Bearer sk_test_stripe_key_456');

    // Body should be URL-encoded, not JSON
    const body = fetchCall[1].body;
    expect(body).toContain('email=test%40example.com');
    expect(body).toContain('name=Test+User');
  });

  it('sends GET requests without body or content-type header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          available: [{ amount: 10000, currency: 'usd' }],
        }),
    });

    await (stripe as any).request('GET', '/balance');

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.stripe.com/v1/balance');
    expect(fetchCall[1].method).toBe('GET');
    expect(fetchCall[1].body).toBeUndefined();
  });

  it('healthCheck hits /balance endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          available: [{ amount: 5000, currency: 'usd' }],
        }),
    });

    const health = await stripe.healthCheck();

    expect(health.name).toBe('stripe');
    expect(health.healthy).toBe(true);

    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.stripe.com/v1/balance');
  });

  it('healthCheck returns unhealthy on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const health = await stripe.healthCheck();

    expect(health.healthy).toBe(false);
    expect(health.error).toContain('Stripe API error');
  });

  it('throws on non-OK Stripe response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    await expect(
      (stripe as any).request('POST', '/charges', { amount: -1 }),
    ).rejects.toThrow('Stripe API error: 400');
  });
});
