'use client'

import Link from 'next/link'
import { Calculator, FileCheck, ArrowRight, Sparkles } from 'lucide-react'
import type { PortalAskKind } from './portal-ask-config'

export interface PortalServiceLink {
  id: string
  title: string
  description: string
  href: string
  external?: boolean
  priceHint?: string
  icon: 'estimate' | 'permits' | 'concept'
}

const ICONS = {
  estimate: Calculator,
  permits: FileCheck,
  concept: Sparkles,
} as const

const PORTAL_COPY: Record<
  PortalAskKind,
  { headline: string; sub: string; services: PortalServiceLink[] }
> = {
  owner: {
    headline: 'Estimation & permits',
    sub: 'Order standalone services or continue from your concept package.',
    services: [
      {
        id: 'estimate',
        title: 'Cost estimate',
        description: 'RSMeans-validated budget ranges for remodels and new work.',
        href: '/estimate/intake',
        external: true,
        priceHint: 'From $595',
        icon: 'estimate',
      },
      {
        id: 'permits',
        title: 'Permit path & submissions',
        description: 'AHJ checklist, discipline map, and permit-ready drawing packages.',
        href: '/permits',
        external: true,
        priceHint: 'From $499',
        icon: 'permits',
      },
      {
        id: 'concept',
        title: 'AI concept package',
        description: 'Renderings, scope, MEP direction, and your downloadable PDF.',
        href: '/concepts',
        icon: 'concept',
      },
    ],
  },
  contractor: {
    headline: 'Estimation & permits',
    sub: 'Tools for bidding, compliance, and owner-facing deliverables.',
    services: [
      {
        id: 'estimate',
        title: 'Project estimates',
        description: 'Generate and share certified estimates with homeowners.',
        href: '/estimate/intake',
        external: true,
        priceHint: 'From $595',
        icon: 'estimate',
      },
      {
        id: 'permits',
        title: 'Permit applications',
        description: 'Track submissions, corrections, and approvals.',
        href: '/permits',
        icon: 'permits',
      },
    ],
  },
  developer: {
    headline: 'Estimation & entitlements',
    sub: 'Feasibility, pro forma, and permit strategy for your pipeline.',
    services: [
      {
        id: 'estimate',
        title: 'Development estimates',
        description: 'Budget models for feasibility and investor packages.',
        href: '/estimate/intake',
        external: true,
        priceHint: 'From $595',
        icon: 'estimate',
      },
      {
        id: 'permits',
        title: 'Entitlements & permits',
        description: 'Zoning, variances, and entitlement roadmaps.',
        href: '/permits',
        external: true,
        priceHint: 'Scoped per project',
        icon: 'permits',
      },
    ],
  },
}

function resolveHref(baseUrl: string, service: PortalServiceLink): string {
  if (!service.external) return service.href
  const root = baseUrl.replace(/\/$/, '')
  return `${root}${service.href.startsWith('/') ? service.href : `/${service.href}`}`
}

export function PortalServicesHub({
  portal,
  webMainUrl,
}: {
  portal: PortalAskKind
  webMainUrl?: string
}) {
  const config = PORTAL_COPY[portal]
  const main = (webMainUrl ?? process.env.NEXT_PUBLIC_WEB_MAIN_URL ?? 'https://kealee.com').replace(
    /\/$/,
    '',
  )

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 font-display mb-1">{config.headline}</h1>
      <p className="text-slate-600 mb-8">{config.sub}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {config.services.map((service) => {
          const Icon = ICONS[service.icon]
          const href = resolveHref(main, service)
          const external = service.external ?? false

          return (
            <Link
              key={service.id}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: 'rgba(42, 191, 191, 0.12)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: '#2ABFBF' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 group-hover:text-teal-800">
                    {service.title}
                  </p>
                  {service.priceHint && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{service.priceHint}</p>
                  )}
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{service.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-teal-600 shrink-0 mt-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
