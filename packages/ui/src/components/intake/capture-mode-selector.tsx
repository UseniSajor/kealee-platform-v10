'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Camera, Scan, Star } from 'lucide-react'

export type CaptureMode = 'standard' | 'enhanced_scan'

interface CaptureModeOption {
  mode: CaptureMode
  title: string
  price: number
  features: string[]
  badge?: string
  androidNote?: string
  iOSNote?: string
}

const CAPTURE_MODES: CaptureModeOption[] = [
  {
    mode: 'standard',
    title: 'Standard Capture',
    price: 48500,
    features: [
      'Guided video walkthrough',
      'Room-by-room photo capture',
      'Voice notes',
      'Works on all phones',
    ],
  },
  {
    mode: 'enhanced_scan',
    title: 'Enhanced Scan',
    price: 68500,
    features: [
      '3D room scanning',
      'Auto floor plan',
      'Room dimensions',
      'Higher accuracy',
    ],
    badge: 'Best for remodels',
    iOSNote: 'Best experience with LiDAR (iPhone 12 Pro+)',
    androidNote: 'Limited support — still improves results',
  },
]

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

interface CaptureModeCardProps {
  option: CaptureModeOption
  selected: boolean
  isAndroid: boolean
  isIOS: boolean
  onSelect: () => void
}

function CaptureModeCard({ option, selected, isAndroid, isIOS, onSelect }: CaptureModeCardProps) {
  const deviceNote = isAndroid ? option.androidNote : isIOS ? option.iOSNote : undefined

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-2xl border-2 p-5 transition-all"
      style={{
        borderColor: selected ? '#E8793A' : '#E5E7EB',
        backgroundColor: selected ? '#FFF7F2' : '#FFFFFF',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: selected ? '#E8793A' : '#F3F4F6' }}
          >
            {option.mode === 'standard' ? (
              <Camera className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
            ) : (
              <Scan className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold" style={{ color: '#1A2B4A' }}>
                {option.title}
              </span>
              {option.mode === 'standard' && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
                >
                  Recommended
                </span>
              )}
              {option.badge && (
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  <Star className="h-3 w-3" />
                  {option.badge}
                </span>
              )}
            </div>
            <span className="text-lg font-bold" style={{ color: '#E8793A' }}>
              {formatPrice(option.price)}
            </span>
          </div>
        </div>

        <div
          className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? '#E8793A' : '#D1D5DB' }}
        >
          {selected && (
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: '#E8793A' }} />
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {option.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: '#16A34A' }} />
            {feat}
          </li>
        ))}
      </ul>

      {deviceNote && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: isAndroid ? '#FFF7ED' : '#EFF6FF',
            color: isAndroid ? '#92400E' : '#1E40AF',
          }}
        >
          {isAndroid ? '⚠️' : '✨'} {deviceNote}
        </div>
      )}
    </button>
  )
}

interface CaptureModesSelectorProps {
  defaultMode?: CaptureMode
  onChange: (mode: CaptureMode) => void
  className?: string
}

export function CaptureModeSelector({
  defaultMode = 'standard',
  onChange,
  className = '',
}: CaptureModesSelectorProps) {
  const [selected, setSelected] = useState<CaptureMode>(defaultMode)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) {
      setPlatform('ios')
    } else if (/Android/.test(ua)) {
      setPlatform('android')
    }
  }, [])

  function handleSelect(mode: CaptureMode) {
    setSelected(mode)
    onChange(mode)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1A2B4A' }}>
          Choose your capture method
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          All standard capture is included. Enhanced Scan adds 3D spatial data for higher accuracy.
        </p>
      </div>

      {CAPTURE_MODES.map((opt) => (
        <CaptureModeCard
          key={opt.mode}
          option={opt}
          selected={selected === opt.mode}
          isAndroid={platform === 'android'}
          isIOS={platform === 'ios'}
          onSelect={() => handleSelect(opt.mode)}
        />
      ))}
    </div>
  )
}
