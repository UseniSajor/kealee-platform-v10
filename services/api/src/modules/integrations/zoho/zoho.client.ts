/**
 * services/api/src/modules/integrations/zoho/zoho.client.ts
 *
 * Zoho CRM OAuth2 client with automatic token refresh.
 * Uses the "refresh_token" grant type — run the Zoho OAuth2 flow once
 * (via Self-Client or Server-based OAuth) to obtain a refresh token,
 * then store it in ZOHO_REFRESH_TOKEN.
 *
 * Data center support: set ZOHO_DOMAIN to 'com' | 'eu' | 'in' | 'au' | 'jp'
 *
 * Rate limits: Zoho CRM free = 500 req/day, Professional+ = 5,000+/day
 */

import type { ZohoTokenResponse } from './zoho.types.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const ZOHO_DOMAIN       = process.env.ZOHO_DOMAIN       || 'com';
const ZOHO_CLIENT_ID    = process.env.ZOHO_CLIENT_ID    || '';
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET || '';
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN || '';

const AUTH_BASE = `https://accounts.zoho.${ZOHO_DOMAIN}`;
const CRM_BASE  = `https://www.zohoapis.${ZOHO_DOMAIN}/crm/v2`;

// ─── Token Cache ─────────────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string;
  expiresAt:   number; // unix ms
}

let _tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 60s buffer)
  if (_tokenCache && _tokenCache.expiresAt - now > 60_000) {
    return _tokenCache.accessToken;
  }

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho CRM is not configured. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN.');
  }

  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id:     ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type:    'refresh_token',
  });

  const res = await fetch(`${AUTH_BASE}/oauth/v2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Zoho token refresh failed (${res.status}): ${text}`);
  }

  const token = (await res.json()) as ZohoTokenResponse;

  if (token.error) {
    throw new Error(`Zoho OAuth error: ${token.error}`);
  }

  _tokenCache = {
    accessToken: token.access_token,
    expiresAt:   now + (token.expires_in * 1000),
  };

  return _tokenCache.accessToken;
}

// ─── Request Helper ───────────────────────────────────────────────────────────

export interface ZohoRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path:    string;
  body?:   Record<string, unknown> | { data: unknown[] };
  query?:  Record<string, string>;
}

export async function zohoRequest<T = unknown>(opts: ZohoRequestOptions): Promise<T> {
  const accessToken = await getAccessToken();

  const url = new URL(`${CRM_BASE}${opts.path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method:  opts.method ?? 'GET',
    headers: {
      Authorization:  `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });

  // 204 No Content
  if (res.status === 204) return {} as T;

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Zoho API error ${res.status} ${opts.method ?? 'GET'} ${opts.path}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

export function zohoGet<T = unknown>(
  path: string,
  query?: Record<string, string>,
): Promise<T> {
  return zohoRequest<T>({ method: 'GET', path, query });
}

export function zohoPost<T = unknown>(
  path: string,
  body: Record<string, unknown> | { data: unknown[] },
): Promise<T> {
  return zohoRequest<T>({ method: 'POST', path, body });
}

export function zohoPut<T = unknown>(
  path: string,
  body: Record<string, unknown> | { data: unknown[] },
): Promise<T> {
  return zohoRequest<T>({ method: 'PUT', path, body });
}

export function zohoDelete<T = unknown>(path: string): Promise<T> {
  return zohoRequest<T>({ method: 'DELETE', path });
}

export function isZohoConfigured(): boolean {
  return Boolean(ZOHO_CLIENT_ID && ZOHO_CLIENT_SECRET && ZOHO_REFRESH_TOKEN);
}

/** Invalidate cached token (useful for testing or forced refresh) */
export function clearTokenCache(): void {
  _tokenCache = null;
}
