'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download } from 'lucide-react'

interface FloorPlanProps {
  tier: 1 | 2 | 3
  floorPlanUrl?: string
  mepSchematic?: Record<string, unknown>
  conceptId: string
}

const LAYERS = [
  { id: 'base', label: 'Architectural', color: '#1A2B4A', locked: true },
  { id: 'electrical', label: 'Electrical', color: '#E8724B' },
  { id: 'plumbing', label: 'Plumbing', color: '#2563EB' },
  { id: 'hvac', label: 'HVAC', color: '#059669' },
]

function InteractiveSVG({ visible }: { visible: Set<string> }) {
  return (
    <svg viewBox="0 0 800 500" className="w-full max-w-2xl mx-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Base — walls */}
      {visible.has('base') && (
        <g>
          {/* Outer walls */}
          <rect x="40" y="40" width="720" height="420" fill="#f8fafc" stroke="#1A2B4A" strokeWidth="3" rx="2" />

          {/* Room: Living Room */}
          <rect x="40" y="40" width="340" height="220" fill="none" stroke="#1A2B4A" strokeWidth="1.5" />
          <text x="210" y="170" textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155">Living Room</text>
          <text x="210" y="188" textAnchor="middle" fontSize="10" fill="#94a3b8">280 sq ft</text>

          {/* Room: Kitchen */}
          <rect x="380" y="40" width="380" height="220" fill="none" stroke="#1A2B4A" strokeWidth="1.5" />
          <text x="570" y="155" textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155">Kitchen</text>
          <text x="570" y="173" textAnchor="middle" fontSize="10" fill="#94a3b8">180 sq ft</text>
          {/* Island */}
          <rect x="460" y="90" width="220" height="100" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="5,4" rx="4" />
          <text x="570" y="148" textAnchor="middle" fontSize="10" fill="#94a3b8">Island</text>

          {/* Room: Bedroom */}
          <rect x="40" y="260" width="280" height="200" fill="none" stroke="#1A2B4A" strokeWidth="1.5" />
          <text x="180" y="370" textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155">Primary Bedroom</text>
          <text x="180" y="388" textAnchor="middle" fontSize="10" fill="#94a3b8">220 sq ft</text>

          {/* Room: Bathroom */}
          <rect x="320" y="260" width="160" height="200" fill="none" stroke="#1A2B4A" strokeWidth="1.5" />
          <text x="400" y="368" textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">Bath</text>
          <text x="400" y="384" textAnchor="middle" fontSize="9" fill="#94a3b8">80 sq ft</text>

          {/* Room: Dining */}
          <rect x="480" y="260" width="280" height="200" fill="none" stroke="#1A2B4A" strokeWidth="1.5" />
          <text x="620" y="368" textAnchor="middle" fontSize="13" fontWeight="600" fill="#334155">Dining Room</text>
          <text x="620" y="384" textAnchor="middle" fontSize="10" fill="#94a3b8">160 sq ft</text>

          {/* Scale bar */}
          <line x1="560" y1="470" x2="720" y2="470" stroke="#94a3b8" strokeWidth="1" />
          <line x1="560" y1="465" x2="560" y2="475" stroke="#94a3b8" strokeWidth="1" />
          <line x1="720" y1="465" x2="720" y2="475" stroke="#94a3b8" strokeWidth="1" />
          <text x="640" y="485" textAnchor="middle" fontSize="9" fill="#94a3b8">Scale: ¼″ = 1′</text>
        </g>
      )}

      {/* Electrical */}
      {visible.has('electrical') && (
        <g>
          {/* Outlets */}
          {[[120, 55], [280, 55], [60, 180], [60, 100], [420, 55], [600, 55], [740, 55], [740, 150], [740, 100]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <circle r="5" fill="#E8724B" />
              <rect x="-3" y="-5" width="6" height="10" fill="none" stroke="#E8724B" strokeWidth="1" />
            </g>
          ))}
          {/* Lighting fixtures */}
          {[[210, 130], [570, 120], [400, 340], [620, 360]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="12" fill="none" stroke="#E8724B" strokeWidth="1.5" strokeDasharray="3,2" />
              <circle cx={x} cy={y} r="3" fill="#E8724B" />
            </g>
          ))}
          <text x="50" y="492" fontSize="9" fill="#E8724B">⬤ Outlet  ○ Light fixture</text>
        </g>
      )}

      {/* Plumbing */}
      {visible.has('plumbing') && (
        <g>
          {/* Kitchen sink */}
          <rect x="680" y="55" width="50" height="28" fill="none" stroke="#2563EB" strokeWidth="1.5" rx="2" />
          <text x="705" y="73" textAnchor="middle" fontSize="8" fill="#2563EB">Sink</text>
          {/* Supply line */}
          <line x1="705" y1="83" x2="705" y2="240" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4,3" />

          {/* Bath fixtures */}
          <rect x="330" y="280" width="50" height="30" fill="none" stroke="#2563EB" strokeWidth="1.5" rx="2" />
          <text x="355" y="298" textAnchor="middle" fontSize="8" fill="#2563EB">Sink</text>
          <rect x="395" y="350" width="70" height="35" fill="none" stroke="#2563EB" strokeWidth="1.5" rx="4" />
          <text x="430" y="372" textAnchor="middle" fontSize="8" fill="#2563EB">Tub</text>
          {/* Main drain */}
          <circle cx="400" cy="440" r="8" fill="none" stroke="#2563EB" strokeWidth="1.5" />
          <text x="400" y="444" textAnchor="middle" fontSize="7" fill="#2563EB">D</text>
          <text x="52" y="492" fontSize="9" fill="#2563EB">□ Fixture  ◎ Drain</text>
        </g>
      )}

      {/* HVAC */}
      {visible.has('hvac') && (
        <g>
          {/* Supply vents */}
          {[[80, 250], [300, 250], [460, 250], [700, 250]].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="50" height="16" fill="#059669" fillOpacity="0.25" stroke="#059669" strokeWidth="1" rx="2" />
          ))}
          {/* Return vents */}
          <rect x="360" y="450" width="80" height="18" fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="3,2" rx="2" />
          {/* Ductwork */}
          <line x1="400" y1="250" x2="400" y2="300" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1="80" y1="258" x2="700" y2="258" stroke="#059669" strokeWidth="1" strokeDasharray="4,3" />
          <text x="155" y="492" fontSize="9" fill="#059669">■ Supply  □ Return vent</text>
        </g>
      )}
    </svg>
  )
}

export function FloorPlan({ tier, floorPlanUrl, mepSchematic, conceptId }: FloorPlanProps) {
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['base']))

  function toggleLayer(id: string) {
    setVisibleLayers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (tier === 1) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
        <p className="text-slate-500 font-semibold mb-2">Floor Plan — Premium &amp; Premium+</p>
        <p className="text-sm text-slate-400">Upgrade to Premium to unlock your 2D architectural floor plan.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Layer controls (Tier 3 only) */}
      {tier === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Toggle Layers</p>
          <div className="flex flex-wrap gap-3">
            {LAYERS.map((layer) => (
              <label key={layer.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleLayers.has(layer.id)}
                  onChange={() => toggleLayer(layer.id)}
                  disabled={layer.locked}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: layer.color }}
                />
                <span className="text-sm font-medium" style={{ color: visibleLayers.has(layer.id) ? layer.color : '#94a3b8' }}>
                  {layer.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Floor plan display */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-center min-h-80">
        {floorPlanUrl ? (
          <div className="relative w-full max-w-2xl aspect-[16/10]">
            <Image src={floorPlanUrl} alt="Floor plan" fill className="object-contain" />
          </div>
        ) : (
          <InteractiveSVG visible={visibleLayers} />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex flex-wrap gap-4">
          {LAYERS.map((layer) => (
            visibleLayers.has(layer.id) && (
              <div key={layer.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: layer.color }} />
                {layer.label}
              </div>
            )
          ))}
          <span className="text-xs text-slate-400">Scale: ¼″ = 1′</span>
        </div>
      </div>

      {/* Download buttons (Tier 3) */}
      {tier === 3 && (
        <div className="flex flex-wrap gap-2">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <Download className="w-3 h-3" />
              {layer.label} (PDF)
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
