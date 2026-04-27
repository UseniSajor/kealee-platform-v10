'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface FilterBarProps {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  onSearch: (query: string) => void
  resultCount: number
}

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  onSearch,
  resultCount,
}: FilterBarProps) {
  const [inputValue, setInputValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(inputValue)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [inputValue, onSearch])

  function clear() {
    setInputValue('')
    onSearch('')
  }

  const allCategories = ['all', ...categories]

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search services..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder-gray-400 shadow-sm focus:border-[#2ABFBF] focus:outline-none focus:ring-2 focus:ring-[#2ABFBF]/20"
        />
        {inputValue && (
          <button
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {allCategories.map((cat) => {
          const isActive = cat === activeCategory || (cat === 'all' && !activeCategory)
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat === 'all' ? '' : cat)}
              className="rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all"
              style={{
                backgroundColor: isActive ? '#1A2B4A' : '#fff',
                borderColor: isActive ? '#1A2B4A' : '#E5E7EB',
                color: isActive ? '#fff' : '#6B7280',
              }}
            >
              {cat}
            </button>
          )
        })}
        <span className="ml-auto text-xs text-gray-400">
          {resultCount} service{resultCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
