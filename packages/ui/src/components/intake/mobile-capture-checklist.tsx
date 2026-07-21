'use client'

import { CheckCircle2, ChevronRight } from 'lucide-react'

interface CaptureZoneItem {
  zone: string
  displayName: string
  isRequired: boolean
  isCompleted: boolean
  assetCount: number
}

interface MobileCaptureChecklistProps {
  zones: CaptureZoneItem[]
  currentZone?: string
  onSelectZone: (zone: string) => void
}

export function MobileCaptureChecklist({
  zones,
  currentZone,
  onSelectZone,
}: MobileCaptureChecklistProps) {
  const required = zones.filter((z) => z.isRequired)
  const optional = zones.filter((z) => !z.isRequired)
  const completedCount = required.filter((z) => z.isCompleted).length

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header summary */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: '#1A2B4A' }}
      >
        <div>
          <p className="text-xs font-medium text-blue-200 uppercase tracking-wide">Progress</p>
          <p className="text-xl font-bold text-white">
            {completedCount} / {required.length} zones
          </p>
        </div>
        <div className="relative h-12 w-12">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="#E8793A"
              strokeWidth="3"
              strokeDasharray={`${required.length > 0 ? (completedCount / required.length) * 100 : 0} 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {required.length > 0 ? Math.round((completedCount / required.length) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Required zones */}
      <div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Required Zones
        </p>
        <div className="space-y-2">
          {required.map((zone) => (
            <ZoneRow
              key={zone.zone}
              zone={zone}
              isCurrent={zone.zone === currentZone}
              onSelect={() => onSelectZone(zone.zone)}
            />
          ))}
        </div>
      </div>

      {/* Optional zones */}
      {optional.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Optional Zones
          </p>
          <div className="space-y-2">
            {optional.map((zone) => (
              <ZoneRow
                key={zone.zone}
                zone={zone}
                isCurrent={zone.zone === currentZone}
                onSelect={() => onSelectZone(zone.zone)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ZoneRow({
  zone,
  isCurrent,
  onSelect,
}: {
  zone: CaptureZoneItem
  isCurrent: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: isCurrent ? '#FFF4ED' : zone.isCompleted ? '#F0FDF4' : '#FAFAFA',
        border: isCurrent ? '1.5px solid #E8793A' : '1.5px solid transparent',
      }}
    >
      <CheckCircle2
        className="h-5 w-5 flex-shrink-0"
        style={{ color: zone.isCompleted ? '#16A34A' : isCurrent ? '#E8793A' : '#D1D5DB' }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="truncate text-sm font-medium"
          style={{ color: isCurrent ? '#E8793A' : zone.isCompleted ? '#166534' : '#1A2B4A' }}
        >
          {zone.displayName}
        </p>
        {zone.assetCount > 0 && (
          <p className="text-xs text-gray-400">{zone.assetCount} photo{zone.assetCount !== 1 ? 's' : ''}</p>
        )}
      </div>
      {!zone.isRequired && (
        <span className="mr-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
          Optional
        </span>
      )}
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
    </button>
  )
}
