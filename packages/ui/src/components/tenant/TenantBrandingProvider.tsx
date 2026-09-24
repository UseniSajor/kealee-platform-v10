'use client'

import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from 'react'
import type { TenantPresentationContext } from '@kealee/shared'
import { tenantBrandCssVariables } from '@kealee/shared'

const TenantBrandingContext = createContext<TenantPresentationContext | null>(null)

export interface TenantBrandingProviderProps {
  context: TenantPresentationContext | null
  children: ReactNode
  audience: 'PROFESSIONAL' | 'HOMEOWNER_PROJECT'
}

export function TenantBrandingProvider({ context, children, audience }: TenantBrandingProviderProps) {
  const style = tenantBrandCssVariables(context) as CSSProperties
  return (
    <TenantBrandingContext.Provider value={context}>
      <div
        data-tenant-org-id={context?.orgId}
        data-tenant-audience={audience}
        data-white-label={context ? 'active' : 'kealee'}
        style={{ ...style, display: 'contents' }}
      >
        {children}
      </div>
    </TenantBrandingContext.Provider>
  )
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext)
}

export function TenantBrandAttribution() {
  const context = useTenantBranding()
  if (!context?.kealeeBrandingVisible) return null
  return <span className="text-xs text-current/60">Powered by Kealee AI</span>
}
