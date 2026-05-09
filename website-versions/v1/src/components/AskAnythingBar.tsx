'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

const MAX = 500

export function AskAnythingBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, source: 'homepage' }),
      })

      const data: unknown = await res.json().catch(() => null)

      if (!res.ok || !data || typeof data !== 'object') {
        setError('We could not reach Concept intake. Try again shortly.')
        return
      }

      const success = 'success' in data && Boolean((data as { success?: boolean }).success)
      const conceptId = 'conceptId' in data ? String((data as { conceptId?: string }).conceptId ?? '') : ''

      if (!success || !conceptId) {
        setError('Concept intake declined this submission. Please refine your description.')
        return
      }

      router.push(`/concept?q=${encodeURIComponent(trimmed)}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const remaining = MAX - query.length

  return (
    <section className="relative z-10 mx-auto max-w-4xl px-4 pb-16 lg:pb-20">
      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-navy/10 sm:p-6"
      >
        <label htmlFor="concept-query" className="sr-only">
          Describe your project or ask anything
        </label>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <textarea
              id="concept-query"
              value={query}
              maxLength={MAX}
              rows={3}
              placeholder="Describe your project or ask anything..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-navy outline-none ring-builder-orange/40 placeholder:text-slate-400 focus:border-builder-orange focus:ring-2"
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{remaining} characters left</span>
              <span className="hidden sm:inline">Responses route through Concept.</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || query.trim().length === 0}
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-builder-orange px-8 py-3 text-sm font-semibold text-white hover:bg-builder-orange-dark disabled:cursor-not-allowed disabled:opacity-60 lg:min-w-[160px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Sending
              </>
            ) : (
              'Get Started'
            )}
          </button>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  )
}
