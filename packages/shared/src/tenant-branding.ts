export interface TenantPresentationContext {
  orgId: string
  hostname: string
  companyName: string
  productName?: string | null
  logoUrl?: string | null
  faviconUrl?: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  supportName?: string | null
  supportEmail?: string | null
  supportPhone?: string | null
  supportUrl?: string | null
  locale: string
  currency: string
  timeZone: string
  navigationConfig?: Record<string, unknown> | null
  kealeeBrandingVisible: boolean
  products: Array<{ key: string; name: string; configuration?: Record<string, unknown> | null }>
  enabledModules: string[]
}

export interface TenantContextResponse {
  tenantContext: TenantPresentationContext
}

export interface TenantFetchResponse {
  ok: boolean
  json(): Promise<unknown>
}

export type TenantFetch = (
  input: string,
  init?: { headers?: Record<string, string>; next?: { revalidate?: number } },
) => Promise<TenantFetchResponse>

export function normalizeTenantHostname(value: string | null | undefined): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim().toLowerCase()
  if (!first) return null
  const withoutPort = first.startsWith('[')
    ? first.replace(/\]:\d+$/, ']')
    : first.replace(/:\d+$/, '')
  if (withoutPort === 'localhost' || withoutPort === '127.0.0.1') return null
  return withoutPort.replace(/\.$/, '')
}

export async function loadTenantPresentationContext(
  host: string | null | undefined,
  apiUrl: string | null | undefined,
  fetcher: TenantFetch,
): Promise<TenantPresentationContext | null> {
  const hostname = normalizeTenantHostname(host)
  if (!hostname || !apiUrl) return null
  const endpoint = `${apiUrl.replace(/\/$/, '')}/white-label/context?host=${encodeURIComponent(hostname)}`
  try {
    const response = await fetcher(endpoint, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!response.ok) return null
    const payload = await response.json() as Partial<TenantContextResponse>
    return payload.tenantContext ?? null
  } catch {
    // Tenant branding must never make a portal unavailable. Kealee defaults are
    // the safe fallback when the control plane cannot be reached.
    return null
  }
}

export function tenantBrandCssVariables(context: TenantPresentationContext | null): Record<string, string> {
  if (!context) return {}
  return {
    '--tenant-primary': context.primaryColor,
    '--tenant-secondary': context.secondaryColor,
    '--tenant-accent': context.accentColor,
    '--brand-primary': context.primaryColor,
    '--brand-secondary': context.secondaryColor,
    '--brand-accent': context.accentColor,
  }
}

export function hasTenantModule(context: TenantPresentationContext | null, moduleKey: string): boolean {
  return Boolean(context?.enabledModules.includes(moduleKey))
}
