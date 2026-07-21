'use client'

import type { ReactNode } from 'react'

export function OpsPanel({
  title,
  icon: Icon,
  accent = '#2ABFBF',
  children,
  action,
}: {
  title: string
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  accent?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: '#2A3D5F' }}
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accent}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </div>
          )}
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  sub,
  accent = '#2ABFBF',
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: '#2A3D5F', backgroundColor: 'rgba(15,26,46,0.6)' }}
    >
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {sub && (
        <p className="mt-0.5 text-xs" style={{ color: accent }}>
          {sub}
        </p>
      )}
    </div>
  )
}
