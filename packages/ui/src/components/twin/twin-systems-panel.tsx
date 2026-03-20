'use client'

import { Zap, Thermometer, Droplets, Wind, Shield, Package } from 'lucide-react'

interface SystemNode {
  id: string
  system_key: string
  system_category: string
  label: string
  condition?: string | null
  estimated_age_years?: number | null
  brand?: string | null
  model?: string | null
  observation_count?: number
}

interface TwinSystemsPanelProps {
  systems: SystemNode[]
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  electrical: { icon: <Zap className="h-4 w-4" />, color: '#854D0E', bg: '#FEF9C3' },
  hvac: { icon: <Thermometer className="h-4 w-4" />, color: '#1E40AF', bg: '#DBEAFE' },
  plumbing: { icon: <Droplets className="h-4 w-4" />, color: '#065F46', bg: '#D1FAE5' },
  ventilation: { icon: <Wind className="h-4 w-4" />, color: '#6B21A8', bg: '#F3E8FF' },
  roofing: { icon: <Shield className="h-4 w-4" />, color: '#9F1239', bg: '#FFE4E6' },
}

const CONDITION_STYLES: Record<string, { text: string; bg: string }> = {
  excellent: { text: '#166534', bg: '#DCFCE7' },
  good: { text: '#15803D', bg: '#F0FDF4' },
  fair: { text: '#92400E', bg: '#FEF3C7' },
  poor: { text: '#9F1239', bg: '#FFE4E6' },
  unknown: { text: '#6B7280', bg: '#F3F4F6' },
}

export function TwinSystemsPanel({ systems }: TwinSystemsPanelProps) {
  // Group by category
  const grouped = new Map<string, SystemNode[]>()
  for (const sys of systems) {
    const cat = sys.system_category
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(sys)
  }

  if (systems.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Building Systems
        </h3>
        <div className="py-8 text-center text-sm text-gray-400">
          No systems captured yet.
          <br />
          Complete the HVAC and systems zones in your capture session.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Building Systems
        </h3>
        <span className="text-sm text-gray-400">{systems.length} systems</span>
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([category, nodes]) => {
          const meta = CATEGORY_META[category] ?? {
            icon: <Package className="h-4 w-4" />,
            color: '#6B7280',
            bg: '#F3F4F6',
          }
          const label = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')
          return (
            <div key={category}>
              <div
                className="mb-2 flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ backgroundColor: meta.bg, color: meta.color }}
              >
                {meta.icon}
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                <span className="ml-auto text-xs opacity-70">{nodes.length}</span>
              </div>
              <div className="space-y-2 pl-2">
                {nodes.map((sys) => {
                  const cond = sys.condition ?? 'unknown'
                  const condStyle = CONDITION_STYLES[cond] ?? CONDITION_STYLES.unknown
                  return (
                    <div
                      key={sys.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800">{sys.label}</p>
                        {sys.condition && (
                          <span
                            className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                            style={{ backgroundColor: condStyle.bg, color: condStyle.text }}
                          >
                            {sys.condition}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {sys.brand && (
                          <span className="text-xs text-gray-500">Brand: {sys.brand}</span>
                        )}
                        {sys.model && (
                          <span className="text-xs text-gray-500">Model: {sys.model}</span>
                        )}
                        {sys.estimated_age_years != null && (
                          <span className="text-xs text-gray-500">
                            Age: ~{sys.estimated_age_years} yr{sys.estimated_age_years !== 1 ? 's' : ''}
                          </span>
                        )}
                        {(sys.observation_count ?? 0) > 0 && (
                          <span className="text-xs font-medium" style={{ color: '#E8793A' }}>
                            {sys.observation_count} observation{sys.observation_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
