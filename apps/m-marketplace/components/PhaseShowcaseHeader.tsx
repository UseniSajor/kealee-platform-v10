'use client'

import { MESSAGES } from '@/lib/messages'

const phaseColors: Record<string, { text: string; bg: string; border: string }> = {
  teal:   { text: '#196B5E', bg: 'rgba(25,107,94,.08)',  border: 'rgba(25,107,94,.2)'  },
  amber:  { text: '#A84E10', bg: 'rgba(168,78,16,.08)', border: 'rgba(168,78,16,.2)' },
  green:  { text: '#1A5C32', bg: 'rgba(26,92,50,.08)',  border: 'rgba(26,92,50,.2)'  },
  navy:   { text: '#0D1F3C', bg: 'rgba(13,31,60,.08)',  border: 'rgba(13,31,60,.2)'  },
  gold:   { text: '#C07B20', bg: 'rgba(192,123,32,.08)', border: 'rgba(192,123,32,.2)' },
  purple: { text: '#5B2D8E', bg: 'rgba(91,45,142,.08)', border: 'rgba(91,45,142,.2)' },
}

// VERSION C: Pain-first, then solution via 5 phases
export function PhaseShowcaseHeader() {
  const m = MESSAGES.phases

  return (
    <div className="text-center mb-12">
      <span
        className="inline-block text-xs font-bold tracking-widest uppercase mb-4"
        style={{ color: '#0F2240' }}
      >
        {m.eyebrow}
      </span>

      {/* VERSION C Headline — pain first */}
      <h2
        className="text-3xl lg:text-4xl font-bold mb-4"
        style={{ fontFamily: '"Clash Display", "Playfair Display", sans-serif', color: '#0F2240' }}
      >
        {m.headline}
        <br />
        <em className="italic">{m.headlineEm}</em>
      </h2>

      {/* Pain statement */}
      <p
        className="text-lg text-gray-600 max-w-2xl mx-auto mb-8"
        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
      >
        {m.sub}{' '}
        <strong className="text-gray-900">{m.subStrong}</strong>
      </p>

      {/* Phase flow visualization */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
        {m.phases.map((phase, i) => {
          const colors = phaseColors[phase.color]
          return (
            <span key={phase.num} className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  color: colors.text,
                  background: colors.bg,
                  border: `1.5px solid ${colors.border}`,
                }}
              >
                {phase.num} {phase.label}
              </span>
              {i < m.phases.length - 1 && (
                <span className="text-gray-400 text-lg">→</span>
              )}
            </span>
          )
        })}
      </div>

      <p className="text-sm font-semibold text-gray-500 tracking-wide">
        {m.phaseConnector}
      </p>
    </div>
  )
}
