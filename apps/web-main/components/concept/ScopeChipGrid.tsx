'use client'

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
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const on = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                on
                  ? 'border-[#E8724B] bg-orange-50 text-[#E8724B] font-medium'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}
