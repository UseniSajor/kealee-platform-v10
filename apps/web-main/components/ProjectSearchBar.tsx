'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'

interface ProjectSearchBarProps {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ProjectSearchBar({
  placeholder = "Tell me about your project...",
  size = 'md',
}: ProjectSearchBarProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const getProjectPathFromIntent = (text: string): string => {
    const lower = text.toLowerCase()

    if (lower.includes('permit') || lower.includes('filing')) return 'permit_path_only'
    if (lower.includes('cost') || lower.includes('estimate') || lower.includes('price')) return 'cost_estimate'
    if (lower.includes('exterior') || lower.includes('outside')) return 'exterior_concept'
    if (lower.includes('garden') || lower.includes('landscape')) return 'garden_concept'
    if (lower.includes('whole') || lower.includes('full')) return 'whole_home_concept'
    if (lower.includes('interior') || lower.includes('inside')) return 'interior_reno_concept'
    if (lower.includes('kitchen')) return 'kitchen_remodel'
    if (lower.includes('bathroom')) return 'bathroom_remodel'
    if (lower.includes('addition') || lower.includes('expand')) return 'addition_expansion'
    if (lower.includes('commercial') || lower.includes('office')) return 'commercial_office'
    if (lower.includes('multifamily') || lower.includes('apartment')) return 'multi_unit_residential'
    if (lower.includes('mixed') || lower.includes('development')) return 'mixed_use'

    return 'exterior_concept'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    const projectPath = getProjectPathFromIntent(input)
    router.push(`/intake/${projectPath}`)
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-4 text-base',
    lg: 'px-8 py-6 text-lg',
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative rounded-xl bg-white shadow-lg border border-slate-200 transition focus-within:ring-2 focus-within:ring-orange-500 ${sizeClasses[size]}`}>
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 bg-transparent outline-none placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg font-semibold transition text-sm"
          >
            {loading ? 'Loading...' : 'Analyze'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </form>
  )
}
