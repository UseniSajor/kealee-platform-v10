'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Camera, Scan, Star, MapPin } from 'lucide-react'

export type CaptureMode = 'self_capture' | 'enhanced_scan' | 'kealee_site_visit'

export const SITE_VISIT_FEE_CENTS = 12500 // $125

interface CaptureModeOption {
  mode: CaptureMode
  title: string
  subtitle?: string
  priceLabel: string
  features: string[]
  badge?: string
  badgeColor?: 'blue' | 'amber' | 'indigo'
  androidNote?: string
  iOSNote?: string
  skipCapture: boolean
}

const CAPTURE_MODES: CaptureModeOption[] = [
  {
    mode: 'self_capture',
    title: 'Self Capture',
    subtitle: 'Default',
    priceLabel: 'Included',
    features: [
      'Guided video walkthrough',
      'Room-by-room photo capture',
      'Voice notes',
      'Works on all phones',
    ],
    skipCapture: false,
  },
  {
    mode: 'enhanced_scan',
    title: 'Enhanced Scan',
    priceLabel: 'Included',
    features: [
      '3D room scanning',
      'Auto floor plan',
      'Room dimensions',
      'Higher accuracy',
    ],
    badge: 'Best for remodels',
    badgeColor: 'amber',
    iOSNote: 'Best experience with LiDAR (iPhone 12 Pro+)',
    androidNote: 'Scan uses video-based capture',
    skipCapture: false,
  },
  {
    mode: 'kealee_site_visit',
    title: 'Kealee Site Visit Scan',
    subtitle: 'Best Accuracy',
    priceLabel: '+ $125',
    features: [
      'Kealee team visits your property',
      'Professional scan + measurements',
      'High-accuracy layout + conditions',
      'Best for large or complex projects',
    ],
    badge: 'Highest Accuracy',
    badgeColor: 'indigo',
    skipCapture: true,
  },
]

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  blue:   { bg: '#DBEAFE', text: '#1D4ED8' },
  amber:  { bg: '#FEF3C7', text: '#92400E' },
  indigo: { bg: '#E0E7FF', text: '#3730A3' },
}

interface CaptureModeCardProps {
  option: CaptureModeOption
  selected: boolean
  isAndroid: boolean
  isIOS: boolean
  onSelect: () => void
}

function CaptureModeCard({ option, selected, isAndroid, isIOS, onSelect }: CaptureModeCardProps) {
  const deviceNote = option.mode !== 'kealee_site_visit'
    ? (isAndroid ? option.androidNote : isIOS ? option.iOSNote : undefined)
    : undefined

  const isSiteVisit = option.mode === 'kealee_site_visit'
  const accentColor = isSiteVisit ? '#4F46E5' : '#E8793A'

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-2xl border-2 p-5 transition-all"
      style={{
        borderColor: selected ? accentColor : '#E5E7EB',
        backgroundColor: selected ? (isSiteVisit ? '#F5F3FF' : '#FFF7F2') : '#FFFFFF',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: selected ? accentColor : '#F3F4F6' }}
          >
            {option.mode === 'self_capture' && (
              <Camera className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
            )}
            {option.mode === 'enhanced_scan' && (
              <Scan className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
            )}
            {option.mode === 'kealee_site_visit' && (
              <MapPin className="h-5 w-5" style={{ color: selected ? '#fff' : '#6B7280' }} />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-base font-semibold" style={{ color: '#1A2B4A' }}>
                {option.title}
              </span>
              {option.mode === 'self_capture' && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
                >
                  Recommended
                </span>
              )}
              {option.badge && option.badgeColor && (
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  style={BADGE_STYLES[option.badgeColor]}
                >
                  <Star className="h-3 w-3" />
                  {option.badge}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className="text-base font-bold"
                style={{ color: isSiteVisit ? '#4F46E5' : '#E8793A' }}
              >
                {option.priceLabel}
              </span>
              {isSiteVisit && (
                <span className="text-xs text-gray-400">Optional — we come to you</span>
              )}
            </div>
          </div>
        </div>

        <div
          className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? accentColor : '#D1D5DB' }}
        >
          {selected && (
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: accentColor }} />
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {option.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2
              className="h-4 w-4 flex-shrink-0"
              style={{ color: isSiteVisit ? '#4F46E5' : '#16A34A' }}
            />
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

      {isSiteVisit && selected && (
        <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
          📅 We&apos;ll contact you within 24 hours to schedule your visit after payment.
        </div>
      )}
    </button>
  )
}

interface CaptureModesSelectorProps {
  defaultMode?: CaptureMode
  preferredVisitWindow?: string
  onChange: (mode: CaptureMode, preferredWindow?: string) => void
  className?: string
}

export function CaptureModeSelector({
  defaultMode = 'self_capture',
  preferredVisitWindow: defaultWindow = '',
  onChange,
  className = '',
}: CaptureModesSelectorProps) {
  const [selected, setSelected] = useState<CaptureMode>(defaultMode)
  const [preferredWindow, setPreferredWindow] = useState<string>(defaultWindow)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios')
    else if (/Android/.test(ua)) setPlatform('android')
  }, [])

  function handleSelect(mode: CaptureMode) {
    setSelected(mode)
    onChange(mode, preferredWindow || undefined)
  }

  function handleWindowChange(w: string) {
    setPreferredWindow(w)
    onChange(selected, w || undefined)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1A2B4A' }}>
          Choose your capture method
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Site capture is included with your package. Kealee Site Visit is an optional paid upgrade.
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

      {/* Preferred visit window — shown only when site visit selected */}
      {selected === 'kealee_site_visit' && (
        <div
          className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-indigo-800">
            When are you available for a site visit?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['Weekdays', 'Weekends', 'Flexible'].map((w) => (
              <button
                key={w}
                onClick={() => handleWindowChange(w)}
                className="rounded-xl border-2 py-2.5 text-sm font-medium transition-all"
                style={{
                  borderColor: preferredWindow === w ? '#4F46E5' : '#C7D2FE',
                  backgroundColor: preferredWindow === w ? '#4F46E5' : '#EEF2FF',
                  color: preferredWindow === w ? '#fff' : '#3730A3',
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <p className="text-xs text-indigo-500">
            Optional — our team will confirm a specific time after payment.
          </p>
        </div>
      )}
    </div>
  )
}
