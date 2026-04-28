'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleAnalyze() {
    const path = '/intake/exterior_concept'
    if (query.trim()) {
      router.push(`${path}?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push(path)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAnalyze()
  }

  return (
    <div className="relative rounded-2xl bg-white shadow-lg border border-slate-200 p-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your project..."
        className="w-full bg-transparent px-6 py-4 text-lg outline-none placeholder:text-slate-400"
      />
      <button
        onClick={handleAnalyze}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        Analyze
      </button>
    </div>
  )
}
