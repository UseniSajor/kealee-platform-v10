'use client'

import { Check, Plus } from 'lucide-react'

interface Props {
  label: string
  hint?: string
  options: string[]
  selected: string[]
  onToggle: (option: string) => void
  error?: string
}

export function ScopeChipGrid({ label, hint, options, selected, onToggle, error }: Props) {
  return (
    <fieldset>
      <legend className="block text-sm font-semibold text-slate-800 mb-1">{label}</legend>
      {hint && <p className="text-xs leading-5 text-slate-500 mb-3">{hint}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(opt)}
              className={`flex min-h-12 items-center justify-between gap-3 text-left px-3.5 py-3 rounded-xl border text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                on
                  ? 'border-[#E8724B] bg-orange-50/70 text-orange-900 font-medium shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/30'
              }`}
            >
              <span>{opt}</span>
              <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${on ? 'bg-[#E8724B] text-white' : 'bg-slate-100 text-slate-400'}`}>
                {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </span>
            </button>
          )
        })}
      </div>
      {error && <p data-field-error role="alert" className="text-xs text-red-500 mt-1.5">{error}</p>}
    </fieldset>
  )
}
