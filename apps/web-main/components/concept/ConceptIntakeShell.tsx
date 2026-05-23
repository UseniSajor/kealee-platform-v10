'use client'

import { AskChatBar } from '@/components/ui/AskChatBar'
import { MessageCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
  serviceSlug?: string
}

/**
 * Two-column concept intake: form left, locked Kea ask panel right (lg+).
 * Prevents chat thread from overlaying form fields on desktop.
 */
export function ConceptIntakeShell({ children, serviceSlug }: Props) {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] xl:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 lg:items-start">
      <div className="min-w-0">{children}</div>

      <aside className="hidden lg:block">
        <div className="sticky top-28 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[calc(100vh-8rem)] max-h-[720px]">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: '#2ABFBF' }}
              >
                K
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Ask Kea</p>
                <p className="text-xs text-slate-500">Questions while you fill out the form</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 p-3 flex flex-col">
            <AskChatBar
              context="concept-intake"
              variant="light"
              layout="sidebar"
              serviceSlug={serviceSlug}
              className="h-full max-w-none mx-0"
            />
          </div>
        </div>
      </aside>

      <div className="lg:hidden mt-10 pt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-[#2ABFBF]" />
          <h2 className="text-sm font-semibold text-slate-900">Questions? Ask Kea</h2>
        </div>
        <AskChatBar context="concept-intake" variant="light" serviceSlug={serviceSlug} />
      </div>
    </div>
  )
}
