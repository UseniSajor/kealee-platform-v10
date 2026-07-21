'use client'

import { useState, useRef } from 'react'
import { ArrowRight, X, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AskResponse {
  answer: string
  recommendedPath: string
  cta: { label: string; href: string }
  related?: { label: string; href: string }[]
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  homepage: [
    'How much does a kitchen remodel cost?',
    'Do I need a permit for my addition?',
    'What is an AI concept package?',
    'How do I find a contractor?',
    'How does milestone pay work?',
  ],
  permit: [
    'Do I need plans before submitting a permit?',
    'How long does permit review take?',
    'What does Kealee handle for me?',
    'Can I expedite my permit application?',
    'What is included in the permit package?',
  ],
  default: [
    'What services does Kealee offer?',
    'How does the AI concept work?',
    'How are contractors vetted?',
    'How does escrow protect me?',
    'Where do I start my project?',
  ],
}

interface Props {
  context?: string
  className?: string
}

export function AskAnythingBar({ context = 'default', className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<AskResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = SUGGESTED_PROMPTS[context] ?? SUGGESTED_PROMPTS['default']

  async function handleSubmit(q: string) {
    if (!q.trim()) return
    setIsLoading(true)
    setResponse(null)
    setError(null)
    setIsFocused(false)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, context }),
      })
      if (!res.ok) throw new Error('Failed to get answer')
      const data: AskResponse = await res.json()
      setResponse(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSuggestionClick(prompt: string) {
    setQuery(prompt)
    handleSubmit(prompt)
  }

  function clearResponse() {
    setResponse(null)
    setError(null)
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Input bar */}
      <div
        className="relative flex items-center rounded-2xl border-2 transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: isFocused ? '#2ABFBF' : 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(query)}
          placeholder="Ask anything — permits, costs, design, contractors…"
          className="flex-1 bg-transparent px-5 py-3.5 text-sm text-white placeholder-white/50 outline-none"
        />
        <button
          onClick={() => handleSubmit(query)}
          disabled={isLoading || !query.trim()}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl transition-all disabled:opacity-40"
          style={{ backgroundColor: '#E8793A' }}
          aria-label="Ask"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <ArrowRight className="h-4 w-4 text-white" />
          )}
        </button>
      </div>

      {/* Suggested prompts */}
      {isFocused && !response && (
        <div
          className="mt-2 rounded-xl border border-white/10 p-3"
          style={{ backgroundColor: 'rgba(26,43,74,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-white/40">
            Try asking
          </p>
          <ul className="space-y-1">
            {suggestions.map(prompt => (
              <li key={prompt}>
                <button
                  onMouseDown={() => handleSuggestionClick(prompt)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Answer panel */}
      {response && (
        <div
          className="mt-3 rounded-xl border border-white/10 p-5 text-left"
          style={{ backgroundColor: 'rgba(26,43,74,0.95)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed text-white">{response.answer}</p>
            <button
              onClick={clearResponse}
              className="shrink-0 rounded-lg p-1 text-white/40 transition-colors hover:text-white/80"
              aria-label="Close answer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs text-white/50">Recommended next step:</span>
            <Link
              href={response.cta.href}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E8793A' }}
            >
              {response.cta.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {response.related && response.related.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {response.related.map(r => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/60 transition-colors hover:border-white/40 hover:text-white/80"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
