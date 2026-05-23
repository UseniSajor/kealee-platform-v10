'use client'

import { Megaphone } from 'lucide-react'

export function V30MarketingKitPanel({ kit }: { kit: Record<string, unknown> }) {
  const headline = kit.headline as string | undefined
  const pitch = kit.elevatorPitch as string | undefined
  const social = (kit.socialPosts as Array<Record<string, unknown>> | undefined) ?? []
  const emails = (kit.emailSequence as Array<Record<string, unknown>> | undefined) ?? []

  if (!headline && !social.length && !emails.length) return null

  return (
    <section
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-violet-600" />
        <h2 className="text-base font-bold" style={{ color: '#1A2B4A' }}>
          Marketing kit
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {headline && <p className="text-lg font-bold text-slate-900">{headline}</p>}
        {pitch && <p className="text-sm text-slate-600">{pitch}</p>}
        {social.map((post, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-xs font-semibold text-violet-600">{String(post.platform ?? 'Social')}</p>
            <p className="mt-1 text-slate-700 whitespace-pre-wrap">{String(post.caption ?? '')}</p>
          </div>
        ))}
        {emails.map((em, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold">{String(em.subject ?? '')}</p>
            <p className="text-slate-600 mt-1 whitespace-pre-wrap">{String(em.body ?? '')}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
