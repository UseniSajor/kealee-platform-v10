'use client'

import { Loader2, Sparkles } from 'lucide-react'

/** P3 — full-screen “AI analyzing” state during IntakeBot quote. */
export function V30AnalyzingOverlay({ message = 'AI is analyzing your project…' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mx-4 max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-orange-100 text-center">
        <div className="relative mx-auto mb-6 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-45" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E8724B] to-amber-600">
            <Sparkles className="h-9 w-9 text-white animate-pulse" />
          </div>
        </div>
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#E8724B] mb-3" />
        <p className="text-lg font-semibold text-slate-900">{message}</p>
        <p className="mt-2 text-sm text-slate-500">
          IntakeBot is assessing scope, risk, timeline, and your custom package price.
        </p>
        <div className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#E8724B] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
