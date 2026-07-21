'use client'

import { useState } from 'react'
import { Layers, ChevronDown, ChevronRight, Home, DoorOpen } from 'lucide-react'

interface SpatialNode {
  id: string
  node_key: string
  level: string
  area_type: string
  label: string
  sqft?: number | null
  parent_node_key?: string | null
  observation_count?: number
  asset_count?: number
}

interface TwinSpatialMapProps {
  nodes: SpatialNode[]
}

const AREA_ICONS: Record<string, React.ReactNode> = {
  exterior: <Home className="h-4 w-4" />,
  interior: <DoorOpen className="h-4 w-4" />,
  systems: <Layers className="h-4 w-4" />,
}

type GroupedNodes = {
  exterior: SpatialNode[]
  interior: SpatialNode[]
  systems: SpatialNode[]
}

export function TwinSpatialMap({ nodes }: TwinSpatialMapProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['exterior', 'interior', 'systems']),
  )

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const grouped: GroupedNodes = { exterior: [], interior: [], systems: [] }
  for (const node of nodes) {
    const at = node.area_type as keyof GroupedNodes
    if (at in grouped) grouped[at].push(node)
    else grouped.exterior.push(node)
  }

  const groups: { key: keyof GroupedNodes; label: string }[] = [
    { key: 'exterior', label: 'Exterior' },
    { key: 'interior', label: 'Interior' },
    { key: 'systems', label: 'Building Systems' },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-5 w-5" style={{ color: '#1A2B4A' }} />
        <h3 className="text-lg font-semibold" style={{ color: '#1A2B4A' }}>
          Spatial Map
        </h3>
        <span className="ml-auto text-sm text-gray-400">{nodes.length} zones</span>
      </div>

      <div className="space-y-3">
        {groups.map(({ key, label }) => {
          const groupNodes = grouped[key]
          if (groupNodes.length === 0) return null
          const isExpanded = expandedGroups.has(key)
          return (
            <div key={key} className="rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleGroup(key)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-500">{AREA_ICONS[key]}</span>
                <span className="flex-1 text-sm font-semibold text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{groupNodes.length}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {isExpanded && (
                <div className="divide-y divide-gray-50 border-t border-gray-100">
                  {groupNodes.map((node) => (
                    <div key={node.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{node.label}</p>
                        <p className="text-xs text-gray-400">
                          {node.level}
                          {node.sqft ? ` · ${node.sqft} sqft` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {(node.asset_count ?? 0) > 0 && (
                          <span className="text-xs text-gray-400">
                            {node.asset_count} photo{(node.asset_count ?? 0) !== 1 ? 's' : ''}
                          </span>
                        )}
                        {(node.observation_count ?? 0) > 0 && (
                          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                            {node.observation_count} obs
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {nodes.length === 0 && (
        <div className="py-8 text-center text-sm text-gray-400">
          No spatial nodes captured yet.
          <br />
          Complete a mobile capture session to populate the spatial map.
        </div>
      )}
    </div>
  )
}
