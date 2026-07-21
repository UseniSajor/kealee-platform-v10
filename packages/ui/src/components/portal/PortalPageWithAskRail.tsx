'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { PortalAskChatBar } from './PortalAskChatBar'
import { PORTAL_ASK_CONFIG, type PortalAskKind } from './portal-ask-config'

interface Props {
  portal: PortalAskKind
  children: React.ReactNode
  askEndpoint?: string
  /** Lock the ask bar (no active order) */
  locked?: boolean
}

/**
 * Locks Kea ask UI to the right on lg+ so chat never covers portal forms/tables.
 */
export function PortalPageWithAskRail({ portal, children, askEndpoint, locked }: Props) {
  const pathname = usePathname()
  const config = PORTAL_ASK_CONFIG[portal]
  const pagePath = pathname.replace(/^\//, '') || 'home'

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,20rem)] xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 lg:items-start">
      <div className="min-w-0">{children}</div>

      <aside className="hidden lg:block">
        <div
          className="sticky top-6 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ height: 'calc(100vh - 5.5rem)', maxHeight: '720px' }}
        >
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: config.accentColor }}
              >
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{config.title}</p>
                <p className="text-xs text-slate-500">{config.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-3">
            <PortalAskChatBar
              config={config}
              askEndpoint={askEndpoint}
              pagePath={pagePath}
              className="h-full"
              locked={locked}
            />
          </div>
        </div>
      </aside>

      <div className="lg:hidden mt-10 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5" style={{ color: config.accentColor }} />
          <h2 className="text-sm font-semibold text-slate-900">{config.title}</h2>
        </div>
        <PortalAskChatBar config={config} askEndpoint={askEndpoint} pagePath={pagePath} locked={locked} />
      </div>
    </div>
  )
}
