'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, LayoutGrid, Loader2 } from 'lucide-react'
import { v30WorkspaceUrl } from '@/lib/concept-output'

/**
 * Embeds web-main v30 workspace when NEXT_PUBLIC_V30_WORKSPACE_EMBED=true.
 * Falls back to prominent deep link (cross-origin cookies may block iframe).
 */
export function V30WorkspaceEmbed({ intakeId }: { intakeId: string }) {
  const embedEnabled = process.env.NEXT_PUBLIC_V30_WORKSPACE_EMBED === 'true'
  const url = v30WorkspaceUrl(intakeId)
  const [loaded, setLoaded] = useState(false)

  return (
    <section
      className="rounded-2xl border border-violet-200 bg-white overflow-hidden mb-6"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
    >
      <div className="px-5 py-4 border-b border-violet-100 flex flex-wrap items-center justify-between gap-3 bg-violet-50/80">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-violet-600" />
          <div>
            <p className="text-sm font-bold text-violet-900">Kealee v30 workspace</p>
            <p className="text-xs text-violet-700">
              Estimates, permits, floorplan bots, and generation status
            </p>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-50"
        >
          Open full workspace <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {embedEnabled ? (
        <div className="relative w-full bg-slate-100" style={{ minHeight: 480 }}>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          )}
          <iframe
            title="Kealee v30 workspace"
            src={url}
            className="w-full border-0"
            style={{ height: 'min(72vh, 720px)' }}
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
            View parallel bot outputs (Design, Estimate, Zoning, Floorplan, Video) in the interactive
            v30 workspace on Kealee.
          </p>
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Open v30 workspace <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
