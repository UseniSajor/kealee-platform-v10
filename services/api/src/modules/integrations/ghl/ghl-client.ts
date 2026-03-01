/**
 * GoHighLevel (GHL) API Client
 *
 * Reusable HTTP client for GHL V2 REST API.
 * - Rate-limit aware (100 req / 10s per location)
 * - Automatic retry via withRetry utility
 * - Typed request / response helpers
 *
 * @see https://marketplace.gohighlevel.com/docs/
 */

import { withRetry } from '../../../utils/retry';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GHL_BASE_URL = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const GHL_API_KEY = process.env.GHL_API_KEY || '';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || '';
const GHL_API_VERSION = '2021-07-28';

/** Verify that GHL env vars are configured. */
export function isGhlConfigured(): boolean {
  return !!(GHL_API_KEY && GHL_LOCATION_ID);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GhlRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string>;
  /** Override default retry settings */
  maxRetries?: number;
}

export interface GhlApiError extends Error {
  status: number;
  responseBody?: unknown;
}

// ---------------------------------------------------------------------------
// Core client
// ---------------------------------------------------------------------------

function buildUrl(path: string, query?: Record<string, string>): string {
  const url = new URL(path, GHL_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function rawRequest<T = unknown>(opts: GhlRequestOptions): Promise<T> {
  const { method = 'GET', path, body, query } = opts;

  const url = buildUrl(path, query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${GHL_API_KEY}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const init: RequestInit = { method, headers };
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`GHL API ${method} ${path} failed: ${res.status} ${res.statusText}`) as GhlApiError;
    err.status = res.status;
    err.responseBody = text;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

/**
 * Make a GHL API request with automatic retry on transient failures.
 * Rate-limit (429) and server errors (5xx) are retried with exponential backoff.
 */
export async function ghlRequest<T = unknown>(opts: GhlRequestOptions): Promise<T> {
  return withRetry(() => rawRequest<T>(opts), {
    maxRetries: opts.maxRetries ?? 3,
    baseDelayMs: 1000, // GHL rate: 100 req/10s, so 1s base is safe
    label: `GHL.${opts.method ?? 'GET'} ${opts.path}`,
  });
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function ghlGet<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
  return ghlRequest<T>({ method: 'GET', path, query });
}

export function ghlPost<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  return ghlRequest<T>({ method: 'POST', path, body });
}

export function ghlPut<T = unknown>(path: string, body: Record<string, unknown>): Promise<T> {
  return ghlRequest<T>({ method: 'PUT', path, body });
}

export function ghlDelete<T = unknown>(path: string): Promise<T> {
  return ghlRequest<T>({ method: 'DELETE', path });
}

export { GHL_LOCATION_ID };
